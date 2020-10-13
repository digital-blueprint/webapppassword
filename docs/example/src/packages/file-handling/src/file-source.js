import {i18n} from './i18n';
import {css, html} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPLitElement from 'dbp-common/dbp-lit-element';
import * as commonUtils from "dbp-common/utils";
import {Icon, MiniSpinner} from 'dbp-common';
import * as commonStyles from 'dbp-common/styles';
import {NextcloudFilePicker} from "./dbp-nextcloud-file-picker";
import {classMap} from 'lit-html/directives/class-map.js';
import MicroModal from './micromodal.es'
import * as fileHandlingStyles from './styles';

function mimeTypesToAccept(mimeTypes) {
    // Some operating systems can't handle mime types and
    // need file extensions, this tries to add them for some..
    let mapping = {
        'application/pdf': ['.pdf'],
        'application/zip': ['.zip'],
    };
    let accept = [];
    mimeTypes.split(',').forEach((mime) => {
        accept.push(mime);
        if (mime.trim() in mapping) {
            accept = accept.concat(mapping[mime.trim()]);
        }
    });
    return accept.join(',');
}


/**
 * FileSource web component
 */
export class FileSource extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this.context = '';
        this.lang = 'de';
        this.nextcloudAuthUrl = '';
        this.nextcloudName ='Nextcloud';
        this.nextcloudWebDavUrl = '';
        this.dropArea = null;
        this.allowedMimeTypes = '*/*';
        this.enabledSources = 'local';1
        this.text = '';
        this.buttonLabel = '';
        this.disabled = false;
        this.decompressZip = false;
        this._queueKey = 0;
        this.activeSource = 'local';
        this.isDialogOpen = false;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-nextcloud-file-picker': NextcloudFilePicker,
        };
    }

    /**
     * See: https://lit-element.polymer-project.org/guide/properties#initialize
     */
    static get properties() {
        return {
            context: { type: String, attribute: 'context'},
            lang: { type: String },
            allowedMimeTypes: { type: String, attribute: 'allowed-mime-types' },
            enabledSources: { type: String, attribute: 'enabled-sources' },
            nextcloudAuthUrl: { type: String, attribute: 'nextcloud-auth-url' },
            nextcloudWebDavUrl: { type: String, attribute: 'nextcloud-web-dav-url' },
            nextcloudName: { type: String, attribute: 'nextcloud-name' },
            text: { type: String },
            buttonLabel: { type: String, attribute: 'button-label' },
            disabled: { type: Boolean },
            decompressZip: { type: Boolean, attribute: 'decompress-zip' },
            activeSource: { type: Boolean, attribute: false },
            isDialogOpen: { type: Boolean, attribute: 'dialog-open' },
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "lang":
                    i18n.changeLanguage(this.lang);
                    break;
                case "enabledSources":
                    if (!this.hasEnabledSource(this.activeSource)) {
                        this.activeSource = this.enabledSources.split(",")[0];
                    }
                    break;
                case "isDialogOpen":
                    if (this.isDialogOpen) {
                        // this.setAttribute("dialog-open", "");
                        this.openDialog();
                    } else {
                        this.removeAttribute("dialog-open");
                        // this.closeDialog();
                    }

                    break;
            }
        });

        super.update(changedProperties);
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateComplete.then(() => {
            this.dropArea = this._('#dropArea');
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                this.dropArea.addEventListener(eventName, this.preventDefaults, false)
            });
            ['dragenter', 'dragover'].forEach(eventName => {
                this.dropArea.addEventListener(eventName, this.highlight.bind(this), false)
            });
            ['dragleave', 'drop'].forEach(eventName => {
                this.dropArea.addEventListener(eventName, this.unhighlight.bind(this), false)
            });
            this.dropArea.addEventListener('drop', this.handleDrop.bind(this), false);
            this._('#fileElem').addEventListener('change', this.handleChange.bind(this));
        });
    }

    preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(e) {
        this.dropArea.classList.add('highlight')
    }

    unhighlight(e) {
        this.dropArea.classList.remove('highlight')
    }

    handleDrop(e) {
        if (this.disabled) {
            return;
        }

        let dt = e.dataTransfer;
        // console.dir(dt);
        let files = dt.files;

        this.handleFiles(files);
    }

    async handleChange(e) {
        let fileElem = this._('#fileElem');

        if (fileElem.files.length === 0) {
            return;
        }

        await this.handleFiles(fileElem.files);

        // reset the element's value so the user can upload the same file(s) again
        fileElem.value = '';
    }

    /**
     * Handles files that were dropped to or selected in the component
     *
     * @param files
     * @returns {Promise<void>}
     */
    async handleFiles(files) {
        // console.log('handleFiles: files.length = ' + files.length);
        // this.dispatchEvent(new CustomEvent("dbp-file-source-selection-start",
        //     { "detail": {}, bubbles: true, composed: true }));

        await commonUtils.asyncArrayForEach(files, async (file) => {
            if (file.size === 0) {
                console.log('file \'' + file.name + '\' has size=0 and is denied!')
                return;
            }

            // check if we want to decompress the zip and queue the contained files
            if (this.decompressZip && file.type === "application/zip") {
                // add decompressed files to tempFilesToHandle
                await commonUtils.asyncArrayForEach(
                    await this.decompressZIP(file), (file) => this.sendFileEvent(file));

                return;
            } else if (this.allowedMimeTypes && !this.checkFileType(file)) {
                return;
            }

            await this.sendFileEvent(file);
        });

        // this.dispatchEvent(new CustomEvent("dbp-file-source-selection-finished",
        //     { "detail": {}, bubbles: true, composed: true }));

        this.closeDialog();
    }

    /**
     * @param file
     */
    sendFileEvent(file) {
        MicroModal.close(this._('#modal-picker'));
        const data = {"file": file};
        const event = new CustomEvent("dbp-file-source-file-selected", { "detail": data, bubbles: true, composed: true });
        this.dispatchEvent(event);
    }

    checkFileType(file) {
        // check if file is allowed
        const [fileMainType, fileSubType] = file.type.split('/');
        const mimeTypes = this.allowedMimeTypes.split(',');
        let deny = true;

        mimeTypes.forEach((str) => {
            const [mainType, subType] = str.split('/');
            deny = deny && ((mainType !== '*' && mainType !== fileMainType) || (subType !== '*' && subType !== fileSubType));
        });

        if (deny) {
            console.log(`mime type ${file.type} of file '${file.name}' is not compatible with ${this.allowedMimeTypes}`);
            return false;
        }

        return true;
    }

    hasEnabledSource(source) {
        return this.enabledSources.split(',').includes(source);
    }

    /**
     * Decompress files synchronously
     *
     * @param file
     * @returns {Promise<[]>}
     */
    async decompressZIP(file) {
        // see: https://stuk.github.io/jszip/
        let JSZip = (await import('jszip/dist/jszip.js')).default;
        let filesToHandle = [];

        // load zip file
        await JSZip.loadAsync(file)
            .then(async (zip) => {
                // we are not using zip.forEach because we need to handle those files synchronously which
                // isn't supported by JSZip (see https://github.com/Stuk/jszip/issues/281)
                // using zip.files directly works great!
                await commonUtils.asyncObjectForEach(zip.files, async (zipEntry) => {
                    // skip directory entries
                    if (zipEntry.dir) {
                        return;
                    }

                    await zipEntry.async("blob")
                        .then(async (blob) => {
                            // get mime type of Blob, see https://github.com/Stuk/jszip/issues/626
                            const mimeType = await commonUtils.getMimeTypeOfFile(blob);

                            // create new file with name and mime type
                            const zipEntryFile = new File([blob], zipEntry.name, { type: mimeType });

                            // check mime type
                            if (!this.checkFileType(zipEntryFile)) {
                                return;
                            }

                            filesToHandle.push(zipEntryFile);
                        }, (e) => {
                            // handle the error
                            console.error("Decompressing of file in " + file.name + " failed: " + e.message);
                        });
                    });
            }, function (e) {
                // handle the error
                console.error("Loading of " + file.name + " failed: " + e.message);
            });

        return filesToHandle;
    }

    async sendFinishedEvent(response, file, sendFile = false) {
        if (response === undefined) {
            return;
        }

        let data =  {
            fileName: file.name,
            status: response.status,
            json: {"hydra:description": ""}
        };

        try {
            await response.json().then((json) => {
                data.json = json;
            });
        } catch (e) {}

        if (sendFile) {
            data.file = file;
        }

        const event = new CustomEvent("dbp-file-source-file-finished", { "detail": data, bubbles: true, composed: true });
        this.dispatchEvent(event);
    }

    loadWebdavDirectory() {
        if (this._('#nextcloud-file-picker').webDavClient !== null) {
            this._('#nextcloud-file-picker').loadDirectory(this._('#nextcloud-file-picker').directoryPath);
        }
    }

    openDialog() {
        this.loadWebdavDirectory();
        MicroModal.show(this._('#modal-picker'), {
            disableScroll: true,
            onClose: modal => { this.isDialogOpen = false;
                this._('#nextcloud-file-picker').selectAllButton = true;}
        });
    }

    closeDialog() {
        this._('#nextcloud-file-picker').selectAllButton = true;
        MicroModal.close(this._('#modal-picker'));
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS()}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getModalDialogCSS()}
            ${fileHandlingStyles.getFileHandlingCss()}

           

            p {
                margin-top: 0;
            }
            
            .block {
                margin-bottom: 10px;
            }
            
            #dropArea {
                border: var(--FUBorderWidth, 2px) var(--FUBorderStyle, dashed) var(--FUBBorderColor, black);
                border-radius: var(--FUBorderRadius, 0);
                width: auto;
                margin: var(--FUMargin, 0px);
                padding: var(--FUPadding, 20px);
                flex-grow: 1;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
    
            #dropArea.highlight {
                border-color: var(--FUBorderColorHighlight, purple);
            }
            
            
             @media only screen
            and (orientation: portrait)
            and (max-device-width: 800px) {
                #dropArea{
                    height: 100%;
                }
            
            }
            
        `;
    }

    render() {
        let allowedMimeTypes = this.allowedMimeTypes;

        if (this.decompressZip) {
            allowedMimeTypes += ",application/zip";
        }

        return html`
