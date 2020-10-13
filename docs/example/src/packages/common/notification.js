/**
 * Sends a notification via the event
 *
 * Type can be info/success/warning/danger
 *
 * example options:
 *
 * {
 *   "summary": "Item deleted",
 *   "body": "Item foo was deleted!",
 *   "type": "info",
 *   "timeout": 5,
 * }
 *
 * @param options
 */
function send(options) {
    const event = new CustomEvent("dbp-notification-send", {
        bubbles: true,
        cancelable: true,
        detail: options,
    });

    const result = window.dispatchEvent(event);

    // true means the event was not handled
    if (result) {
        alert((options.summary !== undefined && options.summary !== "" ? options.summary + ": " : "") + options.body);
        console.log("Use the web component dbp-notification to show fancy notifications.");
    }
}

export { send };
