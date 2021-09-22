#!/bin/bash
set -e

. venv/bin/activate
rm -rf build/
rm -f dist/*
mkdir -p dist
python setup.py sdist bdist_wheel
twine upload dist/*
