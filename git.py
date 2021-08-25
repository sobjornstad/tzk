import subprocess
from typing import Sequence

def exec(*args: Sequence[str]):
    return subprocess.call(["git", *args])

def read(*args: Sequence[str]):
    return subprocess.check_output(["git", *args], text=True).strip()