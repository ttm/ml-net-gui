[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## multilevel BiNetViz
This repository holds the migration of code in three repositories which provided:
1. A FeathersJS backend (in `server/`).
2. A Nuxt.js frontend (in `frontend/`.
3. A Flask auxiliary server to perform less trivial or computationally intensive calculations (in `aux_server`).


To bootstrap the system, your best friends are:
1. The install and run targets in the Makefile for each of the components listed above.  (e.g. `make aux-server-install` and `make aux-server-run`)
2. The other targets in the Makefile are meant to help in specific situations.
3. MongoDB management. Suggestion: install the Robo 3T, which was used throughout the development of this software.


This repository is proposed as separation of the multilevel strategies from the other visualization interfaces
developed by the team.
Thus, this repository only contains the initial versions of the interfaces (with boxes or hybrid edges),
and should contain enhanced versions of them as they come into existence.

A an experimental collection of Meteor.js apps were developed using multilevel strategies for analysis, modification and harnessing of social networks.
One of its versions, potentially having pure-javascript (no Python needed) implementations of networks measurements and multilevel representations,
layouts, ploting with Pixi.js and animations, projections, WebGL particle system, sounds with Tone.js, and performance timing.

### installation
The data visualization interfaces should be listed in the URL output by `make frontend-install && make frontend-run`.
It needs the backend and auxiliary servers, thus: `make backend-install && make backend-run` and `make aux-server-install && make aux-server-run`.
You'll probably use three terminals to monitor each of these components.
Suggestion: use Byobu, specially if the server is kept in a remote machine or should be persistent.

For the visual analytics (intended) legacy app: `make va-legacy-install && make va-legacy`.
Check `visual_analytics_legacy/README.md` to know of some links to visit and things to explore.
A bare node.js version of this app is being put together in `visual_analytics/`, to use it:
`make va-install && make va`.

### provenance
This repo steams from three repos, which will be refactored and/or split in other repos:
- git@gitlab.com:renato.fabbri/nettext-server.git
- git@gitlab.com:renato.fabbri/nettext-pyserver.git
- git@github.com:ttm/netText.git

### license
GPL v3 (GNU General Public License, vesion 3).


### contact
Send me a message, open an issue in this repo,
or message Cristina Ferreira de Oliveira and Alan Valejo,
researchers at ICMC/USP (VICG and Labic)

:::
