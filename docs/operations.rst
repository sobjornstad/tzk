========
Builders
========


.. automodule:: tzk.builders
    :members: check_for_kill_phrases, compile_html_file, export_public_tiddlers, new_output_folder, publish_wiki_to_github, replace_private_people, require_branch, require_clean_working_tree, save_attachments_externally, say_hi, set_tiddler_values, shell


Builder helper functions
========================

These helper functions, also defined in :mod:`tzk.builders`,
are intended for use with any custom builders you create.

.. autofunction:: tzk.builders::info

.. autofunction:: tzk.builders::stop

.. autodecorator:: tzk.builders::tzk_builder
