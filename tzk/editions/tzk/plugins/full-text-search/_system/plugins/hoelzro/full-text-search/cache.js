"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/cache.js
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
var localForage = require('$:/plugins/hoelzro/full-text-search/localforage.min.js');
var FTSCache;
(function (FTSCache) {
    var RELATED_TERMS_TIDDLER = '$:/plugins/hoelzro/full-text-search/RelatedTerms.json';
    function hasFunctionalCache() {
        return localForage.driver() != null;
    }
    function currentPluginVersion() {
        var pluginTiddler = $tw.wiki.getTiddler('$:/plugins/hoelzro/full-text-search');
        return pluginTiddler.fields.version;
    }
    function relatedTermsModified() {
        var relatedTerms = $tw.wiki.getTiddler(RELATED_TERMS_TIDDLER);
        if (!relatedTerms || !relatedTerms.fields.modified) {
            return 0;
        }
        return relatedTerms.fields.modified.getTime();
    }
    function getCacheMetadata() {
        return __awaiter(this, void 0, void 0, function () {
            var metaKey, cacheMeta, cacheRelatedTermsModified, relatedTerms, ourRelatedTermsModified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasFunctionalCache()) {
                            return [2 /*return*/];
                        }
                        metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        return [4 /*yield*/, localForage.getItem(metaKey)];
                    case 1:
                        cacheMeta = _a.sent();
                        if (cacheMeta === null) {
                            return [2 /*return*/];
                        }
                        if (!('ftsPluginVersion' in cacheMeta) || cacheMeta.ftsPluginVersion != currentPluginVersion()) {
                            return [2 /*return*/];
                        }
                        cacheRelatedTermsModified = ('relatedTermsModified' in cacheMeta) ? cacheMeta.relatedTermsModified : 0;
                        relatedTerms = $tw.wiki.getTiddler(RELATED_TERMS_TIDDLER);
                        ourRelatedTermsModified = relatedTermsModified();
                        if (cacheRelatedTermsModified != ourRelatedTermsModified) {
                            return [2 /*return*/];
                        }
                        return [2 /*return*/, cacheMeta];
                }
            });
        });
    }
    // XXX what about migrating between lunr versions? what about invalid data under the key?
    function getCacheData() {
        return __awaiter(this, void 0, void 0, function () {
            var metaData, dataKey, cacheData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasFunctionalCache()) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, getCacheMetadata()];
                    case 1:
                        metaData = _a.sent();
                        if (metaData == null) {
                            return [2 /*return*/, null];
                        }
                        dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        return [4 /*yield*/, localForage.getItem(dataKey)];
                    case 2:
                        cacheData = _a.sent();
                        if (cacheData === null) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, JSON.parse(cacheData)];
                }
            });
        });
    }
    function getAge() {
        return __awaiter(this, void 0, void 0, function () {
            var cacheMeta;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasFunctionalCache()) {
                            return [2 /*return*/, 0];
                        }
                        return [4 /*yield*/, getCacheMetadata()];
                    case 1:
                        cacheMeta = _a.sent();
                        if (!cacheMeta) {
                            return [2 /*return*/, 0];
                        }
                        return [2 /*return*/, cacheMeta.age];
                }
            });
        });
    }
    FTSCache.getAge = getAge;
    function load() {
        if (!hasFunctionalCache()) {
            return null;
        }
        var cacheData = getCacheData();
        if (!cacheData) {
            return;
        }
        return cacheData;
    }
    FTSCache.load = load;
    function save(age, data) {
        return __awaiter(this, void 0, void 0, function () {
            var dataKey, metaKey, dataPromise, metaPromise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasFunctionalCache()) {
                            return [2 /*return*/];
                        }
                        dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        dataPromise = localForage.setItem(dataKey, JSON.stringify(data));
                        metaPromise = localForage.setItem(metaKey, { age: age, ftsPluginVersion: currentPluginVersion(), relatedTermsModified: relatedTermsModified() });
                        return [4 /*yield*/, Promise.all([dataPromise, metaPromise])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    FTSCache.save = save;
    function invalidate() {
        return __awaiter(this, void 0, void 0, function () {
            var dataKey, metaKey, dataPromise, metaPromise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!hasFunctionalCache()) {
                            return [2 /*return*/];
                        }
                        dataKey = 'tw-fts-index.data.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        metaKey = 'tw-fts-index.meta.' + $tw.wiki.getTiddler('$:/SiteTitle').fields.text;
                        dataPromise = localForage.removeItem(dataKey);
                        metaPromise = localForage.removeItem(metaKey);
                        return [4 /*yield*/, Promise.all([dataPromise, metaPromise])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    FTSCache.invalidate = invalidate;
})(FTSCache || (FTSCache = {}));
module.exports = FTSCache;
