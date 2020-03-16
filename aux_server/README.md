# mls
multilevel strategies for optimization and visualization

### install with
    $ pip install multilevel
or

    $ python setup.py multilevel

For greater control of customization, hacking and debugging, clone the repo and install with pip with -e:

    $ git clone https://github.com/ttm/multilevel.git
    $ pip3 install -e <path_to_repo>

This install method is especially useful when reloading modified module in subsequent runs of music.


### starting Flask server
install Flask with pip

  $ cd server/

export the mode (auto-reload and debug) and app:
  $ export FLASK_APP=first.py

if you are hacking selfcomp:
  $ export FLASK_ENV=development

and start the server with
  $ flask run --host=0.0.0.0 --port=80

works with Babylon.js to enable WebGL visualizations.

:::
