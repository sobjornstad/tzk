/*\
title: $:/tzk/js/filters/isoweek.js
type: application/javascript
module-type: filteroperator

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function dateFromString(str) {
    // Extract individual components
    var year = str.slice(0, 4);
    var month = str.slice(4, 6) || 1;
    var day = str.slice(6, 8) || 1;
    var hour = str.slice(8, 10) || 0;
    var minute = str.slice(10, 12) || 0;
    var second = str.slice(12, 14) || 0;
    var millisecond = str.slice(14) || 0;
    return new Date(year, month - 1, day, hour, minute, second, millisecond);
}

function getWeek(date) {
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/*
Export our filter function
*/
exports.isoweek = function(source,operator,options) {
	var results = [];
	
	var field = operator.suffix;
	var week = parseInt(operator.operand);
	source(function(tiddler, title) {
		var dateFieldValue = tiddler.getFieldString(field);
		if (getWeek(dateFromString(dateFieldValue)) === week) {
			results.push(title)
		}
	});
	
	return results;
};

})();
