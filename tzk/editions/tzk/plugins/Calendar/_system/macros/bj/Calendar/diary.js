/*\
title: $:/macros/bj/Calendar/diary.js
type: application/javascript
module-type: global
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
calendar demo
*/
var Calendar=new Date();
var createMonth= function(mnth,year,options){
	var month=[];
	for (var i=1;i < 1+daysInMonth(mnth,year);i++) month[i] = createDate(i,mnth,year,options);
	return month;
}
function createDate(i,mnth,year,options){
	var strong='',tiddlerDate,format = $tw.wiki.getTiddlerText("$:/config/NewJournal/Title") || "YYYY MM DD";
	var date=(new Date(year, mnth-1, i));
	if (options.highlightLinks=="yes") strong ='!';
	
	tiddlerDate = $tw.utils.formatDateString(date,format);
   
	if ($tw.wiki.getTiddler(tiddlerDate))return centre(strong+'[['+i+'|'+tiddlerDate+']]');
	return  centre('[['+i+'|'+tiddlerDate+']]');
}
function daysInMonth(iMonth, iYear){
		return 32 - new Date(iYear, iMonth-1, 32).getDate();
	}
function centre (x){ return ' '+x+' ';}
exports.createMonth = createMonth;
})();
