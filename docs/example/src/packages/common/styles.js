import {css, unsafeCSS, CSSResult} from 'lit-element';
import {getIconSVGURL} from './src/icon.js';

/**
 * We want to have "neutral" colors here
 *
 * @returns {CSSResult}
 */
export function getThemeCSS() {
    // language=css
    return css`
        :host {
            --dbp-primary-bg-color: var(--dbp-override-primary-bg-color, #007bff);
            --dbp-primary-text-color: var(--dbp-override-primary-text-color, #fff);
            --dbp-primary-button-border: var(--dbp-override-primary-button-border, #007bff);
            --dbp-secondary-bg-color: var(--dbp-override-secondary-bg-color, #6c757d);
            --dbp-secondary-text-color: var(--dbp-override-secondary-text-color, #fff);
            --dbp-info-bg-color: var(--dbp-override-info-bg-color, #17a2b8);
            --dbp-info-text-color: var(--dbp-override-info-text-color, #fff);
            --dbp-success-bg-color: var(--dbp-override-success-bg-color, #28a745);
            --dbp-success-text-color: var(--dbp-override-success-text-color, #fff);
            --dbp-warning-bg-color: var(--dbp-override-warning-bg-color, #ffc107);
            --dbp-warning-text-color: var(--dbp-override-warning-text-color, #343a40);
            --dbp-danger-bg-color: var(--dbp-override-danger-bg-color, #dc3545);
            --dbp-danger-text-color: var(--dbp-override-danger-text-color, #fff);
            --dbp-light: var(--dbp-override-light, #f8f9fa);
            --dbp-dark: var(--dbp-override-dark, #343a40);
            --dbp-muted-text: var(--dbp-override-muted-text, #6c757d);
            --dbp-border-radius: var(--dbp-override-border-radius, 0px);
            --dbp-border-width: var(--dbp-override-border-width, 1px);
            --dbp-border-color: var(--dbp-override-border-color, #000);
            --dbp-placeholder-color: #777; 
        }
    `;
}

