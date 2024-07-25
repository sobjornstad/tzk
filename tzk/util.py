"""
util.py - miscellaneous utility functions
"""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import shutil
import sys
from typing import Any, Callable, Dict, NoReturn


TZK_VERSION = "0.5.0"


class BuildError(Exception):
    pass


def alter_tiddlywiki_info(
        info_path: Path,
        edit_func: Callable[[Dict[str, Any]], Dict[str, Any]]) -> None:
    "Change a tiddlywiki.info (or other json file) in an arbitrary manner."
    with info_path.open("r") as f:
        tinfo = json.load(f)
    tinfo = edit_func(tinfo)
    with info_path.open("w") as f:
        json.dump(tinfo, f, indent=2)


def fail(msg: str, exit_code: int = 1) -> NoReturn:
    "Print message to stderr and quit with exit code 1."
    print(msg, file=sys.stderr)
    sys.exit(exit_code)


def numerize(number: int, singular: str, plural: str = None) -> str:
    "Render a string in the singular or plural as appropriate."
    if plural is None:
        plural = singular + 's'

    if number == 1:
        return singular
    else:
        return plural


@contextmanager
def pushd(directory: str):
    """
    Change directory into the directory /directory/ until the end of the with-block,
    then return to previous directory.
    """
    old_directory = os.getcwd()
    try:
        os.chdir(directory)
        yield
    finally:
        os.chdir(old_directory)


def require_dependencies() -> None:
    """
    Raise an exception if dependencies of tzk aren't available.
    """
    if shutil.which("npm") is None:
        fail("npm is not available. "
                "Please install NPM and make it available on your PATH.\n"
                "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm")

    if shutil.which("git") is None:
        fail("Git is not available. "
                "Please install Git and make it available on your PATH.\n"
                "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")


def split_tiddler_list(s: str):
    """
    Split a tiddler list string into a Python list of undecorated tiddler names.
    A tiddler list is a series of tiddler names separated by spaces.  If a
    tiddler name contains spaces itself, it is placed in [[double square
    brackets]].

    >>> split_tiddler_list("")
    []

    >>> split_tiddler_list("foo")
    ['foo']

    >>> split_tiddler_list("foo bar")
    ['foo', 'bar']

    >>> split_tiddler_list("foo [[bar]] [[baz]]")
    ['foo', 'bar', 'baz']

    >>> split_tiddler_list("foo bar [[baz qux]]")
    ['foo', 'bar', 'baz qux']
    """
    result = []
    current_tiddler = []
    in_brackets = False
    i = 0

    while i < len(s):
        if s[i:i+2] == '[[':
            in_brackets = True
            i += 2  # Skip the opening brackets
            continue
        elif s[i:i+2] == ']]' and in_brackets:
            in_brackets = False
            i += 2  # Skip the closing brackets
            result.append(''.join(current_tiddler).strip())
            current_tiddler = []
            continue

        if in_brackets:
            current_tiddler.append(s[i])
        else:
            if s[i] == ' ':
                if current_tiddler:
                    result.append(''.join(current_tiddler).strip())
                    current_tiddler = []
            else:
                current_tiddler.append(s[i])

        i += 1

    if current_tiddler:
        result.append(''.join(current_tiddler).strip())

    return result
