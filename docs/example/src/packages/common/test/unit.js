import {expect, assert} from 'chai';
import * as utils from '../utils';
import * as styles from '../styles';
import '../jsonld.js';

suite('utils', () => {
    test('base64EncodeUnicode', () => {
        expect(utils.base64EncodeUnicode('')).to.equal('');
        expect(utils.base64EncodeUnicode('foo')).to.equal('Zm9v');
        expect(utils.base64EncodeUnicode('äöü')).to.equal('w6TDtsO8');
        expect(utils.base64EncodeUnicode('😊')).to.equal('8J+Yig==');
    });

    test('defineCustomElement', () => {
        class SomeElement extends HTMLElement {
            constructor() {
                super();
                this.foo = 42;
            }
        }
        var res = utils.defineCustomElement("test-some-element", SomeElement);
        expect(res).to.equal(true);

        var node = document.createElement('test-some-element');
        expect(node.foo).to.equal(42);
    });

    test('defineCustomElement multiple times', () => {
        class SomeElement2 extends HTMLElement {
        }
        let res = utils.defineCustomElement("test-some-element-2", SomeElement2);
        assert.isTrue(res);
        res = utils.defineCustomElement("test-some-element-2", SomeElement2);
        assert.isTrue(res);
    });

    test('getAPiUrl', () => {
        assert(utils.getAPiUrl().startsWith("http"));
    });

    test('getAssetURL', () => {
        // Backwards compat
        assert.equal(new URL(utils.getAssetURL("foo/bar")).pathname, "/foo/bar");
        // Normal usage
        assert.equal(new URL(utils.getAssetURL('foobar', 'bar/quux')).pathname, "/local/foobar/bar/quux");
    });

    test('getThemeCSS', () => {
        styles.getThemeCSS();
    });
});
