import {i18n} from './i18n';
import {css, html} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPLitElement from 'dbp-common/dbp-lit-element';
import {Icon, MiniSpinner} from 'dbp-common';
import * as commonUtils from 'dbp-common/utils';
import * as commonStyles from 'dbp-common/styles';
import {createClient} from 'webdav/web';
import {classMap} from 'lit-html/directives/class-map.js';
import {humanFileSize} from 'dbp-common/i18next';
import Tabulator from 'tabulator-tables';
import nextcloudFileURL from 'consts:nextcloudFileURL';
import MicroModal from './micromodal.es';

/**
 * NextcloudFilePicker web component
 */
export class NextcloudFilePicker extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this.lang = 'de';
        this.authUrl = '';
        this.webDavUrl = '';
        this.nextcloudName = 'Nextcloud';
        this.loginWindow = null;
        this.isPickerActive = false;
        this.statusText = '';
        this.lastDirectoryPath = '/';
        this.directoryPath = '';
        this.webDavClient = null;
        this.tabulatorTable = null;
        this.allowedMimeTypes = '*/*';
        this.directoriesOnly = null;
        this.maxSelectedItems = true;
        this.loading = false;
        this._onReceiveWindowMessage = this.onReceiveWindowMessage.bind(this);

        this.folderIsSelected = i18n.t('nextcloud-file-picker.load-in-folder');
        this.generatedFilename = '';
        this.replaceFilename = '';
        this.customFilename = '';
        this.uploadFileObject = null;
        this.uploadFileDirectory = null;
        this.fileList = [];
        this.fileNameCounter = 1;
        this.activeDirectoryRights = 'RGDNVCK';
        this.activeDirectoryACL = '';
        this.forAll = false;
        this.uploadCount = 0;
        this.selectAllButton = true;
        this.abortUploadButton = false;
        this.abortUpload = false;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
        };
    }

    /**
     * See: https://lit-element.polymer-project.org/guide/properties#initialize
     */
    static get properties() {
        return {
            lang: { type: String },
            authUrl: { type: String, attribute: 'auth-url' },
            webDavUrl: { type: String, attribute: 'web-dav-url' },
            nextcloudName: { type: String, attribute: 'nextcloud-name' },
            isPickerActive: { type: Boolean, attribute: false },
            statusText: { type: String, attribute: false },
            folderIsSelected: { type: String, attribute: false },
            directoryPath: { type: String, attribute: false },
            allowedMimeTypes: { type: String, attribute: 'allowed-mime-types' },
            directoriesOnly: { type: Boolean, attribute: 'directories-only' },
            maxSelectedItems: { type: Number, attribute: 'max-selected-items' },
            loading: { type: Boolean, attribute: false },
            replaceFilename: { type: String, attribute: false },
            uploadFileObject: { type: Object, attribute: false },
            uploadFileDirectory: { type: String, attribute: false },
            activeDirectoryRights: { type: String, attribute: false },
            activeDirectoryACL: { type: String, attribute: false },
            selectAllButton: { type: Boolean, attribute: false },
            abortUploadButton: { type: Boolean, attribute: false },
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "lang":
                    i18n.changeLanguage(this.lang);
                    break;
            }
        });

        super.update(changedProperties);
    }

    disconnectedCallback() {
        window.removeEventListener('message', this._onReceiveWindowMessage);
        super.disconnectedCallback();
    }

    connectedCallback() {
        super.connectedCallback();
        const that = this;
        this.updateComplete.then(() => {
            // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
            window.addEventListener('message', this._onReceiveWindowMessage);

            // see: http://tabulator.info/docs/4.7
            this.tabulatorTable = new Tabulator(this._("#directory-content-table"), {
                layout: "fitColumns",
                selectable: this.maxSelectedItems,
                selectableRangeMode: "drag",
                responsiveLayout: true,
                placeholder:this.directoriesOnly ? i18n.t('nextcloud-file-picker.no-data') :  i18n.t('nextcloud-file-picker.no-data-type'),
                resizableColumns:false,
                columns: [
                    {title: "", field: "type", align:"center", headerSort:false, width:50, responsive:1, formatter: (cell, formatterParams, onRendered) => {
                            const icon_tag =  that.constructor.getScopedTagName("dbp-icon");
                            let disabled = this.directoriesOnly ? "nextcloud-picker-icon-disabled" : "";
                            let icon = `<${icon_tag} name="empty-file" class="nextcloud-picker-icon ` + disabled + `"></${icon_tag}>`;
                            return (cell.getValue() === "directory") ? `<${icon_tag} name="folder" class="nextcloud-picker-icon"></${icon_tag}>` : icon;
                        }},
                    {title: i18n.t('nextcloud-file-picker.filename'), responsive: 0, widthGrow:5,  minWidth: 150, field: "basename", sorter: "alphanum",
                        formatter: (cell) => {
                            var data = cell.getRow().getData();
                            if (data.edit) {
                                cell.getElement().classList.add("fokus-edit");
                            }
                            return cell.getValue();
                        }},
                    {title: i18n.t('nextcloud-file-picker.size'), responsive: 4, widthGrow:1, minWidth: 50, field: "size", formatter: (cell, formatterParams, onRendered) => {
                            return cell.getRow().getData().type === "directory" ? "" : humanFileSize(cell.getValue());}},
                    {title: i18n.t('nextcloud-file-picker.mime-type'), responsive: 2, widthGrow:1, minWidth: 20, field: "mime", formatter: (cell, formatterParams, onRendered) => {
                            if (typeof cell.getValue() === 'undefined') {
                                return "";
                            }
                            const [fileMainType, fileSubType] = cell.getValue().split('/');
                            return fileSubType;
                        }},
                    {title: i18n.t('nextcloud-file-picker.last-modified'), responsive: 3, widthGrow:1, minWidth: 100, field: "lastmod",sorter: (a, b, aRow, bRow, column, dir, sorterParams) => {
                            const a_timestamp = Date.parse(a);
                            const b_timestamp = Date.parse(b);
                            return a_timestamp - b_timestamp;
                        }, formatter:function(cell, formatterParams, onRendered) {
                            const d = Date.parse(cell.getValue());
                            const timestamp = new Date(d);
                            const year = timestamp.getFullYear();
                            const month = ("0" + (timestamp.getMonth() + 1)).slice(-2);
                            const date = ("0" + timestamp.getDate()).slice(-2);
                            const hours = ("0" + timestamp.getHours()).slice(-2);
                            const minutes = ("0" + timestamp.getMinutes()).slice(-2);
                            return date + "." + month + "." + year + " " + hours + ":" + minutes;
                        }},
                    {title: "rights", field: "props.permissions", visible: false},
                    {title: "acl", field: "props.acl-list.acl.acl-permissions", visible: false}
                ],
                initialSort:[
                    {column:"basename", dir:"asc"},
                    {column:"type", dir:"asc"},

                ],
                rowFormatter: (row) => {
                    let data = row.getData();
                    if (!this.checkFileType(data, this.allowedMimeTypes)) {
                        row.getElement().classList.add("no-select");
                        row.getElement().classList.remove("tabulator-selectable");
                    }
                    if (this.directoriesOnly && typeof data.mime !== 'undefined') {
                        row.getElement().classList.add("no-select");
                        row.getElement().classList.remove("tabulator-selectable");
                    }
                },
                rowSelectionChanged: (data, rows) => {
                    if (data.length > 0  && this.directoriesOnly) {
                        this.folderIsSelected = i18n.t('nextcloud-file-picker.load-to-folder');
                    }
                    else {
                        this.folderIsSelected = i18n.t('nextcloud-file-picker.load-in-folder');
                    }
                },
                rowClick: (e, row) => {
                    const data = row.getData();

                    if (!row.getElement().classList.contains("no-select")) {
                        if (this.directoriesOnly) {
                            // comment out if you want to navigate through folders with double click
                            const data = row.getData();
                            this.directoryClicked(e, data);
                            this.folderIsSelected = i18n.t('nextcloud-file-picker.load-in-folder');
                        }
                        else
                        {
                            switch(data.type) {
                                case "directory":
                                    this.directoryClicked(e, data);
                                    break;
                                case "file":
                                    if (this.tabulatorTable.getSelectedRows().length === this.tabulatorTable.getRows().filter(row => row.getData().type != 'directory' && this.checkFileType(row.getData(), this.allowedMimeTypes)).length) {
                                        this.selectAllButton = false;
                                    }
                                    else {
                                        this.selectAllButton = true;
                                    }
                                    break;
                            }
                        }
                    }
                    else{
                        row.deselect();
                    }
                },
                rowDblClick: (e, row) => {
                    // comment this in for double click directory change
                   /* if (this.directoriesOnly) {
                        const data = row.getData();
                        this.directoryClicked(e, data);
                        this.folderIsSelected = i18n.t('nextcloud-file-picker.load-in-folder');
                    }*/
                },
                rowAdded: (row) => {
                    row.getElement().classList.toggle("addRowAnimation");
                }
            });


            // Strg + click select mode on desktop
            /*if (this.tabulatorTable.browserMobile === false) {
                this.tabulatorTable.options.selectableRangeMode = "click";
            }*/

            if (typeof this.allowedMimeTypes !== 'undefined' && !this.directoriesOnly) {
                this.tabulatorTable.setFilter(this.checkFileType, this.allowedMimeTypes);
            }
            // comment this in to show only directories in filesink
            /*
            if (typeof this.directoriesOnly !== 'undefined' && this.directoriesOnly) {
                this.tabulatorTable.setFilter([
                    {field:"type", type:"=", value:"directory"},
                ]);
            }
            */

            // add folder on enter
            this._('#new-folder').addEventListener('keydown', function(e) {
                if (e.keyCode === 13) {
                    that.addFolder();
                }
            });
        });
    }

    /**
     * check mime type of row
     *
     * @param row.getDatat(), mimetypes
     */
    checkFileType(data, filterParams) {
        if (typeof data.mime === 'undefined') {
            return true;
        }
        const [fileMainType, fileSubType] = data.mime.split('/');
        const mimeTypes = filterParams.split(',');
        let deny = true;

        mimeTypes.forEach((str) => {
            const [mainType, subType] = str.split('/');
            deny = deny && ((mainType !== '*' && mainType !== fileMainType) || (subType !== '*' && subType !== fileSubType));
        });

        return !deny;
    }

    openFilePicker() {
        if (this.webDavClient === null) {
            this.loading = true;
            this.statusText = i18n.t('nextcloud-file-picker.auth-progress');
            const authUrl = this.authUrl + "?target-origin=" + encodeURIComponent(window.location.href);
            this.loginWindow = window.open(authUrl, "Nextcloud Login",
                "width=400,height=400,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no");
        }
        else {
            this.loadDirectory(this.directoryPath, this.webDavClient);

        }
    }

    onReceiveWindowMessage(event) {
        if (this.webDavClient === null)
        {
            const data = event.data;

            if (data.type === "webapppassword") {
                if (this.loginWindow !== null) {
                    this.loginWindow.close();
                }

                const apiUrl = this.webDavUrl + "/" + data.loginName;
                // see https://github.com/perry-mitchell/webdav-client/blob/master/API.md#module_WebDAV.createClient

                this.webDavClient = createClient(
                    apiUrl,
                    {
                        username: data.loginName,
                        password: data.token
                    }
                );
                this.loadDirectory(this.directoryPath);
            }
        }
    }

    /**
     * Loads the directory from WebDAV
     *
     * @param path
     */
    loadDirectory(path) {
        this.selectAllButton = true;
        this.loading = true;
        this.statusText = i18n.t('nextcloud-file-picker.loadpath-nextcloud-file-picker', {name: this.nextcloudName});
        this.lastDirectoryPath = this.directoryPath;
        this.directoryPath = path;

        // see https://github.com/perry-mitchell/webdav-client#getdirectorycontents
        if (this.webDavClient === null) {
            // client is broken reload try to reset & reconnect
            this.tabulatorTable.clearData();
            this.webDavClient = null;
            let reloadButton = html`${i18n.t('nextcloud-file-picker.something-went-wrong')} <button class="button"
                            title="${i18n.t('nextcloud-file-picker.refresh-nextcloud-file-picker')}"
                            @click="${async () => { this.openFilePicker(); } }"><dbp-icon name="reload"></button>`;
            this.loading = false;
            this.statusText = reloadButton;
        }
        this.webDavClient
            .getDirectoryContents(path, {details: true, data: "<?xml version=\"1.0\"?>" +
                    "<d:propfind  xmlns:d=\"DAV:\" xmlns:oc=\"http://owncloud.org/ns\" xmlns:nc=\"http://nextcloud.org/ns\"  xmlns:ocs=\"http://open-collaboration-services.org/ns\">" +
                    "  <d:prop>" +
                    "        <d:getlastmodified />" +
                    "        <d:resourcetype />" +
                    "        <d:getcontenttype />" +
                    "        <d:getcontentlength />" +
                    "        <d:getetag />" +
                    "        <oc:permissions />" +
                    "        <nc:acl-list>" +
                    "           <nc:acl>" +
                    "               <nc:acl-permissions />" +
                    "           </nc:acl>" +
                    "        </nc:acl-list>" +
                    "  </d:prop>" +
                    "</d:propfind>"})
            .then(contents => {
                console.log("------", contents);
                this.loading = false;
                this.statusText = "";
                this.tabulatorTable.setData(contents.data);
                this.isPickerActive = true;
                if (!this.activeDirectoryRights.includes("CK") && !this.activeDirectoryRights.includes("NV")) {
                    this._("#download-button").setAttribute("disabled", "true");
                }
                else {
                    this._("#download-button").removeAttribute("disabled");
                }
            }).catch(error => {
                console.error(error.message);

                // on Error: try to reload with home directory
                if ((path !== "/" || path !== "") && this.webDavClient !== null && error.message.search("401") === -1) {
                    this.loadDirectory("");
                }
                else {
                    this.loading = false;
                    this.statusText = html`<span class="error"> ${i18n.t('nextcloud-file-picker.webdav-error', {error: error.message})} </span>`;
                    this.isPickerActive = false;
                    this.tabulatorTable.clearData();
                    this.webDavClient = null;
                    let reloadButton = html`${i18n.t('nextcloud-file-picker.something-went-wrong')} <button class="button"
                                title="${i18n.t('nextcloud-file-picker.refresh-nextcloud-file-picker')}"
                                @click="${async () => { this.openFilePicker(); } }"><dbp-icon name="reload"></button>`;
                    this.loading = false;
                    this.statusText = reloadButton;
                }
        });
    }

    /**
     * Event Triggered when a directory in tabulator table is clicked
     *
     * @param event
     * @param file
     */
    directoryClicked(event, file) {
        // save rights of clicked directory
        if (typeof file.props !== 'undefined') {
            this.activeDirectoryRights = file.props.permissions;
            if (typeof  file.props['acl-list'] !== "undefined" &&
                typeof  file.props['acl-list']['acl']['acl-permissions'] !== "undefined" && file.props['acl-list']['acl']['acl-permissions']) {
                this.activeDirectoryACL = file.props['acl-list']['acl']['acl-permissions'];
            } else {
                this.activeDirectoryACL = '';
            }
        } else {
            this.activeDirectoryRights = 'SGDNVCK'
        }
        this.loadDirectory(file.filename);
        event.preventDefault();
    }

    /**
     * Download all files
     *
     * @param files
     */
    downloadFiles(files) {
        files.forEach((fileData) => this.downloadFile(fileData));
        this.tabulatorTable.deselectRow();
    }

    /**
     * Download a single file
     *
     * @param fileData
     */
    downloadFile(fileData) {
        this.loading = true;
        this.statusText = "Loading " + fileData.filename + "...";

        // https://github.com/perry-mitchell/webdav-client#getfilecontents
        this.webDavClient
            .getFileContents(fileData.filename)
            .then(contents => {
                // create file to send via event
                const file = new File([contents], fileData.basename, { type: fileData.mime });
                // send event
                const data = {"file": file, "data": fileData};
                const event = new CustomEvent("dbp-nextcloud-file-picker-file-downloaded",
                    { "detail": data, bubbles: true, composed: true });
                this.dispatchEvent(event);
                this.loading = false;
                this.statusText = "";
            }).catch(error => {
                console.error(error.message);
                this.loading = false;
                this.statusText = html`<span class="error"> ${i18n.t('nextcloud-file-picker.webdav-error', {error: error.message})} </span>`;;
        });
    }

    /**
     * Send the directory to filesink
     *
     * @param directory
     */
    sendDirectory(directory) {
        this.tabulatorTable.deselectRow();
        let path;

        if (!directory[0]) {
            path = this.directoryPath;
        }
        else {
            path = directory[0].filename;
        }
        this.loading = true;
        this.statusText = i18n.t('nextcloud-file-picker.upload-to', {path: path});

        const event = new CustomEvent("dbp-nextcloud-file-picker-file-uploaded",
            { "detail": path, bubbles: true, composed: true });
        this.dispatchEvent(event);
    }

    /**
     * Upload Files to a directory
     *
     * @param files
     * @param directory
     */
    uploadFiles(files, directory) {
        this.loading = true;
        this.statusText = i18n.t('nextcloud-file-picker.upload-to', {path: directory});
        this.fileList = files;
        this.forAll = false;
        this.setRepeatForAllConflicts()
        this.uploadFile(directory);
    }

    /**
     * Upload a single file from this.filelist to given directory
     *
     * @param directory
     */
    async uploadFile(directory) {
        if (this.abortUpload) {
            this.abortUpload = false;
            this.abortUploadButton = false;
            this.forAll = false;
            this.loading = false;
            this.statusText = i18n.t('nextcloud-file-picker.abort-message');
            this._("#replace_mode_all").checked = false;
            return;
        }
        if (this.fileList.length !== 0) {
            let file = this.fileList[0];
            this.replaceFilename = file.name;
            let path = directory + "/" + file.name;
            // https://github.com/perry-mitchell/webdav-client#putfilecontents
            let that = this;
            this.loading = true;
            this.statusText = i18n.t('nextcloud-file-picker.upload-to', {path: path});
            let contents = await this.webDavClient
                    .putFileContents(path, file,  { overwrite: false, onUploadProgress: progress => {
                            /* console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);*/
                        }}).then(function() {
                            that.uploadCount += 1;
                            that.fileList.shift();
                            that.uploadFile(directory);
                        }).catch(error => {
                            if (error.message.search("412") !== -1 || error.message.search("403") !== -1) {
                                this.generatedFilename = this.getNextFilename();
                                this._("#replace-filename").value = this.generatedFilename;
                                if (this.forAll) {
                                    this.uploadFileObject = file;
                                    this.uploadFileDirectory = directory;
                                    this.abortUploadButton = true;
                                    this.uploadFileAfterConflict();
                                }
                                else {
                                    this.replaceModalDialog(file, directory);
                                }
                            }
                        });
        }
        else {
            this.loadDirectory(this.directoryPath);
            this.loading = false;
            this.statusText = "";
            this._("#replace_mode_all").checked = false;
            this.forAll = false;
            this.customFilename = '';
            const event = new CustomEvent("dbp-nextcloud-file-picker-file-uploaded-finished",
                {  bubbles: true, composed: true , detail: this.uploadCount});
            this.uploadCount = 0;
            this.abortUpload = false;
            this.abortUploadButton = false;
            this.dispatchEvent(event);

        }
    }

    /**
     * Upload a file after a conflict happens on webdav side
     *
     */
    async uploadFileAfterConflict() {
        if (this.abortUpload) {
            this.abortUpload = false;
            this.abortUploadButton = false;
            this.forAll = false;
            this.loading = false;
            this.statusText = i18n.t('nextcloud-file-picker.abort-message');
            this._("#replace_mode_all").checked = false;
            return;
        }
        let path = "";
        let overwrite = false;
        let file = this.uploadFileObject;
        let directory = this.uploadFileDirectory;

        if (this._("input[name='replacement']:checked").value === "ignore") {
            MicroModal.close(this._("#replace-modal"));
            this.forAll ? this.fileList = [] : this.fileList.shift();
            this.uploadFile(directory);
            return true;
        } else if (this._("input[name='replacement']:checked").value === "new-name") {
            if (this.generatedFilename !== this._("#replace-filename").value) {
                this.customFilename = this._("#replace-filename").value;
            }
            path = directory + "/" + this._("#replace-filename").value;
            MicroModal.close(this._("#replace-modal"));
            this.replaceFilename = this._("#replace-filename").value;
        } else {
            path = directory + "/" + this.uploadFileObject.name;
            overwrite = true;
        }

        this.loading = true;
        this.statusText = i18n.t('nextcloud-file-picker.upload-to', {path: path});

        let that = this;
        // https://github.com/perry-mitchell/webdav-client#putfilecontents
        let contents = await this.webDavClient
            .putFileContents(path, file, {
                overwrite: overwrite, onUploadProgress: progress => {
                    /*console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`);*/
                }
            }).then(content => {
                MicroModal.close(this._("#replace-modal"));
                this.uploadCount += 1;
                that.fileList.shift();
                that.uploadFile(directory);
            }).catch(error => {
                if (error.message.search("412") !== -1) {
                    MicroModal.close(that._("#replace-modal"));
                    this.generatedFilename = this.getNextFilename();
                    this._("#replace-filename").value = this.generatedFilename;
                    if (this.forAll) {
                        this.uploadFileObject = file;
                        this.uploadFileDirectory = directory;
                        this.abortUploadButton = true;
                        this.uploadFileAfterConflict();
                    }
                    else {
                        this.replaceModalDialog(file, directory);
                    }
                }
            });

        this.fileNameCounter = 1;
    }

    /**
     * Check permissions of a given file in the active directory
     * no rename: if you dont have create permissions
     * no replace: if you dont have write permissions
     *
     * R = Share, S = Shared Folder, M = Group folder or external source, G = Read, D = Delete, NV / NVW = Write, CK = Create
     *
     * @param file
     * @return number
     */
    checkRights(file) {

        // nextcloud permissions
        let file_perm = 0;
        let active_directory_perm = this.activeDirectoryRights;
        let rows = this.tabulatorTable.searchRows("basename", "=", this.replaceFilename);
        if (typeof rows[0] !== 'undefined' && rows[0]) {
            file_perm = rows[0].getData().props.permissions;
        }
        else {
            file_perm = "";
        }

        /* ACL permissions: If ACL > permssions comment this in
        if (this.activeDirectoryACL !== '') {
            console.log("ACL SET");
            active_directory_perm = "MG";
            if (this.activeDirectoryACL & (1 << (3 - 1))) {
                active_directory_perm = "CK";
                console.log("ACL CREATE");
            }
            if (this.activeDirectoryACL & (1 << (2 - 1))) {
                active_directory_perm += "NV";
                console.log("ACL WRITE");
            }
        }

        // if file has acl rights take that
        if (typeof rows[0].getData().props['acl-list'] !== 'undefined' && rows[0].getData().props['acl-list'] &&
            rows[0].getData().props['acl-list']['acl']['acl-permissions'] !== '') {
            console.log("FILE HAS ACL");
            file_perm = "MG";

            if (rows[0].getData().props['acl-list']['acl']['acl-permissions'] & (1 << (3 - 1))) {
                file_perm = "CK";
                console.log("FILE ACL CREATE");
            }
            if (rows[0].getData().props['acl-list']['acl']['acl-permissions'] & (1 << (2 - 1))) {
                file_perm += "NV";
                console.log("FILE ACL WRITE");
            }
        }
        */

        // all allowed
        if (active_directory_perm.includes("CK") && file_perm.includes("NV")) {
            return -1;
        }

        // read only file but you can write to directory = only create and no edit
        if (active_directory_perm.includes("CK") && !file_perm.includes("NV")) {
            return 1;
        }

        // only edit and no create
        if (!active_directory_perm.includes("CK") && file_perm.includes("NV")) {
            return 2;
        }

        // read only directory and read only file
        return 0;

    }

    /**
     * Open the replace Modal Dialog with gui where forbidden actions are disabled
     *
     * @param file, directory
     */
    replaceModalDialog(file, directory) {
        this.uploadFileObject = file;
        this.uploadFileDirectory = directory;
        let rights = this.checkRights(file);
        // read only directory or read only file
        if (rights === 0) {
            this.loading = false;
            this.statusText = i18n.t('nextcloud-file-picker.readonly');
            return;
        }
        // read only file but you can write to directory = only create and no edit
        else if (rights === 1) {
            this.loading = false;
            this.statusText = i18n.t('nextcloud-file-picker.onlycreate');
            this._("#replace-replace").setAttribute("disabled", "true");
            this._("#replace-new-name").removeAttribute("disabled");
            this._("#replace-replace").checked = false;
            this._("#replace-new-name").checked = true;
            this.setInputFieldVisibility();
            this._("#replace-new-name").focus();
        }
        // only edit and no create
        else if (rights === 2) {
            this.loading = false;
            this.statusText = i18n.t('nextcloud-file-picker.onlyedit');
            this._("#replace-new-name").setAttribute("disabled", "true");
            this._("#replace-replace").removeAttribute("disabled");
            this._("#replace-new-name").checked = false;
            this._("#replace-replace").checked = true;
            this.setInputFieldVisibility();
            this._("#replace-replace").focus();
        }
        // all allowed
        else {
            this._("#replace-new-name").removeAttribute("disabled");
            this._("#replace-replace").removeAttribute("disabled");
            this._("#replace-replace").checked = false;
            this._("#replace-new-name").checked = true;
            this.setInputFieldVisibility();
            this._("#replace-new-name").focus();
        }
        MicroModal.show(this._('#replace-modal'), {
            disableScroll: true,
            onClose: modal => {
                this.statusText = "";
                this.loading = false;},
        });
    }

    closeDialog(e) {
        MicroModal.close(this._('#modal-picker'));
    }

    /**
     * Returns a filename with the next counter number.
     *
     * @returns {string} The next filename
     */
    getNextFilename() {
        let nextFilename = "";
        let splitFilename;
        if (this.forAll && this.customFilename !== '') {
            splitFilename = this.customFilename.split(".");
        }
        else {
            splitFilename = this.replaceFilename.split(".");
        }

        let splitBracket = splitFilename[0].split('(');
        if (splitBracket.length > 1) {
            let numberString = splitBracket[1].split(')');
            if (numberString.length > 1 && !isNaN(parseInt(numberString[0]))) {
                let number = parseInt(numberString[0]);
                this.fileNameCounter = number + 1;
                nextFilename = splitBracket[0] + "(" + this.fileNameCounter + ")";
            }
            else {
                nextFilename = splitFilename[0] + "(" + this.fileNameCounter + ")";
            }
        }
        else {
            nextFilename = splitFilename[0] + "(" + this.fileNameCounter + ")";
        }
        if (splitFilename.length > 1) {
            for(let i = 1; i < splitFilename.length; i++) {
                nextFilename = nextFilename + "." + splitFilename[i];
            }
        }
        this.fileNameCounter++;
        return nextFilename;
    }

    /**
     * Disables or enables the input field for the new file name
     */
    setInputFieldVisibility() {
        this._("#replace-filename").disabled = !this._("#replace-new-name").checked;
    }

    /**
     * Returns text for the cancel button depending on number of files
     *
     * @returns {string} correct cancel text
     */
    getCancelText() {
        if (this.fileList.length > 1) {
            return i18n.t('nextcloud-file-picker.replace-cancel-all');
        }
        return i18n.t('nextcloud-file-picker.replace-cancel');
    }

    /**
     *
     */
    cancelOverwrite() {
        this.statusText = "";
        this.loading = false;
        this.fileList = [];
    }

    /**
     *
     */
    setRepeatForAllConflicts() {
        this.forAll = this._("#replace_mode_all").checked;
    }

    /**
     * Add new folder with webdav
     *
     */
    openAddFolderDialogue() {
        if (this._('.addRowAnimation')) {
            this._('.addRowAnimation').classList.remove('addRowAnimation');
        }
        this._('#new-folder-wrapper').classList.toggle('hidden');
        if (this._('#new-folder-wrapper').classList.contains('hidden')) {
            this._('#add-folder-button').setAttribute("name","plus");
            this._('#add-folder-button').setAttribute("title", i18n.t('nextcloud-file-picker.add-folder-open'));
        }
        else {
            this._('#add-folder-button').setAttribute("name","close");
            this._('#add-folder-button').setAttribute("title", i18n.t('nextcloud-file-picker.add-folder-close'));
            this._('#new-folder').focus();
        }

        let that = this;
    }

    /**
     * Add new folder with webdav
     *
     */
    addFolder() {
        if (this._('#new-folder').value !== "") {
            let folderName = this._('#new-folder').value;
            let folderPath = this.directoryPath + "/" + folderName;
            this.webDavClient.createDirectory(folderPath).then(contents => {
                // this.loadDirectory(this.directoryPath);
                const d = new Date();
                let props = {permissions:'RGDNVCK'};
                this.tabulatorTable.addRow({type:"directory", filename: folderPath, basename:folderName, lastmod:d, props: props}, true);
                this.statusText = i18n.t('nextcloud-file-picker.add-folder-success', {folder: folderName});
                this.loading = false;
            }).catch(error => {
                this.loading = false;
                if (error.message.search("405") !== -1) {
                    this.statusText = html`<span class="error"> ${i18n.t('nextcloud-file-picker.add-folder-error', {folder: folderName})} </span>`;
                } else {
                    this.statusText = html`<span class="error"> ${i18n.t('nextcloud-file-picker.webdav-error', {error: error.message})} </span>`;
                }
            });

            this._('#new-folder').value = '';
            this.openAddFolderDialogue();
        }
    }

    /**
     * Select all files from tabulator table
     *
     */
    selectAll() {
        this.tabulatorTable.selectRow(this.tabulatorTable.getRows().filter(row => row.getData().type != 'directory' && this.checkFileType(row.getData(), this.allowedMimeTypes)));
        if (this.tabulatorTable.getSelectedRows().length > 0) {
            this.selectAllButton = false;
        }
    }

    /**
     * Deselect files from tabulator table
     *
     */
    deselectAll() {
        this.selectAllButton = true;
        this.tabulatorTable.getSelectedRows().forEach(row => row.deselect());
    }

    /**
     * Returns the parent directory path
     *
     * @returns {string} parent directory path
     */
    getParentDirectoryPath() {
        let path = this.directoryPath.replace(/\/$/, "");
        path = path.replace(path.split("/").pop(), "").replace(/\/$/, "");

        return (path === "") ? "/" : path;
    }

    /**
     * Returns the directory path as clickable breadcrumbs
     *
     * @returns {string} clickable breadcrumb path
     */
    getBreadcrumb() {
        let htmlpath = [];
        htmlpath[0] =  html`<span class="breadcrumb"><a class="home-link" @click="${() => { this.loadDirectory(""); }}" title="${i18n.t('nextcloud-file-picker.folder-home')}"><dbp-icon name="home"></dbp-icon> </a></span>`;
        const directories = this.directoryPath.split('/');
        if (directories[1] === "") {
            return htmlpath;
        }
        for(let i = 1; i < directories.length; i ++)
        {
            let path = "";
            for(let j = 1; j <= i; j++)
            {
                path += "/";
                path += directories[j];
            }

            htmlpath[i] = html`<span class="muted"> › </span><span class="breadcrumb"><a @click="${() => { this.loadDirectory(path); }}" title="${i18n.t('nextcloud-file-picker.load-path-link', {path: directories[i]})}">${directories[i]}</a></span>`;
        }

        return htmlpath;
    }

    /**
     * Returns Link to Nextcloud with actual directory
     *
     * @returns {string} actual directory Nextcloud link
     */
    getNextCloudLink() {
        let link = nextcloudFileURL + this.directoryPath;
        return link;
    }

    getCloudLogo() {
        let cloudLogo = html `<dbp-icon name="cloud" class="nextcloud-logo-icon"></dbp-icon>`;
        if (this.nextcloudName === "TU Graz cloud") {
            cloudLogo = html`
            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 97.6 81.74">
                  <g>
                    <path d="M89.8,22.7a28.51,28.51,0,0,0-16.9-9.1,27.84,27.84,0,0,0-14.8-12A24,24,0,0,0,48.9,0,28.36,28.36,0,0,0,20.6,27.4,22.42,22.42,0,0,0,13,70.11v-6.3A16.7,16.7,0,0,1,5.5,50a17,17,0,0,1,17-17h3.6V28.5A23,23,0,0,1,49,5.6a19.75,19.75,0,0,1,7.2,1.2h.1A22.48,22.48,0,0,1,68.9,17.5l.6,1.3,1.4.2a23.07,23.07,0,0,1,14.9,7.5,23.85,23.85,0,0,1-1.23,33.74v7A29.56,29.56,0,0,0,89.8,22.7Z"/>
                    <g>
                      <path d="M16.39,71.61H36.65V51.36H16.39Z" style="fill: #e4154b"/>
                      <path d="M38.67,71.61H58.93V51.36H38.67Z" style="fill: #e4154b"/>
                      <path d="M61,71.61H81.21V51.36H61Z" style="fill: #e4154b"/>
                      <path d="M26.52,81.74H46.78V61.49H26.52Z" style="fill: #e4154b"/>
                      <path d="M50.83,61.49H71.08V41.23H50.83Z" style="fill: #e4154b"/>
                    </g>
                  </g>
            </svg>
        `;
        }

        return cloudLogo;
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getGeneralCSS()}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getTextUtilities()}
            ${commonStyles.getModalDialogCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}
            
            .visible {
                display: unset;
            }
            
            .block {
                margin-bottom: 10px;
            }

            .error{
                color: var(--dbp-danger-bg-color);
            }

            .force-no-select{
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            .nextcloud-header{
                margin-bottom: 2rem;  
                display: inline-grid;
                width: 100%;
                grid-template-columns: auto auto;          
            }

            .nextcloud-header div button{
                justify-self: start;
            }

            .nextcloud-intro{
                text-align: center;
            }

            .nextcloud-logo{
                width: 80px;
                justify-self: end;  
                transition: all 0.5s ease;
                margin: auto;
            }

            .nextcloud-logo-icon{
                height: 100%;
            }

            .nextcloud-logo-sm{
                width: 40px;
                justify-self: inherit;  
                margin-right: 70px;
                display:none;
            }

            .m-inherit{
                margin: inherit;
            }

            .wrapper{
                width: 100%;
                height:100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
            }

            .wrapper-select{
                justify-content: inherit;
            }

            .select-button{
                justify-self: end;
                justify-self: end;
            }

            .nextcloud-content{
                width: 100%;
                height: 100%;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable .tabulator-col-title{
                padding-top: 4px;
                padding-bottom: 4px;
                font-weight: normal;
                font-size: 1rem;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="asc"] .tabulator-col-content .tabulator-arrow, 
            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="none"] .tabulator-col-content .tabulator-arrow,
            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-content .tabulator-arrow{
                padding-bottom: 6px;
            }

            .tabulator .tabulator-header, .tabulator .tabulator-header, .tabulator .tabulator-header .tabulator-col, .tabulator, .tabulator-row .tabulator-cell, .tabulator-row.tabulator-row-even,
            .tabulator .tabulator-header .tabulator-col.tabulator-sortable:hover{
                background-color: unset;
                background: unset;
                color: unset;
                border: none;
                font-size: 1rem;
            }

            .tabulator-row, .tabulator-row.tabulator-row-even{
                background-color: white;
            }
                        
            .tabulator-row.tabulator-selectable.tabulator-selectable:hover{
                background-color: white;
                color: var(--dbp-dark);
            }
            
            .tabulator-row.tabulator-selectable.tabulator-selected:hover, .tabulator-row.tabulator-selected{
                background-color: var(--dbp-dark);
                color: var(--dbp-light);
            }
            
            .tabulator .tabulator-header .tabulator-col .tabulator-col-content{
                display: inline-flex;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-content .tabulator-arrow{
                top: 16px;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="asc"] .tabulator-col-content .tabulator-arrow{
                border-top: none;
                border-bottom: 4px solid #666;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="none"] .tabulator-col-content .tabulator-arrow{
                border-top: none;
                border-bottom: 4px solid #bbb;
            }

            .tabulator .tabulator-header .tabulator-col .tabulator-col-content .tabulator-arrow{
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
            }

            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-content .tabulator-arrow,
            .tabulator .tabulator-header .tabulator-col.tabulator-sortable[aria-sort="desc"] .tabulator-col-content .tabulator-arrow{
                border-top: 4px solid #666;
                border-bottom: none;
            }

            .tabulator-row, .tabulator-row.tabulator-row-even{
                padding-top: 10px;
                padding-bottom: 10px;
                border-top: 1px solid #eee;
            }

            .tabulator-header{
                padding-top: 10px;
                padding-bottom: 10px;
            }

            .nextcloud-nav{
                display: flex;
                justify-content: space-between;
            }
           

            .nextcloud-footer{
                background-color: white;
                width: 100%;
                padding-top: 10px;
            }

            .nextcloud-footer-grid{
                width: 100%;
                display: flex;
                align-items: center;
                flex-direction: row-reverse;
                justify-content: space-between;
            }

            .tabulator .tabulator-tableHolder{
                overflow: hidden;
            }

            .tabulator .tabulator-tableHolder .tabulator-placeholder span{
                font-size: inherit;
                font-weight: inherit;
                color: inherit;
            }

            .add-folder{
                padding-top: 10px;
                white-space: nowrap;
                align-self: end;
            }
            
            #select-all-wrapper{
                padding-top: 10px;
                white-space: nowrap;
                align-self: end;
            }
            
            #replace-modal-box {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 30px;
                max-height: 450px;
                min-height: 450px;
                min-width: 380px;
                max-width: 190px;
            }
            
            #replace-modal-box .modal-header {
                display: flex;
                justify-content: space-evenly;
                align-items: baseline;
            }
            
             #replace-modal-box .modal-header h2 {
                font-size: 1.2rem;
                padding-right: 5px;
            }
            
            #replace-modal-box .modal-content {
                display: flex;
                flex-direction: column;
                height: 100%;
                justify-content: space-evenly;
            }
            
            #replace-modal-box .radio-btn {
                margin-right: 5px;
            }
            
            #replace-modal-box .modal-content label {
                display: block;
                width: 100%;
            }
            
            #replace-modal-box #replace-filename {
                display: block;
                width: 100%;
                margin-top: 8px;
            }
            
            #replace-modal-box input[type="text"]:disabled {
                color: #aaa;
            }
            
             #replace-modal-box .modal-content div {
                display: flex;
            }
            
            #replace-modal-box .modal-footer {
                padding-top: 15px;
            }
            
            #replace-modal-box .modal-footer .modal-footer-btn {
                display: flex;
                justify-content: space-between;
                padding-bottom: 15px;
            }
            
            .breadcrumb, .muted{
                color: var(--dbp-muted-text);
            }
            
            .breadcrumb:last-child{
                color: inherit;
            }
            
            input:disabled+label{
                color: #aaa;
            }
            
            .inline-block{
                display: inline-block;
            }
            
            .nextcloud-nav h2{
                padding-top: 10px;
            }
            
            .no-select, .tabulator-row.tabulator-selected.no-select:hover, .tabulator-row.no-select:hover, .tabulator-row.tabulator-selectable.no-select:hover{
                cursor: unset;
                color: #333;
                background-color: white;
            }
            
            .nextcloud-nav{
                    position: relative;
                }
            
            .inline-block{
                position: absolute;
                right: 0px;
                z-index: 1;
                background-color: white;
                bottom: -40px;
            }
            
            .addRowAnimation{
                animation: added 0.4s ease;
            }
            
            #abortButton{
                color: var(--dbp-danger-bg-color);
            }
            
            #abortButton:hover{
                color: white;
            }
            
            @keyframes added {
                0% {
                    background-color: white;
                }
                50% {
                    background-color: var(--dbp-success-bg-color);
                }
                100% {
                    background-color: white;
                }
            }
            
            .nextcloud-picker-icon{
                top: 0px;
                font-size: 1.4rem;
            }
            
            .spinner{
                font-size: 0.7em;
            }
            
            .nextcloud-picker-icon-disabled{
                opacity: 0.4;
            }
           
            @media only screen
            and (orientation: portrait)
            and (max-device-width: 765px) {   
                .inline-block{    
                    width: 100%;
                }
                
                .add-folder-button{
                    right: 0px;
                    position: absolute;
                }
                
                .nextcloud-nav h2 > a{
                    font-size: 1.3rem;
                }
                
                .nextcloud-nav h2{
                   padding-top: 8px; 
                }

                .nextcloud-nav a{
                    font-size: 1rem;
                }
                
                .nextcloud-nav .home-link{
                    font-size: 1.2rem;
                } 

                .nextcloud-logo-sm{
                    display: none;
                }
                
                .nextcloud-logo{
                    margin: 0 auto;
                }

                .tabulator .tabulator-tableHolder{
                    white-space: inherit;
                }
                .button-wrapper{
                    justify-self: start;
                }

                .wrapper{
                    display: flex;
                    justify-content: space-between;
                }

                .nextcloud-header{
                    grid-area: header-l;
                    margin-bottom: 0px;
                }

                .nextcloud-content, .nextcloud-intro{
                    grid-area: content;
                    height:100%;
                    justify-content:center;
                }

                .nextcloud-intro{
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                }

                .nextcloud-footer{
                    bottom: 0px;
                    width: 100%;
                    left: 0px;
                }

                .mobile-hidden{
                    display: none;
                }
                
                .info-box{
                    position:relative;
                }
                
                .nextcloud-footer-grid{
                    display: flex;
                    justify-content: center;
                    flex-direction: column-reverse;
                }

                .select-button{
                    margin: 0px;
                }

                #new-folder{
                    width: 100%;
                }
                
                #replace-modal-box {
                    min-width: 100%;
                    max-width: 100%;
                }
                
                .hidden{
                    display:none;
                }
                
            }
        `;
    }

    render() {
        const tabulatorCss = commonUtils.getAssetURL('local/dbp-file-source/tabulator-tables/css/tabulator.min.css');

        return html`
            <div class="wrapper">
                <link rel="stylesheet" href="${tabulatorCss}">
                <div class="nextcloud-intro ${classMap({hidden: this.isPickerActive})}">
                    <div class="nextcloud-logo ${classMap({"nextcloud-logo-sm": this.isPickerActive})}">
                             ${this.getCloudLogo()}
                        </div>
                    <div class="block text-center ${classMap({hidden: this.isPickerActive})}">
                        <h2 class="m-inherit">
                            ${this.nextcloudName}
                        </h2>
                        <p class="m-inherit">
                            ${i18n.t('nextcloud-file-picker.init-text-1', {name: this.nextcloudName})}   <br>           
                            ${i18n.t('nextcloud-file-picker.init-text-2')}     <br><br>
                                   
                        </p>
                    </div>
                    <div class="block ${classMap({hidden: this.isPickerActive})}">
                        <button class="button  is-primary"
                                title="${i18n.t('nextcloud-file-picker.open-nextcloud-file-picker', {name: this.nextcloudName})}"
                                @click="${async () => { this.openFilePicker(); } }">${i18n.t('nextcloud-file-picker.connect-nextcloud', {name: this.nextcloudName})}</button>
                    </div>
                    <div class="block text-center m-inherit ${classMap({hidden: this.isPickerActive})}">
                    <p class="m-inherit"><br>
                         ${i18n.t('nextcloud-file-picker.auth-info')}<br>${i18n.t('nextcloud-file-picker.auth-info-2')}  
                    </p>
                </div>
               </div>
                <div class="nextcloud-content ${classMap({hidden: !this.isPickerActive})}">
                    <div class="nextcloud-nav">
                        <h2>${this.getBreadcrumb()}</h2>             
                        <div class="add-folder ${classMap({hidden: !this.directoriesOnly})}">
                            <div class="inline-block">
                                <div id="new-folder-wrapper" class="hidden">
                                    <input type="text" placeholder="${i18n.t('nextcloud-file-picker.new-folder-placeholder')}" name="new-folder" class="input" id="new-folder" />
                                    <button class="button add-folder-button"
                                            title="${i18n.t('nextcloud-file-picker.add-folder')}"
                                            @click="${() => { this.addFolder(); }}">
                                        <dbp-icon name="checkmark-circle" class="nextcloud-add-folder"></dbp-icon>
                                    </button>
                                </div>
                            </div>
                            <button class="button"
                                    title="${i18n.t('nextcloud-file-picker.add-folder-open')}"
                                    @click="${() => { this.openAddFolderDialogue(); }}">
                                <dbp-icon name="plus" class="nextcloud-add-folder" id="add-folder-button"></dbp-icon>
                            </button>
                        </div>
                        <div id="select-all-wrapper" class="${classMap({hidden: this.directoriesOnly})}">
                            <button class="button ${classMap({hidden: !this.selectAllButton})}"
                                    title="${i18n.t('nextcloud-file-picker.select-all-title')}"
                                    @click="${() => { this.selectAll(); }}">
                                    ${i18n.t('nextcloud-file-picker.select-all')}
                            </button>
                            <button class="button ${classMap({hidden: this.selectAllButton})}"
                                    title="${i18n.t('nextcloud-file-picker.select-nothing-title')}"
                                    @click="${() => { this.deselectAll(); }}">
                                    ${i18n.t('nextcloud-file-picker.select-nothing')}
                            </button>
                           
                        </div>
                    </div>
                    <table id="directory-content-table" class="force-no-select"></table>
                </div>
                 
                <div class="nextcloud-footer ${classMap({hidden: !this.isPickerActive})}">
                    <div class="nextcloud-footer-grid">
                        <button id="download-button" class="button select-button is-primary ${classMap({hidden: ((!this.directoriesOnly)  || (this.directoriesOnly && this.abortUploadButton && this.forAll))})}"
                                @click="${() => { this.sendDirectory(this.tabulatorTable.getSelectedData()); }}">${this.folderIsSelected}</button>
                        <button class="button select-button is-primary ${classMap({hidden: this.directoriesOnly})}"
                                @click="${() => { this.downloadFiles(this.tabulatorTable.getSelectedData()); }}">${i18n.t('nextcloud-file-picker.select-files')}</button>
                       <button id="abortButton" class="button select-button hidden ${classMap({"visible": (this.directoriesOnly && this.forAll && this.abortUploadButton)})}"
                                    title="${i18n.t('nextcloud-file-picker.abort')}"  @click="${() => { this.abortUpload = true; }}">${i18n.t('nextcloud-file-picker.abort')}</button>
                                
                        <div class="block info-box ${classMap({hidden: this.statusText === ""})}">
                            <dbp-mini-spinner class="spinner ${classMap({hidden: this.loading === false})}"></dbp-mini-spinner>
                            <span>${this.statusText}</span>
                        </div>
                       
                    </div>
                </div>
            </div>

            <div class="modal micromodal-slide" id="replace-modal" aria-hidden="true">
                <div class="modal-overlay" tabindex="-2" data-micromodal-close>
                    <div class="modal-container" id="replace-modal-box" role="dialog" aria-modal="true" aria-labelledby="replace-modal-title" >
                        <header class="modal-header">
                            <h2 id="replace-modal-title">
                                ${i18n.t('nextcloud-file-picker.replace-title-1')}
                                <span style="word-break: break-all;">${this.replaceFilename}</span>
                                ${i18n.t('nextcloud-file-picker.replace-title-2')}.
                            </h2>
                            <button title="${i18n.t('file-sink.modal-close')}" class="modal-close"  aria-label="Close modal" @click="${() => {this.closeDialog()}}">
                                <dbp-icon title="${i18n.t('file-sink.modal-close')}" name="close" class="close-icon"></dbp-icon>
                            </button> 
                        </header>
                        <main class="modal-content" id="replace-modal-content">
                            <h3>
                                ${i18n.t('nextcloud-file-picker.replace-text')}?
                            </h3>
                            <div>
                                <label class="button-container">
                                    <span> 
                                        ${i18n.t('nextcloud-file-picker.replace-new_name')}:

                                    </span>
                                    <input type="radio" id="replace-new-name" class="radio-btn" name="replacement" value="new-name" checked @click="${() => {this.setInputFieldVisibility();}}">
                                    <span class="radiobutton"></span>
                                    <input type="text" id="replace-filename" class="input" name="replace-filename" value="" onClick="this.select();">
                                </label>

                            </div>

                   
                            <div>
                                <label class="button-container">
                                    <span>${i18n.t('nextcloud-file-picker.replace-replace')}</span>
                                    <input type="radio" id="replace-replace" name="replacement" value="replace" @click="${() => {this.setInputFieldVisibility();}}">
                                    <span class="radiobutton"></span>
                                </label>
                            </div>
                            <div>
                                <label class="button-container">
                                    <span>${i18n.t('nextcloud-file-picker.replace-skip')}</span>
                                    <input type="radio" class="radio-btn" name="replacement" value="ignore" @click="${() => {this.setInputFieldVisibility();}}">
                                    <span class="radiobutton"></span>
                                </label>
                            </div>
                        </main>
                        <footer class="modal-footer">
                            <div class="modal-footer-btn">
                                <button class="button" data-micromodal-close aria-label="Close this dialog window" @click="${() => {this.cancelOverwrite();}}">${this.getCancelText()}</button>
                                <button class="button select-button is-primary" @click="${() => {this.uploadFileAfterConflict();}}">OK</button>
                            </div>
                            <div>
                                <label class="button-container">
                                    ${i18n.t('nextcloud-file-picker.replace-mode-all')}
                                    <input type="checkbox" id="replace_mode_all" name="replace_mode_all" value="replace_mode_all" @click="${() => {this.setRepeatForAllConflicts();}}"> 
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        `;
    }
}
