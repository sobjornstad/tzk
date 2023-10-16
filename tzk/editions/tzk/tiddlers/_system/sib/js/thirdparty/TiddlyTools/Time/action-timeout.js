/*\
title: action-timeout.js
type: application/javascript
module-type: widget
author: Eric Shulman elsdesign@gmail.com
revision: 1.4

$action-timeout invokes actions once after a specified delay, or repeatedly at a specified interval

\*/

(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;
var TimeoutWidget= function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};
TimeoutWidget.prototype = new Widget();
TimeoutWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};
TimeoutWidget.prototype.execute = function() {
	this.delay     = this.getAttribute("delay",   "1000");
	this.interval  = this.getAttribute("interval","1000");
	this.actions   = this.getAttribute("actions",     "");
};
TimeoutWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0) { this.refreshSelf(); return true; }
	return this.refreshChildren(changedTiddlers);
};
TimeoutWidget.prototype.allowActionPropagation = function() { return false; };
TimeoutWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self=this;
	if (self.delay)    setTimeout( function() { self.invokeActionString(self.actions,self,event); }, self.delay);
	if (self.interval) setInterval(function() { self.invokeActionString(self.actions,self,event); }, self.interval);
	return true; // Action was invoked
};
exports["action-timeout"] = TimeoutWidget;
})();