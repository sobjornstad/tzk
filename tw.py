import subprocess
from typing import Sequence


def exec(args: Sequence[Sequence[str]]) -> None:
    bin_dir = subprocess.check_output(("npm", "bin"), text=True).strip()
    call_args = [bin_dir + "/tiddlywiki"]
    for tw_arg in args:
        call_args.append(f"--{tw_arg[0]}")
        for inner_arg in tw_arg[1:]:
            call_args.append(inner_arg)
    return subprocess.call(call_args)