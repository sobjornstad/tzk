from abc import ABC, abstractmethod, abstractclassmethod
import argparse
import os

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
            default="daily checkpoint"
        )
        parser.add_argument(
            "-l", "--local",
            help="Don't push the results to any configured remote repository.",
            action="store_true"
        )

    def execute(self, args: argparse.Namespace) -> None:
        git.exec("add", "-A")
        git.exec("commit", "-m", args.message)
        if not args.local:
            git.exec("push", "backup")


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
