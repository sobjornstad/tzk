"""
*Builders* are small executable chunks that together can be linked into a useful build
process.

Builders are decorated with :func:`tzk_builder`, which causes them to be
lazy-evaluated: that is, when they're initially called in the configuration,
instead of running the function and returning its result, a zero-argument
function with all of the arguments wrapped up is returned, to be run at a later
time. This allows the configuration file to be read at any time to retrieve
information about the defined products without actually running any build steps.
"""

from collections.abc import Mapping
import functools
import itertools
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from typing import Callable, Dict, Generator, List, Optional, Set, Sequence, Tuple, Union

from tzk import git
from tzk import tw
from tzk.util import alter_tiddlywiki_info, BuildError, pushd


def tzk_builder(func):
    """
    Decorator which makes a function lazy-evaluable: that is, when it's
    initially called, it returns a zero-argument lambda with the arguments
    initially passed wrapped up in it. Calling that lambda has the effect
    of executing the builder.

    We use this in tzk to allow the user to use function calls in her config
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


def stop(message: str) -> None:
    "Stop the build due to an error condition."
    raise BuildError(message)


def info(message: str) -> None:
    "Print information about this build step to the console."
    print(message)


# Global state available to all builders.
build_state = {}


@tzk_builder
def say_hi(username: str) -> None:
    """
    Say hi to the specified user.

    This function is intended for testing. It will normally succeed and print
    the provided *username*, but if you give "Jeff" as the username, the step
    will fail, and if you give "General Failure" as the username, it will
    cause an unhandled exception.

    :param username: The name of the person to say hi to.
    """
    if username.lower() == 'general failure':
        raise Exception("")
    elif username.lower() == 'jeff':
        # https://twitter.com/yephph/status/1249246702126546944
        stop("Sorry, the name Jeff does not work with our database schema.")
    else:
        print(f"Hello {username}!")


@tzk_builder
def require_branch(branchname: str) -> None:
    """
    Require a specific Git branch to be checked out.

    If the branch isn't checked out, the build will fail immediately. This may
    be helpful if you want to be sure you aren't accidentally building a wiki
    from tentative changes or an old version.

    :param branchname: The name of the branch that must be checked out.
    """
    if git.read("branch", "--show-current") != branchname:
        stop(f"You may only run this build from the {branchname} branch.")


@tzk_builder
def require_clean_working_tree() -> None:
    """
    Require the working tree of the Git repository to be clean.

    If there are any unstaged changes to existing files or staged changes,
    the build will fail immediately.

    For the standard build process, it is not necessary for the working tree
    to be clean. However, if you use any custom build steps that compare history,
    or you simply want to ensure that you always have a recent checkpoint in your
    local version whenever you publish another version, this may be a useful
    requirement.
    """
    pleasecommit = "Please commit or stash them before publishing (try 'tzk commit')."
    if git.rc("diff-index", "--quiet", "--cached", "HEAD", "--") != 0:
        stop(f"There are staged changes. {pleasecommit}")
    if git.rc("diff-files", "--quiet") != 0:
        stop(f"There are uncommitted changes. {pleasecommit}")


@tzk_builder
def new_output_folder():
    """
    Create a new temporary folder to hold intermediate steps of the product being built.
    
    The path to this temporary folder will be stored in the ``public_wiki_folder``
    key of the ``builders.build_state`` dictionary. Future build steps can access
    the work in progress here. A cleaner is registered to delete this folder
    when all steps complete, so any finished product should be copied out by a
    later build step once it is complete.
    """
    assert 'public_wiki_folder' not in build_state
    build_state['public_wiki_folder'] = tempfile.mkdtemp()

def new_output_folder_cleaner():
    if 'public_wiki_folder' in build_state:
        shutil.rmtree(build_state['public_wiki_folder'])
new_output_folder.cleaner = new_output_folder_cleaner


@tzk_builder
def export_public_tiddlers(export_filter: str) -> None:
    """
    Export specified tiddlers to a new wiki in the temporary build folder.

    :func:`new_output_folder()` must be run prior to this builder.

    :param export_filter: A TiddlyWiki filter describing the tiddlers to be selected
                          for inclusion in the new wiki.
    """
    assert 'public_wiki_folder' in build_state, "new_output_folder builder must run first"
    tw.exec((
        ("savewikifolder", build_state['public_wiki_folder'], export_filter),
    ))


def _find_kill_phrases(phrases: Set[str]):
    """
    Search all tiddlers in the public_wiki_folder for the specified kill phrases.
    """
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
    """
    Fail the build if any of a series of regexes matches a tiddler's source in the temp wiki.

    The temp wiki should be created first
    using the :func:`export_public_tiddlers()` builder.

    The kill phrases are Python-format regular expressions and may be configured
    within the wiki, currently in $:/sib/gui/KillPhrases.

    :param kill_phrase_file: The path from the source wiki's root directory to the
                             config tiddler containing kill phrases. In the default
                             Zettelkasten edition, this is
                             "tiddlers/$__config_zettelkasten_Build_KillPhrases.tid";
                             if you change the way paths are determined, you can give
                             a different path here.
    """
    assert 'public_wiki_folder' in build_state, "new_output_folder builder must run first"
    if kill_phrase_file is None:
        kill_phrase_file = "tiddlers/$__config_zettelkasten_Build_KillPhrases.tid"

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
                                extimage_folder: str = "extimage") -> None:
    """
    Save embedded files in the temp wiki into an external folder.

    The temp wiki should be created first
    using the :func:`export_public_tiddlers()` builder.

    Note that this builder **does not finish externalizing images**.
    It saves the images outside the wiki,
    but it does not change the ``_canonical_uri`` and ``text`` fields
    on each image tiddler to point to this new location.
    For the latter step, use the
    ``externalize_attachments``, ``attachment_filter``, and ``canonical_uri_template``
    parameters to the :func:`compile_html_file` step.

    :param attachment_filter: The tiddlers to be saved to the external folder;
                              by default, ``[is[image]]``.
    :param extimage_folder:   The name of the external folder to save to. This must
                              be the default of ``extimage`` to work with the default
                              ``canonical_uri_template``
                              in the :func:`compile_html_file()` builder,
                              but you can use a different name and a different
                              canonical URI template if you prefer.
    """
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
    """
    Compile a single HTML file from the temp wiki.
    
    Before compiling an HTML file,
    you should create a temp wiki using the :func:`export_public_tiddlers()` builder,
    then run any other build steps you want to use
    to make changes to the wiki being built.
    Once you compile the HTML file,
    it will be copied out to an output location outside the temp folder,
    and the content can no longer be changed through tzk.

    :param wiki_name:     The filename of the single-file wiki to create.
                          Default ``index.html``.
    :param output_folder: The path to the folder
                          where the single-file wiki and any externalized attachments
                          will be placed, relative to the private wiki's root directory.
                          Default ``output/public_site``.
    :param overwrite:     If the ``output_folder`` already exists,
                          should we overwrite any files in it with the same name?
                          Default True.
    :param externalize_attachments: If True, update tiddlers that match
                                    the ``attachment_filter`` parameter to point to
                                    external versions of their content.
                                    Only useful if you have previously run
                                    the ``save_attachments_externally`` builder.
                                    Default False.
    :param attachment_filter:       If externalizing attachments,
                                    which tiddlers should be externalized?
                                    Default ``[is[image]]``.
    :param canonical_uri_template:  What TiddlyWiki template should be used
                                    to determine the new content
                                    of the ``_canonical_uri`` field?
                                    Default ``$:/core/templates/canonical-uri-external-image``.
                                    If you're not sure what this is, don't change it.
    """
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


def _private_people_replacement_table(
    initialer: Callable[[str], str] = None,
    is_public: Callable[[str], Union[bool, None]] = None,
) -> Dict[str, str]:
    "Build table of private people and their transformed initials."

    def _initials_from_tiddler_name(name: str) -> str:
        m = re.match(r"^(?:Mr|Ms|Mx|The)(?P<camel_case_name>.+?)\.tid", name)
        assert m
        return '.'.join(i for i in m.group('camel_case_name') if i.isupper()) + '.'

    if initialer is None:
        initialer = _initials_from_tiddler_name

    tiddlers = (Path.cwd() / "tiddlers").glob("**/*.tid")
    person_tiddlers = (i for i in tiddlers if re.match(r"^(Mr|Ms|Mx|The)\w+", i.name))
    private_person_tiddlers = []
    for pt in person_tiddlers:
        # If the is_public handler is defined, call it. If not defined
        # or it returns None for this line, proceed to the default
        # handler.
        if is_public:
            delegated_publicity_status = is_public(pt)
            if delegated_publicity_status is True:
                continue
            elif delegated_publicity_status is False:
                private_person_tiddlers.append(pt)
                continue
            assert delegated_publicity_status is None, \
                f"publicity status was {delegated_publicity_status}"

        # Default handler.
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
        i.name.replace('.tid', ''): initialer(i.name)
        for i in private_person_tiddlers
    }


def _privatize_line(line: str, replacement_table: Dict[str, str],
                    replace_link_text: bool = False) -> Optional[str]:
    """
    Given a line and a table of replacements to make, replace all instances
    of all private people defined in the replacement table.

    Basics:
        >>> _privatize_line("MsAlice is a test person.", {'MsAlice': 'A.'})
        '[[A.|PrivatePerson]] is a test person.'

        >>> _privatize_line("This woman, known as MsAlice, is a test person.", \
                            {'MsAlice': 'A.'})
        'This woman, known as [[A.|PrivatePerson]], is a test person.'

        >>> _privatize_line("[[MsAlice]] is a test person.", {'MsAlice': 'A.'})
        '[[A.|PrivatePerson]] is a test person.'

        >>> _privatize_line("When we talk about [[MsAlice]] in the middle of a " \
                            "sentence, that's fine too.", {'MsAlice': 'A.'})
        "When we talk about [[A.|PrivatePerson]] in the middle of a sentence, that's fine too."

    Content inside a macro:
        >>> _privatize_line('''Text with a footnote.''' \
                            '''<<fnote "Here's my footnote about MsAlice.">>''', \
                            {'MsAlice': 'A.'})
        'Text with a footnote.<<fnote "Here\\'s my footnote about [[A.|PrivatePerson]].">>'

    Links with different text and target:
        >>> _privatize_line("We can talk about [[Alice|MsAlice]] " \
                            "with different text.", {'MsAlice': 'A.'})
        'We can talk about [[Alice|PrivatePerson]] with different text.'

    Multiple replacements with different people:
        >>> _privatize_line("We can have [[MsAlice]] and MrBob talk to each other " \
                            "in the same line.", {'MsAlice': 'A.', 'MrBob': 'B.'})
        'We can have [[A.|PrivatePerson]] and [[B.|PrivatePerson]] talk to each other in the same line.'

    Multiple replacements with the same person:
        >>> _privatize_line("We can have MsAlice talk to herself (MsAlice) " \
                            "in the same line.", {'MsAlice': 'A.'})
        'We can have [[A.|PrivatePerson]] talk to herself ([[A.|PrivatePerson]]) in the same line.'

        >>> _privatize_line("Likewise [[MsAlice]] can do it with brackets " \
                            "([[MsAlice]]).", {'MsAlice': 'A.'})
        'Likewise [[A.|PrivatePerson]] can do it with brackets ([[A.|PrivatePerson]]).'

        >>> _privatize_line('We can talk about [[Alice|MsAlice]] lots of ways, ' \
                            'like MsAlice and [[MsAlice]].', {'MsAlice': 'A.'})
        'We can talk about [[Alice|PrivatePerson]] lots of ways, like [[A.|PrivatePerson]] and [[A.|PrivatePerson]].'

    Replacements with alternate link text:
        >>> _privatize_line('We can talk about [[Alice|MsAlice]] and [[Bob|MrBob]] as well', \
                            {'MsAlice': 'A.', 'MrBob': 'B.'}, replace_link_text=True)
        'We can talk about [[A.|PrivatePerson]] and [[B.|PrivatePerson]] as well'


    We don't want to replace places where a CamelCase match is a substring of another
    word. This is expected to yield no output because there's nothing to replace:
        >>> _privatize_line("But an EmbeddedCamelWithMsAliceInIt isn't her.", \
                            {'MsAlice': 'A.'})
    """
    def iteroccurrences(needle: str) -> Generator[int, int, None]:
        """
        Iterate over the start indices of occurrences of substring
        ``needle`` in the line /line/ in outer scope.

        (We have to use outer scope because it can be changed while we're iterating
         and the generator is only bound to arguments once.)
        """
        idx = -1
        while True:
            idx = line.find(needle, idx + 1)
            if idx == -1:
                return
            else:
                additional_increments = yield idx
                if additional_increments is not None:
                    idx += additional_increments

    def anchored_at_one_end(start_index: int, end_index: int) -> bool:
        return start_index == 0 or end_index == len(line)

    def is_camelcase_link(start_index: int, end_index: int) -> bool:
        return (anchored_at_one_end(start_index, end_index)
                or (line[start_index-1] != '[' and line[end_index] != ']'))

    def is_bare_bracketed_link(start_index: int, end_index: int) -> bool:
        return (not anchored_at_one_end(start_index, end_index)
                and line[start_index-2:start_index] == '[['
                and line[end_index:end_index+2] == ']]')

    def is_textual_bracketed_link(start_index: int, end_index: int) -> bool:
        return (not anchored_at_one_end(start_index, end_index)
                and line[start_index-1] == '|'
                and line[end_index:end_index+2] == ']]')

    dirty = False
    increment_iterator_by = 0
    for replace_person, replace_initials in replacement_table.items():
        iterator = iteroccurrences(replace_person)
        try:
            while True:
                # NOTE: the "end" index is one after the last index in the string,
                # as is needed for slice notation.
                if increment_iterator_by:
                    start_idx = iterator.send(increment_iterator_by)
                    increment_iterator_by = 0
                else:
                    start_idx = next(iterator)
                end_idx = start_idx + len(replace_person)
                new_line = None

                if is_camelcase_link(start_idx, end_idx):
                    # camel-case link or unlinked reference in text
                    def is_spurious_substring():
                        # If there's not a non-alphanumeric character on both sides of
                        # the "link", we may be making a clbuttic replacement.
                        # <https://en.wikipedia.org/wiki/Scunthorpe_problem>
                        start_ok = start_idx == 0 or not line[start_idx-1].isalnum()
                        end_ok = end_idx == len(line) or not line[end_idx].isalnum()
                        return not (start_ok and end_ok)

                    if not is_spurious_substring():
                        new_line = (line[0:start_idx]
                                    + f'[[{replace_initials}|PrivatePerson]]'
                                    + line[end_idx:])
                elif is_bare_bracketed_link(start_idx, end_idx):
                    # link with the person as the target and text
                    replacement = replace_initials + '|PrivatePerson'
                    new_line = line[0:start_idx] + replacement + line[end_idx:]
                elif is_textual_bracketed_link(start_idx, end_idx):
                    # link with the person as the target only;
                    # beware that you might have put something private in the text
                    if replace_link_text:
                        start_of_link = line[0:start_idx].rfind('[[', 0, start_idx) + 2
                        new_line = line[0:start_of_link] + f"{replace_initials}|PrivatePerson" + line[end_idx:]
                    else:
                        new_line = line[0:start_idx] + 'PrivatePerson' + line[end_idx:]
                else:
                    link = line[start_idx:end_idx]
                    raise ValueError(f"Unknown type of link '{link}' in line:\n  {line}")

                if new_line:
                    line = new_line
                    dirty = True
                    # If we changed the length of the string by modifying it,
                    # we need to update our stored position within the string.
                    increment_iterator_by = len(new_line) - len(line)
        except StopIteration:
            pass

    if dirty:
        return line
    else:
        return None


@tzk_builder
def replace_private_people(
    initialer: Callable[[str], str] = None,
    replace_link_text: bool = False,
    is_public: Callable[[str], Union[bool, None]] = None) -> None:
    """
    Replace the names of people who are not marked Public with their initials.

    If you have lots of PAO (People, Animals, and Organizations) in your Zettelkasten
    and many of them are personal friends,
    you might prefer not to make everything you said about them
    easily searchable on the internet.
    This is more challenging than simply not marking their tiddlers public,
    since there will also probably be links to their tiddlers in other tiddlers --
    and those links contain their full names, if you put them in the title.

    This builder replaces all links, bracketed or WikiCamelCase,
    to the names of all people *not* tagged Public
    with the initials suggested by their CamelCase titles
    (e.g., MsJaneDoe becomes J.D.). The links point to the tiddler ``PrivatePerson``,
    which explains this process.

    :param initialer: If you don't like the way that initials
                      are generated from tiddler filenames by default,
                      you can customize it by passing a callable
                      that takes one string argument
                      (a tiddler filename without the full path, e.g., ``MsJaneDoe.tid``)
                      and returns a string to be considered the "initials" of that person.

    :param replace_link_text: If you have links in the form
                              ``So then [[John said|MrJohnDoe]] something about this``,
                              then enabling this option ensures that the link is fully
                              replaced with
                              ``So then [[J.D.|PrivatePerson]] something about this``.
                              This means that when using this feature, having the
                              link text also be meaningful after redaction is important.

    :param is_public: If you want to define a person tiddler being public/private by
                      some criteria other than having a 'Public' tag, pass a
                      callable here. A Path object for the tiddler is the sole argument.
                      Return True if the tiddler is public / should be included in the
                      edition, False if it's private, or None to delegate to the default
                      handler.

    .. warning ::
        This function redacts only square-bracketed and CamelCase links themselves.
        The text of links with different link target and text is NOT redacted unless
        ``replace_link_text`` is enabled, and names used outside of links
        are NEVER redacted. Making a tiddler public still needs consideration and
        this function is here to help, not to replace your judgment! Consider adding
        kill phrases for anyone you want to be doubly sure is not publicly mentioned.
    """
    assert 'public_wiki_folder' in build_state

    replacement_table = _private_people_replacement_table(initialer, is_public)
    root = Path(build_state['public_wiki_folder']) / "tiddlers"
    tid_files = itertools.chain(root.glob("**/*.tid"), root.glob("**/*.json"))

    for tiddler in tid_files:
        dirty = False
        with tiddler.open() as f:
            lines = f.readlines()
        for i in range(len(lines)):
            private_line = _privatize_line(lines[i], replacement_table, replace_link_text)
            if private_line is not None:
                lines[i] = private_line
                dirty = True
        if dirty:
            with tiddler.open("w") as f:
                f.writelines(lines)


def _set_fields(mappings: Dict[str, str],
                editing_func: Callable[[Path, List[str], str], None]) -> None:
    """
    Read the text of a .tid file into memory and call an editing_func on it
    in order to modify some of its fields.

    :param mappings: Mapping of tiddler filenames to new values of some field
                     (this function is field-agnostic; the editing_func should be
                     aware of what field is to be edited).
    :param editing_func: A function which will make the changes.

    The editing_func is called once for each item in the mapping
    and receives three arguments:

    :param tiddler_path: The full path to the tiddler on the filesystem.
                         The editing_func should write changes back to this file,
                         if any are appropriate.
    :param tiddler_lines: A sequence of strings, each one line of the original file.
    :param new_text: The new field value specified for this tiddler in the provided
                     mapping dict of tiddler name/new value.
    """

    for tiddler, new_text in mappings.items():
        tiddler_path = (Path(build_state['public_wiki_folder']) / "tiddlers" / tiddler)
        try:
            with tiddler_path.open("r") as f:
                tiddler_lines = f.readlines()
        except FileNotFoundError:
            stop(f"File {tiddler_path} not found. "
                 f"(Did you forget to end the name with '.tid'?)")

        editing_func(tiddler_path, tiddler_lines, new_text)


def _set_text_field(mappings: Dict[str, str]) -> None:
    "Set the 'text' field to a new value in each pair of tiddler name/value."
    def editor(tiddler_path: Path, tiddler_lines: Sequence[str], new_text: str) -> None:
        if not str(tiddler_path).endswith('.tid'):
            # will be a separate meta file, so the whole thing is the text field
            first_blank_line_index = -1
        else:
            first_blank_line_index = next(idx
                                        for idx, value in enumerate(tiddler_lines)
                                        if not value.strip())
        with tiddler_path.open("w") as f:
            f.writelines(tiddler_lines[0:first_blank_line_index+1])
            f.write(new_text)
    _set_fields(mappings, editor)


def _set_nontext_field(field: str, mappings: Dict[str, str]) -> None:
    "Set the specified /field/ to a new value in each pair of tiddler name/value."
    def editor(tiddler_path: Path, tiddler_lines: Sequence[str], new_text: str) -> None:
        # First check if the field exists and is currently not set to new_text...
        line_to_change = -1
        for idx, line in enumerate(tiddler_lines):
            m = re.match(f"^{field}: (?P<value>.*)", line)
            if m:
                if m.group('value') != new_text:
                    line_to_change = idx
                break

        # ...and if so, write the file again with the change in place.
        if line_to_change != -1:
            with tiddler_path.open("w") as f:
                for idx, line in enumerate(tiddler_lines):
                    if idx == line_to_change:
                        f.write(f"{field}: {new_text}\n")
                    else:
                        f.write(line)
    _set_fields(mappings, editor)


@tzk_builder
def set_tiddler_values(text: Optional[Dict[str, str]] = None,
                       **kwargs: Dict[str, str]) -> None:
    """
    Set fields of selected config or other tiddlers to arbitrary new values.

    This can be used to make customizations that can't easily be done with feature
    flags or other wikitext solutions within the wiki -- for instance, changing the
    subtitle or what buttons are visible. It's also used to implement feature flags
    in the first place by changing the ``$:/config/sib/CurrentEditionPublicity``
    tiddler to ``public``, so at minimum, the build of a public wiki should use:

    .. code-block:: python

        builders.set_tiddler_values({
            '$__config_sib_CurrentEditionPublicity.tid': 'public',
        })

    Any number of arguments can be provided. The name of each argument is the name of
    the field to edit. One positional argument may be used with no name; this argument
    is assumed to be mappings for replacing the 'text' field.
    """
    assert 'public_wiki_folder' in build_state
    for field_name, field_mapping in kwargs.items():
        if not isinstance(field_mapping, Mapping):
            raise AssertionError(
                "Arguments to set_tiddler_values must be dictionaries "
                "mapping tiddler names to values.")

    if text is not None:
        _set_text_field(text)
    
    for field, mappings in kwargs.items():
        _set_nontext_field(field, mappings)


@tzk_builder
def delete_tiddlers(tiddlers: Sequence[str]) -> None:
    """
    Delete selected tiddlers from the output.

    This is hopefully self-explanatory.

    :param tiddlers: A list of filenames of tiddlers to delete.
    """
    assert 'public_wiki_folder' in build_state
    for tiddler in tiddlers:
        tiddler_path = (Path(build_state['public_wiki_folder']) / "tiddlers" / tiddler)
        tiddler_path.unlink()


@tzk_builder
def publish_wiki_to_github(
        output_folder: str = "output/public_site/",
        commit_message: str = "publish checkpoint",
        remote: str = "origin",
        refspec: str = "master",
        push = True) -> None:
    """
    Publish the built wiki to GitHub.

    :param output_folder:  Path to a folder containing the Git repository you'd like 
                           to publish, relative to your private wiki's root directory.
                           This folder should contain the version of your wiki
                           built by the :func:`compile_html_file()` builder,
                           either directly or in a subfolder somewhere.
                           You need to clone or create the repository yourself
                           and set up the remotes as appropriate
                           before running this step.
                           Default ``output/public_site``.
    :param commit_message: Message to use when committing the newly built wiki.
                           Note that all changes in the repository will be committed.
                           Default ``publish checkpoint``.
    :param remote:         The repository remote to push changes to.
                           If you don't know what that is,
                           the default of ``origin`` is probably correct.
    :param refspec:        The local branch or refspec to push.
                           Default ``master``.
    :param push:           If set to False, don't push after committing the changes
                           (mostly useful for testing purposes).
                           Default True.
    """
    with pushd(output_folder):
        if not os.path.isdir(".git"):
            stop(f"The output folder {output_folder} isn't a Git repository. "
                 f"Please go initialize it and then try again.")

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
    """
    Run an arbitrary shell command.

    The builder will fail if a return code other than 0 is returned,
    otherwise it will succeed. Output will be printed to stdout.

    :param shell_command: A string to be passed to your system's shell.
    """
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


@tzk_builder
def editionify(target_folder: str, description: str) -> None:
    """
    Copy the output folder to a target location and set its edition description.

    This generates a TiddlyWiki edition based on the temporary output. By
    copying it into an appropriate location or setting the environment variable
    :envvar:`TIDDLYWIKI_EDITION_PATH` to the parent directory of the edition's folder,
    it's possible to quickly generate new TiddlyWikis based on the edition
    "template" (``tiddlywiki --init EDITION_NAME``, where the ``EDITION_NAME`` is the
    name of the folder).

    :param target_folder: The folder to copy the output folder to.
                          This folder *will be deleted* if it already exists
                          prior to the copy.
    :param description:   The description of this edition to use in the new edition's
                          ``tiddlywiki.info`` file.
    """
    try:
        shutil.rmtree(target_folder)
    except FileNotFoundError:
        pass
    shutil.copytree(
        build_state['public_wiki_folder'],
        target_folder,
    )

    def editor(tinfo):
        tinfo['description'] = description
        return tinfo
    alter_tiddlywiki_info(Path(target_folder) / "tiddlywiki.info", editor)


@tzk_builder
def add_plugins(plugins: Sequence[str]) -> None:
    """
    Add one or more plugins to the tiddlywiki.info file.

    :param plugins: A list of plugin names (e.g., "tiddlywiki/codemirror") to add.
    """
    def editor(tinfo):
        tinfo['plugins'].extend(plugins)
        return tinfo
    alter_tiddlywiki_info(Path(build_state['public_wiki_folder']) / "tiddlywiki.info",
                          editor)
