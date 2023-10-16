// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define(["../../lib/codemirror"], mod);
	else // Plain browser env
		mod(CodeMirror);
})(function (CodeMirror) {
	"use strict";

	CodeMirror.registerHelper('hint', 'anyword', function (editor) {
		var cur = editor.getCursor();
		var curLine = editor.getLine(cur.line);
		var start = cur.ch;
		var end = start;
		var max_length = 30
		while (start) {
			if (end - start > max_length) {
				return null;
			}
			var ch = curLine.charAt(start - 1)
			if (!(ch == '[' || ch == '{' || ch == "|")) {
				start--;
			} else {
				break;
			}
		}
		var curWord = start !== end && curLine.slice(start, end);
		if (curLine.charAt(start) == '$') {
			return {
				list: $tw.wiki.filterTiddlers(`[all[tiddlers]search:title:literal[${curWord}]!prefix[$:/state]]`),
				from: CodeMirror.Pos(cur.line, start),
				to: CodeMirror.Pos(cur.line, end)
			}
		} else {
			return {
				list: $tw.wiki.filterTiddlers(`[all[tiddlers]!is[system]!is[shadow]search:title:literal[${curWord}]!prefix[$:/state]]`),
				from: CodeMirror.Pos(cur.line, start),
				to: CodeMirror.Pos(cur.line, end)
			}
		}
	})
});