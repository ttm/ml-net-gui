import sys
keys=tuple(sys.modules.keys())
for key in keys:
    if ("ml" in key) or ("multilevel" in key):
        del sys.modules[key]
import multilevel as ml, networkx as x
# g = ml.parsers.GMLParser('/home/renato/Dropbox/Public/doc/vaquinha/FASE1/aa.gml').g

mls = ml.basic.MLS1()
g = ml.parsers.GMLParser(mls.nets[1]).g
dim = 3
level = 0
layout = 'kamada'
method = 'lab'

mls = ml.basic.MLS2()
mls.setLayout(layout)
mls.setDim(dim)
mls.setNetwork(g)
mls.mkMetaNetwork(level, method)
mls.mkLayout(level)
mls.mkLayout(level+1)
mls.mkLevelLayers()
