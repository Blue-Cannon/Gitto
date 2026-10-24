# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Gitto'
copyright = '2026, Rogge Ramos'
author = 'Rogge Ramos'
release = '0.1.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    # Markdown support
    'myst_parser',

    # Python code docs - reads your docstrings
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',  # for Google/NumPy style docstrings
    'sphinx.ext.viewcode',  # adds [source] links
    'sphinx.ext.autosummary',

    # Useful extras
    'sphinx.ext.intersphinx', # link to Python docs
    'sphinx.ext.todo',
    'sphinx_copybutton', # copy button on code blocks

    # Contrib Sphinx
    "sphinxcontrib.youtube", # For embedding YouTube
    "sphinxcontrib.images", # For showing a image
    "sphinxcontrib.phpdomain", # A PHP Domain
]

source_suffix = ['.rst', '.md']

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "tasklist",
    "fieldlist",
]

# Optional but recommended for furo theme
html_theme = 'sphinx_nefertiti'

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output
 
html_static_path = ['_static']
