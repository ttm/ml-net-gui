# make sure mongod is running for server, aux server, and frontend.
# if the `mongod` executable is not associated with a PID, install and start mongod
# as needed for your system:
mongo-ok:
	ps ax | grep mongod

aux-install:
	pipenv run pip3 install -e ./aux_server/

aux-run:
	pipenv run /bin/sh -c "cd aux_server && ./runme.sh"

aux: aux-install aux-run

# TODO: target `aux-test`, using e.g. the routines in the aux_server/tests/ scripts.

server-install:
	cd server && npm install && cd ..

server-run:
	cd server && npm start && cd ..

server: server-install server-run


frontend-install:
	cd frontend && npm install && cd ..

frontend-run:
	cd frontend && npm run dev && cd ..

frontend: frontend-install frontend-run


# visual analytics app, independent from previous targets:   ############################
va-legacy-install:
	curl https://install.meteor.com/ | sh
	cd visual_analytics_legacy && meteor npm install --save @babel/runtime tone pixi.js pixi-projection mathjs graphology-layout graphology-layout-forceatlas2 graphology jsnetworkx fuse.js graphology-components graphology-communities-louvain graphology-utils

va-legacy:  # will finish to install and run
	cd visual_analytics_legacy && meteor

# JS implementation without framework:
va-install:
	cd visual_analytics && npm i

va:
	cd visual_analytics && npm run x

# executes server-side tests and linting of all code,
# for client-side tests, open localhost:8080/test.html:
va-dev:
	cd visual_analytics && npm run runme

va-test:
	cd visual_analytics && npm test

# this must always pass or something is wrong with the algorithms:
va-test_:
	cd visual_analytics && npm run test_

# testing of the client code must be performed on the client. The /test page should be accessed,
# e.g. https://0.0.0.0:8080/test/


# auxiliary targets:   ################################################################
# create binomial/random bipartite networks in aux_server/data/
mk-random-nets:
	python3 aux_server/utils/generateNcol.py

# example usage of mlpb, implemented in the aux_server/server.py, is in:
# aux_server/utils/IOmlpb.py



