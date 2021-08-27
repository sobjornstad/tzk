import functools
import json
import os
from pathlib import Path
import subprocess
from textwrap import dedent
from typing import Optional, Sequence

from tzk import config
from tzk import git
from tzk.util import pushd


@functools.lru_cache(1)
def _npm_bin() -> str:
    return subprocess.check_output(("npm", "bin"), text=True).strip()

def _tw_path() -> str:
    return _npm_bin() + "/tiddlywiki"

@functools.lru_cache(1)
def _whoami() -> str:
    try:
        return subprocess.check_output(("whoami",), text=True).strip()
    except subprocess.CalledProcessError:
        return "user"


def exec(args: Sequence[Sequence[str]], base_wiki_folder: str = None) -> int:
    call_args = [_tw_path()]
    if base_wiki_folder is not None:
        call_args.append(base_wiki_folder)
    for tw_arg in args:
        call_args.append(f"--{tw_arg[0]}")
        for inner_arg in tw_arg[1:]:
            call_args.append(inner_arg)
    return subprocess.call(call_args)


def _init_npm(wiki_name: str, tw_version_spec: str, author: str) -> None:
    """
    Create a package.json file for this repository, requiring TiddlyWiki
    at the specified version, and install the npm dependencies.
    """
    print("tzk: Creating package.json...")
    PACKAGE_JSON = dedent("""
    {
        "name": "%(wiki_name)s",
        "version": "1.0.0",
        "description": "My nice notes",
        "dependencies": {
            "tiddlywiki": "%(tw_version_spec)s"
        },
        "author": "%(author)s",
        "license": "See copyright notice in wiki"
    }
    """).strip() % ({'tw_version_spec': tw_version_spec, 'author': author,
                     'wiki_name': wiki_name})
    with open("package.json", "w") as f:
        f.write(PACKAGE_JSON)

    print("tzk: Installing npm packages from package.json...")
    subprocess.check_call(("npm", "install"))


def _init_tw(wiki_name: str) -> None:
    """
    Create a new TiddlyWiki in the subfolder named 'wiki_name'
    using 'tiddlywiki --init'.
    """
    print("tzk: Creating new TiddlyWiki...")
    try:
        os.mkdir(wiki_name)
    except FileExistsError:
        pass
    with pushd(wiki_name):
        subprocess.check_call((_tw_path(), "--init"))


def _save_wikifolder_to_config(wiki_name: str) -> bool:
    """
    Set the wiki_folder config option to the wiki_name we initialized with,
    if it's not already set in the config.

    Return True if the option ended set to wiki_name, False otherwise.
    """
    print("tzk: Writing new wiki folder to config file...")
    if not config.cm().write_attr("wiki_folder", wiki_name):
        if config.cm().wiki_folder == wiki_name:
            print("tzk: (Looks like it was already there.)")
        else:
            print(f"tzk: WARNING: The wiki_folder option in your config appears "
                  f"to be set to '{config.cm().wiki_folder}', rather than the wiki folder "
                  f"you're initializing, {wiki_name}. Please check your config file "
                  "and update this option if necessary.")
            return False
    return True


def _add_filesystem_plugins(wiki_name: str) -> None:
    print("tzk: Adding filesystem plugins to tiddlywiki.info...")
    info_path = Path.cwd() / wiki_name / "tiddlywiki.info"
    with info_path.open("r") as f:
        info_data = json.load(f)
    info_data['plugins'] = ["tiddlywiki/filesystem", "tiddlywiki/tiddlyweb"]
    with info_path.open("w") as f:
        json.dump(info_data, f)


def _init_gitignore() -> None:
    print("tzk: Creating gitignore...")
    GITIGNORE = dedent("""
    __pycache__/
    node_modules/
    .peru/
    output/

    \$__StoryList.tid
    """).strip()
    with open(".gitignore", "w") as f:
        f.write(GITIGNORE)


def _initial_commit() -> None:
    print("tzk: Initializing new Git repository for wiki...")
    git.exec("init")

    print("tzk: Committing changes to repository...")
    git.exec("add", "-A")
    git.exec("commit", "-m", "Initial commit")


def install(wiki_name: str, tw_version_spec: str, author: Optional[str]):
    # assert: caller has checked npm and git are installed
    warnings = False

    if author is None:
        author = _whoami()

    _init_npm(wiki_name, tw_version_spec, author)
    _init_tw(wiki_name)
    warnings |= not _save_wikifolder_to_config(wiki_name)
    _add_filesystem_plugins(wiki_name)
    _init_gitignore()
    _initial_commit()

    if warnings:
        print("tzk: Initialization completed with warnings. Read the output and "
              "make any changes required, then run 'tzk listen' to start the server.")
    else:
        print("tzk: Initialized successfully. Run 'tzk listen' to start the server.")
