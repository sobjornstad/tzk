/*\
title: $:/sib/js/excise-private-chunk.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to excise the selection to a new private-chunk tiddler.

SIB 2021-05-21: Copied from the standard excise operation and modified as needed.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["excisePrivateChunk"] = function(event, operation) {
	var editTiddler = this.wiki.getTiddler(this.editTitle),
		editTiddlerTitle = this.editTitle;
	if(editTiddler && editTiddler.fields["draft.of"]) {
		editTiddlerTitle = editTiddler.fields["draft.of"];
	}
	var excisionTitle = this.wiki.generateNewTitle(editTiddlerTitle + "/p");
	this.wiki.addTiddler(new $tw.Tiddler(
		this.wiki.getCreationFields(),
		this.wiki.getModificationFields(),
		{
			title: excisionTitle,
			text: operation.selection,
			tags: "PrivateChunk"
		}
	));
	operation.replacement = "{{" + excisionTitle + "||PrivateChunk}}";
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};

})();