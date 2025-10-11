#!/usr/bin/env bash

### Sanity check ###
if [ ! -d "m2-wiki" ]; then
    echo "Please run this script from the M2 root directory."
    exit 1
fi

### Setup ###
shopt -s nullglob
shopt -s extglob

rsync -a --remove-source-files m2-wiki/tiddlers/_system/tzk/* tzk/tzk/tzk_plugin
