from abc import ABC, abstractmethod, abstractclassmethod
import argparse
import os
import shutil
import sys
from typing import Optional

from config import cm
import git
import tw
from util import fail


class CliCommand(ABC):
    cmd = None   # type: str
    help = None  # type: str

    @abstractclassmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        raise NotImplementedError

    @abstractmethod
    def execute(self, parser: argparse.Namespace) -> None:
        raise NotImplementedError


class CommitCommand(CliCommand):
    cmd = "commit"
    help = "Commit all changes to the wiki repository."

    @classmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "-m", "--message",
            metavar="MSG",
            help="Commit message to use.",
            default=(cm.commit_message or "checkpoint")
        )
        parser.add_argument(
            "-r", "--remote",
            metavar="REMOTE",
            help="Name of the configured Git remote to push to.",
            default=(cm.commit_remote or "origin"),
        )
        parser.add_argument(
            "-l", "--local",
            help="Don't push the results to any configured remote repository.",
            action="store_true",
        )

    def execute(self, args: argparse.Namespace) -> None:
        if cm.commit_require_branch:
            current_branch = git.read("rev-parse", "--abbrev-ref", "HEAD")
            if current_branch != cm.commit_require_branch:
                fail(f"You are on the '{current_branch}' branch, "
                     f"but your TZK configuration requires you to be on the "
                     f"'{cm.commit_require_branch}' branch to commit.")

        git.exec("add", "-A")
        git.exec("commit", "-m", args.message)
        if not args.local:
            git.exec("push", args.remote)


class ListenCommand(CliCommand):
    cmd = "listen"
    help = "Start a TiddlyWiki server in the current directory."

    @classmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "-p", "--port",
            metavar="PORT",
            help="Port to listen on.",
            default=str(cm.listen_port or "8080"),
        )
        parser.add_argument(
            "--username",
            metavar="USERNAME",
            default=cm.listen_username or "",
            help="Username to use for basic authentication, if any.",
        )
        parser.add_argument(
            "--password",
            metavar="PASSWORD",
            default=cm.listen_password or "",
            help="Password to use for basic authentication, if any.",
        )
    
    def execute(self, args: argparse.Namespace) -> None:
        try:
            tw.exec(
                [
                    ("listen",
                    f"port={args.port}",
                    f"username={args.username}",
                    f"password={args.password}")
                ]
            )
        except KeyboardInterrupt:
            # We'll terminate anyway now that we're at the end of execute() --
            # no need to display the traceback to the user.
            pass


class InitCommand(CliCommand):
    cmd = "init"
    help = "Set up a new TZK directory."

    @classmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "-n", "--wiki-name",
            metavar="NAME",
            help="The wiki will be installed in a subfolder of the current directory, called NAME.",
            default="wiki",
        )
        parser.add_argument(
            "-v", "--tiddlywiki-version-spec",
            metavar="SPEC",
            help="NPM version spec for the version of TiddlyWiki to start your package.json at.",
            default="^5.1.23",
        )
        parser.add_argument(
            "-a", "--author",
            metavar="AUTHOR_NAME",
            help="The author to be credited in the package.json, if not your current username.",
            default=None,
        )

    def _precheck(self):
        if shutil.which("npm") is None:
            fail("TZK requires NPM. Please install NPM and make it available on your PATH.\n"
                 "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm")

        if shutil.which("git") is None:
            fail("TZK requires Git. Please install Git and make it available on your PATH.\n"
                 "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")

        if os.path.exists("package.json"):
            fail("A 'package.json' file already exists in the current directory. "
                 "Perhaps you've already initialized a TZK repository here?")

    def execute(self, args: argparse.Namespace) -> None:
        self._precheck()
        tw.install(args.wiki_name, args.tiddlywiki_version_spec, args.author)



parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()
for command in CliCommand.__subclasses__():
    subparser = subparsers.add_parser(command.cmd, help=command.help)
    subparser.set_defaults(_cls=command)
    command.setup_arguments(subparser)  # type: ignore

args = parser.parse_args()

# For all operations except 'init', we start in the wiki folder.
if not args._cls.cmd == "init":
    if not cm.wiki_folder:
        fail("No 'wiki_folder' option found in config. Set this option to the name "
            "of the wiki subfolder within the current directory.")

    try:
        os.chdir(cm.wiki_folder)
    except FileNotFoundError:
        fail(f"Tried to change directory into the wiki_folder '{cm.wiki_folder}' "
            f"specified in your config file, but that directory does not exist.")
    # TODO: confirm we're in the right directory

args._cls().execute(args)
