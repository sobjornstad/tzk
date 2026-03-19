/*\
title: $:/plugins/hoelzro/progress-bar/progress-bar.js
type: application/javascript
module-type: widget

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require('$:/core/modules/widgets/widget.js').widget;

var ProgressBarWidget = function ProgressBarWidget(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

ProgressBarWidget.prototype = new Widget();

ProgressBarWidget.prototype.render = function render(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    var node = this.document.createElement('div');
    node.style.border = 'thin solid black';
    var filledIn = this.document.createElement('div');
    filledIn.style.height = '10px';
    filledIn.style.backgroundColor = 'green';
    filledIn.style.width = Math.round(100 * this.current / this.total) + '%';
    node.appendChild(filledIn);
    parent.insertBefore(node, nextSibling);
    this.renderChildren(node, null);
    this.domNodes.push(node);
};

ProgressBarWidget.prototype.execute = function execute() {
    this.current = this.getAttribute('current');
    this.total = this.getAttribute('total');
    this.makeChildWidgets();
};

ProgressBarWidget.prototype.refresh = function refresh(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.current || changedAttributes.total) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports['hoelzro-progressbar'] = ProgressBarWidget;

})();
