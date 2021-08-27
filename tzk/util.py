"""
util.py - miscellaneous utility functions
"""
from contextlib import contextmanager
import os
import shutil
import sys
from typing import NoReturn


class BuildError(Exception):
    pass


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