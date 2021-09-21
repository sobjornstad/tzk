#!/bin/bash
set -e

rm -f dist/*
mkdir -p dist
python setup.py sdist bdist_wheel
twine upload --repository-url https://test.pypi.org/legacy/ dist/*
