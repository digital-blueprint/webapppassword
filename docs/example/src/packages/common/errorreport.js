import * as Sentry from '@sentry/browser';
import environment from 'consts:environment';

let _isInitialized = false;
let _canReportEvent = false;

let sentryDSN = '';

/**
 * Initializes error reporting.
 * 
 * If a sentry DSN is set we will use sentry, if not we will log to the console.
 * 
 * @param {object} [options]
 * @param {boolean} [options.debug=false] Enable debug output
 * @param {string} [options.release] The project release
 */
export function init(options) {
  let defaults = {
    debug: false,
  };
  let actual = Object.assign({}, defaults, options);

  if (_isInitialized)
    throw new Error("Already initialized");

  let sentryOptions = {debug: actual.debug, environment: environment};

  if (actual.release) {
    sentryOptions['release'] = actual.release;
  }

  if (!sentryDSN) {
    if (options.debug)
      console.log("No sentry DSN set, sentry disabled");

    // In case we don't have a sentry config, we still use sentry, but print
    // all events into the console don't send them to the server.
    // XXX: Dummy DSN needed to make init() work.
    sentryOptions['dsn'] = 'http://12345@dummy.dummy/42';
    sentryOptions['beforeSend'] = (event, hint) => {
      console.error('ERR-REPORT:', hint.originalException || hint.syntheticException);
      return null;
    };
  } else {
    sentryOptions['dsn'] = sentryDSN;
    _canReportEvent = true;
  }

  Sentry.init(sentryOptions);

  _isInitialized = true;
}

/**
 * Whether showReportDialog() will work.
 */
export function canReportEvent() {
  if (!_isInitialized)
    throw new Error("Not initialized");
  return _canReportEvent;
}

/**
 * Show a report dialog for user error feedback.
 * 
 * Call canReportEvent() first to see if this will do anything.
 */
export function showReportDialog() {
  if (!canReportEvent())
    return;
  Sentry.showReportDialog();
}

/**
 * Log an exception
 *
 * @param {*} exception
 */
export function captureException(exception) {
  if (!_isInitialized)
    throw new Error("Not initialized");
  Sentry.captureException(exception);
}

/**
 * Log a message, returns an internal ID
 *
 * @param {string} message The message to log
 * @param {string} [level=error] The loglevel (error, warning, info, debug)
 */
export function captureMessage(message, level) {
  if (!_isInitialized)
    throw new Error("Not initialized");
  if (!level)
    level = 'error';
  if (!['error', 'warning', 'info', 'debug'].includes(level))
    throw new Error('Invalid log level');
  Sentry.captureMessage(message, level);
}