import datetime
import functools
import importlib
import os
from pathlib import Path
import sys
from typing import Any

from tzk.util import fail


class ConfigurationManager:
    def __init__(self):
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
            fail(
                f"Your TZK config file could not be found. "
                f"Please ensure there is a file called tzk_config.py "
                f"in the current directory.")

    def __getattr__(self, attr):
        return getattr(self.conf_mod, attr, None)

    def write_attr(self, attr: str, value: str) -> bool:
        """
        Try to add a simple attribute = string value config parameter to the
        config file, if it doesn't already exist. More complicated data types
        are not supported.

        Return:
            False if the attribute already has a value.
            True if successful.

        Raises:
            File access errors if the config file is inaccessible.
        """

        if hasattr(self.conf_mod, attr):
            return False
        else:
            setattr(self.conf_mod, attr, value)
            with open(self.config_path / "tzk_config.py", "a") as f:
                now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"\n# Added automatically by tzk at {now}\n")
                f.write(f'{attr} = "{value}"\n')
            return True


def cm(cache=[]):
    if not cache:
        cache.append(ConfigurationManager())
    return cache[0]
