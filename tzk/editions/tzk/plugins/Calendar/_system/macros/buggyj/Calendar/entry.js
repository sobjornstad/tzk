/*\
title: $:/macros/buggyj/Calendar/entry.js
type: application/javascript
module-type: macro

<<calendar year month>>
<<calendar year>> - year calendar
<<calendar>> - this month

Options:$:/macros/diary/options.json
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
CAL demo
*/

exports.name = "calendar";

exports.params = [
	{ name: "year" },{ name: "month" },{ name: "opts" }
];
/*
Run the macro
*/

exports.run = function(year, month,opts) {
return '<$macrorefresh $name="calendarbase" year="'+year+'" month="'+month+'" opts="'+opts+'" $refresh="calendarrefresh"/>';
}

})();
