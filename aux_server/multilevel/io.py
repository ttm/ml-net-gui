from . import db, basic

def getNetworkAndLayout(net, method, layer, layout, dim, net_prev=None):
    # verifica se existe a rede ou precisa fazer (coarsen) e salvar
    tnet = db.getNetLayer(net, method, layer)
    print(tnet_, tnet_.g.number_of_nodes(), tnet_.g.number_of_edges())
    if not tnet:
        # basic.
        pass
    # verifica se existe o layout ou precisa fazer e salvar
    print(db.getNetLayout(net, layout, dim, method, layer))
