from contextlib import contextmanager
import functools
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from typing import Dict, List, Set, Sequence, Tuple

import git
import tw
from util import BuildError, pushd


def _lazy_evaluable(func):
    """
    Decorator which makes a function lazy-evaluable: that is, when it's
    initially called, it returns a zero-argument lambda with the arguments
    initially passed wrapped up in it. Calling that lambda has the effect
    of executing the function.

    We use this in TZK to allow the user to use function calls in her config
    to define the build steps, while not requiring her to write a bunch of
    ugly and confusing lambda:'s in the config. The functions that will be called
    are prepared during the config and executed later.
    """

    @functools.wraps(func)
    def new_func(*args, **kwargs):
        my_args = args
        my_kwargs = kwargs
        @functools.wraps(new_func)
        def inner():
            func(*my_args, **my_kwargs)
        return inner
    return new_func

# Now a more descriptive name that doesn't expose inner workings
# if the user wants to write her own builder.
tzk_builder = _lazy_evaluable


def stop(message: str) -> None:
    "Stop the build due to an error condition."
    raise BuildError(message)


def info(message: str) -> None:
    "Print information about this build step to the console."
    print(message)


# Global state available to all builders.
build_state = {}


@tzk_builder
def printer(username: str) -> None:
    "Display the user's name"
    if username == 'Maud':
        raise Exception("No Mauds allowed!")
    print(f"Hallelujah, {username} built a wiki!")


@tzk_builder
def require_branch(branchname: str) -> None:
    "Require a specific Git branch to be checked out"
    if git.read("branch", "--show-current") != branchname:
        stop(f"You may only run this build from the {branchname} branch.")


@tzk_builder
def require_clean_working_tree() -> None:
    "Require the working tree of the Git repository to be clean"
    pleasecommit = "Please commit or stash them before publishing."
    if git.rc("diff-index", "--quiet", "--cached", "HEAD", "--") != 0:
        stop(f"There are staged changes. {pleasecommit}")
    if git.rc("diff-files", "--quiet") != 0:
        stop(f"There are uncommitted changes. {pleasecommit}")


@tzk_builder
def new_output_folder():
    "Create a new temporary folder to hold output being built"
    assert 'public_wiki_folder' not in build_state
    build_state['public_wiki_folder'] = tempfile.mkdtemp()

new_output_folder.cleaner = lambda: shutil.rmtree(build_state['public_wiki_folder'])


@tzk_builder
def export_public_tiddlers(export_filter: str) -> None:
    "Export public tiddlers to a temp wiki"
    assert 'public_wiki_folder' in build_state, "new_output_folder builder must run first"
    tw.exec((
        ("savewikifolder", build_state['public_wiki_folder'], export_filter),
    ))


def _find_kill_phrases(phrases: Set[str]):
    regexes = [re.compile(phrase) for phrase in phrases]
    failures = []
    tid_files = (Path(build_state['public_wiki_folder']) / "tiddlers").glob("**/*.tid")

    for tid_file in tid_files:
        with tid_file.open() as f:
            for line in f:
                for regex in regexes:
                    if re.search(regex, line):
                        failures.append((regex, str(tid_file), line))
    
    return failures

@tzk_builder
def check_for_kill_phrases(kill_phrase_file: str = None) -> None:
    "Fail build if any of a series of regexes appears in a tiddler's source in the temp wiki"
    assert 'public_wiki_folder' in build_state, "new_output_folder builder must run first"
    if kill_phrase_file is None:
        kill_phrase_file = "tiddlers/_system/config/zettelkasten/Build/KillPhrases.tid"

    kill_phrases = set()
    with open(kill_phrase_file) as f:
        reading = False
        for line in f:
            if not line.strip():
                reading = True
            if line.strip() and reading:
                kill_phrases.add(line)

    failures = _find_kill_phrases(kill_phrases)
    if failures:
        result = ["Kill phrases were found in your public wiki:"]
        for failed_regex, failed_file, failed_line in failures:
            trimmed_file = failed_file.replace(build_state['public_wiki_folder'], '')
            result.append(f"'{failed_regex.pattern}' matched file {trimmed_file}:\n"
                          f"    {failed_line.strip()}")
        stop('\n'.join(result))

@tzk_builder
def save_attachments_externally(attachment_filter: str = "[is[image]]",
                                extimage_folder: str = "extimage") -> None:  # TODO: or must this be extimage as the template suggests?
    "Save embedded files in the temp wiki into an external folder"
    assert 'public_wiki_folder' in build_state

    tw.exec(
        (
            ("savetiddlers", attachment_filter, extimage_folder),
        ),
        base_wiki_folder=build_state['public_wiki_folder']
    )


@tzk_builder
def compile_html_file(
        wiki_name: str = "index.html",
        output_folder: str = "output/public_site/",
        overwrite: bool = True,
        externalize_attachments: bool = False,
        attachment_filter: str = "[is[image]]",
        canonical_uri_template: str = "$:/core/templates/canonical-uri-external-image",
    ) -> None:
    "Compile a single HTML file from the temp wiki"
    assert 'public_wiki_folder' in build_state

    commands: List[Tuple[str, ...]] = []
    if externalize_attachments:
        commands.extend([
            ("setfield", attachment_filter, "_canonical_uri",
             canonical_uri_template, "text/plain"),
            ("setfield", attachment_filter, "text", "", "text/plain"),
        ])
    commands.append(("render", "$:/core/save/all", wiki_name, "text/plain"))

    tw.exec(commands, base_wiki_folder=build_state['public_wiki_folder'])
    if os.path.exists(output_folder) and not overwrite:
        stop(f"The output folder '{os.path.abspath(output_folder)}' already exists. "
             f"(To overwrite any files existing in the output folder, "
             f"set overwrite = True for this builder.)")

    shutil.copytree(
        Path(build_state['public_wiki_folder']) / "output",
        Path(output_folder),
        dirs_exist_ok=True
    )
    info(f"Successfully copied built output to {os.path.abspath(output_folder)}.")


