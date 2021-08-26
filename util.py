import sys
from typing import NoReturn


class BuildError(Exception):
    pass


def fail(msg: str, exit_code: int = 1) -> NoReturn:
    print(msg, file=sys.stderr)
    sys.exit(exit_code)
