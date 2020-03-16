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

A Meteor.js app was developed using multilevel strategies for analysis, modification and harnessing of social networks,
and might be added or linked to this repo, maybe refactored in to a pure node.js software, with hot-reload, and the needed
libraries: (Pixi.js, Tone.js, the ones for networks).


### installation
The data visualization interfaces should be listed in the URL output by `make frontend-install && make frontend-run`.
It needs the backend and auxiliary servers, thus: `make backend-install && make backend-run` and `make aux-server-install && make aux-server-run`.
You'll probably use three terminals to monitor each of these components.
Suggestion: use Byobu, specially if the server is kept in a remote machine or should be persistent.


### contact
Send me a message, open an issue in this repo,
or message Cristina Ferreira de Oliveira and Alan Valejo,
researchers at ICMC/USP (VICG and Labic)

:::
