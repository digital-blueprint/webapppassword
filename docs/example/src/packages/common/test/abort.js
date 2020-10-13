import {assert} from 'chai';
import {createLinkedAbortController, createTimeoutAbortSignal} from '../src/abort.js';

suite('abort', () => {
    test('createLinkedAbortController', () => {
        let c1 = new AbortController();
        let c2 = new AbortController();
        const linked = createLinkedAbortController(c1.signal, c2.signal);
        assert.isFalse(linked.signal.aborted);
        c1.abort();
        assert.isTrue(linked.signal.aborted);
        c1.abort();
        linked.abort();
    });

    test('createTimeoutAbortSignal', () => {
        const signal = createTimeoutAbortSignal(10000000);
        assert.isFalse(signal.aborted);
    });
});