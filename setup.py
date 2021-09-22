"""
setup.py -  setuptools configuration for esc
"""

import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="tzk",
    version="0.1.1",
    author="Soren I. Bjornstad",
    author_email="zettelkasten@sorenbjornstad.com",
    description="Build tool for TiddlyWiki Zettelkasten",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/sobjornstad/tzk",
    packages=setuptools.find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Environment :: Console",
        "Natural Language :: English",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    entry_points={
        "console_scripts": [
            "tzk = tzk.__main__:launch"
        ],
    },
    python_requires='>=3.6',
    include_package_data=True,
)