<!--
            <button class="button"
                ?disabled="${this.disabled}"
                @click="${() => { this.openDialog(); }}">${i18n.t('file-source.open-menu')}</button>
-->
            <div class="modal micromodal-slide" id="modal-picker" aria-hidden="true">
                <div class="modal-overlay" tabindex="-1" data-micromodal-close>
                    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-picker-title">
                        <nav class="modal-nav">
                            <div title="${i18n.t('file-source.nav-local')}"
                                 @click="${() => { this.activeSource = "local"; }}"
                                 class="${classMap({"active": this.activeSource === "local", hidden: !this.hasEnabledSource("local")})}">
                                <dbp-icon class="nav-icon" name="laptop"></dbp-icon>
                                <p>${i18n.t('file-source.nav-local')}</p>
                            </div>
                            <div title="Nextcloud"
                                 @click="${() => { this.activeSource = "nextcloud"; this.loadWebdavDirectory();}}"
                                 class="${classMap({"active": this.activeSource === "nextcloud", hidden: !this.hasEnabledSource("nextcloud") || this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}">
                                <dbp-icon class="nav-icon" name="cloud"></dbp-icon>
                                <p> ${this.nextcloudName} </p>
                            </div>
                            
                        </nav>
                        <div class="modal-header">
                            <button title="${i18n.t('file-source.modal-close')}" class="modal-close"  aria-label="Close modal"  @click="${() => {this.closeDialog()}}">
                                    <dbp-icon name="close" class="close-icon"></dbp-icon>
                            </button>
                       
                            <p class="modal-context"> ${this.context}</p>
                        </div>
                        <main class="modal-content" id="modal-picker-content">
                            
                            <div class="source-main ${classMap({"hidden": this.activeSource !== "local"})}">
                                <div id="dropArea">
                                    <div class="block">
                                        <p>${this.text || i18n.t('intro')}</p>
                                    </div>
                                    <input ?disabled="${this.disabled}"
                                           type="file"
                                           id="fileElem"
                                           multiple
                                           accept="${mimeTypesToAccept(allowedMimeTypes)}"
                                           name='file'>
                                    <label class="button is-primary" for="fileElem" ?disabled="${this.disabled}">
                                        ${this.buttonLabel || i18n.t('upload-label')}
                                    </label>
                                </div>
                            </div>
                            <div class="source-main ${classMap({"hidden": this.activeSource !== "nextcloud" || this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}">
                                <dbp-nextcloud-file-picker id="nextcloud-file-picker"
                                       class="${classMap({hidden: this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}"
                                       ?disabled="${this.disabled}"
                                       lang="${this.lang}"
                                       auth-url="${this.nextcloudAuthUrl}"
                                       web-dav-url="${this.nextcloudWebDavUrl}"
                                       nextcloud-name="${this.nextcloudName}"
                                       allowed-mime-types="${this.allowedMimeTypes}"
                                       @dbp-nextcloud-file-picker-file-downloaded="${(event) => {
                                    this.sendFileEvent(event.detail.file);
                                }}"></dbp-nextcloud-file-picker>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
          `;
    }
}