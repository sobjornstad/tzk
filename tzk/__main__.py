from abc import ABC, abstractmethod, abstractclassmethod
import argparse
import os
import sys
import traceback
from typing import Optional

from tzk.config import cm
from tzk import git
from tzk import tw
from tzk.util import BuildError, fail, numerize, require_dependencies


class CliCommand(ABC):
    """
    Base class for subcommands of tzk.
    """
    #: The text of the subcommand to be used on the command line.
    cmd = None   # type: str
    #: Help string for argparse to display for this subcommand.
    help = None  # type: str

    @abstractclassmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        """
        Given the :arg:`parser`, add any arguments this subcommand wants to accept.
        """
        raise NotImplementedError

    @abstractmethod
    def execute(self, args: argparse.Namespace) -> None:
        """
        Given the :arg:`args` passed to this subcommand, do whatever the command does.
        """
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
            default=(cm().commit_message or "checkpoint")
        )
        parser.add_argument(
            "-r", "--remote",
            metavar="REMOTE",
            help="Name of the configured Git remote to push to.",
            default=(cm().commit_remote or "origin"),
        )
        parser.add_argument(
            "-l", "--local",
            help="Don't push the results to any configured remote repository.",
            action="store_true",
        )

    def execute(self, args: argparse.Namespace) -> None:
        cm().require_config()
        chdir_to_wiki()
        if cm().commit_require_branch:
            current_branch = git.read("rev-parse", "--abbrev-ref", "HEAD")
            if current_branch != cm().commit_require_branch:
                fail(f"You are on the '{current_branch}' branch, "
                     f"but your TZK configuration requires you to be on the "
                     f"'{cm().commit_require_branch}' branch to commit.")

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
            default=str(cm().listen_port or "8080"),
        )
        parser.add_argument(
            "--username",
            metavar="USERNAME",
            default=cm().listen_username or "",
            help="Username to use for basic authentication, if any.",
        )
        parser.add_argument(
            "--password",
            metavar="PASSWORD",
            default=cm().listen_password or "",
            help="Password to use for basic authentication, if any.",
        )
    
    def execute(self, args: argparse.Namespace) -> None:
        cm().require_config()
        chdir_to_wiki()
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
        require_dependencies()

        if os.path.exists("package.json"):
            fail("A 'package.json' file already exists in the current directory. "
                 "Perhaps you've already initialized a TZK repository here?")

    def execute(self, args: argparse.Namespace) -> None:
        self._precheck()
        tw.install(args.wiki_name, args.tiddlywiki_version_spec, args.author)


class PreflightCommand(CliCommand):
    cmd = "preflight"
    help = "Check if tzk and all its dependencies are correctly installed."

    @classmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        pass

    def execute(self, args: argparse.Namespace) -> None:
        require_dependencies()
        print("You're all set! Change into a directory you want to "
              "turn into your tzk repository and run 'tzk init'.")


class BuildCommand(CliCommand):
    cmd = "build"
    help = ("Build another wiki or derivative product, "
            "such as a public version of the wiki, "
            "from this TZK repository.")

    @classmethod
    def setup_arguments(cls, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "product",
            metavar="PRODUCT",
            help="Name of the product you want to build (defined in your config file).",
        )
        parser.add_argument(
            "-s", "--skip-builder",
            metavar="BUILDER_NAME",
            help="Function name of a builder to skip even if part of the PRODUCT. "
                 "This option can be specified multiple times.",
            action="append",
            default=[],
        )

    def _precheck(self, product: str) -> None:
        if cm().products is None:
            fail("No 'products' dictionary is defined in your config file.")
        if product not in cm().products:
            fail(f"No '{product}' product found in the products dictionary "
                 f"in your config file. (Available: {', '.join(cm().products.keys())})")
        if not cm().products[product]:
            fail(f"No build steps are defined in the '{product}' product "
                 f"in your config file.")

    def execute(self, args: argparse.Namespace) -> None:
        cm().require_config()
        chdir_to_wiki()
        self._precheck(args.product)

        # Find the build steps for the product the user specified.
        steps = cm().products[args.product]
        print(f"tzk: Starting build of product '{args.product}'.")
        print(f"tzk: Found {len(steps)} build {numerize(len(steps), 'step')}.")

        # For each build step...
        for idx, step in enumerate(steps, 1):
            # Explain what we're doing. Use first line of the builder's docstring
            # as a summary, if present.
            if hasattr(step, '__doc__'):
                short_description = step.__doc__.strip().split('\n')[0].rstrip('.')
                print(f"tzk: Step {idx}/{len(steps)}: {short_description}")
            else:
                print(f"tzk: Step {idx}/{len(steps)}")

            # If the user asked to skip this builder on the command line, do so.
            if step.__name__ in args.skip_builder:
                print(f"tzk: Skipping step {idx} due to --skip-builder parameter.")
                continue

            # Execute step and handle any errors.
            try:
                step()
            except BuildError as e:
                print(f"tzk: ERROR: {str(e)}")
                print(f"tzk: Build of product '{args.product}' failed on step {idx}, "
                      f"backed by builder '{step.__name__}'.")
                sys.exit(1)
            except Exception:
                print(f"tzk: Build of product '{args.product}' failed on step {idx}: "
                      f"unhandled exception. "
                      f"The original error follows:")
                traceback.print_exc()
                sys.exit(1)

        # TODO: This should run in a finally() block; leaving for now as it's convenient for development :)
        for idx, step in enumerate(steps, 1):
            if hasattr(step, 'cleaner'):
                print(f"tzk: Running cleanup routine for step {idx}...")
                step.cleaner()

        print(f"tzk: Build of product '{args.product}' completed successfully.")


def chdir_to_wiki():
    """
    For most operations, we want the current directory to be the wiki folder.
    """
    if not cm().wiki_folder:
        fail("No 'wiki_folder' option found in config. Set this option to the name "
            "of the wiki subfolder within the current directory.")

    try:
        os.chdir(cm().wiki_folder)
    except FileNotFoundError:
        fail(f"Tried to change directory into the wiki_folder '{cm().wiki_folder}' "
            f"specified in your config file, but that directory does not exist.")

    if not os.path.exists("tiddlywiki.info"):
        fail(f"After changing directory into {cm().wiki_folder} per your config file: "
            f"Expected a 'tiddlywiki.info' file in {os.getcwd()}. "
            f"Please check that your wiki is initialized "
            f"and you specified the correct wiki_folder_name.")


def launch():
    parser = argparse.ArgumentParser()

    subparsers = parser.add_subparsers()
    for command in sorted(CliCommand.__subclasses__(), key=lambda i: i.__name__):
        subparser = subparsers.add_parser(command.cmd, help=command.help)
        subparser.set_defaults(_cls=command)
        command.setup_arguments(subparser)  # type: ignore

    args = parser.parse_args()
    if not hasattr(args, '_cls'):
        # no subcommand was given
        parser.print_help()
        sys.exit(0)

    args._cls().execute(args)


if __name__ == '__main__':
    launch()
