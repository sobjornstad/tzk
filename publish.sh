#!/bin/bash
set -e

rm -rf build/
rm -f dist/*
mkdir -p dist
python setup.py sdist bdist_wheel
twine upload dist/*
