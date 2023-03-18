# wc

See statistics about a folder on your computer: file sizes and line counts.

I use it mostly to see line count for source code of my projects.

The inspiration for this tool is command-line tool `wc -l`.

The difference is:

* it's in the browser, no installation necessary
* better GUI (I hope!)
* ability to interactively exclude some directories from the statistics
* intelligent defaults e.g. not counting lines in binary files, excluding directories like `.gitignore` or `node_modules`

Requires a browser supporting File System API: Chrome, Edge. Sadly not Firefox.