export function getGeneralCSS(doMarginPaddingReset = true) {
    // language=css
    const marginPaddingResetCss = doMarginPaddingReset ? css`
        blockquote, body, dd, dl, dt, fieldset, figure, h1, h2, h3, h4, h5, h6, hr, html, iframe, legend, li, ol, p, pre, textarea, ul {
            margin: 0;
            padding: 0;
        }
    ` : css``;

    // language=css
    return css`
        h2 {
            font-weight: 300;
        }

        code {
            background-color: var(--dbp-light);
            color: var(--dbp-danger-bg-color);
            font-size: 1em;
            line-height: 1.5em;
            font-weight: normal;
            padding: 0.25em 0.5em 0.25em;
        }

        .field:not(:last-child) {
            margin-bottom: 0.75rem;
        }

        .field.has-addons {
            display: flex;
            justify-content: flex-start;
        }

        .input, .textarea, .select select {
            border: solid 1px #aaa;
            border-radius: var(--dbp-border-radius);
            padding-bottom: calc(.375em - 1px);
            padding-left: calc(.625em - 1px);
            padding-right: calc(.625em - 1px);
            padding-top: calc(.375em - 1px);
        }

        .input::placeholder, .textarea::placeholder, .select select::placeholder {
            color: var(--dbp-placeholder-color);
        }

        input, ::placeholder, textarea, select, .select select {
            font-size: inherit;
            font-family: inherit;
        }

        .control {
            box-sizing: border-box;
            clear: both;
            font-size: 1rem;
            position: relative;
            text-align: left;
        }

        .label {
            margin-bottom: .5em;
            display: block;
            font-weight: 600;
        }

        .hidden { display: none; }

        a {
            color: var(--dbp-override-muted-text);
            cursor: pointer;
            text-decoration: none;
        }

        a.is-download {
            border-bottom: 1px solid rgba(0,0,0,0.4);
            transition: background-color 0.15s, color 0.15s;
        }

        a.is-download:hover {
            color: #fff;
            background-color: #000;
        }

        /* Inline SVG don't work in our web-components */
        /*
        a.is-download:after, a.is-download:hover:after {
            content: "\\00a0\\00a0\\00a0\\00a0";
            background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%228.3021mm%22%20width%3D%228.2977mm%22%20version%3D%221.1%22%20xmlns%3Acc%3D%22http%3A%2F%2Fcreativecommons.org%2Fns%23%22%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20viewBox%3D%220%200%2029.401607%2029.41681%22%3E%3Cg%20style%3D%22stroke-width%3A2.1%22%20transform%3D%22translate(-271.68%20-367.92)%22%3E%3Cpath%20style%3D%22stroke-linejoin%3Around%3Bstroke%3A%23000%3Bstroke-linecap%3Around%3Bstroke-width%3A2.1%3Bfill%3Anone%22%20d%3D%22m300.13%20390.41v2.3918c0%201.9813-1.6064%203.5877-3.5877%203.5877h-20.326c-1.9813%200-3.5877-1.6064-3.5877-3.5877v-2.3918%22%2F%3E%3Cpath%20style%3D%22stroke-linejoin%3Around%3Bstroke%3A%23000%3Bstroke-linecap%3Around%3Bstroke-width%3A2.1%3Bfill%3Anone%22%20d%3D%22m286.38%20390.27v-21.384%22%2F%3E%3Cpath%20style%3D%22stroke-linejoin%3Around%3Bstroke%3A%23000%3Bstroke-linecap%3Around%3Bstroke-width%3A2.1%3Bfill%3Anone%22%20d%3D%22m295.13%20381.52-8.7501%208.7462-8.7501-8.7462%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center center;
            margin: 0 0.25% 0 1.5%;
            font-size: 94%;
        }
        */

        .title {
            color: #363636;
            font-size: 2rem;
            font-weight: 600;
            line-height: 1.125;
        }

        ${marginPaddingResetCss}

        .button[disabled], .file-cta[disabled], .file-name[disabled], .input[disabled], .pagination-ellipsis[disabled],
        .pagination-link[disabled], .pagination-next[disabled], .pagination-previous[disabled], .select fieldset[disabled] select,
        .select select[disabled], .textarea[disabled], fieldset[disabled] .button, fieldset[disabled] .file-cta,
        fieldset[disabled] .file-name, fieldset[disabled] .input, fieldset[disabled] .pagination-ellipsis,
        fieldset[disabled] .pagination-link, fieldset[disabled] .pagination-next, fieldset[disabled] .pagination-previous,
        fieldset[disabled] .select select, fieldset[disabled] .textarea {
            cursor: not-allowed;
        }

        .input, .select select, .textarea {
            background-color: #fff;
            border-color: var(--dbp-muted);
            border-radius: var(--dbp-border-radius);
            color: var(--dbp-muted);
        }

        *, ::after, ::before {
            box-sizing: inherit;
        }

        select:not(.select) {
            -moz-appearance: none;
            -webkit-appearance: none;
            background: calc(100% - 0.2rem) center no-repeat url("${unsafeCSS(getIconSVGURL('chevron-down'))}");
            background-size: 25%;
            border-color: black;
            border-width: 1px;
            border-radius: var(--dbp-border-radius);
            color: black;
            padding: 0.14rem 1.0rem 0.14rem 0.14rem;
            border-style: solid;
        }
    `;
}

