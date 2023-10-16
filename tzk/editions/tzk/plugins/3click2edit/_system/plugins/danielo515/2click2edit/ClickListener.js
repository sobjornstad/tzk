/*\
title: $:/plugins/danielo515/2click2edit/ClickListener.js
type: application/javascript
module-type: widget

This widgets adds an double click event listener to its parent

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ClickListener = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ClickListener.prototype = new Widget();

/*
Render this widget into the DOM
*/
ClickListener.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.execute();
	var self = this;
    /*Since the event listener have been added to the parent, the "this" property is pointing to the
    wrong object, we should call our edit function with our widget object set as the this property.*/
    /* https://stackoverflow.com/questions/6480060/how-do-i-listen-for-triple-clicks-in-javascript */
    parent.addEventListener("click", function (event) {
        if (event.detail === 3) {
            self.editTiddler.call(self, event);
        }
    });
};

ClickListener.prototype.editTiddler = function(event) {
    this.dispatchEvent({type: "tm-edit-tiddler", param: this.getVariable("currentTiddler")});
};

/*
Compute the internal state of the widget
*/
ClickListener.prototype.execute = function() {
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ClickListener.prototype.refresh = function(changedTiddlers) {
	return false;
};

exports.click = ClickListener;

})();
