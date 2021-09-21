/*\
title: $:/plugins/kixam/datepicker/widget.datepicker.js
type: application/javascript
module-type: widget

  A widget for displaying date pickers using Pikaday at https://github.com/owenmead/Pikaday

  For full help see $:/plugins/kixam/datepicker/usage

  TODO: use HTML5 "date" (and not "datetime-local") input types if available
  TODO: set field type/flag to "date" to make TW5 render {{!!ourField}} as expected, i.e. like it renders e.g. {{!!created}}
  TODO: use our widget for system date fields (created, modified, ...)
\*/

/*jslint node: true, browser: true */
/*global $tw: false */

(function() {
  'use strict';

  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var moment = require("$:/plugins/kixam/moment/moment.js");
  var pikaday = require("$:/plugins/kixam/datepicker/pikaday.js"); // this is a modified version of pikaday.js, see build.sh
  var image = require("$:/core/modules/widgets/image.js").image;

  var DatePickerWidget = function(parseTreeNode, options) {
    Widget.call(this);
    this.initialise(parseTreeNode, options);
    this.options = options;
  };

  DatePickerWidget.prototype = new Widget();

  DatePickerWidget.prototype.render = function(parent,nextSibling) {
    this.computeAttributes();
    this.renderChildren(parent,nextSibling);
    this.execute();
    this.parentDomNode = parent;

    // set HTML tag
    if(!this.editTag || $tw.config.htmlUnsafeElements.indexOf(this.editTag) !== -1) {
      this.editTag = "input";
    }

    // set HTML item attributes
    if(this.editAttributesTiddlerName) {
      this.editAttributes = $tw.wiki.getTiddlerData(this.editAttributesTiddlerName, {});
    }

    // create HTML item
    this.editor = $tw.utils.domMaker(this.editTag, {attributes: this.editAttributes});

    if(this.editPlaceholder) {
      this.editor.setAttribute("placeholder",this.editPlaceholder);
    }

    if(this.editClass) {
      this.editor.setAttribute("class",this.editClass);
    }

    // render HTML item
    parent.insertBefore(this.editor, nextSibling);
    this.domNodes.push(this.editor);

    // render icon
    if(this.iconPath) {
      var tiddler = this.wiki.getTiddler(this.iconPath);
      if(tiddler && tiddler.hasTag("$:/tags/Image")) {
        // this is a system icon tiddler: just transclude the tiddler
        this.icon = $tw.utils.domMaker("span", {innerHTML: tiddler.fields.text});
        parent.insertBefore(this.icon, this.editor);
        this.domNodes.push(this.icon);
      } else {
        // this is something else: render it using <$image> widget
        var ptn = this.parseTreeNode;
        ptn.attributes = {source: {name: "source", type: "string", value: this.iconPath} };
        this.icon = new image(ptn, this.options);
        this.icon.render(this.parentDomNode, this.editor);
      }
    }

    this.onPickerDateSelect = this.onPickerDateSelect.bind(this);

    var langprefix = "$:/languages/".length,
        lang = $tw.wiki.getTiddlerText("$:/language").substring(langprefix, langprefix + 2);
    if(lang === "zh") {
      // TW5 does not use standard codes for Chinese
      var suffix = $tw.wiki.getTiddlerText("$:/language");
      suffix = suffix.substring(suffix.length-1);
      if(suffix === "s") {
        lang = "zh-cn"; //simplified
      } else {
        lang = "zh-tw"; //traditional
      }
    }

    var locale = moment.localeData(moment.locale([lang, "en"])),
        i18n = {
          previousMonth : "Previous Month",
          nextMonth     : "Next Month",
          months        : locale._months,
          monthsShort   : locale._monthsShort,
          weekdays      : locale._weekdays,
          weekdaysShort : locale._weekdaysShort,
        };

    this.picker = new pikaday({
      field: this.editor,
      trigger: this.icon || this.editor,
      format: this.editFormat,
      firstDay: this.firstDay,
      onSelect: this.onPickerDateSelect,
      showTime: this.showTime,
      showSeconds: this.showSeconds,
      use24hour: this.use24hour,
      i18n: i18n,
    });

    this.refreshSelf();
  };

  DatePickerWidget.prototype.execute = function() {
    // Get our parameters
    this.showTime = this.getAttribute("showTime");
    this.showSeconds = this.getAttribute("showSeconds");
    this.use24hour = this.getAttribute("use24hour");

    var defaultFormat = "YYYY-MM-DD";
    if(this.showTime) {
      if(this.use24hour) defaultFormat += " HH";
      else defaultFormat += " hh";
      defaultFormat += ":mm";
      if(this.showSeconds) defaultFormat += ":ss";
    }
    this.editFormat = this.getAttribute("format", defaultFormat);
    this.firstDay = parseInt(this.getAttribute("firstDay", "0"));
    this.saveFormat = this.getAttribute("fieldFormat", "YYYYMMDDHHmmssSSS");
    this.editTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    this.editField = this.getAttribute("field","created");
    this.editIndex = this.getAttribute("index");
    this.editClass = this.getAttribute("class");
    this.editPlaceholder = this.getAttribute("placeholder");
    this.editTag = this.getAttribute("tag");
    this.editAttributesTiddlerName = this.getAttribute("attributes");
    this.iconPath = this.getAttribute("icon");
  };

  // Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
  DatePickerWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    // Refresh if an attribute has changed, or the type associated with the target tiddler has changed
    if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || changedTiddlers[this.editTitle]) {
      this.refreshSelf();
      return true;
    } else {
      return this.refreshChildren(changedTiddlers);
    }
  };

  DatePickerWidget.prototype.refreshSelf = function() {
    var val = moment.utc(this.getEditInfo().value, this.saveFormat);
    if(val.isValid()) {
      this.editor.value = val.format(this.editFormat);
      this.picker.setMoment(val, true);
    }
  }

  DatePickerWidget.prototype.onPickerDateSelect = function() {
    var val = this.picker.getMoment();
    if(this.showTime) val = val.utc();
    this.saveChanges(val.format(this.saveFormat));
    $tw.rootWidget.dispatchEvent({type: "tm-auto-save-wiki"});
  };