export function getFormAddonsCSS() {
    // language=css
    return css`
        .buttons.has-addons .button:not(:first-child) {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }

        .buttons.has-addons .button:not(:last-child) {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
            margin-right: -1px;
        }

        .buttons.has-addons .button:last-child {
            margin-right: 0;
        }

        .buttons.has-addons .button:hover, .buttons.has-addons .button.is-hovered {
            z-index: 2;
        }

        .buttons.has-addons .button:focus, .buttons.has-addons .button.is-focused, .buttons.has-addons .button:active, .buttons.has-addons .button.is-active, .buttons.has-addons .button.is-selected {
            z-index: 3;
        }

        .buttons.has-addons .button:focus:hover, .buttons.has-addons .button.is-focused:hover, .buttons.has-addons .button:active:hover, .buttons.has-addons .button.is-active:hover, .buttons.has-addons .button.is-selected:hover {
            z-index: 4;
        }

        .buttons.has-addons .button.is-expanded {
            flex-grow: 1;
            flex-shrink: 1;
        }

        .buttons.is-centered {
            justify-content: center;
        }

        .buttons.is-centered:not(.has-addons) .button:not(.is-fullwidth) {
            margin-left: 0.25rem;
            margin-right: 0.25rem;
        }

        .buttons.is-right {
            justify-content: flex-end;
        }

        .buttons.is-right:not(.has-addons) .button:not(.is-fullwidth) {
            margin-left: 0.25rem;
            margin-right: 0.25rem;
        }

        .tags.has-addons .tag {
            margin-right: 0;
        }

        .tags.has-addons .tag:not(:first-child) {
            margin-left: 0;
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }

        .tags.has-addons .tag:not(:last-child) {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        .field.has-addons {
            display: flex;
            justify-content: flex-start;
        }

        .field.has-addons .control:not(:last-child) {
            margin-right: -1px;
        }

        .field.has-addons .control:not(:first-child):not(:last-child) .button,
        .field.has-addons .control:not(:first-child):not(:last-child) .input,
        .field.has-addons .control:not(:first-child):not(:last-child) .select select {
            border-radius: 0;
        }

        .field.has-addons .control:first-child:not(:only-child) .button,
        .field.has-addons .control:first-child:not(:only-child) .input,
        .field.has-addons .control:first-child:not(:only-child) .select select {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        .field.has-addons .control:last-child:not(:only-child) .button,
        .field.has-addons .control:last-child:not(:only-child) .input,
        .field.has-addons .control:last-child:not(:only-child) .select select {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }

        .field.has-addons .control .button:not([disabled]):hover, .field.has-addons .control .button:not([disabled]).is-hovered,
        .field.has-addons .control .input:not([disabled]):hover,
        .field.has-addons .control .input:not([disabled]).is-hovered,
        .field.has-addons .control .select select:not([disabled]):hover,
        .field.has-addons .control .select select:not([disabled]).is-hovered {
            z-index: 2;
        }

        .field.has-addons .control .button:not([disabled]):focus, .field.has-addons .control .button:not([disabled]).is-focused, .field.has-addons .control .button:not([disabled]):active, .field.has-addons .control .button:not([disabled]).is-active,
        .field.has-addons .control .input:not([disabled]):focus,
        .field.has-addons .control .input:not([disabled]).is-focused,
        .field.has-addons .control .input:not([disabled]):active,
        .field.has-addons .control .input:not([disabled]).is-active,
        .field.has-addons .control .select select:not([disabled]):focus,
        .field.has-addons .control .select select:not([disabled]).is-focused,
        .field.has-addons .control .select select:not([disabled]):active,
        .field.has-addons .control .select select:not([disabled]).is-active {
            z-index: 3;
        }

        .field.has-addons .control .button:not([disabled]):focus:hover, .field.has-addons .control .button:not([disabled]).is-focused:hover, .field.has-addons .control .button:not([disabled]):active:hover, .field.has-addons .control .button:not([disabled]).is-active:hover,
        .field.has-addons .control .input:not([disabled]):focus:hover,
        .field.has-addons .control .input:not([disabled]).is-focused:hover,
        .field.has-addons .control .input:not([disabled]):active:hover,
        .field.has-addons .control .input:not([disabled]).is-active:hover,
        .field.has-addons .control .select select:not([disabled]):focus:hover,
        .field.has-addons .control .select select:not([disabled]).is-focused:hover,
        .field.has-addons .control .select select:not([disabled]):active:hover,
        .field.has-addons .control .select select:not([disabled]).is-active:hover {
            z-index: 4;
        }

        .field.has-addons .control.is-expanded {
            flex-grow: 1;
            flex-shrink: 1;
        }

        .field.has-addons.has-addons-centered {
            justify-content: center;
        }

        .field.has-addons.has-addons-right {
            justify-content: flex-end;
        }

        .field.has-addons.has-addons-fullwidth .control {
            flex-grow: 1;
            flex-shrink: 0;
        }
    `;
}

export function getNotificationCSS() {
    // language=css
    return css`
        .notification {
            background-color: var(--dbp-light);
            padding: 1.25rem 2.5rem 1.25rem 1.5rem;
            position: relative;
            border-radius: var(--dbp-border-radius);
        }

        .notification a:not(.button):not(.dropdown-item) {
            color: currentColor;
            text-decoration: underline;
        }

        .notification strong {
            color: currentColor;
        }

        .notification code,
        .notification pre {
            color: var(--dbp-light);
            background: var(--dbp-muted-text);
        }

        .notification pre code {
            background: transparent;
        }

        .notification dbp-icon {
            font-size: 1.4em;
            margin-right: 0.4em;
        }

        .notification > .delete {
            position: absolute;
            right: 0.5rem;
            top: 0.5rem;
        }

        .notification .title,
        .notification .subtitle,
        .notification .content {
            color: currentColor;
        }

        .notification.is-primary {
            background-color: var(--dbp-primary-bg-color);
            color: var(--dbp-primary-text-color);
        }

        .notification.is-info {
            background-color: var(--dbp-info-bg-color);
            color: var(--dbp-info-text-color);
        }

        .notification.is-success {
            background-color: var(--dbp-success-bg-color);
            color: var(--dbp-success-text-color);
        }

        .notification.is-warning {
            background-color: var(--dbp-warning-bg-color);
            color: var(--dbp-warning-text-color);
        }

        .notification.is-danger {
            background-color: var(--dbp-danger-bg-color);
            color: var(--dbp-danger-text-color);
        }
    `;
}

