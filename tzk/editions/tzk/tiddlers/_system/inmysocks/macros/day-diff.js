/*\
title: $:/inmysocks/macros/day-diff.js
type: application/javascript
module-type: macro

Takes two dates and returns their difference in days

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "day-diff";

exports.params = [
	{name: "year1"},
	{name: "month1"},
	{name: "day1"},
	{name: "year2"},
	{name: "month2"},
	{name: "day2"}
];

/*
Run the macro
*/
exports.run = function(year1, month1, day1, year2, month2, day2) {
	//Make each date object.
	var date1 = new Date(year1, Number(month1)+Number(1), day1);
	var date2 = new Date(year2, Number(month2)+Number(1), day2);

	//Find difference in milliseconds.
	var elapsed = date2.getTime()-date1.getTime();

	//Number of milliseconds in a day.
	var dayMS = 86400000; 

	//Convert milliseconds to year months and days
	var days_diff = Math.floor(elapsed/dayMS);
	
	var result = days_diff;

	return result;
};

})();
