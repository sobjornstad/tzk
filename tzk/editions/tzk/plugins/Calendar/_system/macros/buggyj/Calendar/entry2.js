/*\
title: $:/macros/buggyj/Calendar/entry2.js
type: application/javascript
module-type: macro

<<diary year month>>
<<diary year>> - year calendar
<<diary>> - this month

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

exports.name = "diary";

exports.params = [
	{ name: "year" },{ name: "month" },{ name: "opts" }
];
/*
Run the macro
*/

exports.run = function(year, month,opts) {
	var tags = $tw.wiki.getTiddlerText("$:/config/NewJournal/Tags");
	if (!opts) opts = "diary";
	return '<$ifnew fields="""{"tags":"'+tags+'"}""">' +
	'<$macrorefresh $name="calendarbase" year="'+year+'" month="'+month+'" opts="'+opts+'" $refresh="calendarrefresh"/>'+ '</$ifnew>';
}

})();
