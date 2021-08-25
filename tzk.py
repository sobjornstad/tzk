from abc import ABC, abstractmethod, abstractclassmethod
import argparse
import os
import sys

import config
import git
import tw


class CliCommand(ABC):
    @abstractclassmethod
    def setup_arguments(self, parser: argparse.ArgumentParser) -> None:
        raise NotImplementedError

    @abstractmethod
    def execute(self, parser: argparse.ArgumentParser) -> None:
        raise NotImplementedError


class CommitCommand(CliCommand):
    cmd = "commit"
    help = "Commit all changes to the wiki repository."

    @classmethod
    def setup_arguments(self, parser: argparse.ArgumentParser) -> None:
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
                print(f"You are on the '{current_branch}' branch, "
                      f"but your TZK configuration requires you to be on the "
                      f"'{cm.commit_require_branch}' branch to commit.",
                      file=sys.stderr)
                sys.exit(1)

        git.exec("add", "-A")
        git.exec("commit", "-m", args.message)
        if not args.local:
            git.exec("push", args.remote)


class ListenCommand(CliCommand):
    cmd = "listen"
    help = "Start a TiddlyWiki server in the current directory."

    @classmethod
    def setup_arguments(self, parser: argparse.ArgumentParser) -> None:
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
        tw.exec(
            [
                ("listen",
                 f"port={args.port}",
                 f"username={args.username}",
                 f"password={args.password}")
            ]
        )


cm = config.ConfigurationManager()

os.chdir("zk-wiki")
# TODO: confirm we're in the right directory

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()
for command in CliCommand.__subclasses__():
    subparser = subparsers.add_parser(command.cmd, help=command.help)
    subparser.set_defaults(_cls=command)
    command.setup_arguments(subparser)

args = parser.parse_args()
args._cls().execute(args)
