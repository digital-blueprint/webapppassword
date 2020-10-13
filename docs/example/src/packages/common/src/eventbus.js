
const OPERATION_FETCH_RETAINED = 'fetch-retained';

export function checkIndentifier(name, allowEmpty=false) {
    if (name.length === 0 && allowEmpty)
        return;
    // we are strict here, so we can used special characters to extend the format later on
    if (!/^[a-z]+[a-z0-9-]*$/.test(name)) {
        throw new Error('Only a-z0-9 and - allowed: ' + JSON.stringify(name));
    }
}

export function createEventName(busName, eventName, operation) {
    checkIndentifier(busName, true);
    checkIndentifier(eventName);
    let result = 'dbp' + ':' + busName + ':' + eventName;
    if (operation !== undefined) {
        checkIndentifier(operation);
        result += ':' + operation;
    }
    return result;
}

/**
 * An event bus implementation which doesn't depend on a global bus instance and supports retained messages
 * (similar to MQTT retained messages)
 */
export class EventBus
{
    /**
     * @param {object} options
     * @param {string} options.name The bus name, events will only be visible on the same bus
     */
    constructor(options={}) {
        const {name = ''} = options;
        this._busName = name;
        this._retainedData = {};
        this._retainedListeners = {};
        this._listeners = {};
    }

    _name(name, operation) {
        return createEventName(this._busName, name, operation);
    }

    /**
     * Subscribe to an event. Note that this will immediately trigger the callback in case there exists a
     * retained event on the bus.
     *
     * @param {string} name The event name
     * @param {Function} callback The callback to call in case the event is received
     */
    subscribe(name, callback) {
        const listeners = this._listeners[name] || new Map();

        if (listeners.has(callback)) {
            throw new Error('already subscribed to: ' + JSON.stringify(name));
        }

        const eventHandler = (e) => {
            const meta = {};
            const detail = e.detail;
            if (detail.retain !== undefined)
                meta.retain = detail.retain;
            callback(detail.data, meta);
            e.preventDefault();
        };

        window.addEventListener(this._name(name), eventHandler);

        this._listeners[name] = listeners.set(callback, eventHandler);

        const fetchEvent = new CustomEvent(this._name(name, OPERATION_FETCH_RETAINED), {
            detail: {callback: eventHandler}
        });
        window.dispatchEvent(fetchEvent);
    }

    /**
     * Unsubscribe from an event given the name and callback used for subscribing.
     *
     * @param {string} name The event name
     * @param {Function} callback The callback used when calling subscribe()
     */
    unsubscribe(name, callback) {
        const listeners = this._listeners[name] || new Map();
        const eventHandler = listeners.get(callback);
        if (eventHandler === undefined) {
            throw new Error("Not subscribed to: " + name);
        }
        window.removeEventListener(this._name(name), eventHandler);
        listeners.delete(callback);
    }

    /**
     * Publish a value for an event name. Set the retained flag to send the event also to future subscribers.
     *
     * @param {string} name 
     * @param {any} data 
     * @param {object} options
     * @param {boolean} options.retain If the event should be retained i.e. send to all future subscribers as well
     * @returns {boolean} If the event was handled by at least one bus member.
     */
    publish(name, data, options={}) {
        const {retain = false} = options;
        const eventName = this._name(name);

        if (retain && this._retainedListeners[name] === undefined) {
            const retainedEventHandler = (e) => {
                const data = this._retainedData[name];
                if (data !== undefined) {
                    const callback = e.detail['callback'];
                    e.stopImmediatePropagation();
                    const event = new CustomEvent(eventName, {detail: {data: data, retain: retain}});
                    callback(event);
                }
            };
            window.addEventListener(this._name(name, OPERATION_FETCH_RETAINED), retainedEventHandler);

            const eventHandler = (e) => {
                const detail = e.detail;
                if (detail.retain) {
                    this._retainedData[name] = detail.data;
                }
            };
            window.addEventListener(eventName, eventHandler);

            this._retainedListeners[name] = [retainedEventHandler, eventHandler];
        }

        const event = new CustomEvent(eventName, {detail: {data: data, retain: retain}, cancelable: true});
        return !window.dispatchEvent(event);
    }

    /**
     * Cleans up all subscriptions, retained messages and other event handlers.
     *
     * This _needs_ to be called for every bus instance at some point.
     * Otherwise the callbacks will stay alive forever and will leak.
     */
    close() {
        for (const [name, funcs] of Object.entries(this._retainedListeners)) {
            const [retainedHandler, handler] = funcs;
            window.removeEventListener(this._name(name, OPERATION_FETCH_RETAINED), retainedHandler);
            window.removeEventListener(this._name(name), handler);
            delete this._retainedListeners[name];
            delete this._retainedData[name];
        }
        for (const [name, callbacks] of Object.entries(this._listeners)) {
            for (const callback of callbacks.keys()) {
                this.unsubscribe(name, callback);
            }
        }
    }
}
