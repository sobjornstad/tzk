"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/query-expander.js
type: application/javascript
module-type: library

\*/
var QueryExpander;
(function (QueryExpander) {
    if (!('asyncIterator' in Symbol)) {
        Symbol.asyncIterator = Symbol["for"]('Symbol.asyncIterator');
    }
    function buildAliasTree(lunr, listOfAliases) {
        var topTree = {};
        for (var _i = 0, listOfAliases_1 = listOfAliases; _i < listOfAliases_1.length; _i++) {
            var aliases = listOfAliases_1[_i];
            for (var i = 0; i < aliases.length; i++) {
                // XXX do you want to run the full pipeline? what if we tweak the tokenizer?
                var iTokens = lunr.tokenizer(aliases[i]).map(function (token) { return token.toString(); });
                for (var j = 0; j < aliases.length; j++) {
                    if (i == j) {
                        continue;
                    }
                    var jTokens = lunr.tokenizer(aliases[j]).map(function (token) { return token.toString(); });
                    var tree = topTree;
                    for (var _a = 0, jTokens_1 = jTokens; _a < jTokens_1.length; _a++) {
                        var token = jTokens_1[_a];
                        if (!(token in tree)) {
                            tree[token] = {};
                        }
                        tree = tree[token];
                    }
                    if (!('.expansion' in tree)) {
                        tree['.expansion'] = [];
                    }
                    for (var _b = 0, iTokens_1 = iTokens; _b < iTokens_1.length; _b++) {
                        var token = iTokens_1[_b];
                        tree['.expansion'].push(token);
                    }
                }
            }
        }
        return topTree;
    }
    function generateQueryExpander(lunr, relatedTerms) {
        var treeTop = buildAliasTree(lunr, relatedTerms);
        var currentTree = treeTop;
        var expandQuery = function expandQuery(token) {
            if (token.metadata.index == 0) {
                currentTree = treeTop;
            }
            var tokenStr = token.toString();
            if (currentTree.hasOwnProperty(tokenStr)) {
                currentTree = currentTree[tokenStr];
                if ('.expansion' in currentTree) {
                    var originalToken = token;
                    var tokens = [originalToken];
                    var _loop_1 = function (token_1) {
                        tokens.push(originalToken.clone(function (str, meta) {
                            return token_1;
                        }));
                    };
                    for (var _i = 0, _a = currentTree['.expansion']; _i < _a.length; _i++) {
                        var token_1 = _a[_i];
                        _loop_1(token_1);
                    }
                    return tokens;
                }
            }
            else {
                currentTree = treeTop;
            }
            return token;
        };
        lunr.Pipeline.registerFunction(expandQuery, 'expandQuery');
        return expandQuery;
    }
    QueryExpander.generateQueryExpander = generateQueryExpander;
})(QueryExpander || (QueryExpander = {}));
module.exports = QueryExpander;
// vim:sts=4:sw=4
