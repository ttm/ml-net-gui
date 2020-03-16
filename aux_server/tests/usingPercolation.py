import networkx as x, percolation as p
g=x.erdos_renyi_graph(100, .4)
class NM: pass
nm = NM()
dv=g.degree()
nm.degrees_ = list(dict(dv).values())
nm.N=g.number_of_nodes()
nm.E=g.number_of_edges()
nm.degrees=dict(g.degree())
sec = p.analysis.sectorialize.NetworkSectorialization(nm, metric='d')

