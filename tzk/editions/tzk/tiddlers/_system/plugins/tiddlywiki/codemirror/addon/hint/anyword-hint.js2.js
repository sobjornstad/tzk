// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

CodeMirror.registerHelper('hint', 'anyword', function(editor) {
    var cur = editor.getCursor();
    var curLine = editor.getLine(cur.line);
    var start = cur.ch;
    var end = start;
    var tiddlers = $tw.wiki.filterTiddlers("[all[tiddlers]!is[system]]");
    while (end < curLine.length && /[\w$]/.test(curLine.charAt(end))) ++end;
    while (start && /[\w$]/.test(curLine.charAt(start - 1))) --start;
    var curWord = start !== end && curLine.slice(start, end);
    var regex = new RegExp('^' + curWord, 'i');
    return {
        list: (!curWord ? [] : tiddlers.filter(function(item) {
            return item.match(regex);
        })).sort(),
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, end)
    }
})
});