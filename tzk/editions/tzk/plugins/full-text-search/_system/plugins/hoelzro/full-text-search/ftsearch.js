"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/ftsearch.js
type: application/javascript
module-type: filteroperator

\*/
var FTSearch;
(function (FTSearch) {
    var FUZZY_SEARCH_TIDDLER = '$:/plugins/hoelzro/full-text-search/EnableFuzzySearching';
    var lunr = require('$:/plugins/hoelzro/full-text-search/lunr.min.js');
    var getIndex = require('$:/plugins/hoelzro/full-text-search/shared-index.js').getIndex;
    function ftsearch(source, operator, options) {
        var sourceLookup = Object.create(null);
        source(function (tiddler, title) {
            sourceLookup[title] = tiddler;
        });
        var index = getIndex();
        if (!index) {
            return [];
        }
        return function (callback) {
            var results;
            try {
                var fuzzySearchesEnabled = options.wiki.getTiddlerText(FUZZY_SEARCH_TIDDLER, '') == 'yes';
                if (!fuzzySearchesEnabled) {
                    var qp = new lunr.QueryParser(operator.operand, new lunr.Query(['title', 'tags', 'text']));
                    var query = qp.parse();
                    for (var _i = 0, _a = query.clauses; _i < _a.length; _i++) {
                        var clause = _a[_i];
                        if (!clause.usePipeline) {
                            // we're using a wildcard, but the index isn't prepared for
                            // fuzzy searches - so pass information on this down the pipeline
                            return callback(null, null, "It looks like you're trying to perform a wildcard search; you'll need to enable wildcard/fuzzy searching in the FTS settings");
                        }
                        if ('editDistance' in clause) {
                            // we're using a fuzzy search, but the index isn't prepared for
                            // fuzzy searches - so pass information on this down the pipeline
                            return callback(null, null, "It looks like you're trying to perform a fuzzy search; you'll need to enable wildcard/fuzzy searching in the FTS settings");
                        }
                    }
                }
                results = index.search(operator.operand);
            }
            catch (e) {
                if (e instanceof lunr.QueryParseError) {
                    results = [];
                }
                else {
                    throw e;
                }
            }
            for (var _b = 0, results_1 = results; _b < results_1.length; _b++) {
                var match = results_1[_b];
                if (match.ref in sourceLookup) {
                    callback(sourceLookup[match.ref], match.ref);
                }
            }
        };
    }
    FTSearch.ftsearch = ftsearch;
    ;
})(FTSearch || (FTSearch = {}));
module.exports = FTSearch;
// vim:sts=4:sw=4
