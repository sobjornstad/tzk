========
Builders
========

.. currentmodule:: tzk.builders

*Builders* are small executable chunks
that can be linked together to form a useful build process.
Products are built by applying builders in sequence.
Please see the existing ``products`` dictionary and associated comments
in the :ref:`config file <Configuring tzk>` for how these are specified.


Builders included with tzk
==========================

You can use the following builders in your configuration file out of the box:

.. autofunction:: check_for_kill_phrases

.. autofunction:: compile_html_file

.. autofunction:: export_public_tiddlers

.. autofunction:: new_output_folder

.. autofunction:: publish_wiki_to_github

.. autofunction:: replace_private_people

.. autofunction:: require_branch

.. autofunction:: require_clean_working_tree

.. autofunction:: save_attachments_externally

.. autofunction:: say_hi

.. autofunction:: set_tiddler_values

.. autofunction:: shell


Builder helper functions
========================

These helper functions, also defined in :mod:`tzk.builders`,
are intended for use with any custom builders you create.

.. autofunction:: tzk.builders::info

.. autofunction:: tzk.builders::stop

.. autodecorator:: tzk.builders::tzk_builder


Custom builders
===============

If the existing builders don't cover something you're hoping to do to build a product,
you can write your own directly within your config file.

As an example, let's suppose that we want to publish our wiki to an S3 bucket
fronted by CloudFront on Amazon Web Services.
We can work with AWS using the ``aws`` CLI,
if we've set that up on our computer.
We first write a builder function in our ``tzk_config.py``,
anywhere above the ``products`` dictionary:

.. code-block:: python

    import subprocess

    @builders.tzk_builder
    def publish_to_aws(target_uri: str, cloudfront_distribution_id: str):
        source_folder = Path(builders.build_state['public_wiki_folder']) / "output"
        # Sync the output folder to S3, deleting any files that have been removed.
        subprocess.call(("aws", "s3", "sync", "--delete", source_folder, target_uri))
        # Clear the CDN cache so the new version is available immediately.
        subprocess.call(("aws", "cloudfront", "create-invalidation",
                        "--distribution-id", cloudfront_distribution_id, "--paths", "/*"))

``builders.build_state`` is a dictionary that is preserved across all build steps.
The :func:`new_output_folder()` builder
populates this ``public_wiki_folder`` attribute early in the default build process,
so that it contains the path to the temporary wiki that build steps happen within.

Then we add a call to this builder within the list for this product,
with whatever parameters we like:

.. code-block:: python
    :emphasize-lines: 5

    products = {
        'public': [
            [...]
            builders.compile_html_file(externalize_attachments=True),
            publish_to_aws("s3://my_target_uri", "MY_DISTRIBUTION_ID"),
        ],
    }

Since we've parameterized this builder,
we can easily use it multiple times if we want,
for instance within different products.
Note that we say just ``publish_to_aws``,
not ``builders.publish_to_aws``,
since this builder is located directly within the config file
rather than in the external ``tzk.builders`` module that comes with tzk.


Shell commands
==============

If a builder seems like overkill for your use case,
you can also run simple shell commands using the :func:`shell()` builder.

Our AWS example would look like this:

.. code-block:: python
    :emphasize-lines: 5-7

    products = {
        'public': [
            [...]
            builders.compile_html_file(externalize_attachments=True,
                                       output_folder="output/public_site/"),
            builders.shell("aws s3 sync --delete output/public_site s3://my_target_uri"),
            builders.shell("aws cloudfront create-invalidation --distribution-id MY_DISTRIBUTION_ID --paths '/*'"),
        ],
    }

Notice the need to include quotes within the string in :func:`builders.shell`;
the same quoting rules as when running shell commands directly apply.
Also notice that we had to access the compiled HTML file from
``output/public_site``, since we can no longer use the ``build_state`` dictionary.
Paths are relative to the private wiki's root directory
(the directory containing the ``tiddlywiki.info`` file)
while builders are running.