export function getButtonCSS() {
    // language=css
    return css`
        button.button, .button, button.dt-button {
            border-style: solid;
            border-color: black;
            border-width: 1px;
            border-radius: var(--dbp-border-radius);
            color: black;
            cursor: pointer;
            justify-content: center;
            padding-bottom: calc(0.375em - 1px);
            padding-left: 0.75em;
            padding-right: 0.75em;
            padding-top: calc(0.375em - 1px);
            text-align: center;
            white-space: nowrap;
            font-size: inherit;
            font-family: inherit;
            transition: background-color 0.15s ease 0s, color 0.15s ease 0s;
            background: none;
        }

        button.button:hover, .button:hover, button.dt-button:hover, button.dt-button:hover:not(.disabled) {
            color: white;
            background: none;
            background-color: black;
        }

        button.button.is-small, .button.is-small {
            border-radius: calc(var(--dbp-border-radius) / 2);
            font-size: .75rem;
        }

        button.button.is-primary, .button.is-primary {
            background-color: var(--dbp-primary-bg-color);
            border: var(--dbp-primary-button-border);
            color: var(--dbp-primary-text-color);
        }

        button.button.is-info, .button.is-info {
            background-color: var(--dbp-info-bg-color);
            color: var(--dbp-info-text-color);
        }

        button.button.is-success, .button.is-success {
            background-color: var(--dbp-success-bg-color);
            color: var(--dbp-success-text-color);
        }

        button.button.is-warning, .button.is-warning {
            background-color: var(--dbp-warning-bg-color);
            color: var(--dbp-warning-text-color);
        }

        .button.button.is-danger, .button.is-danger {
            background-color: var(--dbp-danger-bg-color);
            color: var(--dbp-danger-text-color);
        }

        button.button[disabled], .button[disabled], fieldset[disabled] .button {
            opacity: .5;
            cursor: not-allowed;
        }
    `;
}

export function getRadioAndCheckboxCss() {
    // language=css
    return css`            
            
        /* 
        Radiobutton:
            <label class="button-container">
                Labeltext
                <input type="radio" name="myradiobutton">
                <span class="radiobutton"></span>
            </label>
            
        Checkbox:
            <label class="button-container">
                Labeltext
                <input type="checkbox" name="mycheckbox"> 
                <span class="checkmark"></span>
            </label>
         */
            
        .button-container {
            display: block;
            position: relative;
            padding-left: 35px;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        .button-container input[type="radio"], .button-container input[type="checkbox"] {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
            left: 0px;
        }
        
        .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 21px;
            width: 21px;
            background-color: white;
            border: solid;
            border-radius: var(--dbp-border-radius);
            border-width: var(--dbp-border-width);
            border-color: var(--dbp-border-color);
        }
        
        .radiobutton {
            position: absolute;
            top: 0;
            left: 0;
            height: 20px;
            width: 20px;
            background-color: white;
            border: solid;
            border-radius: 100%;
            border-width: var(--dbp-border-width);
            border-color: var(--dbp-border-color);
            box-sizing: content-box;
        }

        .button-container input[type="radio"]:checked ~ .radiobutton:after {
            border-color: white;
        }
        
        .button-container input[type="radio"]:disabled ~ .radiobutton {
            border-color: #aaa;
            background-color: #eee;
        }

        .button-container input[type="radio"]:checked:disabled ~ .radiobutton:after {
            border-color: #aaa;
            background-color: #aaa;
        }
        
        .radiobutton:after {
            content: "";
            position: absolute;
            display: none;
        }
        
        .button-container input[type="radio"]:checked ~ .radiobutton:after {
            display: block;
        }
        
        .button-container .radiobutton:after {
            left: 0px;
            top: 0px;
            width: 100%;
            height: 100%;
            background-color: var(--dbp-border-color);
            border: none;
            border-radius: 100%;
            border: 2px solid white;
            box-sizing: border-box;
        }
        
        .button-container input[type="checkbox"]:checked ~ .checkmark:after {
            border-color: var(--dbp-border-color);
        }
        
        .button-container input[type="checkbox"]:disabled ~ .checkmark {
            border-color: #aaa;
            background-color: #eee;
        }

        .button-container input[type="checkbox"]:checked:disabled ~ .checkmark:after {
            border-color: #aaa;
        }

        .checkmark:after {
            content: "";
            position: absolute;
            display: none;
        }
        
        .button-container input[type="checkbox"]:checked ~ .checkmark:after {
            display: block;
        }
        
        .button-container .checkmark:after {
            left: 7px;
            top: 4px;
            width: 6px;
            height: 10px;
            border: solid var(--dbp-border-color);
            border-width: 0 2px 2px 0;
            -webkit-transform: rotate(45deg);
            -ms-transform: rotate(45deg);
            transform: rotate(45deg);
        }
        
    `;
}