def _private_people_replacement_table() -> Dict[str, str]:
    def _initials_from_tiddler_name(name: str) -> str:
        m = re.match(r"^(?:Mr|Ms|Mx|The)(?P<camel_case_name>.*?)\.tid", name)
        assert m
        return '.'.join(i for i in m.group('camel_case_name') if i.isupper()) + '.'


    # Build table of private people and their transformed initials.
    tiddlers = (Path.cwd() / "tiddlers").glob("**/*.tid")
    person_tiddlers = (i for i in tiddlers if re.match("^(Mr|Ms|Mx|The)", i.name))
    private_person_tiddlers = []
    for pt in person_tiddlers:
        with pt.open() as f:
            for line in f:
                if line.startswith("tags:"):
                    if re.search(r'\bPublic\b', line):
                        # If there's a tags line in the file and it contains the
                        # Public tag, we skip it.
                        break
                    else:
                        # Otherwise, if there's a tags line in the file and it
                        # doesn't contain the Public tag, it's private.
                        private_person_tiddlers.append(pt)
                        break
                if not line.strip():
                    # And if there's no tags line in the file at all,
                    # it's private by default.
                    private_person_tiddlers.append(pt)
                    break
    return {
        i.name.replace('.tid', ''): _initials_from_tiddler_name(i.name)
        for i in private_person_tiddlers
    }


@tzk_builder
def replace_private_people() -> None:
    "Replace the names of people who are not marked Public with their initials"
    assert 'public_wiki_folder' in build_state

    replacement_table = _private_people_replacement_table()
    tid_files = (Path(build_state['public_wiki_folder']) / "tiddlers").glob("**/*.tid")

    for tiddler in tid_files:
        dirty = False
        with tiddler.open() as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            for replace_person, replace_initials in replacement_table.items():
                if replace_person in line:
                    if '|' + replace_person + ']]' in line:
                        # link with the person as the target only;
                        # beware that you might have put something private in the text
                        lines[idx] = line.replace(replace_person,
                                                  'PrivatePerson')
                    elif '[[' + replace_person + ']]' in line:
                        # link with the person as the target and text
                        lines[idx] = line.replace(replace_person,
                                                  replace_initials + '|PrivatePerson')
                    else:
                        # camel-case link or unlinked reference in text;
                        # or spurious substring, so rule that out with the '\b' search
                        lines[idx] = re.sub(
                            r"\b" + re.escape(replace_person) + r"\b",
                            f'<<privateperson "{replace_initials}">>',
                            line
                        )
                    dirty = True
        if dirty:
            with tiddler.open("w") as f:
                f.writelines(lines)


@tzk_builder
def set_tiddler_values(mappings: Dict[str, str]) -> None:
    "Set the 'text' field of selected config or other tiddlers to new values"
    assert 'public_wiki_folder' in build_state

    for tiddler, new_text in mappings.items():
        tiddler_path = (Path(build_state['public_wiki_folder']) / "tiddlers" / tiddler)
        with tiddler_path.open("r") as f:
            tiddler_lines = f.readlines()
        first_blank_line_index = next(idx
                                      for idx, value in enumerate(tiddler_lines)
                                      if not value.strip())
        with tiddler_path.open("w") as f:
            f.writelines(tiddler_lines[0:first_blank_line_index+1])
            f.write(new_text)


@tzk_builder
def publish_wiki_to_github(
        output_folder: str = "output/public_site/",
        commit_message: str = "publish checkpoint",
        remote: str = "origin",
        refspec: str = "master",
        push = True) -> None:
    "Publish the wiki to GitHub"

    with pushd(output_folder):
        if not os.path.isdir(".git"):
            info(f"The output folder {output_folder} doesn't appear to be a Git repository. "
                f"I'll try to make it one.")
            git.exec("init")

        git.exec("add", "-A")
        rc = git.rc("commit", "-m", commit_message)
        if rc == 0:
            if push:
                git.exec("push", remote, refspec)
        elif rc == 1:
            info("No changes to commit or publish. "
                "You probably rebuilt without changing the wiki in between.")
        else:
            stop(f"'git commit' returned unknown return code {rc}.")


@tzk_builder
def shell(shell_command: str) -> None:
    "Run an arbitrary shell command"
    info("$ " + shell_command)
    try:
        output = subprocess.check_output(shell_command, shell=True, text=True)
    except subprocess.CalledProcessError as e:
        if e.output.strip():
            stop(f"Command exited with return code {e.returncode}:\n{e.output}")
        else:
            stop(f"Command exited with return code {e.returncode} (no output).")
    else:
        if output.strip():
            info(f"Command exited with return code 0:\n{output}")
        else:
            info(f"Command exited with return code 0 (no output).")
