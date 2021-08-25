import importlib
import os
from pathlib import Path
import sys


class ConfigurationManager:
    def __init__(self):
        config_path = Path.cwd()

        for child in sorted(config_path.iterdir()):
            if child.is_file() and child.name.endswith('.py'):
                mod_name = child.name.rsplit('.', 1)[0]
                if mod_name == 'tzk_config':
                    sys.path.insert(0, str(config_path))
                    self.conf_mod = importlib.import_module(mod_name)
                    del sys.path[0]
                    break
        else:
            print(
                f"Your TZK config file could not be found. "
                f"Please ensure there is a file called tzk_config.py "
                f"in the current directory.", file=sys.stderr)
            sys.exit(1)

    def __getattr__(self, attr):
        return getattr(self.conf_mod, attr, None)
