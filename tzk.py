from abc import ABC, abstractmethod, abstractclassmethod
import argparse
import os

import git


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
            "-m, --message",
            metavar="MSG",
            help="Commit message to use.",
            default="daily checkpoint")

    def execute(self, args: argparse.Namespace) -> None:
        os.chdir("zk-wiki")
        git.exec("add", "-A")
        git.exec("commit", "-m", args.message)
        git.exec("push", "backup")


parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()
for command in CliCommand.__subclasses__():
    subparser = subparsers.add_parser(command.cmd, help=command.help)
    subparser.set_defaults(_cls=command)
    command.setup_arguments(subparser)

args = parser.parse_args()
print(type(args))
9/0
args._cls().execute(args)
