import subprocess
from typing import Sequence


def exec(*args: str) -> None:
    "Execute a Git command, raising CalledProcessError if the exit code is nonzero."
    subprocess.check_call(["git", *args])


def rc(*args: str) -> int:
    "Execute a Git command, returning the exit code."
    return subprocess.call(["git", *args])


def read(*args: str) -> str:
    "Execute a Git command, returning the output as a string."
    return subprocess.check_output(["git", *args], text=True).strip()
