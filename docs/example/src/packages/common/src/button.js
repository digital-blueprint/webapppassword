import {html, LitElement, css} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {MiniSpinner} from './mini-spinner.js';
import * as commonStyles from '../styles.js';

/**
 * dbp-button implements a button with Bulma styles and automatic spinner and
 * disabling if button is clicked
 *
 * Use the attribute "no-spinner-on-click" to disable the spinner, then you can
 * start it with start() and stop it with stop()
 *
 * Type can be is-primary/is-info/is-success/is-warning/is-danger
 */
export class Button extends ScopedElementsMixin(LitElement) {
    constructor() {
        super();
        this.value = "";
        this.type = "";
        this.spinner = false;
        this.noSpinnerOnClick = false;
        this.disabled = false;
    }

    static get scopedElements() {
        return {
            'dbp-mini-spinner': MiniSpinner,
        };
    }

    connectedCallback() {
        super.connectedCallback();
    }

    static get properties() {
        return {
            value: { type: String },
            type: { type: String },
            spinner: { type: Boolean },
            noSpinnerOnClick: { type: Boolean, attribute: 'no-spinner-on-click' },
            disabled: { type: Boolean, reflect: true },
        };
    }

    clickHandler() {
        if (!this.noSpinnerOnClick) {
            this.start();
        }
    }

    start() {
        this.spinner = true;
        this.disabled = true;
    }

    stop() {
        this.spinner = false;
        this.disabled = false;
    }

    isDisabled() {
        return this.disabled;
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getButtonCSS()}

            .spinner { margin-left: 0.5em; }
        `;
    }

    render() {
        return html`
            <button @click="${this.clickHandler}" class="button ${this.type}" ?disabled="${this.disabled}">
                ${this.value} <dbp-mini-spinner class="spinner" style="display: ${this.spinner ? "inline" : "none"}"></dbp-mini-spinner>
            </button>
        `;
    }
}
