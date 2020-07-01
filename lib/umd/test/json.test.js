(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "json5", "assert", "../main"], factory);
    }
})(function (require, exports) {
    /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var JSON5 = require("json5");
    var assert = require("assert");
    var main_1 = require("../main");
    function assertKinds(text) {
        var kinds = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            kinds[_i - 1] = arguments[_i];
        }
        var scanner = main_1.createScanner(text);
        var kind;
        while ((kind = scanner.scan()) !== 17 /* EOF */) {
            assert.equal(kind, kinds.shift());
            assert.equal(scanner.getTokenError(), 0 /* None */, text);
        }
        assert.equal(kinds.length, 0);
    }
    function assertScanError(text, scanError) {
        var kinds = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            kinds[_i - 2] = arguments[_i];
        }
        var scanner = main_1.createScanner(text);
        scanner.scan();
        assert.equal(scanner.getToken(), kinds.shift());
        assert.equal(scanner.getTokenError(), scanError);
        var kind;
        while ((kind = scanner.scan()) !== 17 /* EOF */) {
            assert.equal(kind, kinds.shift());
        }
        assert.equal(kinds.length, 0);
    }
    function assertValidParse(input, expected, options) {
        var errors = [];
        var actual = main_1.parse(input, errors, options);
        assert.deepEqual([], errors);
        assert.deepEqual(actual, expected);
    }
    function assertInvalidParse(input, expected, options) {
        var errors = [];
        var actual = main_1.parse(input, errors, options);
        assert(errors.length > 0);
        assert.deepEqual(actual, expected);
    }
    function assertTree(input, expected, expectedErrors) {
        if (expectedErrors === void 0) { expectedErrors = []; }
        var errors = [];
        var actual = main_1.parseTree(input, errors);
        assert.deepEqual(errors, expectedErrors);
        var checkParent = function (node) {
            if (node.children) {
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    assert.equal(node, child.parent);
                    delete child.parent; // delete to avoid recursion in deep equal
                    checkParent(child);
                }
            }
        };
        checkParent(actual);
        assert.deepEqual(actual, expected, JSON5.stringify(actual));
    }
    ;
    function assertVisit(input, expected, expectedErrors, disallowComments) {
        if (expectedErrors === void 0) { expectedErrors = []; }
        if (disallowComments === void 0) { disallowComments = false; }
        var errors = [];
        var actuals = [];
        var noArgHalder = function (id) { return function (offset, length, startLine, startCharacter) { return actuals.push({ id: id, text: input.substr(offset, length), startLine: startLine, startCharacter: startCharacter }); }; };
        var oneArgHalder = function (id) { return function (arg, offset, length, startLine, startCharacter) { return actuals.push({ id: id, text: input.substr(offset, length), startLine: startLine, startCharacter: startCharacter, arg: arg }); }; };
        main_1.visit(input, {
            onObjectBegin: noArgHalder('onObjectBegin'),
            onObjectProperty: oneArgHalder('onObjectProperty'),
            onObjectEnd: noArgHalder('onObjectEnd'),
            onArrayBegin: noArgHalder('onArrayBegin'),
            onArrayEnd: noArgHalder('onArrayEnd'),
            onLiteralValue: oneArgHalder('onLiteralValue'),
            onSeparator: oneArgHalder('onSeparator'),
            onComment: noArgHalder('onComment'),
            onError: function (error, offset, length, startLine, startCharacter) {
                errors.push({ error: error, offset: offset, length: length, startLine: startLine, startCharacter: startCharacter });
            }
        }, {
            disallowComments: disallowComments
        });
        assert.deepEqual(errors, expectedErrors);
        assert.deepEqual(actuals, expected, JSON5.stringify(actuals));
    }
    function assertNodeAtLocation(input, segments, expected) {
        var actual = main_1.findNodeAtLocation(input, segments);
        assert.deepEqual(actual ? main_1.getNodeValue(actual) : void 0, expected);
        if (actual) {
            assert.deepEqual(main_1.getNodePath(actual), segments);
        }
    }
    function assertLocation(input, expectedSegments, expectedNodeType, expectedCompleteProperty) {
        var offset = input.indexOf('|');
        input = input.substring(0, offset) + input.substring(offset + 1, input.length);
        var actual = main_1.getLocation(input, offset);
        assert(actual);
        assert.deepEqual(actual.path, expectedSegments, input);
        assert.equal(actual.previousNode && actual.previousNode.type, expectedNodeType, input);
        assert.equal(actual.isAtPropertyKey, expectedCompleteProperty, input);
    }
    function assertMatchesLocation(input, matchingSegments, expectedResult) {
        if (expectedResult === void 0) { expectedResult = true; }
        var offset = input.indexOf('|');
        input = input.substring(0, offset) + input.substring(offset + 1, input.length);
        var actual = main_1.getLocation(input, offset);
        assert(actual);
        assert.equal(actual.matches(matchingSegments), expectedResult);
    }
    suite('JSON5', function () {
        test('tokens', function () {
            assertKinds('{', 1 /* OpenBraceToken */);
            assertKinds('}', 2 /* CloseBraceToken */);
            assertKinds('[', 3 /* OpenBracketToken */);
            assertKinds(']', 4 /* CloseBracketToken */);
            assertKinds(':', 6 /* ColonToken */);
            assertKinds(',', 5 /* CommaToken */);
        });
        test('comments', function () {
            assertKinds('// this is a comment', 12 /* LineCommentTrivia */);
            assertKinds('// this is a comment\n', 12 /* LineCommentTrivia */, 14 /* LineBreakTrivia */);
            assertKinds('/* this is a comment*/', 13 /* BlockCommentTrivia */);
            assertKinds('/* this is a \r\ncomment*/', 13 /* BlockCommentTrivia */);
            assertKinds('/* this is a \ncomment*/', 13 /* BlockCommentTrivia */);
            // unexpected end
            assertScanError('/* this is a', 1 /* UnexpectedEndOfComment */, 13 /* BlockCommentTrivia */);
            assertScanError('/* this is a \ncomment', 1 /* UnexpectedEndOfComment */, 13 /* BlockCommentTrivia */);
            // broken comment
            assertKinds('/ ttt', 16 /* Unknown */, 15 /* Trivia */, 16 /* Unknown */);
        });
        test('strings', function () {
            assertKinds('"test"', 10 /* StringLiteral */);
            assertKinds('"\\""', 10 /* StringLiteral */);
            assertKinds('"\\/"', 10 /* StringLiteral */);
            assertKinds('"\\b"', 10 /* StringLiteral */);
            assertKinds('"\\f"', 10 /* StringLiteral */);
            assertKinds('"\\n"', 10 /* StringLiteral */);
            assertKinds('"\\r"', 10 /* StringLiteral */);
            assertKinds('"\\t"', 10 /* StringLiteral */);
            assertKinds('"\u88ff"', 10 /* StringLiteral */);
            assertKinds('"​\u2028"', 10 /* StringLiteral */);
            assertScanError('"\\v"', 5 /* InvalidEscapeCharacter */, 10 /* StringLiteral */);
            // unexpected end
            assertScanError('"test', 2 /* UnexpectedEndOfString */, 10 /* StringLiteral */);
            assertScanError('"test\n"', 2 /* UnexpectedEndOfString */, 10 /* StringLiteral */, 14 /* LineBreakTrivia */, 10 /* StringLiteral */);
            // invalid characters
            assertScanError('"\t"', 6 /* InvalidCharacter */, 10 /* StringLiteral */);
            assertScanError('"\t "', 6 /* InvalidCharacter */, 10 /* StringLiteral */);
            assertScanError('"\0 "', 6 /* InvalidCharacter */, 10 /* StringLiteral */);
        });
        test('numbers', function () {
            assertKinds('0', 11 /* NumericLiteral */);
            assertKinds('0.1', 11 /* NumericLiteral */);
            assertKinds('-0.1', 11 /* NumericLiteral */);
            assertKinds('-1', 11 /* NumericLiteral */);
            assertKinds('1', 11 /* NumericLiteral */);
            assertKinds('123456789', 11 /* NumericLiteral */);
            assertKinds('10', 11 /* NumericLiteral */);
            assertKinds('90', 11 /* NumericLiteral */);
            assertKinds('90E+123', 11 /* NumericLiteral */);
            assertKinds('90e+123', 11 /* NumericLiteral */);
            assertKinds('90e-123', 11 /* NumericLiteral */);
            assertKinds('90E-123', 11 /* NumericLiteral */);
            assertKinds('90E123', 11 /* NumericLiteral */);
            assertKinds('90e123', 11 /* NumericLiteral */);
            assertKinds('.0', 11 /* NumericLiteral */);
            assertKinds('-.5', 11 /* NumericLiteral */);
            assertKinds('0xff', 11 /* NumericLiteral */);
            // zero handling
            assertKinds('01', 11 /* NumericLiteral */, 11 /* NumericLiteral */);
            assertKinds('-01', 11 /* NumericLiteral */, 11 /* NumericLiteral */);
            // unexpected end
            assertKinds('-', 16 /* Unknown */);
            // assertKinds('.0', SyntaxKind.Unknown);
        });
        test('keywords: true, false, null', function () {
            assertKinds('true', 8 /* TrueKeyword */);
            assertKinds('false', 9 /* FalseKeyword */);
            assertKinds('null', 7 /* NullKeyword */);
            assertKinds('true false null', 8 /* TrueKeyword */, 15 /* Trivia */, 9 /* FalseKeyword */, 15 /* Trivia */, 7 /* NullKeyword */);
            // invalid words
            assertKinds('nulllll', 16 /* Unknown */);
            assertKinds('True', 16 /* Unknown */);
            assertKinds('foo-bar', 16 /* Unknown */);
            assertKinds('foo bar', 16 /* Unknown */, 15 /* Trivia */, 16 /* Unknown */);
            assertKinds('false//hello', 9 /* FalseKeyword */, 12 /* LineCommentTrivia */);
        });
        test('trivia', function () {
            assertKinds(' ', 15 /* Trivia */);
            assertKinds('  \t  ', 15 /* Trivia */);
            assertKinds('  \t  \n  \t  ', 15 /* Trivia */, 14 /* LineBreakTrivia */, 15 /* Trivia */);
            assertKinds('\r\n', 14 /* LineBreakTrivia */);
            assertKinds('\r', 14 /* LineBreakTrivia */);
            assertKinds('\n', 14 /* LineBreakTrivia */);
            assertKinds('\n\r', 14 /* LineBreakTrivia */, 14 /* LineBreakTrivia */);
            assertKinds('\n   \n', 14 /* LineBreakTrivia */, 15 /* Trivia */, 14 /* LineBreakTrivia */);
        });
        test('parse: literals', function () {
            assertValidParse('true', true);
            assertValidParse('false', false);
            assertValidParse('null', null);
            assertValidParse('"foo"', 'foo');
            assertValidParse('"\\"-\\\\-\\/-\\b-\\f-\\n-\\r-\\t"', '"-\\-/-\b-\f-\n-\r-\t');
            assertValidParse('"\\u00DC"', 'Ü');
            assertValidParse('9', 9);
            assertValidParse('-9', -9);
            assertValidParse('0.129', 0.129);
            assertValidParse('23e3', 23e3);
            assertValidParse('1.2E+3', 1.2E+3);
            assertValidParse('1.2E-3', 1.2E-3);
            assertValidParse('1.2E-3 // comment', 1.2E-3);
        });
        test('parse: objects', function () {
            assertValidParse('{}', {});
            assertValidParse('{ "foo": true }', { foo: true });
            assertValidParse('{ "bar": 8, "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "a": false, "b": true, "c": [ 7.4 ] }', { a: false, b: true, c: [7.4] });
            assertValidParse('{ "lineComment": "//", "blockComment": ["/*", "*/"], "brackets": [ ["{", "}"], ["[", "]"], ["(", ")"] ] }', { lineComment: '//', blockComment: ['/*', '*/'], brackets: [['{', '}'], ['[', ']'], ['(', ')']] });
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} });
            assertValidParse('{ "hello": { "again": { "inside": 5 }, "world": 1 }}', { hello: { again: { inside: 5 }, world: 1 } });
            assertValidParse('{ "foo": /*hello*/true }', { foo: true });
            assertValidParse('{ "": true }', { '': true });
        });
        test('parse: arrays', function () {
            assertValidParse('[]', []);
            assertValidParse('[ [],  [ [] ]]', [[], [[]]]);
            assertValidParse('[ 1, 2, 3 ]', [1, 2, 3]);
            assertValidParse('[ { "a": null } ]', [{ a: null }]);
        });
        test('parse: objects with errors', function () {
            assertInvalidParse('{,}', {});
            assertInvalidParse('{ "foo": true, }', { foo: true });
            assertInvalidParse('{ "bar": 8 "xoo": "foo" }', { bar: 8, xoo: 'foo' });
            assertInvalidParse('{ ,"bar": 8 }', { bar: 8 });
            assertInvalidParse('{ ,"bar": 8, "foo" }', { bar: 8 });
            assertInvalidParse('{ "bar": 8, "foo": }', { bar: 8 });
            assertInvalidParse('{ 8, "foo": 9 }', { foo: 9 });
        });
        test('parse: array with errors', function () {
            assertInvalidParse('[,]', []);
            assertInvalidParse('[ 1 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3 ]', [1, 2, 3]);
            assertInvalidParse('[ ,1, 2, 3, ]', [1, 2, 3]);
        });
        test('parse: errors', function () {
            assertInvalidParse('', undefined);
            assertInvalidParse('1,1', 1);
        });
        test('parse: disallow comments', function () {
            var options = { disallowComments: true };
            assertValidParse('[ 1, 2, null, "foo" ]', [1, 2, null, 'foo'], options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertInvalidParse('{ "foo": /*comment*/ true }', { foo: true }, options);
        });
        test('parse: trailing comma', function () {
            var options = { allowTrailingComma: true };
            assertValidParse('{ "hello": [], }', { hello: [] }, options);
            assertValidParse('{ "hello": [] }', { hello: [] }, options);
            assertValidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} }, options);
            assertValidParse('{ "hello": [], "world": {} }', { hello: [], world: {} }, options);
            assertValidParse('[ 1, 2, ]', [1, 2], options);
            assertValidParse('[ 1, 2 ]', [1, 2], options);
            assertInvalidParse('{ "hello": [], }', { hello: [] });
            assertInvalidParse('{ "hello": [], "world": {}, }', { hello: [], world: {} });
            assertInvalidParse('[ 1, 2, ]', [1, 2]);
        });
        test('location: properties', function () {
            assertLocation('|{ "foo": "bar" }', [], void 0, false);
            assertLocation('{| "foo": "bar" }', [''], void 0, true);
            assertLocation('{ |"foo": "bar" }', ['foo'], 'property', true);
            assertLocation('{ "foo|": "bar" }', ['foo'], 'property', true);
            assertLocation('{ "foo"|: "bar" }', ['foo'], 'property', true);
            assertLocation('{ "foo": "bar"| }', ['foo'], 'string', false);
            assertLocation('{ "foo":| "bar" }', ['foo'], void 0, false);
            assertLocation('{ "foo": {"bar|": 1, "car": 2 } }', ['foo', 'bar'], 'property', true);
            assertLocation('{ "foo": {"bar": 1|, "car": 3 } }', ['foo', 'bar'], 'number', false);
            assertLocation('{ "foo": {"bar": 1,| "car": 4 } }', ['foo', ''], void 0, true);
            assertLocation('{ "foo": {"bar": 1, "ca|r": 5 } }', ['foo', 'car'], 'property', true);
            assertLocation('{ "foo": {"bar": 1, "car": 6| } }', ['foo', 'car'], 'number', false);
            assertLocation('{ "foo": {"bar": 1, "car": 7 }| }', ['foo'], void 0, false);
            assertLocation('{ "foo": {"bar": 1, "car": 8 },| "goo": {} }', [''], void 0, true);
            assertLocation('{ "foo": {"bar": 1, "car": 9 }, "go|o": {} }', ['goo'], 'property', true);
            assertLocation('{ "dep": {"bar": 1, "car": |', ['dep', 'car'], void 0, false);
            assertLocation('{ "dep": {"bar": 1,, "car": |', ['dep', 'car'], void 0, false);
            assertLocation('{ "dep": {"bar": "na", "dar": "ma", "car": | } }', ['dep', 'car'], void 0, false);
        });
        test('location: arrays', function () {
            assertLocation('|["foo", null ]', [], void 0, false);
            assertLocation('[|"foo", null ]', [0], 'string', false);
            assertLocation('["foo"|, null ]', [0], 'string', false);
            assertLocation('["foo",| null ]', [1], void 0, false);
            assertLocation('["foo", |null ]', [1], 'null', false);
            assertLocation('["foo", null,| ]', [2], void 0, false);
            assertLocation('["foo", null,,| ]', [3], void 0, false);
            assertLocation('[["foo", null,, ],|', [1], void 0, false);
        });
        test('tree: literals', function () {
            assertTree('true', { type: 'boolean', offset: 0, length: 4, value: true });
            assertTree('false', { type: 'boolean', offset: 0, length: 5, value: false });
            assertTree('null', { type: 'null', offset: 0, length: 4, value: null });
            assertTree('23', { type: 'number', offset: 0, length: 2, value: 23 });
            assertTree('-1.93e-19', { type: 'number', offset: 0, length: 9, value: -1.93e-19 });
            assertTree('"hello"', { type: 'string', offset: 0, length: 7, value: 'hello' });
        });
        test('tree: arrays', function () {
            assertTree('[]', { type: 'array', offset: 0, length: 2, children: [] });
            assertTree('[ 1 ]', { type: 'array', offset: 0, length: 5, children: [{ type: 'number', offset: 2, length: 1, value: 1 }] });
            assertTree('[ 1,"x"]', {
                type: 'array', offset: 0, length: 8, children: [
                    { type: 'number', offset: 2, length: 1, value: 1 },
                    { type: 'string', offset: 4, length: 3, value: 'x' }
                ]
            });
            assertTree('[[]]', {
                type: 'array', offset: 0, length: 4, children: [
                    { type: 'array', offset: 1, length: 2, children: [] }
                ]
            });
        });
        test('tree: objects', function () {
            assertTree('{ }', { type: 'object', offset: 0, length: 3, children: [] });
            assertTree('{ "val": 1 }', {
                type: 'object', offset: 0, length: 12, children: [
                    {
                        type: 'property', offset: 2, length: 8, colonOffset: 7, children: [
                            { type: 'string', offset: 2, length: 5, value: 'val' },
                            { type: 'number', offset: 9, length: 1, value: 1 }
                        ]
                    }
                ]
            });
            assertTree('{"id": "$", "v": [ null, null] }', {
                type: 'object', offset: 0, length: 32, children: [
                    {
                        type: 'property', offset: 1, length: 9, colonOffset: 5, children: [
                            { type: 'string', offset: 1, length: 4, value: 'id' },
                            { type: 'string', offset: 7, length: 3, value: '$' }
                        ]
                    },
                    {
                        type: 'property', offset: 12, length: 18, colonOffset: 15, children: [
                            { type: 'string', offset: 12, length: 3, value: 'v' },
                            {
                                type: 'array', offset: 17, length: 13, children: [
                                    { type: 'null', offset: 19, length: 4, value: null },
                                    { type: 'null', offset: 25, length: 4, value: null }
                                ]
                            }
                        ]
                    }
                ]
            });
            assertTree('{  "id": { "foo": { } } , }', {
                type: 'object', offset: 0, length: 27, children: [
                    {
                        type: 'property', offset: 3, length: 20, colonOffset: 7, children: [
                            { type: 'string', offset: 3, length: 4, value: 'id' },
                            {
                                type: 'object', offset: 9, length: 14, children: [
                                    {
                                        type: 'property', offset: 11, length: 10, colonOffset: 16, children: [
                                            { type: 'string', offset: 11, length: 5, value: 'foo' },
                                            { type: 'object', offset: 18, length: 3, children: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }, [
                { error: 3 /* PropertyNameExpected */, offset: 26, length: 1 },
                { error: 4 /* ValueExpected */, offset: 26, length: 1 }
            ]);
        });
        test('visit: object', function () {
            assertVisit('{ }', [{ id: 'onObjectBegin', text: '{', startLine: 0, startCharacter: 0 }, { id: 'onObjectEnd', text: '}', startLine: 0, startCharacter: 2 }]);
            assertVisit('{ "foo": "bar" }', [
                { id: 'onObjectBegin', text: '{', startLine: 0, startCharacter: 0 },
                { id: 'onObjectProperty', text: '"foo"', startLine: 0, startCharacter: 2, arg: 'foo' },
                { id: 'onSeparator', text: ':', startLine: 0, startCharacter: 7, arg: ':' },
                { id: 'onLiteralValue', text: '"bar"', startLine: 0, startCharacter: 9, arg: 'bar' },
                { id: 'onObjectEnd', text: '}', startLine: 0, startCharacter: 15 },
            ]);
            assertVisit('{ "foo": { "goo": 3 } }', [
                { id: 'onObjectBegin', text: '{', startLine: 0, startCharacter: 0 },
                { id: 'onObjectProperty', text: '"foo"', startLine: 0, startCharacter: 2, arg: 'foo' },
                { id: 'onSeparator', text: ':', startLine: 0, startCharacter: 7, arg: ':' },
                { id: 'onObjectBegin', text: '{', startLine: 0, startCharacter: 9 },
                { id: 'onObjectProperty', text: '"goo"', startLine: 0, startCharacter: 11, arg: 'goo' },
                { id: 'onSeparator', text: ':', startLine: 0, startCharacter: 16, arg: ':' },
                { id: 'onLiteralValue', text: '3', startLine: 0, startCharacter: 18, arg: 3 },
                { id: 'onObjectEnd', text: '}', startLine: 0, startCharacter: 20 },
                { id: 'onObjectEnd', text: '}', startLine: 0, startCharacter: 22 },
            ]);
        });
        test('visit: array', function () {
            assertVisit('[]', [{ id: 'onArrayBegin', text: '[', startLine: 0, startCharacter: 0 }, { id: 'onArrayEnd', text: ']', startLine: 0, startCharacter: 1 }]);
            assertVisit('[ true, null, [] ]', [
                { id: 'onArrayBegin', text: '[', startLine: 0, startCharacter: 0 },
                { id: 'onLiteralValue', text: 'true', startLine: 0, startCharacter: 2, arg: true },
                { id: 'onSeparator', text: ',', startLine: 0, startCharacter: 6, arg: ',' },
                { id: 'onLiteralValue', text: 'null', startLine: 0, startCharacter: 8, arg: null },
                { id: 'onSeparator', text: ',', startLine: 0, startCharacter: 12, arg: ',' },
                { id: 'onArrayBegin', text: '[', startLine: 0, startCharacter: 14 },
                { id: 'onArrayEnd', text: ']', startLine: 0, startCharacter: 15 },
                { id: 'onArrayEnd', text: ']', startLine: 0, startCharacter: 17 },
            ]);
            assertVisit('[\r\n0,\r\n1,\r\n2\r\n]', [
                { id: 'onArrayBegin', text: '[', startLine: 0, startCharacter: 0 },
                { id: 'onLiteralValue', text: '0', startLine: 1, startCharacter: 0, arg: 0 },
                { id: 'onSeparator', text: ',', startLine: 1, startCharacter: 1, arg: ',' },
                { id: 'onLiteralValue', text: '1', startLine: 2, startCharacter: 0, arg: 1 },
                { id: 'onSeparator', text: ',', startLine: 2, startCharacter: 1, arg: ',' },
                { id: 'onLiteralValue', text: '2', startLine: 3, startCharacter: 0, arg: 2 },
                { id: 'onArrayEnd', text: ']', startLine: 4, startCharacter: 0 }
            ]);
        });
        test('visit: comment', function () {
            assertVisit('/* g */ { "foo": //f\n"bar" }', [
                { id: 'onComment', text: '/* g */', startLine: 0, startCharacter: 0 },
                { id: 'onObjectBegin', text: '{', startLine: 0, startCharacter: 8 },
                { id: 'onObjectProperty', text: '"foo"', startLine: 0, startCharacter: 10, arg: 'foo' },
                { id: 'onSeparator', text: ':', startLine: 0, startCharacter: 15, arg: ':' },
                { id: 'onComment', text: '//f', startLine: 0, startCharacter: 17 },
                { id: 'onLiteralValue', text: '"bar"', startLine: 1, startCharacter: 0, arg: 'bar' },
                { id: 'onObjectEnd', text: '}', startLine: 1, startCharacter: 6 },
            ]);
            assertVisit('/* g\r\n */ { "foo": //f\n"bar" }', [
                { id: 'onComment', text: '/* g\r\n */', startLine: 0, startCharacter: 0 },
                { id: 'onObjectBegin', text: '{', startLine: 1, startCharacter: 4 },
                { id: 'onObjectProperty', text: '"foo"', startLine: 1, startCharacter: 6, arg: 'foo' },
                { id: 'onSeparator', text: ':', startLine: 1, startCharacter: 11, arg: ':' },
                { id: 'onComment', text: '//f', startLine: 1, startCharacter: 13 },
                { id: 'onLiteralValue', text: '"bar"', startLine: 2, startCharacter: 0, arg: 'bar' },
                { id: 'onObjectEnd', text: '}', startLine: 2, startCharacter: 6 },
            ]);
            assertVisit('/* g\n */ { "foo": //f\n"bar"\n}', [
                { id: 'onObjectBegin', text: '{', startLine: 1, startCharacter: 4 },
                { id: 'onObjectProperty', text: '"foo"', startLine: 1, startCharacter: 6, arg: 'foo' },
                { id: 'onSeparator', text: ':', startLine: 1, startCharacter: 11, arg: ':' },
                { id: 'onLiteralValue', text: '"bar"', startLine: 2, startCharacter: 0, arg: 'bar' },
                { id: 'onObjectEnd', text: '}', startLine: 3, startCharacter: 0 },
            ], [
                { error: 10 /* InvalidCommentToken */, offset: 0, length: 8, startLine: 0, startCharacter: 0 },
                { error: 10 /* InvalidCommentToken */, offset: 18, length: 3, startLine: 1, startCharacter: 13 },
            ], true);
        });
        test('visit: incomplete', function () {
            assertVisit('{"prop1":"foo","prop2":"foo2","prop3":{"prp1":{""}}}', [
                { id: 'onObjectBegin', text: "{", startLine: 0, startCharacter: 0 },
                { id: 'onObjectProperty', text: '"prop1"', startLine: 0, startCharacter: 1, arg: "prop1" },
                { id: 'onSeparator', text: ":", startLine: 0, startCharacter: 8, arg: ":" },
                { id: 'onLiteralValue', text: '"foo"', startLine: 0, startCharacter: 9, arg: "foo" },
                { id: 'onSeparator', text: ",", startLine: 0, startCharacter: 14, arg: "," },
                { id: 'onObjectProperty', text: '"prop2"', startLine: 0, startCharacter: 15, arg: "prop2" },
                { id: 'onSeparator', text: ":", startLine: 0, startCharacter: 22, arg: ":" },
                { id: 'onLiteralValue', text: '"foo2"', startLine: 0, startCharacter: 23, arg: "foo2" },
                { id: 'onSeparator', text: ",", startLine: 0, startCharacter: 29, arg: "," },
                { id: 'onObjectProperty', text: '"prop3"', startLine: 0, startCharacter: 30, arg: "prop3" },
                { id: 'onSeparator', text: ":", startLine: 0, startCharacter: 37, arg: ":" },
                { id: 'onObjectBegin', text: "{", startLine: 0, startCharacter: 38 },
                { id: 'onObjectProperty', text: '"prp1"', startLine: 0, startCharacter: 39, arg: "prp1" },
                { id: 'onSeparator', text: ":", startLine: 0, startCharacter: 45, arg: ":" },
                { id: 'onObjectBegin', text: "{", startLine: 0, startCharacter: 46 },
                { id: 'onObjectProperty', text: '""', startLine: 0, startCharacter: 47, arg: "" },
                { id: 'onObjectEnd', text: "}", startLine: 0, startCharacter: 49 },
                { id: 'onObjectEnd', text: "}", startLine: 0, startCharacter: 50 },
                { id: 'onObjectEnd', text: "}", startLine: 0, startCharacter: 51 }
            ], [{ error: 5 /* ColonExpected */, offset: 49, length: 1, startLine: 0, startCharacter: 49 }]);
            assertTree('{"prop1":"foo","prop2":"foo2","prop3":{"prp1":{""}}}', {
                type: 'object', offset: 0, length: 52, children: [
                    {
                        type: 'property', offset: 1, length: 13, children: [
                            { type: 'string', value: 'prop1', offset: 1, length: 7 },
                            { type: 'string', offset: 9, length: 5, value: 'foo' }
                        ], colonOffset: 8
                    }, {
                        type: 'property', offset: 15, length: 14, children: [
                            { type: 'string', value: 'prop2', offset: 15, length: 7 },
                            { type: 'string', offset: 23, length: 6, value: 'foo2' }
                        ], colonOffset: 22
                    },
                    {
                        type: 'property', offset: 30, length: 21, children: [
                            { type: 'string', value: 'prop3', offset: 30, length: 7 },
                            {
                                type: 'object', offset: 38, length: 13, children: [
                                    {
                                        type: 'property', offset: 39, length: 11, children: [
                                            { type: 'string', value: 'prp1', offset: 39, length: 6 },
                                            {
                                                type: 'object', offset: 46, length: 4, children: [
                                                    {
                                                        type: 'property', offset: 47, length: 3, children: [
                                                            { type: 'string', value: '', offset: 47, length: 2 },
                                                        ]
                                                    }
                                                ]
                                            }
                                        ], colonOffset: 45
                                    }
                                ]
                            }
                        ], colonOffset: 37
                    }
                ]
            }, [{ error: 5 /* ColonExpected */, offset: 49, length: 1 }]);
        });
        test('tree: find location', function () {
            var root = main_1.parseTree('{ "key1": { "key11": [ "val111", "val112" ] }, "key2": [ { "key21": false, "key22": 221 }, null, [{}] ] }');
            assertNodeAtLocation(root, ['key1'], { key11: ['val111', 'val112'] });
            assertNodeAtLocation(root, ['key1', 'key11'], ['val111', 'val112']);
            assertNodeAtLocation(root, ['key1', 'key11', 0], 'val111');
            assertNodeAtLocation(root, ['key1', 'key11', 1], 'val112');
            assertNodeAtLocation(root, ['key1', 'key11', 2], void 0);
            assertNodeAtLocation(root, ['key2', 0, 'key21'], false);
            assertNodeAtLocation(root, ['key2', 0, 'key22'], 221);
            assertNodeAtLocation(root, ['key2', 1], null);
            assertNodeAtLocation(root, ['key2', 2], [{}]);
            assertNodeAtLocation(root, ['key2', 2, 0], {});
        });
        test('location: matches', function () {
            assertMatchesLocation('{ "dependencies": { | } }', ['dependencies']);
            assertMatchesLocation('{ "dependencies": { "fo| } }', ['dependencies']);
            assertMatchesLocation('{ "dependencies": { "fo|" } }', ['dependencies']);
            assertMatchesLocation('{ "dependencies": { "fo|": 1 } }', ['dependencies']);
            assertMatchesLocation('{ "dependencies": { "fo|": 1 } }', ['dependencies']);
            assertMatchesLocation('{ "dependencies": { "fo": | } }', ['dependencies', '*']);
        });
    });
});
