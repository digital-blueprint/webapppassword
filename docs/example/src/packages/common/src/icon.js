import {html, LitElement, css} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import {until} from 'lit-html/directives/until.js';
import * as commonUtils from '../utils.js';

// Use in case the icon fails to load
const errorIcon = `
<svg version="1.1" id="Layer_2_1_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
<g>
	<path d="M38.2,98.7c-1.1,0-2.2-0.6-2.8-1.6c-0.5-0.8-0.6-1.8-0.3-2.6l8.9-37.8H24.5c-1.2,0-2.2-0.6-2.8-1.5c-0.6-1-0.7-2.2-0.1-3.2
		l0.2-0.3L54.9,3.1c0.9-1.6,2.3-1.8,2.8-1.8c1.1,0,2.2,0.6,2.8,1.6c0.5,0.8,0.6,1.7,0.3,2.6l-6.9,30.4L75.6,36
		c1.1,0,2.2,0.6,2.8,1.5c0.6,1,0.7,2.2,0.1,3.2l-0.2,0.3L40.8,97.4l-0.2,0.2C40.3,97.9,39.5,98.7,38.2,98.7z M28.6,51.2h18.1
		c1.8,0,3.2,1.5,3.2,3.4v0.3l-6.8,29l28.2-42.4l-20.3-0.1c-1.8,0-3.2-1.5-3.2-3.4v-0.3l5-21.9L28.6,51.2z M75.5,41.5
		C75.5,41.5,75.5,41.5,75.5,41.5L75.5,41.5z M51.1,35.9L51.1,35.9C51.2,35.9,51.1,35.9,51.1,35.9z"/>
</g>
</svg>
`;

export function getIconSVGURL(name) {
    return commonUtils.getAssetURL('dbp-common', 'icons/' + encodeURI(name) + '.svg');
}

export function getIconCSS(name) {
    const iconURL = getIconSVGURL(name);
    return `
        background-color: currentColor;
        mask-image: url(${ iconURL });
        -webkit-mask-image: url(${ iconURL });
        mask-size: contain;
        -webkit-mask-size: contain;
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-position: center center;
        -webkit-mask-position: center center;
        margin-left: 0.2em;
        padding-left: 0.3em;
        content: "X";
    `;
}

async function getSVGTextElement(name) {
    const iconURL = getIconSVGURL(name);

    const response = await fetch(iconURL);
    if (!response.ok) {
        return unsafeHTML(errorIcon);
    }
    let text = await response.text();
    if (text.indexOf('<svg') === -1) {
        return unsafeHTML(errorIcon);
    }
    text = text.slice(text.indexOf('<svg'));
    return unsafeHTML(text);
}

const iconCache =  {};

/**
 * Avoid lots of requests in case an icon is used multiple times on the same page.
 *
 * @param {string} name
 */
async function getSVGTextElementCached(name) {
    if (iconCache[name] === undefined) {
        let promise = getSVGTextElement(name);
        iconCache[name] = promise;
        return promise;
    } else {
        return iconCache[name];
    }
}

/**
 * For icon names see https://lineicons.com
 */
export class Icon extends LitElement {

    constructor() {
        super();
        this.name = "bolt";
    }

    static get properties() {
        return { 
          name: { type: String },
        };
      }

    static get styles() {
        return css`
            :host {
                display: inline-block;
                height: 1em;
                top: .125em;
                position: relative;
            }

            svg {
                height: 100%;
            }

            svg * {
                fill: currentColor;
            }
        `;
    } 

    render() {
        let svg = getSVGTextElementCached(this.name);
        return html`
            ${until(svg)}
        `;
    }
}