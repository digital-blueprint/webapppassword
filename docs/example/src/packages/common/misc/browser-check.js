/* eslint-disable */

/*
This file is self contained and does various runtime checks to detect if teh current browser
is supported. In case it isn't it will replace the whole(!) page with an error message.

Example usage:
    <script src="browser-check.js" defer></script>
    <noscript>Diese Applikation benötigt Javascript / This application requires Javascript</noscript>
*/


(function () {

// https://caniuse.com/#feat=es6
function supportsES6() {
    if (typeof Symbol == "undefined")
        return false;

    try {
        eval("class Foo {}");
        eval("var bar = (x) => x+1");
    } catch (e) {
        console.log(e);
        return false;
    }

    return true;
}

// https://caniuse.com/#feat=es6-module-dynamic-import
function supportsDynamicImport() {
    try {
        new Function('import("")');
        return true;
    } catch (err) {
        return false;
    }
}

// https://caniuse.com/#feat=shadowdomv1
function supportsShadowDOM() {
    return (typeof Element != "undefined" && 'attachShadow' in Element.prototype && 'getRootNode' in Element.prototype);
}

// https://caniuse.com/#feat=custom-elementsv1
function supportsCustomElements() {
    return !!window.customElements;
}

// https://caniuse.com/#feat=async-functions
function supportsAsyncAwait() {
    try {
        eval('async () => {}');
    } catch (e) {
        return false;
    }
    return true;
}

// https://caniuse.com/#feat=mdn-javascript_statements_import_meta
function supportsImportMeta() {
    // TODO: sadly no idea how to test this..
    return true;
}

// Eval can be disabled through https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
function supportsEval() {
    try {
        eval('');
    } catch (e) {
        return false;
    }
    return true;
}

function isBrowserSupported() {
    if (!supportsEval()) {
        console.log("Eval support disabled, skipping browser feature detection.");
        return true;
    }

    if (!supportsES6()) {
        console.log("ES6 not supported");
        return false;
    }

    if (!supportsDynamicImport()) {
        console.log("Dynamic imports not supported");
        return false;
    }

    if (!supportsShadowDOM()) {
        console.log("Shadow DOM not supported");
        return false;
    }

    if (!supportsCustomElements()) {
        console.log("Custom Elements not supported");
        return false;
    }

    if (!supportsAsyncAwait()) {
        console.log("Async Await not supported");
        return false;
    }
    
    if (!supportsImportMeta()) {
        console.log("import.meta not supported");
        return false;
    }

    return true;
}

var MultiString = function(f) {
    return f.toString().split('\n').slice(1, -1).join('\n');
};

var ms = MultiString(function() {/**
<style>
    #unsupported .overlay {
        font-family: sans-serif;
        font-size: 0.9em;
        line-height: 1.5em;
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #fafafa;
        color: #333;
        z-index: 1001;
    }
    #unsupported .content{
        position: absolute;
        top: 50%;
        left: 0;
        text-align: center;
        width: 80%;
        left: 10%;
        -ms-transform: translateY(-50%);
        transform: translateY(-50%);
    }
    #unsupported .separator {
        letter-spacing: 0.3em;
        margin: 2em 0;
    }
    #unsupported .footer {
        position: fixed;
        top: 0.5em;
        line-height: 2em;
        width: 100%;
        text-align: center;
    }
</style>
<div id="unsupported">
    <div class="overlay">
        <div class="content">
            <h2>Ihr Browser wird leider nicht mehr unterstützt</h2>
            <p>
                Diese Applikation benötigt Funktionen, die von Ihrem aktuellen Browser noch nicht bereitgestellt werden.
                Bitte probieren Sie es mit einem anderen Browser oder aktualisieren Sie Ihren aktuellen.
            </p>
            <h3 class="separator">🙁🙁🙁🙁🙁🙁🙁🙁🙁🙁🙁🙁</h3>
            <h2>Your browser is sadly no longer supported</h2>
            <p>
                This application requires features that are not yet provided by your current browser.
                Please try to use a different browser or update your current one.
            </p>
        </div>
        <div class="footer">
            IT Support: <a href="mailto:it-support@tugraz.at">it-support@tugraz.at</a>
            <br>
            <a href="https://datenschutz.tugraz.at/erklaerung/" target="_blank" rel="noopener">Datenschutzerklärung / Privacy Policy</a>
        </div>
    </div> 
</div>
**/});

function main() {
    if (!isBrowserSupported()) {
        document.body.innerHTML = ms;
    }
}

main();

})();
