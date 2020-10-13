import {i18n} from './i18n.js';
import {css, html, LitElement} from 'lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from './utils.js';
import * as commonStyles from './styles.js';
import {getIconCSS, Icon, MiniSpinner, Button, Spinner} from './index.js';

class DbpCommonDemo extends ScopedElementsMixin(LitElement) {
    constructor() {
        super();
        this.lang = 'de';
        this.noAuth = false;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-spinner': Spinner,
            'dbp-button': Button,
            'dbp-auth': customElements.get('dbp-auth'),
        };
    }

    static get properties() {
        return {
            lang: { type: String },
            noAuth: { type: Boolean, attribute: 'no-auth' },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        i18n.changeLanguage(this.lang);

        this.updateComplete.then(()=>{
        });
    }

    static get styles() {
        // language=css
        return css`
            ${ commonStyles.getThemeCSS() }

            h1.title {margin-bottom: 1em;}
            div.container {margin-bottom: 1.5em;}

            a:hover {
                color: #ffbb00 !important;
                background-color: blue;
            }

            .demoblock {
                position: relative;
                width: 1.1em;
                height: 1.1em;
                display: inline-block;
                padding: 0px 0px 0px 3px;
            }

           /* from BULMA.CSS */
            .section {
               padding: 3rem 1.5rem;
            }
            .content h1 {
                font-size: 2em;
                margin-bottom: .5em;
            }
            .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
                color: #363636;
                font-weight: 600;
                line-height: 1.125;
            }
            .control:not(:last-child) {
                margin-bottom: 0.5rem;
            }
        `;
    }

    getAuthComponentHtml() {
        return this.noAuth ? html`` : html`
            <div class="container">
                <dbp-auth lang="${this.lang}" load-person></dbp-auth>
            </div>
        `;
    }

    buttonClickHandler() {
        setTimeout(() => {
            this.shadowRoot.querySelector("dbp-button").stop();
        }, 1000);
    }

    render() {
        return html`
            <style>
                a:after {
                    ${ getIconCSS('envelope') };
                }
            </style>
            <section class="section">
                <div class="content">
                    <h1>Common-Demo</h1>
                </div>
                ${this.getAuthComponentHtml()}
                <div class="content">
                    <h2>Mini Spinner</h2>
                    <div class="control">
                        <dbp-mini-spinner text="Loading..."></dbp-mini-spinner>
                        <dbp-mini-spinner></dbp-mini-spinner>
                        <dbp-mini-spinner style="font-size: 2em"></dbp-mini-spinner>
                        <dbp-mini-spinner style="font-size: 3em"></dbp-mini-spinner>
                    </div>
                </div>
                <div class="content">
                    <h2>Spinner</h2>
                    <div class="control">
                        <dbp-spinner></dbp-spinner>
                    </div>
                </div>
                <div class="content">
                    <h2>Icons</h2>
                    <div class="control">
                        <p style="text-decoration: underline">Foo <dbp-icon name="cloudnetwork"></dbp-icon> bar</p>
                        <p style="font-size: 2em;">Foo <dbp-icon name="cloudnetwork"></dbp-icon> bar</p>
                        <p style="font-size: 2em; color: orange">Foo <dbp-icon name="cloudnetwork"></dbp-icon> bar</p>
                        <span style="background-color: #000"><a href="#" style=" color: #fff">foobar</a></span>
                        <p style="font-size: 2em; color: orange">Foo <dbp-icon name="information"></dbp-icon> bar</p>
                        <br>

                        ${(new Array(100).fill(0)).map(i => html`<dbp-icon style="color: green; width: 50px; height: 50px; border: #000 solid 1px"name="happy"></dbp-icon>`)}
                    </div>
                </div>
                <div class="content">
                    <h2>Button</h2>
                    <div class="control">
                        <dbp-button value="Load" @click="${this.buttonClickHandler}" type="is-primary"></dbp-button>
                    </div>
                </div>
                <div class="content">
                    <h2>Theming CSS API</h2>
                    <div class="control">
                        <ul>
                            <li><code>--dbp-primary-bg-color</code>: Primary background color <div class="demoblock" style="background-color: var(--dbp-primary-bg-color)"></div></li>
                            <li><code>--dbp-primary-text-color</code>: Primary text color <div class="demoblock" style="background-color: var(--dbp-primary-bg-color); color: var(--dbp-primary-text-color)">X</div></li>
                            <li><code>--dbp-secondary-bg-color</code>: Secondary background color <div class="demoblock" style="background-color: var(--dbp-secondary-bg-color)"></div></li>
                            <li><code>--dbp-secondary-text-color</code>: Secondary text color <div class="demoblock" style="background-color: var(--dbp-secondary-bg-color); color: var(--dbp-secondary-text-color)">X</div></li>
                            <li><code>--dbp-info-bg-color</code>: Info background color <div class="demoblock" style="background-color: var(--dbp-info-bg-color)"></div></li>
                            <li><code>--dbp-info-text-color</code>: Info text color <div class="demoblock" style="background-color: var(--dbp-info-bg-color); color: var(--dbp-info-text-color)">X</div></li>
                            <li><code>--dbp-success-bg-color</code>: Success background color <div class="demoblock" style="background-color: var(--dbp-success-bg-color)"></div></li>
                            <li><code>--dbp-success-text-color</code>: Success text color <div class="demoblock" style="background-color: var(--dbp-success-bg-color); color: var(--dbp-success-text-color)">X</div></li>
                            <li><code>--dbp-warning-bg-color</code>: Warning background color <div class="demoblock" style="background-color: var(--dbp-warning-bg-color)"></div></li>
                            <li><code>--dbp-warning-text-color</code>: Warning text color <div class="demoblock" style="background-color: var(--dbp-warning-bg-color); color: var(--dbp-warning-text-color)">X</div></li>
                            <li><code>--dbp-danger-bg-color</code>: Danger background color <div class="demoblock" style="background-color: var(--dbp-danger-bg-color)"></div></li>
                            <li><code>--dbp-danger-text-color</code>: Danger text color <div class="demoblock" style="background-color: var(--dbp-danger-bg-color); color: var(--dbp-danger-text-color)">X</div></li>

                            <li><code>--dbp-light</code>: Light color <div class="demoblock" style="background-color: var(--dbp-light)"></div></li>
                            <li><code>--dbp-dark</code>: Dark color <div class="demoblock" style="background-color: var(--dbp-dark)"></div></li>
                            <li><code>--dbp-muted-text</code>: Muted text color <div class="demoblock" style="color: var(--dbp-muted-text)">X</div></li>
                            <li><code>--dbp-border-radius</code>: Border-radius <div class="demoblock" style="background-color: var(--dbp-light); border-color: var(--dbp-dark); border-style: solid; border-width: 1px; border-radius: var(--dbp-border-radius)"></div></li>
                            <li><code>--dbp-border-width</code>: Border-width <div class="demoblock" style="background-color: var(--dbp-light); border-color: var(--dbp-dark); border-style: solid; border-width: var(--dbp-border-width); border-radius: 0px;"></div></li>
                        </ul>
                    </div>
                </div>
                <div class="content">
                    <h2>Theming CSS Override API</h2>
                    <pre>
&lt;style&gt;
html {
    /* This will override --dbp-primary-bg-color */
    --dbp-override-primary-bg-color: green;
    /* Same for all other variables, prefix with "override" */
}
&lt;/style&gt;</pre>
                </div>
            </section>
        `;
    }
}

commonUtils.defineCustomElement('dbp-common-demo', DbpCommonDemo);
