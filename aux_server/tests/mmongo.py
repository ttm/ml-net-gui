# from pymodm import connect
# 
# connect('mongodb://localhost:27017/mmongoDatabase', alias='mm-app')
import sys
keys=tuple(sys.modules.keys())
for key in keys:
    if ("ml" in key) or ("multilevel" in key):
        del sys.modules[key]
import multilevel as ml, networkx as x, pickle, os
# db=ml.db.MongoConnect()
# db.connect()
# 
# pop = ml.db.PopulateNetworks()
# pop.populate()
