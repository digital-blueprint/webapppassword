/**
 * Takes multiple AbortSignal instances and returns a new AbortController which
 * gets aborted if any of the AbortSignals do.
 *
 * @param  {...AbortSignal} signals
 * @returns {AbortController}
 */
export function createLinkedAbortController(...signals) {
    const controller = new AbortController();

    for (const signal of signals) {
        if (signal.aborted) {
            controller.abort();
            break;
        } else {
            signal.addEventListener('abort', () => {
                controller.abort();
            });
        }
    }

    return controller;
}

/**
 * Returns an AbortSignal which aborts after the specified time.
 *
 * @param {number} delay Delay in milliseconds
 * @returns {AbortSignal}
 */
export function createTimeoutAbortSignal(delay) {
    const controller = new AbortController();

    setTimeout(() => {controller.abort(); }, delay);

    return controller.signal;
}