export function getTagCSS() {
    // language=css
    return css`
        .tags {
            align-items: center;
            display: flex;
            flex-wrap: nowrap;
            justify-content: flex-start;
        }

        .tags .tag {
            margin-bottom: 0.5rem;
        }

        .tags .tag:not(:last-child) {
            margin-right: 0.5rem;
        }

        .tags:last-child {
            margin-bottom: -0.5rem;
        }

        .tags:not(:last-child) {
            margin-bottom: 1rem;
        }

        .tags.are-medium .tag:not(.is-normal):not(.is-large) {
            font-size: 1rem;
        }

        .tags.are-large .tag:not(.is-normal):not(.is-medium) {
            font-size: 1.25rem;
        }

        .tags.is-centered {
            justify-content: center;
        }

        .tags.is-centered .tag {
            margin-right: 0.25rem;
            margin-left: 0.25rem;
        }

        .tags.is-right {
            justify-content: flex-end;
        }

        .tags.is-right .tag:not(:first-child) {
            margin-left: 0.5rem;
        }

        .tags.is-right .tag:not(:last-child) {
            margin-right: 0;
        }

        .tags.has-addons .tag {
            margin-right: 0;
        }

        .tags.has-addons .tag:not(:first-child) {
            margin-left: 0;
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }

        .tags.has-addons .tag:not(:last-child) {
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }

        .tag:not(body) {
            align-items: center;
            background-color: whitesmoke;
            border-radius: var(--dbp-border-radius);
            color: #4a4a4a;
            display: inline-flex;
            font-size: 0.75rem;
            height: 2em;
            justify-content: center;
            line-height: 1.5;
            padding-left: 0.75em;
            padding-right: 0.75em;
            white-space: nowrap;
        }

        .tag:not(body) .delete {
            margin-left: 0.25rem;
            margin-right: -0.375rem;
        }

        .tag:not(body).is-dark {
            background-color: var(--dbp-dark);
            color: whitesmoke;
        }

        .tag:not(body).is-light {
            background-color: var(--dbp-light);
            color: #363636;
        }

        .tag:not(body).is-normal {
            font-size: 0.75rem;
        }

        .tag:not(body).is-medium {
            font-size: 1rem;
        }

        .tag:not(body).is-large {
            font-size: 1.25rem;
        }

        .tag:not(body) .icon:first-child:not(:last-child) {
            margin-left: -0.375em;
            margin-right: 0.1875em;
        }

        .tag:not(body) .icon:last-child:not(:first-child) {
            margin-left: 0.1875em;
            margin-right: -0.375em;
        }

        .tag:not(body) .icon:first-child:last-child {
            margin-left: -0.375em;
            margin-right: -0.375em;
        }

        .tag:not(body).is-delete {
            margin-left: 1px;
            padding: 0;
            position: relative;
            width: 2em;
        }

        .tag:not(body).is-delete::before, .tag:not(body).is-delete::after {
            background-color: currentColor;
            content: "";
            display: block;
            left: 50%;
            position: absolute;
            top: 50%;
            -webkit-transform: translateX(-50%) translateY(-50%) rotate(45deg);
            transform: translateX(-50%) translateY(-50%) rotate(45deg);
            -webkit-transform-origin: center center;
            transform-origin: center center;
        }

        .tag:not(body).is-delete::before {
            height: 1px;
            width: 50%;
        }

        .tag:not(body).is-delete::after {
            height: 50%;
            width: 1px;
        }

        .tag:not(body).is-delete:hover, .tag:not(body).is-delete:focus {
            background-color: #e8e8e8;
        }

        .tag:not(body).is-delete:active {
            background-color: #dbdbdb;
        }

        .tag:not(body).is-rounded {
            border-radius: 290486px;
        }

        a.tag:hover {
            text-decoration: underline;
        }
    `;
}

