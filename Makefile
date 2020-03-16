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

#######
# auxiliary targets:
# create binomial/random bipartite networks in aux_server/data/
mk-random-nets:
	python3 aux_server/utils/generateNcol.py

# example usage of mlpb, implemented in the aux_server/server.py, is in:
# aux_server/utils/IOmlpb.py



