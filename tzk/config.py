"""
config.py - read and manage the tzk config file
"""
import datetime
import functools
import importlib
import os
from pathlib import Path
import sys
from typing import Any

from tzk.util import fail


DEFAULT_INIT_OPTS = {
    'wiki_name': 'wiki',
    'tw_version_spec': '^5.1.23',
    'author': None,
}


class ConfigurationManager:
    def __init__(self):
        self.initialize_cm()

    def __getattr__(self, attr):
        if self.conf_mod is None:
            return None
        else:
            return getattr(self.conf_mod, attr, None)

    def initialize_cm(self):
        self.config_path = Path.cwd()

        for child in sorted(self.config_path.iterdir()):
            if child.is_file() and child.name.endswith('.py'):
                mod_name = child.name.rsplit('.', 1)[0]
                if mod_name == 'tzk_config':
                    sys.path.insert(0, Path("__file__").parent)
                    sys.path.insert(0, str(self.config_path))
                    self.conf_mod = importlib.import_module(mod_name)
                    del sys.path[0:1]
                    break
        else:
            # no config file
            self.conf_mod = None

    def has_config(self) -> bool:
        return self.conf_mod is not None

    def require_config(self) -> None:
        """
        Quit with exit status 1 if no config file was found.
        """
        if not self.has_config():
            fail(f"No tzk_config.py found in the current directory. "
                 f"(Try 'tzk init' if you want to create a new one.)")


def cm(cache=[]):
    """
    Call this function to retrieve the singleton ConfigurationManager object,
    reading and initializing it if necessary.

    Since so much happens when the ConfigurationManager is initialized,
    this has to go in a function so that autodoc doesn't blow up
    when it tries to import the module.
    """
    if not cache:
        cache.append(ConfigurationManager())
    return cache[0]
