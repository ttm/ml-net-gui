## multilevel BiNetViz
This repository holds the migration of code in three repositories which provided:
1. A FeathersJS backend (in `server/`).
2. A Nuxt.js frontend (in `frontend/`.
3. A Flask auxiliary server to perform less trivial or computationaly intensive calculations (in `aux_server`).


To bootstrap the system, your best friends are:
1. The install and run targets in the Makefile for each of the components listed above.  (e.g. `make aux-server-install` and `make aux-server-run`)
2. The other targets in the Makefile are meant to help in specific situations.
3. MongoDB management. Suggestion: install the Robo 3T, which was used throughout the develoment of this software.


### contact

Send me a message, open an issue in this repo,
or message Cristina Ferreira de Oliveira and Alan Valejo,
researchers at ICMC/USP (VICG and Labic)

:::
