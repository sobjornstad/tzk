"""
setup.py -  setuptools configuration for esc
"""

import setuptools

#with open("README.md", "r") as fh:
#    long_description = fh.read()
long_description = "my nice long *description*"

setuptools.setup(
    name="tzk",
    version="0.0.1",
    author="Soren I. Bjornstad",
    author_email="contact@sorenbjornstad.com",
    description="Build tool for TiddlyWiki Zettelkasten",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="TODO",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
        "Operating System :: OS Independent",
    ],
    entry_points={
        "console_scripts": [
            "tzk = tzk.__main__:launch"
        ],
    },
    python_requires='>=3.8',
)
