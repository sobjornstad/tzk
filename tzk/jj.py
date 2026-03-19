import subprocess
from typing import Optional, Sequence


def exec(*args: str) -> None:
    "Execute a jj command, raising CalledProcessError if the exit code is nonzero."
    subprocess.check_call(["jj", *args])


def rc(*args: str) -> int:
    "Execute a jj command, returning the exit code."
    return subprocess.call(["jj", *args])


def read(*args: str) -> str:
    "Execute a jj command, returning the output as a string."
    return subprocess.check_output(["jj", *args], text=True).strip()


def check_bookmark_is_ancestor(bookmark: str, rev: str = "@") -> Optional[str]:
    """
    Check that *bookmark* is an ancestor of *rev* via a clean, linear path.
    Obviously, non-linear history is fine, but it's not well-defined to automatically
    advance the bookmark in this case; the user needs to check and move it themselves
    before doing a `tzk commit` or branch-checked build.

    Specifically, verifies that:
    1. *bookmark* is an ancestor of *rev*.
    2. There are no merge commits in the range.
    3. No commit in the range has a child outside the range (i.e., no forks).

    Returns None on success, or an error message string on failure.
    """
    range_revset = f"{bookmark}..{rev}"

    # Is the bookmark an ancestor at all?
    result = read("log", "-r", f"ancestors({rev}) & {bookmark}",
                  "--no-graph", "-T", "commit_id")
    if not result:
        return (
            f"Cannot auto-advance bookmark '{bookmark}': "
            f"it is not an ancestor of the current change {rev}."
        )

    # Are there merge commits between the bookmark and rev?
    all_in_range = read(
        "log", "-r", range_revset,
        "--no-graph", "-T", "commit_id ++ '\\n'")
    non_merge_in_range = read(
        "log", "-r", f"({range_revset}) ~ merges()",
        "--no-graph", "-T", "commit_id ++ '\\n'")
    if all_in_range != non_merge_in_range:
        return (
            f"Cannot auto-advance bookmark '{bookmark}': "
            f"non-linear history detected between '{bookmark}' and {rev}. "
            f"Please verify this is intentional and manually advance the bookmark."
        )

    # Do any commits in the range have children outside the range?
    # Exclude @ since the working copy is always a child of @-.
    forks = read(
        "log", "-r", f"(children({range_revset}) ~ ({range_revset})) ~ @",
        "--no-graph", "-T", "commit_id ++ '\\n'")
    if forks:
        return (
            f"Cannot auto-advance bookmark '{bookmark}': "
            f"branches fork off from the path between '{bookmark}' and {rev}. "
            f"Please manually advance the bookmark to the branch you want to use."
        )

    return None
