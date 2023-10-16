/*\
title: $:/plugins/sobjornstad/TakeAway/dateadd.js
type: application/javascript
module-type: macro

Courtesy of stobot, adapted from Jed Carty:
https://groups.google.com/g/tiddlywiki/c/y_GjM302u60/m/u_aZ6GhEBwAJ
http://inmysocks.tiddlyspot.com/#$:/inmysocks/macros/add-time.js

Takes a base date and adds days, months or years

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "dateadd";

exports.params = [
    {name: "basedate"},
    {name: "days"},
    {name: "months"},
    {name: "years"},
    {name: "template"}
];

/*
Run the macro
*/
exports.run = function(basedate, days, months, years, template) {
    
    //Make each date object.
    
    if (basedate === "") {
        var newdate = new Date();
    } else {
        var baseyear = basedate.substr(0,4);
        var basemonth = basedate.substr(4,2);
        var baseday = basedate.substr(6,2);
        var newdate = new Date(Number(baseyear), Number(basemonth)-1, Number(baseday), 0, 0, 0);
    }

    var new_year = Number(newdate.getFullYear())+Number(years);
    var new_month = Number(newdate.getMonth())+Number(months);
    var new_day = Number(newdate.getDate())+Number(days);

    var output_date = new Date(new_year, new_month, new_day, 0, 0, 0);

    var result = (output_date.getFullYear()*10000) + ((output_date.getMonth()+1)*100) + (output_date.getDate());

    if(template === ""){
        return result;
    } else {
        return $tw.utils.formatDateString(output_date,template);
    }
};

})();