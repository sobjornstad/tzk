/*\
title: $:/plugins/telmiger/details/details.js
type: application/javascript
module-type: widget

Details widget v 0.8

Will output an HTML 5 <details> section including a <summary>

```
	<details>
		<summary>This sums it up</summary> 
		All the details follow here.
	</details>
```

|Parameter |Description |h
|summary |Optional text to display as summary. Wins over field (see below). |
|open |Optional initial state, set to "open" to show details on load. Defaults to "". |
|state |An optional TextReference containing the state. Wins over open. |
|field |Optionally, the summary is taken from the field with this name in a given tiddler. Defaults to "title". |
|tiddler |Optional title of a tiddler to watch, connected to field. Defaults to current tiddler. |
|class |Optional CSS classes to be assigned to the details tag. |


\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DetailsWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DetailsWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DetailsWidget.prototype.render = function(parent,nextSibling) {
	// Save the parent dom node
	this.parentDomNode = parent;
	// Compute attributes
	this.computeAttributes();
	// Execute logic
	this.execute();
	// Create elements
	this.detailsDomNode = this.document.createElement("details");
	if(this.detailsClass !== "") {
		// this.detailsClass += " ";
		// this.detailsClass += "tc-details";
		this.detailsDomNode.setAttribute("class",this.detailsClass);
	}
	if(this.detailsOpen == "open") {
		this.detailsDomNode.setAttribute("open","open");
	}
	if(this.detailsSummary !== "") {
		this.summaryDomNode = this.document.createElement("summary");
		// this.summaryDomNode.setAttribute("class","tc-summary");
		this.detailsDomNode.appendChild(this.summaryDomNode);
		this.summaryDomNode.appendChild(this.document.createTextNode(this.detailsSummary));
	}
// register an event listener
/* Maybe this can be reactivated later, see below.
	if(this.detailsStateTitle) {
		$tw.utils.addEventListeners(this.detailsDomNode,[
			{name: "toggle", handlerObject: this, handlerMethod: "handleToggleEvent"},
		]);
	}
*/
// As iOS mobile browsers lack support of toggle events on details 
// we emulate the toggle event using click
	if(this.detailsStateTitle && this.summaryDomNode) {
		$tw.utils.addEventListeners(this.summaryDomNode,[
			{name: "click", handlerObject: this, handlerMethod: "handleToggleEvent"},
		]);
	} else {
		if(this.detailsStateTitle) {
			$tw.utils.addEventListeners(this.detailsDomNode,[
				{name: "click", handlerObject: this, handlerMethod: "handleToggleEvent"},
			]);
		}
	}
	// Insert the details into the DOM and render any children
	this.parentDomNode.insertBefore(this.detailsDomNode,nextSibling);
	this.renderChildren(this.detailsDomNode,null);
	this.domNodes.push(this.detailsDomNode);
};

/*
Retrieve the value of the summary
*/
DetailsWidget.prototype.getSummary = function() {
	var summary = "";
	if(this.summaryTitle === "Tiddler not found" && this.summaryField === "") {
	// nothing defined: leave empty 
		summary = "";
	} else {
		// tiddler defined? use defined field or title
		if(this.myTiddler) {
			if(this.summaryField === "title" || this.summaryField === "") {
				summary = this.summaryTitle;
			} else {
				if(this.summaryField === "text") {
         		// getTiddlerText() triggers lazy loading of skinny tiddlers
					summary = this.wiki.getTiddlerText(this.summaryTitle);
				} else {
					summary = this.myTiddler.fields[this.summaryField];
				}
			}
		} else {
			if(this.summaryField !== "" && this.summaryField !== "text") {
				// try defined field in current tiddler
				var tiddler = this.wiki.getTiddler(this.getVariable("currentTiddler"));
				summary = tiddler.fields[this.summaryField];
			} else {
				summary = "";
			}
		}
	}
   return summary;
};

/*
Retrieve the value of the state text reference
*/
DetailsWidget.prototype.getStateFromReference = function() {
    var state = this.detailsStateTitle ? this.wiki.getTextReference(this.detailsStateTitle,"",this.getVariable("currentTiddler")) : "";
    return state;
};

/*
Check all open signals, state fields/tiddlers get priority
*/
DetailsWidget.prototype.getOpenState = function() {
	var result = "";
	if((this.detailsOpenDefault !== "" && this.detailsOpenDefault !== "no") 
	    || this.detailsState === "open") {
		result = "open";
	 } 
	if(this.detailsStateTitle !=="" && this.detailsState !== "open") {
		result = "";
	}
	return result;
};

/*
Update the state text reference after click event
*/
DetailsWidget.prototype.updateState = function(openState) {
	var fieldValue = "false";
	var currentTiddler = this.getVariable("currentTiddler");
    // get the title for the (existing/new) tiddler
	var tr = $tw.utils.parseTextReference(this.detailsStateTitle);
	var tidTitle = tr.title || currentTiddler;
    // is it an existing state tiddler?
	var isStateTiddler = (tr.title === this.detailsStateTitle);
	var hasStateTiddler = this.wiki.tiddlerExists(tr.title);
	var currentStateTiddler = (tr.title === currentTiddler);
	if(isStateTiddler || hasStateTiddler || (currentStateTiddler && tr.field !== "text")) { 
		// Set the state field (but never overwrite the current tiddler’s text field
		this.wiki.setText(tidTitle,tr.field,tr.index,openState);
	} else {
		if(!hasStateTiddler && tidTitle !== currentTiddler) {
			this.createTiddler(tidTitle);
			this.wiki.setText(tidTitle,tr.field,tr.index,openState);
		} else {
			console.log ("Something went wrong in updateState");
		}
	}
};

/*
Create a tiddler with a title only
*/
DetailsWidget.prototype.createTiddler = function(tidTitle) {
	this.wiki.addTiddler(new $tw.Tiddler(
		this.wiki.getCreationFields(),
		this.wiki.getModificationFields(),
		{
			title: tidTitle,
			tags: []
		}
	));
};

/*
Set openState according to click
*/
DetailsWidget.prototype.handleToggleEvent = function(event) {
	// check if an open attribute is present
	var newState = this.detailsDomNode.open ? "" : "open";
	// update only, if the node has a new state
	if(newState !== this.detailsState) {
		this.updateState(newState);
	}
};

/*
Compute the internal state of the widget
*/
DetailsWidget.prototype.execute = function() {
	// Get the parameters from the attributes 
	var tryTiddler = this.getAttribute("tiddler");
	this.myTiddler = this.wiki.getTiddler(tryTiddler);
	this.summaryTitle = this.myTiddler ? tryTiddler : "Tiddler not found";
	this.summaryField = this.getAttribute("field","");
	this.detailsSummary = this.getAttribute("summary") || this.getSummary();
	this.detailsStateTitle = this.getAttribute("state","");
	this.detailsState = this.getStateFromReference();
	this.detailsOpenDefault = this.getAttribute("open","");
	this.detailsOpen = this.getOpenState();
	this.detailsClass = this.getAttribute("class","");
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DetailsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.summary || changedAttributes.state || changedAttributes.open || changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	} else {
		var refreshed = false;
		var testState = this.getStateFromReference();
		if(testState !== this.detailsState) {
			// state change
			this.refreshSelf();
			refreshed = true;
		} 
		return this.refreshChildren(changedTiddlers) || refreshed;
	}
};

exports.details = DetailsWidget;

})();