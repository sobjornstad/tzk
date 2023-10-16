/*\
title: $:/plugins/tobibeer/appear/popup.js
type: application/javascript
module-type: utils

An enhanced version of the core Popup to support:
* absolute popups
* preview popups
* popup z-index

@preserve
\*/
(function(){"use strict";var t=require("$:/core/modules/utils/dom/popup.js").Popup,e=require("$:/core/modules/widgets/reveal.js").reveal,s=e.prototype.refresh;t.prototype.show=function(t){var e,s=t.domNode,p=$tw.utils.hasClass(s,"tc-popup-absolute"),o=this.popupInfo(s),i=function(t){var e=t,s=0,p=0;do{s+=e.offsetLeft||0;p+=e.offsetTop||0;e=e.offsetParent}while(e);return{left:s,top:p}},l={left:s.offsetLeft,top:s.offsetTop};e=o.popupLevel;if(o.isHandle){e++}this.cancel(e);if(this.findPopup(t.title)===-1){this.popups.push({title:t.title,wiki:t.wiki,domNode:s})}l=p?i(s):l;t.wiki.setTextReference(t.title,"("+l.left+","+l.top+","+s.offsetWidth+","+s.offsetHeight+")");if(this.popups.length>0){this.rootElement.addEventListener("click",this,true)}};t.prototype.popupInfo=function(t){var e,s=false,p=t;while(p&&e===undefined){if($tw.utils.hasClass(p,"tc-popup-handle")||$tw.utils.hasClass(p,"tc-popup-keep")){s=true}if($tw.utils.hasClass(p,"tc-reveal")&&($tw.utils.hasClass(p,"tc-popup")||$tw.utils.hasClass(p,"tc-popup-handle"))){e=parseInt(p.style.zIndex)-1e3}p=p.parentNode}var o={popupLevel:e||0,isHandle:s};return o};t.prototype.handleEvent=function(t){if(t.type==="click"){var e=this.popupInfo(t.target),s=e.popupLevel-1;if(e.isHandle){if(s<0){s=1}else{s++}}this.cancel(s)}};e.prototype.refresh=function(){var t,e,p=this.isOpen;e=s.apply(this,arguments);t=this.domNodes[0];if(this.isOpen&&(p!==this.isOpen||!t.style.zIndex)&&t&&(this.type==="popup"||$tw.utils.hasClass(t,"tc-block-dropdown")&&$tw.utils.hasClass(t,"tc-reveal"))){t.style.zIndex=1e3+$tw.popup.popups.length}return e}})();