==============
Installing tzk
==============


tzk itself
==========

On most systems, tzk may be installed directly from pip at a command line:
::

    $ pip install tzk

If you don't have Python 3.6 or greater on your computer,
you'll need to install it first.
If you aren't sure how to do that,
here's an `exhaustive guide`_ to installing Python on all major operating systems.
Once you've gotten Python installed,
you'll be able to use ``pip`` to install tzk as described above.

To check your work, run ``tzk --version``;
you should see a version number rather than an error,
something like:
::

    $ tzk --version
    1.0.0

.. _exhaustive guide: https://realpython.com/installing-python/#how-to-install-python-on-macos


Dependencies
============

In order to set up your Zettelkasten,
you'll also need ``npm`` and ``git``.
You can check if they're installed like this:
::

    $ npm --version
    7.20.6
    $ git --version
    git version 2.32.0

Your versions will likely be a little different by the time you read this.
As long as you get a version number rather than an error, you're good;
tzk does not use any features of either tool that require bleeding-edge versions.

If you don't have **NPM**,
follow step 1 of the Node.js installation instructions in the `TiddlyWiki documentation`_.
You can skip all the remaining steps -- tzk takes care of that part for you.

If you don't have **Git**,
follow the steps in the `Installing Git`_ section of Pro Git.

.. _TiddlyWiki documentation: https://tiddlywiki.com/#Installing%20TiddlyWiki%20on%20Node.js
.. _Installing Git: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git


Checking your work
==================

Run ``tzk preflight`` to double-check that everything is correctly installed.
