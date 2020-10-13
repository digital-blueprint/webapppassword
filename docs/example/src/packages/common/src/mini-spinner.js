import {html, LitElement, css} from 'lit-element';

export class MiniSpinner extends LitElement {
    constructor() {
        super();
        this.text = "";
    }

    static get properties() {
        return {
            text: { type: String },
        };
    }

    static get styles() {
        // language=css
        return css`
        .outer {
            display: inline-block;
        }
        .inner {
            display: flex;
        }
        .ring {
          display: inline-block;
          position: relative;
          width: 1em;
          height: 1em;
        }
        .ring div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          border: 0.2em solid currentColor;
          border-radius: 50%;
          animation: ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: currentColor transparent transparent transparent;
        }
        .ring div:nth-child(1) {
          animation-delay: -0.45s;
        }
        .ring div:nth-child(2) {
          animation-delay: -0.3s;
        }
        .ring div:nth-child(3) {
          animation-delay: -0.15s;
        }
        @keyframes ring {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .text {
            display: inline-block;
            margin-left: 0.5em;
            font-size: 0.7em;
        }`;
    } 

    render() {
        const textHtml = this.text !== "" ? html`<div class="text">${this.text}</div>` : html``;

        return html`<div class="outer"><div class="inner"><div class="ring"><div></div><div></div><div></div><div></div></div>${textHtml}</div></div>`;
    }
}
