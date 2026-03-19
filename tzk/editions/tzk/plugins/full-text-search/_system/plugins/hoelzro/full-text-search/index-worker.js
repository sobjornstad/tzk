"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/index-worker.js
type: application/javascript
module-type: library

\*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
(function () {
    return __awaiter(this, void 0, void 0, function () {
        function getNextMessage() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            onmessage = function (msg) {
                                onmessage = function () { };
                                resolve(msg.data);
                            };
                        })];
                });
            });
        }
        function requireFromPage(name, sandbox) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    postMessage({
                        type: 'require',
                        name: name
                    });
                    return [2 /*return*/, getNextMessage().then(function (msg) {
                            var mod = { exports: {} };
                            self['module'] = mod;
                            self['exports'] = mod.exports;
                            if (sandbox != null) {
                                for (var k in sandbox) {
                                    if (sandbox.hasOwnProperty(k)) {
                                        self[k] = sandbox[k];
                                    }
                                }
                            }
                            importScripts(msg);
                            if (sandbox != null) {
                                for (var k in sandbox) {
                                    if (sandbox.hasOwnProperty(k)) {
                                        delete self[k];
                                    }
                                }
                            }
                            delete self['module'];
                            delete self['exports'];
                            return mod.exports;
                        })];
                });
            });
        }
        function getRelatedTerms() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            postMessage({
                                type: 'getRelatedTerms'
                            });
                            return [4 /*yield*/, getNextMessage()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        function getFuzzySetting() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            postMessage({
                                type: 'getFuzzySetting'
                            });
                            return [4 /*yield*/, getNextMessage()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        }
        function readTiddlers() {
            return __asyncGenerator(this, arguments, function readTiddlers_1() {
                var msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            postMessage({ type: 'sendTiddlers' });
                            return [4 /*yield*/, __await(getNextMessage())];
                        case 1:
                            msg = _a.sent();
                            _a.label = 2;
                        case 2:
                            if (!(msg != null)) return [3 /*break*/, 6];
                            return [4 /*yield*/, __await(JSON.parse(msg))];
                        case 3: return [4 /*yield*/, _a.sent()];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, __await(getNextMessage())];
                        case 5:
                            msg = _a.sent();
                            return [3 /*break*/, 2];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        var e_1, _a, lunr, lunrMutable, generateQueryExpander, relatedTerms, fuzzySetting, expandQuery, builder, stemmer, count, previousUpdate, _b, _c, tiddlerFields, fields, now, e_1_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, requireFromPage('$:/plugins/hoelzro/full-text-search/lunr.min.js')];
                case 1:
                    lunr = _d.sent();
                    return [4 /*yield*/, requireFromPage('$:/plugins/hoelzro/full-text-search/lunr-mutable.js', {
                            require: function (modName) {
                                if (modName != '$:/plugins/hoelzro/full-text-search/lunr.min.js') {
                                    throw new Error("Invalid module name for lunr-mutable!");
                                }
                                return lunr;
                            }
                        })];
                case 2:
                    lunrMutable = _d.sent();
                    return [4 /*yield*/, requireFromPage('$:/plugins/hoelzro/full-text-search/query-expander.js')];
                case 3:
                    generateQueryExpander = (_d.sent()).generateQueryExpander;
                    return [4 /*yield*/, getRelatedTerms()];
                case 4:
                    relatedTerms = _d.sent();
                    return [4 /*yield*/, getFuzzySetting()];
                case 5:
                    fuzzySetting = _d.sent();
                    expandQuery = generateQueryExpander(lunr, relatedTerms);
                    builder = new lunrMutable.Builder();
                    if (fuzzySetting == 'yes') {
                        stemmer = function (unstemmedToken) {
                            var stemmedToken = lunr.stemmer(unstemmedToken.clone());
                            return [unstemmedToken, stemmedToken];
                        };
                        lunr.Pipeline.registerFunction(stemmer, 'stemmedAndUnstemmed');
                    }
                    else {
                        stemmer = lunr.stemmer;
                    }
                    builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, expandQuery, stemmer);
                    builder.searchPipeline.add(lunr.stemmer);
                    count = 0;
                    previousUpdate = new Date();
                    // XXX configurable fields?
                    builder.field('title');
                    builder.field('tags');
                    builder.field('text');
                    builder.ref('title');
                    _d.label = 6;
                case 6:
                    _d.trys.push([6, 11, 12, 17]);
                    _b = __asyncValues(readTiddlers());
                    _d.label = 7;
                case 7: return [4 /*yield*/, _b.next()];
                case 8:
                    if (!(_c = _d.sent(), !_c.done)) return [3 /*break*/, 10];
                    tiddlerFields = _c.value;
                    fields = {
                        title: tiddlerFields.title
                    };
                    if ('text' in tiddlerFields) {
                        fields.text = tiddlerFields.text;
                    }
                    if ('tags' in tiddlerFields) {
                        fields.tags = tiddlerFields.tags.join(' ');
                    }
                    builder.add(fields);
                    count++;
                    now = new Date();
                    if ((now.getTime() - previousUpdate.getTime()) > 200) {
                        previousUpdate = now;
                        postMessage({ type: 'progress', count: count });
                    }
                    _d.label = 9;
                case 9: return [3 /*break*/, 7];
                case 10: return [3 /*break*/, 17];
                case 11:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 17];
                case 12:
                    _d.trys.push([12, , 15, 16]);
                    if (!(_c && !_c.done && (_a = _b["return"]))) return [3 /*break*/, 14];
                    return [4 /*yield*/, _a.call(_b)];
                case 13:
                    _d.sent();
                    _d.label = 14;
                case 14: return [3 /*break*/, 16];
                case 15:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 16: return [7 /*endfinally*/];
                case 17:
                    postMessage({ type: 'index', index: JSON.stringify(builder.build()) });
                    close();
                    return [2 /*return*/];
            }
        });
    });
})()["catch"](function (err) {
    postMessage({ type: 'error', error: err.toString() });
});
// vim:sts=4:sw=4
