import {assert} from 'chai';
import {EventBus, createEventName, checkIndentifier} from '../src/eventbus.js';

suite('helpers', () => {
    test('createEventName', () => {
        assert.equal(createEventName('foo', 'bar'), 'dbp:foo:bar');
        assert.equal(createEventName('', 'bar'), 'dbp::bar');
        assert.equal(createEventName('foo', 'bar', 'baz'), 'dbp:foo:bar:baz');
    });

    test('checkIndentifier', () => {
        const ok = ['foo', 'bar', 'a123'];
        const notOk = ['', 'foo bar', '123', 'a_', 'b:', ':'];

        checkIndentifier('', true);

        for(let key of ok) {
            checkIndentifier(key);
        }

        for(let key of notOk) {
            assert.throws(() => {
                checkIndentifier(key);
            });
        }
    });
});

suite('events', () => {
    test('basics', () => {
        const bus = new EventBus();
        bus.close();
    });

    test('pub sub', () => {
        const bus = new EventBus();
        let called = false;
        bus.subscribe("foo", (data) => {
            called = true;
            assert.deepEqual(data, 42);
        });

        const res = bus.publish("foo", 42);
        assert.isTrue(called);
        assert.isTrue(res);
        bus.close();
    });

    test('no handler', () => {
        const bus = new EventBus();
        const res = bus.publish("foo", 42);
        assert.isFalse(res);
        bus.close();
    });

    test('no event after unsubscribe', () => {
        const bus = new EventBus();
        let called = false;

        const func = () => {
            called = true;
        };
        bus.subscribe("foo", func);
        bus.unsubscribe("foo", func);

        const res = bus.publish("foo", 42);
        assert.isFalse(res);
        assert.isFalse(called);
        bus.close();
    });

    test('retained', () => {
        const bus = new EventBus();
        let calledData = null;

        const func = (data, meta) => {
            calledData = {data: data, meta: meta};
        };

        bus.subscribe("foo", func);

        let res = bus.publish("foo", 42, {retain: true});
        assert.isTrue(res);

        assert.equal(calledData.data, 42);
        assert.isTrue(calledData.meta.retain);

        calledData = null;

        res = bus.publish("foo", 24);
        assert.isTrue(res);

        assert.equal(calledData.data, 24);
        assert.isFalse(calledData.meta.retain);
        bus.unsubscribe("foo", func);

        calledData = null;
        bus.subscribe("foo", func);
        assert.equal(calledData.data, 42);
        assert.isTrue(calledData.meta.retain);

        bus.close();
    });

    test('multiple busses', () => {
        const bus = new EventBus();
        const bus2 = new EventBus();

        let called = false;

        const func = () => {
            called = true;
        };
        bus.subscribe("foo", func);

        const res = bus2.publish("foo", 42);
        assert.isTrue(res);
        assert.isTrue(called);

        bus2.close();
        bus.close();
    });

    test('multiple retain conflict', () => {
        const bus = new EventBus();
        bus.publish("foo", 42, {retain: true});

        const bus2 = new EventBus();
        bus.publish("foo", 24, {retain: true});

        const bus3 = new EventBus();

        let calledData = null;
        let callCount = 0;
        const func = (data, meta) => {
            callCount++;
            calledData = {data: data, meta: meta};
        };
        bus3.subscribe("foo", func);

        assert.equal(callCount, 1);
        assert.deepEqual(calledData.data, 24);
        assert.isTrue(calledData.meta.retain);

        bus3.close();
        bus2.close();
        bus.close();
    });
});