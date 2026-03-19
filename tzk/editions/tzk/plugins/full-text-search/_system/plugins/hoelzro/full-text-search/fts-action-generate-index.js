"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/fts-action-generate-index.js
type: application/javascript
module-type: widget

\*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.__esModule = true;
var widgetModule = require('$:/core/modules/widgets/widget.js');
var Widget = widgetModule.widget;
var sharedIndex = require('$:/plugins/hoelzro/full-text-search/shared-index.js');
var cache = require('$:/plugins/hoelzro/full-text-search/cache.js');
var generateQueryExpander = require('$:/plugins/hoelzro/full-text-search/query-expander.js').generateQueryExpander;
var FTSActionGenerateIndex;
(function (FTSActionGenerateIndex) {
    var RELATED_TERMS_TIDDLER = '$:/plugins/hoelzro/full-text-search/RelatedTerms.json';
    var USE_CACHE_TIDDLER = '$:/plugins/hoelzro/full-text-search/use-cache';
    var STATE_TIDDLER = '$:/temp/FTS-state';
    var UPDATE_FREQUENCY = 10;
    var FTSActionGenerateIndexWidget = /** @class */ (function (_super) {
        __extends(FTSActionGenerateIndexWidget, _super);
        function FTSActionGenerateIndexWidget(parseTreeNode, options) {
            var _this = _super.call(this) || this;
            _this.initialise(parseTreeNode, options);
            return _this;
        }
        FTSActionGenerateIndexWidget.prototype.render = function (parent, nextSibling) {
            this.computeAttributes();
            this.execute();
        };
        FTSActionGenerateIndexWidget.prototype.execute = function () {
        };
        FTSActionGenerateIndexWidget.prototype.refresh = function (changedTiddlers) {
            return this.refreshChildren(changedTiddlers);
        };
        FTSActionGenerateIndexWidget.prototype.asyncInvokeAction = function () {
            return __awaiter(this, void 0, void 0, function () {
                var shouldSuppressCache, rebuilding, filter, tiddlers, isFresh, cacheData, _a, cacheAge, titles, i, title, tiddler, modified, i, title, tiddler, relatedTerms, lunr_1, expandQuery, age, stateTiddler, fields, self, lastUpdate;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            shouldSuppressCache = this.wiki.getTiddlerText(USE_CACHE_TIDDLER) == 'no';
                            rebuilding = this.getAttribute('rebuild') === 'true';
                            filter = '[!is[system]]';
                            if (!(rebuilding || shouldSuppressCache)) return [3 /*break*/, 1];
                            _a = null;
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, cache.load()];
                        case 2:
                            _a = _b.sent();
                            _b.label = 3;
                        case 3:
                            cacheData = _a;
                            if (!cacheData) return [3 /*break*/, 5];
                            return [4 /*yield*/, cache.getAge()];
                        case 4:
                            cacheAge = _b.sent();
                            filter += ' +[nsort[modified]]';
                            titles = this.wiki.filterTiddlers(filter);
                            tiddlers = [];
                            for (i = titles.length - 1; i >= 0; i--) {
                                title = titles[i];
                                tiddler = this.wiki.getTiddler(title);
                                if (!('modified' in tiddler.fields)) {
                                    break;
                                }
                                modified = $tw.utils.stringifyDate(tiddler.fields.modified);
                                if (modified <= cacheAge) {
                                    break;
                                }
                                tiddlers.push(title);
                            }
                            for (i = 0; i < titles.length; i++) {
                                title = titles[i];
                                tiddler = this.wiki.getTiddler(title);
                                if ('modified' in tiddler.fields) {
                                    break;
                                }
                                tiddlers.push(title);
                            }
                            relatedTerms = $tw.wiki.getTiddlerDataCached(RELATED_TERMS_TIDDLER, []);
                            relatedTerms = relatedTerms.map($tw.utils.parseStringArray);
                            lunr_1 = require('$:/plugins/hoelzro/full-text-search/lunr.min.js');
                            expandQuery = generateQueryExpander(lunr_1, relatedTerms);
                            sharedIndex.load(cacheData);
                            isFresh = false;
                            return [3 /*break*/, 6];
                        case 5:
                            tiddlers = this.wiki.filterTiddlers(filter);
                            isFresh = true;
                            _b.label = 6;
                        case 6:
                            age = this.wiki.filterTiddlers(filter + ' +[nsort[modified]last[]get[modified]]')[0];
                            age = age == null ? '0' : age;
                            stateTiddler = this.wiki.getTiddler(STATE_TIDDLER);
                            if (!(tiddlers.length > 0)) return [3 /*break*/, 8];
                            fields = {
                                text: 'initializing',
                                progressCurrent: 0,
                                progressTotal: tiddlers.length
                            };
                            this.wiki.addTiddler(new $tw.Tiddler(stateTiddler, fields, this.wiki.getModificationFields()));
                            self = this;
                            lastUpdate = 0;
                            return [4 /*yield*/, sharedIndex.buildIndex(this.wiki, tiddlers, isFresh, function (progressCurrent) {
                                    return __awaiter(this, void 0, void 0, function () {
                                        var stateTiddler, e_1, stateTiddler;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if ((progressCurrent - lastUpdate) >= UPDATE_FREQUENCY) {
                                                        stateTiddler = self.wiki.getTiddler(STATE_TIDDLER);
                                                        self.wiki.addTiddler(new $tw.Tiddler(stateTiddler, { progressCurrent: progressCurrent }, self.wiki.getModificationFields()));
                                                        lastUpdate = progressCurrent;
                                                    }
                                                    if (!(progressCurrent == tiddlers.length)) return [3 /*break*/, 6];
                                                    _a.label = 1;
                                                case 1:
                                                    _a.trys.push([1, 4, , 5]);
                                                    if (!!shouldSuppressCache) return [3 /*break*/, 3];
                                                    return [4 /*yield*/, cache.save(age, sharedIndex.getIndex().toJSON())];
                                                case 2:
                                                    _a.sent();
                                                    _a.label = 3;
                                                case 3: return [3 /*break*/, 5];
                                                case 4:
                                                    e_1 = _a.sent();
                                                    return [3 /*break*/, 5];
                                                case 5:
                                                    stateTiddler = self.wiki.getTiddler(STATE_TIDDLER);
                                                    self.wiki.addTiddler(new $tw.Tiddler(stateTiddler, { text: 'initialized', progressCurrent: progressCurrent }, self.wiki.getModificationFields()));
                                                    _a.label = 6;
                                                case 6: return [2 /*return*/];
                                            }
                                        });
                                    });
                                })];
                        case 7:
                            _b.sent();
                            return [3 /*break*/, 9];
                        case 8:
                            this.wiki.addTiddler(new $tw.Tiddler(stateTiddler, { text: 'initialized', progressCurrent: 1, progressTotal: 1 }, this.wiki.getModificationFields()));
                            _b.label = 9;
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        FTSActionGenerateIndexWidget.prototype.invokeAction = function (triggeringWidget, event) {
            this.asyncInvokeAction().then(function () {
            }, function (err) {
                console.log(err);
            });
        };
        return FTSActionGenerateIndexWidget;
    }(Widget));
    exports['fts-action-generate-index'] = FTSActionGenerateIndexWidget;
})(FTSActionGenerateIndex || (FTSActionGenerateIndex = {}));
// vim:sts=4:sw=4
