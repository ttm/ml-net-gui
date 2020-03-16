aux-server-install:
	pipenv run pip3 install -e ./aux_server/

aux-server-run:
	pipenv run /bin/sh -c "cd aux_server && ./runme.sh"

# run /bin/sh -c "cd /opt/cookie-store/cookiestore/db && ENV=test alembic upgrade heads"


# create binomial/random bipartite networks in aux_server/data/
mk-random-nets:
	python3 aux_server/utils/generateNcol.py

# example usage of mlpb, implemented in the aux_server/server.py, is in:
# aux_server/utils/IOmlpb.py