// ---------------------------------------------------------- //
// --- inspired from $:/core/modules/widgets/edit-text.js --- //
// ---------------------------------------------------------- //

  DatePickerWidget.prototype.saveChanges = function(text) {
    var editInfo = this.getEditInfo();
    if(text !== editInfo.value) {
        editInfo.update(text);
    }
  };

  DatePickerWidget.prototype.getEditInfo = function() {
    // Get the edit value
    var self = this,
        value,
        update;
    if(this.editIndex) {
        value = this.wiki.extractTiddlerDataItem(this.editTitle,this.editIndex,this.editDefault);
        update = function(value) {
            var data = self.wiki.getTiddlerData(self.editTitle,{});
            if(data[self.editIndex] !== value) {
                data[self.editIndex] = value;
                self.wiki.setTiddlerData(self.editTitle,data);
            }
        };
    } else {
        // Get the current tiddler and the field name
        var tiddler = this.wiki.getTiddler(this.editTitle);
        if(tiddler) {
            // If we've got a tiddler, the value to display is the field string value
            value = tiddler.getFieldString(this.editField);
        } else {
            // Otherwise, we need to construct a default value for the editor
            switch(this.editField) {
                case "text":
                    value = "Type the text for the tiddler '" + this.editTitle + "'";
                    break;
                case "title":
                    value = this.editTitle;
                    break;
                default:
                    value = "";
                    break;
            }
            if(this.editDefault !== undefined) {
                value = this.editDefault;
            }
        }
        update = function(value) {
            var tiddler = self.wiki.getTiddler(self.editTitle),
                updateFields = {
                    title: self.editTitle
                };
            updateFields[self.editField] = value;
            self.wiki.addTiddler(new $tw.Tiddler(self.wiki.getCreationFields(),tiddler,updateFields,self.wiki.getModificationFields()));
        };
    }
    return {value: value, update: update};
  };

// ---------------------------------------------------------- //
// ---------------------------------------------------------- //
// ---------------------------------------------------------- //

  exports["edit-date"] = DatePickerWidget;
}
());
