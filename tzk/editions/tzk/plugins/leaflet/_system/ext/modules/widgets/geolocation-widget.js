/*\
title: $:/ext/modules/wigets/geolocation-widget.js
type: application/javascript
module-type: widget

Geolocation widget

\*/
(function() {
    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var GeolocationWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    /* Inherit from the base widget class */
    GeolocationWidget.prototype = new Widget();

    /* Compute the internal state of the widget  */
    GeolocationWidget.prototype.execute = function() {
        // Get attributes
        this.target = this.getAttribute("target") || this.getVariable("currentTiddler");
        this.icon = this.getAttribute("icon") || "$:/core/images/globe";
        this.text = this.getAttribute("text") || undefined;
        this.accuracy = this.getAttribute("accuracy");
        this.type = this.getAttribute("type") || "point";
        // Make child widgets
        this.makeChildWidgets();
    };

    /* Render this widget into the DOM */
    GeolocationWidget.prototype.render = function(parent, nextSibling) {
        var self = this;
        // Remember parent
        this.parentDomNode = parent;
        // Compute attributes and execute state
        this.computeAttributes();
        this.execute();
        // Create element
        var tag = "button";
        if (this.buttonTag && $tw.config.htmlUnsafeElements.indexOf(this.buttonTag) === -1) {
            tag = this.buttonTag;
        }
        var domNode = this.document.createElement(tag);
        // Add a click event handler
        domNode.addEventListener("click", function(event) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    // success callback
                    function(position) {
                        /* to replace by field populating (point(s) polyline(s) or polygon(s)) */
                        /* default : if tiddler has point field, will create a points field to store new data;
        if tiddler has points field, will add a new point to the tiddler field;	*/
                        var target = self.target;
                        var accuracy = self.accuracy;
                        var type = self.type;
                        var newPoint = position.coords.latitude + "," + position.coords.longitude;
                        /* check if tiddler has a geofield */
                        var track = "";
                        if (!$tw.wiki.getTiddler(target)) $tw.wiki.setText(target, "text", null, "", null);
                        var flds = $tw.wiki.getTiddler(target).fields
                        if (flds.points) {
                            track = flds.points;
                            $tw.wiki.setText(target, "points", null, track + " " + newPoint, null);
                            infoLocation("new point " + newPoint + " added to " + target);

                        } else {
                            if (flds.point && flds.point !== null) {
                                track = flds.point;
                                $tw.wiki.setText(target, "points", null, track + " " + newPoint, null);
                                $tw.wiki.setText(target, "point", null, null, null);
                                infoLocation("new point " + newPoint + " added to " + target);
                            } else {
                                $tw.wiki.setText(target, "point", null, newPoint, null);
                                infoLocation("new point " + newPoint + " added to " + target);
                            }
                        }
                    },
                    // error callback
                    function(error) {
                        noLocation(error.message + ". You may not are connected via httpS://")
                    }
                );
            } else {
                noLocation("position disabled or not supported by your browser");
            }
        }, false);
        /* dress up button */
        var buttonContent;
        // if text parameter, will use it for the button
        if (self.text) {
            buttonContent = self.text;
        } else {
            // if not, looking for an icon
            /* !todo: ?question: should the icon depend on "type" parameter? */
            buttonContent = $tw.wiki.getTiddler(self.icon).fields.text;
        }
        domNode.innerHTML = buttonContent;
        // Insert element
        parent.insertBefore(domNode, nextSibling);
        this.renderChildren(domNode, null);
        this.domNodes.push(domNode);
    };

    function noLocation(message) {
        /* !todo: ?question: replace by "modal" alert? */
        // create or update a temporary message tiddler 
        $tw.wiki.setText("$:/temp/noLocationMessage", "text", null, "geolocation access denied: " + message, null);
        // displays it in modal
        $tw.modal.display("$:/temp/noLocationMessage");
    }

    function infoLocation(message) {
        // create or update a temporary message tiddler 
        $tw.wiki.setText("$:/temp/viewLocationMessage", "text", null, message, null);
        // displays it in modal
        $tw.notifier.display("$:/temp/viewLocationMessage");
    }
    /*
    We don't allow actions to propagate because we trigger actions ourselves
    */
    GeolocationWidget.prototype.allowActionPropagation = function() {
        return false;
    };

    exports.geoloc = GeolocationWidget;

})();