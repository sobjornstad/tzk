import sys
from typing import NoReturn

def fail(msg: str, exit_code: int = 1) -> NoReturn:
    print(msg, file=sys.stderr)
    sys.exit(exit_code)

