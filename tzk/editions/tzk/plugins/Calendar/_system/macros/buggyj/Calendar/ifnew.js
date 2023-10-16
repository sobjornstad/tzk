/*\
title: $:/macros/buggyj/Calendar/ifnew.js
type: application/javascript
module-type: widget

Linkcatcher widget

ToDo - add message param to listen for other mssg and action to set other actions (link just create)
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var IfNewWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.addEventListeners([
		{type: "tm-navigate", handler: "handleNavigateEvent"}
	]);
};

/*
Inherit from the base widget class
*/
IfNewWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
IfNewWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
IfNewWidget.prototype.execute = function() {
	// Get our parameters
	this.fields = this.getAttribute("fields");
	this.catchMessage = this.getAttribute("message");
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
IfNewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.fields || changedAttributes.message ) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

/*
Handle a tm-navigate event
*/
IfNewWidget.prototype.handleNavigateEvent = function(event) {
	var tiddler = this.wiki.getTiddler(event.navigateTo),fds;
	if(tiddler) return true;
	try {
		fds=JSON.parse(this.fields);
	} catch(e) {
		fds={};
	}
	fds.title = event.navigateTo;
	if(this.parentWidget) {
		this.parentWidget.dispatchEvent({
			type: "tm-new-tiddler",
			param: fds
		});
	}
	return false;
};

exports.ifnew = IfNewWidget;

})();
