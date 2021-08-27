from contextlib import contextmanager
import os
import sys
from typing import NoReturn


class BuildError(Exception):
    pass


def fail(msg: str, exit_code: int = 1) -> NoReturn:
    print(msg, file=sys.stderr)
    sys.exit(exit_code)


def numerize(number: int, singular: str, plural: str = None):
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
