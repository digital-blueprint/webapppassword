import {send as notify} from './notification';
import {i18n} from "./i18n";

/**
 * Error handling for XHR errors
 *
 * @param jqXHR
 * @param textStatus
 * @param errorThrown
 * @param icon
 */
export const handleXhrError = (jqXHR, textStatus, errorThrown, icon = "sad") => {
    // return if user aborted the request
    if (textStatus === "abort") {
        return;
    }

    let body;

    if (jqXHR.responseJSON !== undefined && jqXHR.responseJSON["hydra:description"] !== undefined) {
        // response is a JSON-LD
        body = jqXHR.responseJSON["hydra:description"];
    } else if (jqXHR.responseJSON !== undefined && jqXHR.responseJSON['detail'] !== undefined) {
        // response is a plain JSON
        body = jqXHR.responseJSON['detail'];
    } else {
        // no description available
        body = textStatus;
    }

    // if the server is not reachable at all
    if (jqXHR.status === 0) {
        body = i18n.t('error.connection-to-server-refused');
    }

    notify({
        "summary": i18n.t('error.summary'),
        "body": escapeHTML(stripHTML(body)),
        "icon": icon,
        "type": "danger",
    });

    if (window._paq !== undefined) {
        window._paq.push(['trackEvent', 'XhrError', body]);
    }
};

/**
 * Error handling for fetch errors
 *
 * @param error
 * @param summary
 * @param icon
 */
export const handleFetchError = async (error, summary = "", icon = "sad") => {
    // return if user aborted the request
    if (error.name === "AbortError") {
        return;
    }

    let body;

    try {
        await error.json().then((json) => {
            if (json["hydra:description"] !== undefined) {
                // response is a JSON-LD and possibly also contains HTML!
                body = json["hydra:description"];
            } else if (json['detail'] !== undefined) {
                // response is a plain JSON
                body = json['detail'];
            } else {
                // no description available
                body = error.statusText;
            }
        }).catch(() => {
            body = error.statusText !== undefined ? error.statusText : error;
        });
    } catch (e) {
        // a TypeError means the connection to the server was refused most of the times
        if (error.name === "TypeError") {
            body = error.message !== "" ? error.message : i18n.t('error.connection-to-server-refused');
        }
    }

    notify({
        "summary": summary === "" ? i18n.t('error.summary') : summary,
        "body": escapeHTML(stripHTML(body)),
        "icon": icon,
        "type": "danger",
    });

    if (window._paq !== undefined) {
        window._paq.push(['trackEvent', 'FetchError', summary === "" ? body : summary + ": " + body]);
    }
};

/**
 * Escapes html
 *
 * @param string
 * @returns {string}
 */
export const escapeHTML = (string) => {
    const pre = document.createElement('pre');
    const text = document.createTextNode(string);
    pre.appendChild(text);

    return pre.innerHTML;
};

/**
 * Strips html
 *
 * @param string
 * @returns {string}
 */
export const stripHTML = (string) => {
    var div = document.createElement("div");
    div.innerHTML = string;

    return div.textContent || div.innerText || "";
};
