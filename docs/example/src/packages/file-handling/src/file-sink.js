import {i18n} from './i18n';
import {css, html} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPLitElement from 'dbp-common/dbp-lit-element';
import * as commonUtils from "dbp-common/utils";
import {Icon, MiniSpinner} from 'dbp-common';
import * as commonStyles from 'dbp-common/styles';
import {NextcloudFilePicker} from "./dbp-nextcloud-file-picker";
import {classMap} from 'lit-html/directives/class-map.js';
import FileSaver from 'file-saver';
import MicroModal from "./micromodal.es";
import * as fileHandlingStyles from './styles';
import { send } from 'dbp-common/notification';


/**
 * FileSink web component
 */
export class FileSink extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this.context = '';
        this.lang = 'de';
        this.nextcloudAuthUrl = '';
        this.nextcloudWebDavUrl = '';
        this.nextcloudName ='Nextcloud';
        this.text = '';
        this.buttonLabel = '';
        this.filename = "files.zip";
        this.files = [];
        this.activeDestination = 'local';
        this.isDialogOpen = false;
        this.enabledDestinations = 'local';
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
            filename: { type: String },
            files: { type: Array, attribute: false },
            enabledDestinations: { type: String, attribute: 'enabled-destinations' },
            nextcloudAuthUrl: { type: String, attribute: 'nextcloud-auth-url' },
            nextcloudWebDavUrl: { type: String, attribute: 'nextcloud-web-dav-url' },
            nextcloudName: { type: String, attribute: 'nextcloud-name' },
            text: { type: String },
            buttonLabel: { type: String, attribute: 'button-label' },
            isDialogOpen: { type: Boolean, attribute: false },
            activeDestination: { type: Boolean, attribute: false },
        };
    }

    async downloadCompressedFiles() {
        // see: https://stuk.github.io/jszip/
        let JSZip = (await import('jszip/dist/jszip.js')).default;
        let zip = new JSZip();
        let fileNames = [];

        // download one file not compressed!
        if (this.files.length === 1) {
            FileSaver.saveAs(this.files[0], this.files[0].filename);
            this.closeDialog();
            return;
        }

        // download all files compressed
        this.files.forEach((file) => {
            let fileName = file.name;

            // add pseudo-random string on duplicate file name
            if (fileNames.indexOf(fileName) !== -1) {
                fileName = commonUtils.getBaseName(fileName) + "-" + Math.random().toString(36).substring(7) + "." +
                    commonUtils.getFileExtension(fileName);
            }

            fileNames.push(fileName);
            zip.file(fileName, file);
        });

        let content = await zip.generateAsync({type:"blob"});

        // see: https://github.com/eligrey/FileSaver.js#readme
        FileSaver.saveAs(content, this.filename || "files.zip");

        this.closeDialog();
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "lang":
                    i18n.changeLanguage(this.lang);
                    break;
                case "enabledDestinations":
                    if (!this.hasEnabledDestination(this.activeDestination)) {
                        this.activeDestination = this.enabledDestinations.split(",")[0];
                    }
                    break;
                case "files":
                    if (this.files.length !== 0 && !this.isDialogOpen) {
                        this.openDialog();
                    }
                    break;
            }
        });

        super.update(changedProperties);
    }

    hasEnabledDestination(source) {
        return this.enabledDestinations.split(',').includes(source);
    }

    async uploadToNextcloud(directory) {
        let that = this;
        const element = that._('#nextcloud-file-picker');
        await element.uploadFiles(that.files, directory);
    }

    finishedFileUpload(event) {
        MicroModal.close(this._('#modal-picker'));
        if (event.detail > 0) {
            send({
                "summary": i18n.t('file-sink.upload-success-title'),
                "body": i18n.t('file-sink.upload-success-body', {name: this.nextcloudName, count: event.detail}),
                "type": "success",
                "timeout": 5,
            });
        }
    }

    preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
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
            onClose: modal => { this.isDialogOpen = false; },
        });
    }

    closeDialog(e) {
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

            #zip-download-block {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            .block {
                margin-bottom: 10px;
            }
        `;
    }

    render() {
        return html`
            <vpu-notification lang="de" client-id="my-client-id"></vpu-notification>
            <div class="modal micromodal-slide" id="modal-picker" aria-hidden="true">
                <div class="modal-overlay" tabindex="-1">
                    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-picker-title">
                        <nav class="modal-nav">
                            <div title="${i18n.t('file-sink.nav-local')}"
                                 @click="${() => { this.activeDestination = "local"; }}"
                                 class="${classMap({"active": this.activeDestination === "local", hidden: !this.hasEnabledDestination("local")})}">
                                <dbp-icon class="nav-icon" name="laptop"></dbp-icon>
                                 <p>${i18n.t('file-source.nav-local')}</p>
                            </div>
                            <div title="${this.nextcloudName}"
                                 @click="${() => { this.activeDestination = "nextcloud"; this.loadWebdavDirectory();}}"
                                 class="${classMap({"active": this.activeDestination === "nextcloud", hidden: !this.hasEnabledDestination("nextcloud") || this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}">
                                <dbp-icon class="nav-icon" name="cloud"></dbp-icon>
                                <p> ${this.nextcloudName} </p>
                            </div>
                        </nav>
                            <div class="modal-header">
                                <button title="${i18n.t('file-sink.modal-close')}" class="modal-close"  aria-label="Close modal" @click="${() => { this.closeDialog()}}">
                                        <dbp-icon title="${i18n.t('file-sink.modal-close')}" name="close" class="close-icon"></dbp-icon>
                                </button> 
                                <p class="modal-context"> ${this.context}</p>
                        </div>
                            
                        
                        <main class="modal-content" id="modal-picker-content">
                            <div class="source-main ${classMap({"hidden": this.activeDestination !== "local"})}">
                                <div id="zip-download-block">
                                    <div class="block">
                                        ${this.text || i18n.t('file-sink.local-intro', {'count': this.files.length})}
                                    </div>
                                    <button class="button is-primary"
                                            ?disabled="${this.disabled}"
                                            @click="${() => { this.downloadCompressedFiles(); }}">
                                        ${this.buttonLabel || i18n.t('file-sink.local-button', {'count': this.files.length})}
                                    </button>
                                </div>
                            </div>
                            <div class="source-main ${classMap({"hidden": this.activeDestination !== "nextcloud" || this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}">
                                <dbp-nextcloud-file-picker id="nextcloud-file-picker"
                                                           class="${classMap({hidden: this.nextcloudWebDavUrl === "" || this.nextcloudAuthUrl === ""})}"
                                                           directories-only
                                                           max-selected-items="1"
                                                           select-button-text="${i18n.t('file-sink.select-directory')}"
                                                           ?disabled="${this.disabled}"
                                                           lang="${this.lang}"
                                                           auth-url="${this.nextcloudAuthUrl}"
                                                           web-dav-url="${this.nextcloudWebDavUrl}"
                                                           nextcloud-name="${this.nextcloudName}"
                                                           @dbp-nextcloud-file-picker-file-uploaded="${(event) => {
                                                               this.uploadToNextcloud(event.detail);
                                                           }}"
                                                           @dbp-nextcloud-file-picker-file-uploaded-finished="${(event) => {
                                                                this.finishedFileUpload(event);
                                                            }}"></dbp-nextcloud-file-picker>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        `;
    }
}