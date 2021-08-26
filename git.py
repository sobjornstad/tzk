import subprocess
from typing import Sequence

def exec(*args: str):
    return subprocess.check_call(["git", *args])

def read(*args: str):
    return subprocess.check_output(["git", *args], text=True).strip()
