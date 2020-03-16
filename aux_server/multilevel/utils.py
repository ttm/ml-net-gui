import os, networkx as x
fpath = os.path.dirname(os.path.abspath(__file__))
def absoluteFilePaths(directory):
   for dirpath,_,filenames in os.walk(directory):
       for f in filenames:
           yield os.path.abspath(os.path.join(dirpath, f))

def mkNetFromEdges(edges):
    g = x.Graph()
    for e in edges:
        if e[0] in g.nodes():
            g.node[e[0]]["weight"]+=1
        else:
            g.add_node(e[0], weight=1.)
        if e[1] in g.nodes():
            g.node[e[1]]["weight"]+=1
        else:
            g.add_node(e[1], weight=1.)

        if g.has_edge(e[0], e[1]):
            g[e[0]][e[1]]["weight"]+=1
        else:
            g.add_edge(e[0], e[1], weight=1.)
    return g

def mkDiNetFromEdges(edges):
    g = x.DiGraph()
    for e in edges:
        if e[0] in g.nodes():
            g.node[e[0]]["weight"]+=1
        else:
            g.add_node(e[0], weight=1.)
        if e[1] in g.nodes():
            g.node[e[1]]["weight"]+=1
        else:
            g.add_node(e[1], weight=1.)

        if g.has_edge(e[0], e[1]):
            g[e[0]][e[1]]["weight"]+=1
        else:
            g.add_edge(e[0], e[1], weight=1.)
    return g

def mkSafeFname(filename):
    keepcharacters = ('.','_')
    fname = "".join(c for c in filename if c.isalnum() or c in keepcharacters).rstrip()
    return fname

