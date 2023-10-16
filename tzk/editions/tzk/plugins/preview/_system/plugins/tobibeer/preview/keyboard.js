/*\
title: $:/plugins/tobibeer/preview/keyboard.js
type: application/javascript
module-type: utils

Fixes $:/core/modules/utils/dom/keyboard.js by providing an alternative.
Do not use as an API, let's fix the core.

@preserve
\*/
(function(){"use strict";var e={BACKSPACE:8,TAB:9,ENTER:13,ESCAPE:27,PAGEUP:33,PAGEDOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,INSERT:45,DELETE:46};exports.parseKeyDescriptorTB=function(t){var l,r,y,s=t.toUpperCase().split("+"),K={keyCode:null,shiftKey:false,altKey:false,ctrlKey:false};for(y=0;y<s.length;y++){l=false;r=s[y];if(r.substr(0,1)==="!"){l=true;r=r.substr(1)}if(r==="CTRL"){K.ctrlKey=l?null:true}else if(r==="SHIFT"){K.shiftKey=l?null:true}else if(r==="ALT"){K.altKey=l?null:true}else if(r==="META"){K.metaKey=l?null:true}else if(e[r]){K.keyCode=e[r]}else{K.keyCode=r.charCodeAt(0)}}return K};exports.checkKeyDescriptorTB=function(e,t){var l=!!t.metaKey;return(t.keyCode===null||e.keyCode===t.keyCode)&&(t.shiftKey===null?!e.shiftKey:e.shiftKey===t.shiftKey)&&(t.altKey===null?!e.altKey:e.altKey===t.altKey)&&(t.ctrlKey===null?!e.ctrlKey:e.ctrlKey===t.ctrlKey)&&(t.metaKey===null?!e.metaKey:e.metaKey===l)}})();