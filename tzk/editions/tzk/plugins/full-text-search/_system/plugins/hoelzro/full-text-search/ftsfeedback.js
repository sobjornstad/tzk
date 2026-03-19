"use strict";
/*\
title: $:/plugins/hoelzro/full-text-search/ftsfeedback.js
type: application/javascript
module-type: filteroperator

\*/
var FTSFeedback;
(function (FTSFeedback) {
    function ftsfeedback(source, operator, options) {
        return function (callback) {
            var targetTiddler = operator.operand;
            var listOfFeedback = [];
            source(function (tiddler, title, feedback) {
                if (tiddler == null && title == null) {
                    listOfFeedback.push(feedback);
                }
                else {
                    callback(tiddler, title);
                }
            });
            options.wiki.setTiddlerData(targetTiddler, listOfFeedback);
        };
    }
    FTSFeedback.ftsfeedback = ftsfeedback;
})(FTSFeedback || (FTSFeedback = {}));
module.exports = FTSFeedback;
