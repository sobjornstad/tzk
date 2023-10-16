/*\
title: $:/core/modules/editor-operations/text/replace-selection.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to replace the selection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["fancyquotes"] = function(event,operation) {
var listtext=operation.selection;

// ellipsis
  listtext= listtext.replace(/\.\.\./gm,'…');
// opening quotes
  listtext= listtext.replace(/([\\n \(\t])\"/gm,'$1“');
  listtext= listtext.replace(/([\\n \(\t])\'/gm,'$1‘');
//substitute prime and double prime if following numbers
  listtext= listtext.replace(/([0-9])'/gm,'$1′');
  listtext= listtext.replace(/([0-9])"/gm,'$1″');
//rearrange ". to ."
// remove this one because it is only Americans who insist on this.
//  listtext= listtext.replace(/"([.!?])/gm,'$1”');
// closing quote
  listtext= listtext.replace(/([?!.,])"([\n \t\)])/gm,'$1”$2');
  listtext= listtext.replace(/"([!?., ][\n \t\)])/gm,'”$1');
  listtext= listtext.replace(/'([\n \t])/gm,'’$1');
  listtext= listtext.replace(/'([!?.])/gm,'’$1');
//apostrophes
  listtext= listtext.replace(/([a-zA-Z])'([a-zA-Z])/gm,'$1’$2');
//convert post sentence double space to single
  listtext= listtext.replace(/([\.?!] ) /gm,'$1');
//convert x to × when between numbers
// SIB: this broke URLs for me
//  listtext= listtext.replace(/([0-9])x([0-9])/gm,'$1×$2');
//convert superscript small o to °
  listtext= listtext.replace(/\^\^o\^\^/gm,'°');
//convert ens and ems
//  listtext= listtext.replace(/--/gm,'–');
//  listtext= listtext.replace(/---/gm,'—');


operation.replacement=listtext;
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};

})();
