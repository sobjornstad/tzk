import subprocess
from typing import Sequence

def exec(*args: Sequence[str]):
    return subprocess.call(["git", *args])
