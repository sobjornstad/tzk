/*\
title: action-sendfeedback
type: application/javascript
module-type: widget
Action widget to call an API.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

let ENDPOINT = "https://351uof5dxh.execute-api.us-east-1.amazonaws.com/default/startZettelkastenConversation";

function gfv(id) {
		return document.getElementById(id).value
}

function sendRequest(url, params, callback) {
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.responseType = 'json';
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		xhr.onload = () => {
				let status = xhr.status;
				if (status == 200) {
						console.log(xhr.response);
						if (xhr.response["status"] == "success") {
								callback(null, xhr.response);
						} else {
								callback(status, xhr.response);
						}
				} else {
						callback(status, xhr.response);
				}
		};

		// Turn the data object into an array of URL-encoded key/value pairs.
		// https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
		let urlEncodedDataPairs = [], name;
		for (name in params) {
				urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
		}
		xhr.send(urlEncodedDataPairs.join('&'))
};

function submitFeedback(tiddler, email, comment) {
		var params = new Object();
		params.tiddler = tiddler
		params.email = email
		params.comment = comment

		sendRequest(ENDPOINT, params, (err, data) => {
				if (err != null) {
						alert("Error sending mail: " + data.reason);
						return false;
				} else {
						alert("Thanks for getting in touch! You'll receive a copy of your message and I will write back to you when I am able.");
						return true;
				}
		});
}


var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FeedbackWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
FeedbackWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
FeedbackWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
FeedbackWidget.prototype.execute = function() {
	this.tiddlerName = this.getAttribute("tiddler");
	this.email = this.getAttribute("email");
	this.comment = this.getAttribute("comment");
	this.debuginfo = this.getAttribute("debuginfo");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
FeedbackWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["name"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
FeedbackWidget.prototype.invokeAction = function(triggeringWidget,event) {
	return submitFeedback(this.tiddlerName, this.email, this.comment);
};

exports["action-sendfeedback"] = FeedbackWidget;

})();