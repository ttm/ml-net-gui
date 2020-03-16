aux-install:
	pipenv run pip3 install -e ./aux_server/

aux-run:
	pipenv run /bin/sh -c "cd aux_server && ./runme.sh"

aux: aux-install aux-run

server-install:
	cd server && npm install && cd ..

server-run:
	cd server && npm start && cd ..
server: server-install server-run

# create binomial/random bipartite networks in aux_server/data/
mk-random-nets:
	python3 aux_server/utils/generateNcol.py

# example usage of mlpb, implemented in the aux_server/server.py, is in:
# aux_server/utils/IOmlpb.py



