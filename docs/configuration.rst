===============
Configuring tzk
===============

Basic setup
===========

1. Change into a directory you'd like to use as your Zettelkasten repository.
   The directory should be empty, so you'll probably want to create a new one, e.g.:
   ::

       $ mkdir my_zettelkasten
       $ cd my_zettelkasten

2. Run ``tzk init``.
   This will create a tzk configuration file,
   install TiddlyWiki to this folder,
   and set up a Git repository.

3. When ``init`` has completed successfully,
   open the ``tzk_config.py`` in your favorite text editor.
   Read the comments and make any changes you would like.
   See the :ref:`Builders` section of this documentation
   for more information about builders --
   but you'll most likely want to get started with your wiki now
   and worry about builds once you actually have some content to build!

4. Run ``tzk listen`` and confirm that you can access your wiki.


Committing
==========

Many people find that carefully designing atomic Git commits
when editing a TiddlyWiki
is difficult and not all that useful,
so the ``tzk commit`` command is made available
to quickly stage, commit, and (if you wish) push all changes in the repository in one go.

To enable pushes,
add a new Git remote (e.g., ``git remote add origin https://github.com/you/YourRepository``)
and set the ``commit_remote`` option in your tzk config to the remote name
(here, ``origin``).
You can selectively skip pushing for a particular commit
with the ``--local`` switch to ``tzk commit``.


Environment
===========

If you'd like to be able to run ``tzk`` from any directory,
rather than having to change into the directory of your tzk repository,
set the ``TZK_DIRECTORY`` environment variable on your system
to its full path.
If the current directory contains a ``tzk_config.py`` file,
the current directory will still be preferred to the ``TZK_DIRECTORY`` directory.

.. note::
    ``TZK_DIRECTORY`` is not honored when calling ``tzk init``.
    Otherwise tzk would prioritize the ``TZK_DIRECTORY`` over the current directory
    since the current directory doesn't contain a config file yet,
    and it would be impossible to initialize a second tzk repository.
