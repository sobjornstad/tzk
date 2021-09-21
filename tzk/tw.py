import datetime
import functools
import json
import os
from pathlib import Path
import subprocess
from textwrap import dedent
from typing import Callable, Optional, Sequence

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
    "Try to guess the user's name."
    try:
        return subprocess.check_output(("whoami",), text=True).strip()
    except subprocess.CalledProcessError:
        return "user"


def exec(args: Sequence[Sequence[str]], base_wiki_folder: str = None) -> int:
    """
    Execute a series of TiddlyWiki commands.

    :param args: A list of lists of CLI commands to send to TiddlyWiki.
                 The first element of each list is a TiddlyWiki CLI command,
                 without the ``--``, e.g., ``savewikifolder``.
                 The following elements of the list are arguments to that command.
    :param base_wiki_folder: If the wiki to execute commands against is not the one
                             in the current directory, provide its path here.
                             The current directory is the source wiki's root directory
                             during the execution of builders,
                             unless explicitly changed.
    """
    # must pushd into base wiki to find the tiddlywiki node_modules
    if base_wiki_folder is not None:
        with pushd(base_wiki_folder):
            call_args = [_tw_path()]
    else:
        call_args = [_tw_path()]

    if base_wiki_folder is not None:
        call_args.append(base_wiki_folder)
    for tw_arg in args:
        call_args.append(f"--{tw_arg[0]}")
        for inner_arg in tw_arg[1:]:
            call_args.append(inner_arg)
    return subprocess.call(call_args)


def _init_tzk_config() -> None:
    print("tzk: Creating new tzk_config.py...")
    with open(Path(__file__).parent / "default_config.py") as f:
        default_config = f.read()

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    generation_details = f"Created automatically by 'tzk init' at {now}."
    default_config = default_config.replace('<<GENERATION_DETAILS>>',
                                            generation_details)

    with open("tzk_config.py", "w") as f:
        f.write(default_config)


def _init_npm(wiki_name: str, tw_version_spec: str, author: str) -> None:
    """
    Create a package.json file for this repository, requiring TiddlyWiki
    at the specified version, and install the npm dependencies.
    """
    print("tzk: Creating new package.json...")
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
        old_edition_path = os.environ.get('TIDDLYWIKI_EDITION_PATH')
        os.environ['TIDDLYWIKI_EDITION_PATH'] = str(Path(__file__).parent / "editions")
        try:
            subprocess.check_call((_tw_path(), "--init", "tzk"))
        finally:
            if old_edition_path:
                os.environ['TIDDLYWIKI_EDITION_PATH'] = old_edition_path


def _restore_plugins(wiki_name: str) -> None:
    """
    Add the two plugins required for client-server operation to the existing
    ones in the edition, sort them in order, and replace the existing plugins
    array in the tiddlywiki.info.
    """
    print("tzk: Configuring plugins in tiddlywiki.info...")

    info_path = Path.cwd() / wiki_name / "tiddlywiki.info"
    edition_path = Path(__file__).parent / "editions" / "tzk" / "tiddlywiki.info"

    with info_path.open("r") as f:
        info_data = json.load(f)
    with edition_path.open("r") as f:
        edition_data = json.load(f)

    plugins = {"tiddlywiki/filesystem", "tiddlywiki/tiddlyweb"}
    plugins = plugins.union(edition_data['plugins'])
    info_data['plugins'] = sorted(plugins)

    with info_path.open("w") as f:
        json.dump(info_data, f, indent=4)


def _init_gitignore() -> None:
    """
    Create a basic gitignore for the new wiki.
    """
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
    """
    Create a new Git repo and commit everything we've done so far.
    """
    print("tzk: Initializing new Git repository for wiki...")
    git.exec("init")

    print("tzk: Committing changes to repository...")
    git.exec("add", "-A")
    output = git.read("commit", "-m", "Initial commit")
    # Print just a summary since there are going to be a lot of files.
    print('\n'.join(output.split('\n')[0:2]))


def install(wiki_name: str, tw_version_spec: str, author: Optional[str],
            _tw_func: Optional[Callable[[str], None]] = None):
    """
    Install TiddlyWiki on Node.js in the current directory and set up a new wiki.

    If _tw_func is provided, call it to create the TiddlyWiki in the new tzk repository
    rather than the default routine. It receives one argument, the name of the new wiki.
    """
    # assert: caller has checked npm and git are installed

    if author is None:
        author = _whoami()

    _init_tzk_config()
    _init_npm(wiki_name, tw_version_spec, author)

    if _tw_func is not None:
        _tw_func(wiki_name)
    else:
        _init_tw(wiki_name)

    _restore_plugins(wiki_name)
    _init_gitignore()
    _initial_commit()

    print("tzk: Initialized successfully. "
          "Review the 'tzk_config.py' in a text editor and make any changes desired, "
          "then run 'tzk listen' to start the server.")
