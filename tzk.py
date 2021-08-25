from abc import ABC, abstractmethod, abstractclassmethod
import argparse


class CliCommand(ABC):
    @abstractclassmethod
    def setup_arguments(self, parser):
        raise NotImplementedError

    @abstractmethod
    def execute(self, parser):
        raise NotImplementedError


class CommitCommand(CliCommand):
    cmd = "commit"
    help = "Do a commit"

    @classmethod
    def setup_arguments(self, parser):
        pass

    def execute(self, args):
        print(f"We have committed!")


parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()
for command in CliCommand.__subclasses__():
    subparser = subparsers.add_parser(command.cmd, help=command.help)
    subparser.set_defaults(_cls=command)
    command.setup_arguments(subparser)

args = parser.parse_args()
args._cls().execute(args)
