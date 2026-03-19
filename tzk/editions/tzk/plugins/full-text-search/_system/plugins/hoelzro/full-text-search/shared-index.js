"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/shared-index.js
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
var SharedIndex;
(function (SharedIndex) {
    var RELATED_TERMS_TIDDLER = '$:/plugins/hoelzro/full-text-search/RelatedTerms.json';
    var FUZZY_SEARCH_TIDDLER = '$:/plugins/hoelzro/full-text-search/EnableFuzzySearching';
    var lunr = require('$:/plugins/hoelzro/full-text-search/lunr.min.js');
    var lunrMutable = require('$:/plugins/hoelzro/full-text-search/lunr-mutable.js');
    // XXX import?
    var generateQueryExpander = require('$:/plugins/hoelzro/full-text-search/query-expander.js').generateQueryExpander;
    lunr.utils.warn = function () { };
    var index = null;
    function tick() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        $tw.utils.nextTick(resolve);
                    })];
            });
        });
    }
    function buildIndexIncremental(wiki, tiddlers, rebuilding, progressCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var builder, relatedTerms, expandQuery, stemmer, i, _i, tiddlers_1, title, tiddler, type;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        builder = null;
                        if (rebuilding || !index) {
                            relatedTerms = $tw.wiki.getTiddlerDataCached(RELATED_TERMS_TIDDLER, []);
                            relatedTerms = relatedTerms.map($tw.utils.parseStringArray);
                            expandQuery = generateQueryExpander(lunr, relatedTerms);
                            builder = new lunrMutable.Builder();
                            stemmer = void 0;
                            if (wiki.getTiddlerText(FUZZY_SEARCH_TIDDLER, '') == 'yes') {
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
                            // XXX configurable fields?
                            builder.field('title');
                            builder.field('tags');
                            builder.field('text');
                            builder.ref('title');
                        }
                        else {
                            builder = index.builder;
                        }
                        i = 0;
                        _i = 0, tiddlers_1 = tiddlers;
                        _a.label = 1;
                    case 1:
                        if (!(_i < tiddlers_1.length)) return [3 /*break*/, 5];
                        title = tiddlers_1[_i];
                        tiddler = wiki.getTiddler(title);
                        i++;
                        if (tiddler === undefined) { // avoid drafts that were open when we started
                            return [3 /*break*/, 4];
                        }
                        type = tiddler.fields.type || 'text/vnd.tiddlywiki';
                        if (!type.startsWith('text/')) {
                            return [3 /*break*/, 4];
                        }
                        if ('draft.of' in tiddler.fields) {
                            return [3 /*break*/, 4];
                        }
                        updateTiddler(builder, tiddler);
                        return [4 /*yield*/, progressCallback(i)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, tick()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        index = builder.build();
                        return [4 /*yield*/, progressCallback(tiddlers.length)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function buildIndexWorker(wiki, tiddlers, progressCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var workerSource, worker, relatedTerms, expandQuery, stemmer, workerFinished;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workerSource = wiki.getTiddlerText('$:/plugins/hoelzro/full-text-search/index-worker.js');
                        worker = new Worker(URL.createObjectURL(new Blob([workerSource])));
                        relatedTerms = $tw.wiki.getTiddlerDataCached(RELATED_TERMS_TIDDLER, []);
                        relatedTerms = relatedTerms.map($tw.utils.parseStringArray);
                        expandQuery = generateQueryExpander(lunr, relatedTerms);
                        stemmer = function (unstemmedToken) {
                            var stemmedToken = lunr.stemmer(unstemmedToken.clone());
                            return [unstemmedToken, stemmedToken];
                        };
                        lunr.Pipeline.registerFunction(stemmer, 'stemmedAndUnstemmed');
                        workerFinished = new Promise(function (resolve, reject) {
                            worker.onmessage = function (msg) {
                                var payload = msg.data;
                                if (payload.type == 'require') {
                                    var moduleName = payload.name;
                                    var moduleSource = wiki.getTiddlerText(moduleName);
                                    worker.postMessage(URL.createObjectURL(new Blob([moduleSource])));
                                }
                                else if (payload.type == 'index') {
                                    index = lunrMutable.Index.load(JSON.parse(payload.index));
                                    resolve();
                                }
                                else if (payload.type == 'sendTiddlers') {
                                    for (var _i = 0, tiddlers_2 = tiddlers; _i < tiddlers_2.length; _i++) {
                                        var title = tiddlers_2[_i];
                                        var tiddler = wiki.getTiddler(title);
                                        if (tiddler === undefined) { // avoid drafts that were open when we started
                                            continue;
                                        }
                                        var type = tiddler.fields.type || 'text/vnd.tiddlywiki';
                                        if (!type.startsWith('text/')) {
                                            continue;
                                        }
                                        worker.postMessage(JSON.stringify(tiddler.fields));
                                    }
                                    worker.postMessage(null);
                                }
                                else if (payload.type == 'progress') {
                                    progressCallback(payload.count);
                                }
                                else if (payload.type == 'getRelatedTerms') {
                                    worker.postMessage(relatedTerms);
                                }
                                else if (payload.type == 'getFuzzySetting') {
                                    var fuzzySetting = wiki.getTiddlerText(FUZZY_SEARCH_TIDDLER, '');
                                    worker.postMessage(fuzzySetting);
                                }
                                else if (payload.type == 'error') {
                                    reject(payload.error);
                                }
                            };
                        });
                        return [4 /*yield*/, workerFinished];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, progressCallback(tiddlers.length)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function buildIndex(wiki, tiddlers, isFresh, progressCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!($tw.browser && isFresh)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, buildIndexWorker(wiki, tiddlers, progressCallback)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_1 = _a.sent();
                        console.log(e_1);
                        console.log('falling back to incremental indexing...');
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, buildIndexIncremental(wiki, tiddlers, isFresh, progressCallback)];
                    case 5: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    SharedIndex.buildIndex = buildIndex;
    function updateTiddler(builder, tiddler) {
        var fields = {
            title: tiddler.fields.title
        };
        if ('text' in tiddler.fields) {
            fields.text = tiddler.fields.text;
        }
        if ('tags' in tiddler.fields) {
            fields.tags = tiddler.fields.tags.join(' ');
        }
        builder.remove(fields);
        builder.add(fields);
    }
    SharedIndex.updateTiddler = updateTiddler;
    function getIndex() {
        return index;
    }
    SharedIndex.getIndex = getIndex;
    ;
    function clearIndex() {
        index = null;
    }
    SharedIndex.clearIndex = clearIndex;
    function load(data) {
        index = lunrMutable.Index.load(data);
    }
    SharedIndex.load = load;
})(SharedIndex || (SharedIndex = {}));
module.exports = SharedIndex;
// vim:sts=4:sw=4
