import i18next from 'i18next';

/**
 * Like Intl.DateTimeFormat().format() but uses the current language as locale.
 *
 * A i18next instance can be created with createInstance()
 *
 * @param {i18next.i18n} i18n - The i18next instance
 * @param {Date} date - The date to format
 * @param {object} options - Options passed to Intl.DateTimeFormat
 * @returns {string} The formated datetime
 */
export function dateTimeFormat(i18n, date, options) {
    return new Intl.DateTimeFormat(i18n.languages, options).format(date);
}

/**
 * Like Intl.NumberFormat().format() but uses the current language as locale.
 *
 * A i18next instance can be created with createInstance()
 *
 * @param {i18next.i18n} i18n - The i18next instance
 * @param {number} number - The number to format
 * @param {object} options - Options passed to Intl.NumberFormat
 * @returns {string} The formated number
 */
export function numberFormat(i18n, number, options) {
    return new Intl.NumberFormat(i18n.languages, options).format(number);
}

export function humanFileSize(bytes, si = false) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

/**
 * Creates a new i18next instance that is fully initialized.
 *
 * Call changeLanguage() on the returned object to change the language.
 *
 * @param {object} languages - Mapping from languages to translation objects
 * @param {string} lng - The default language
 * @param {string} fallback - The fallback language to use for unknown languages or untranslated keys
 * @returns {i18next.i18n} A new independent i18next instance
 */
export function createInstance(languages, lng, fallback) {
    var options = {
        lng: lng,
        fallbackLng: fallback,
        debug: false,
        initImmediate: false, // Don't init async
        resources: {},
    };

    Object.keys(languages).forEach(function(key) {
        options['resources'][key] = {translation: languages[key]};
    });

    var i18n = i18next.createInstance();
    i18n.init(options);
    console.assert(i18n.isInitialized);

    return i18n;
}