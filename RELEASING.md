1. Run 'tzk build emptify' in the parent directory;
   this will update the single-file (for GitHub Pages)
   and edition (for the PyPi package) versions.
   Ensure that the emptified build looks how you want it.
2. Update version numbers:
   `setup.py`,
   `cli_docs/conf.py`,
   `util.py`.
3. Push changes to GitHub.
   Check that RTD and GitHub Pages update as desired
   (https://tzk.readthedocs.io/en/latest/,
    https://sobjornstad.github.io/tzk/).
4. Run `publish.sh`, which will upload the latest package version to PyPi.