export function getDocumentationCSS() {
    // language=css
    return css`
        .documentation h1, .documentation h2, .documentation h3 {
            margin: 1em 0 0.8em 0;
        }

        .documentation p {
            margin: 1em 0;
        }

        .documentation a {
            border-bottom: 1px solid var(--dbp-muted-text);
            transition: background-color 0.15s, color 0.15s;
        }

        .documentation a:hover {
            color: #fff;
            background-color: #000;
        }

        .documentation ul, .documentation ol, .documentation li {
            margin: inherit;
            padding: inherit;
        }

        .documentation li > ul {
            margin-left: 0.5em;
        }
    `;
}

export function getSelect2CSS() {
    // language=css
    return css`
        .select2-dropdown {
            border-radius: var(--dbp-border-radius);
        }

        .select2-container--default .select2-selection--single {
            border-radius: var(--dbp-border-radius);
        }

        .select2-container--default .select2-selection--single .select2-selection__rendered {
            color: inherit;
        }

        .select2-container--default .select2-selection--single .select2-selection__clear {
            font-size: 1.5em;
            font-weight: 300;
            /* color: red; */
        }

        .select2-container--default .select2-selection--single .select2-selection__placeholder {
            color: var(--dbp-placeholder-color);
        }

        /* Work around single selections not wrapping and breaking responsivness */
        .select2-container--default .select2-selection--single {
            height: 100% !important;
        }
        .select2-container--default .select2-selection__rendered{
            word-wrap: break-word !important;
            text-overflow: inherit !important;
            white-space: normal !important;
        }
    `;
}

export function getModalDialogCSS() {
    // language=css
    return css`
        /**************************\\
          Modal Styles
        \\**************************/

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .modal-container {
            background-color: #fff;
            max-width: 600px;
            max-height: 100vh;
            min-width: 60%;
            min-height: 50%;
            overflow-y: auto;
            box-sizing: border-box;
            display: grid;
            height: 70%;
            width: 70%;
            position: relative;
        }
        
        .modal-close {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            color: var(--dbp-override-danger-bg-color);
            cursor: pointer;
            padding: 0px;
        }
        
        .modal-close .close-icon svg, .close-icon{
            pointer-events: none;
        }

        button.modal-close:focus {
            outline: none;
        }


        /**************************\\
          Modal Animation Style
        \\**************************/
        @keyframes mmfadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes mmfadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        @keyframes mmslideIn {
            from {
                transform: translateY(15%);
            }
            to {
                transform: translateY(0);
            }
        }

        @keyframes mmslideOut {
            from {
                transform: translateY(0);
            }
            to {
                transform: translateY(-10%);
            }
        }

        .micromodal-slide {
            display: none;
        }

        .micromodal-slide.is-open {
            display: block;
        }

        .micromodal-slide[aria-hidden="false"] .modal-overlay {
            animation: mmfadeIn .3s cubic-bezier(0.0, 0.0, 0.2, 1);
        }

        .micromodal-slide[aria-hidden="false"] .modal-container {
            animation: mmslideIn .3s cubic-bezier(0, 0, .2, 1);
        }

        .micromodal-slide[aria-hidden="true"] .modal-overlay {
            animation: mmfadeOut .3s cubic-bezier(0.0, 0.0, 0.2, 1);
        }

        .micromodal-slide[aria-hidden="true"] .modal-container {
            animation: mmslideOut .3s cubic-bezier(0, 0, .2, 1);
        }

        .micromodal-slide .modal-container,
        .micromodal-slide .modal-overlay {
            will-change: transform;
        }
        
        @media only screen
        and (orientation: landscape)
        and (max-device-width: 896px) {
             .modal-container {
                 width: 100%;
                 height: 100%;
                 max-width: 100%;
             }
         }
        
        @media only screen
        and (orientation: portrait)
        and (max-device-width: 800px) {
            .micromodal-slide .modal-container{
                height: 100%;
                width: 100%;
            }
        }

        
    `;
}

export function getTextUtilities() {
    // language=css
    return css`
        .text-left {
            text-align: left;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-lowercase {
            text-transform: lowercase;
        }

        .text-uppercase {
            text-transform: uppercase;
        }

        .text-capitalize {
            text-transform: capitalize;
        }

      
    `;
}


