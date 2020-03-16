import networkx as x, numpy as n, pymongo, pickle
from bson.objectid import ObjectId

class Connection:
    def __init__(self):
        mclient = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = mclient['boilerplate']
        # the networks collection keeps both uncoarsened and coarsened networks
        # a layer is a network with specific layer number and coarsening method
        # layer == 0 for the original (uncoarsened) network
        self.networks = self.db['networks']
        # any network may have a layout given by the network _id and the layout method
        self.layouts = self.db['layouts']

db = Connection()

class MLS:
    """
    Multilevel Strategy class

    """
    def __init__(self):
        pass
    def setNetwork(self, network):
        pass
    def coarsen(self):
        pass
    def uncoarsen(self):
        self._project()
        pass
    def _project(self):
        pass
    def _refine(self):
        pass
    def _match(self):
        pass
    def _collapse(self):
        pass

class MLS1:
    """
    Multilevel Strategy class

    """
    def __init__(self):
        self.gs = {}
        self.npos = {}
        self.status = ''
        self.nets = [
                '/home/renato/repos/multilevel/data/aa.gml',
                '/home/renato/repos/multilevel/data/automata18022013.gml',
                '/home/renato/repos/multilevel/data/GabiThume_huge_100002011676407_2013_02_19_04_40_b60204320447f88759e1efe7b031357b.gml',
                '/home/renato/repos/multilevel/data/LarissaAnzoateguihuge_1760577842_2013_02_20_02_07_f297e5c8675b72e87da409b2629dedb3.gml',
                '/home/renato/repos/multilevel/data/PedroRochaAttaktorZeros10032013.gml',
        ]
        self.layouts = {
                'circular' : x.layout.circular_layout,
                'fruch' : x.layout.fruchterman_reingold_layout, # same as spring?
                'kamada' : x.layout.kamada_kawai_layout, # cool
                'random' : x.layout.random_layout,
                'shell' : x.layout.shell_layout, # arrumar 3d
                'spectral' : x.layout.spectral_layout,
                'spring' : x.layout.spring_layout,
        }
        self.layout = 'spring'
        self.dim = 3
    def setLayout(self, layout):
        assert layout in self.layouts
        self.layout = layout
    def setDim(self, dim):
        assert dim in {2,3}
        self.dim = dim
    def setNetwork(self, network):
        self.g = network
        self.gs[0] = self.g
        self.nodes = tuple(self.g.nodes())
        self.nodes_ = set(self.nodes)
        self.status += 'networkset|'
    def mkMetaNetwork(self, level=-1, method='mod'):
        """ level here is of the network to be coarsened """
        assert 'networkset' in self.status
        if level == -1:
            level = len(self.npos) -1
        self._match(level, method)  # make metaNodes
        self._collapse(level)  # make metaLinks
    def _match(self, level, method):
        if level not in self.gs:
            self.mkMetaNetwork(level -1, method)
            self.mkLayout(level-1)
        g_ = self.gs[level]
        if 'kclick' in method:  # k-click communities
            k_ = int(method.replace('kclick', ''))
            svs = [i for i in x.algorithms.community.k_clique_communities(g_, k_)]
            gg = x.Graph()
            for i, sv in enumerate(svs):
                gg.add_node(i, weight=len(sv), children=sv)
            self.gs[level+1] = gg
        elif method == 'lab':  # label propagation
            svs = [i for i in x.algorithms.community.label_propagation_communities(g_)]
            gg = x.Graph()
            for i, sv in enumerate(svs):
                gg.add_node(i, weight=len(sv), children=sv)
            self.gs[level+1] = gg
        elif method == 'cp':
            sub = [i for i in x.connected_component_subgraphs(g_)]
            g = sub[0]
            per = set(x.periphery(g))
            if len(sub) > 1:
                for per_ in sub[1:]:
                    per.update(per_.nodes())
            cen = set(x.center(g))
            pc = per.union(cen)
            nodes = set(g.nodes())
            inter = nodes.difference(pc)
            gg = x.Graph()
            gg.add_node(0, label='center', weight=len(cen), children=cen)
            gg.add_node(1, label='intermediary', weight=len(inter), children=inter)
            gg.add_node(2, label='periphery', weight=len(per), children=per)
            self.gs[level+1] = gg
        self._mkNodeMetaNodeDict(level)
    def _findMetaNode(self, node, level=0):
        for node_ in self.gs[level+1].nodes():
            if node in self.gs[level+1][node_]['children']:
                return node_
    def _mkNodeMetaNodeDict(self, level):
        self.nmn = {}
        for node_ in self.gs[level+1]:
            ch = self.gs[level+1].nodes[node_]['children']
            ad = dict.fromkeys(ch, node_)
            self.nmn.update(ad)

    def _collapse(self, level):
        """Make meta-links"""
        # contar as arestas entre os membros dos supervertices
        # ou montar lista com os vizinhos, depois contar quantas vezes cada membro ocorreu
        # ou montar dicionario em que o vertice eh chave e o sv eh o valor, ao iterar pelos vizinhos, jah considerar o sv correspondente
        # ou iterar pelas arestas, convertendo para as meta-arestas
        for e in self.gs[level].edges():
            mv1 = self.nmn[e[0]]
            mv2 = self.nmn[e[1]]
            if mv2 not in self.gs[level+1][mv1]:
                self.gs[level+1].add_edge(mv1, mv2, weight = 0)
            self.gs[level+1][mv1][mv2]['weight'] += 1
    def mkLayout(self, level=0, inherit=1):
        if inherit == 0:
            self.mkRawLayout(level)
        else:
            if level == 0:
                self.mkRawLayout(level)
            else:
                # put vertices in the centroid of its children
                pos_ = []
                for node in self.gs[level].nodes():
                    # if node has children:
                    if len(self.gs[level].nodes[node]['children']) > 0:
                        pos = self.npos[level-1][n.array(list(self.gs[level].nodes[node]['children']))]
                        pos_.append(pos.mean(0))
                    else:
                        pos_.append([0,0,0])
                self.npos[level] = n.array(pos_)
    def mkRawLayout(self, level):
        l = self.layouts[self.layout](self.gs[level], dim=self.dim)
        nodepos = n.array([l[i] for i in self.nodes])
        # edges = [list(i) for i in g.edges]
        # nodepos = (2*n.random.random((nn,3))-1).tolist()
        # self.llayouts[level] = (nodepos, edges))
        self.npos[level] = nodepos

class MLS2(MLS1):
    def __init__(self):
        MLS1.__init__(self)
    def mkLevelLayers(self, sep=1, axis=2):
        """
        sep : separation in normalized units (?)
        axis : 0, 1, 2 are x, y, z

        """
        for level in self.npos:
            if level != 0:
                self.npos[level][:,axis] += level * sep
        self.npos_ = n.vstack(self.npos.values())
        es = []
        disp = 0
        for g in range(len(self.gs)):
            es_ = [(i+disp, j+disp) for i, j in self.gs[g].edges]
            es.extend(es_)
            disp += self.gs[g].number_of_nodes()
        self.edges_ = es

def mkLayout(netid, method, layout, dimensions, layer, network):
    if layer == 0:
        layouts = {
                'circular' : x.layout.circular_layout,
                'fruch' : x.layout.fruchterman_reingold_layout, # same as spring?
                'kamada' : x.layout.kamada_kawai_layout, # cool
                'random' : x.layout.random_layout,
                'shell' : x.layout.shell_layout, # arrumar 3d
                'spectral' : x.layout.spectral_layout,
                'spring' : x.layout.spring_layout,
        }
        assert layout in layouts
        l = layouts[layout](network, dim=dimensions)
        positions = n.array([l[i] for i in network.nodes])
    else:
        # query for layout of precedent layer
        if layer - 1 > 0:
            query = {'uncoarsened_network': ObjectId(netid), 'layer': layer - 1, 'coarsen_method': method}
        else:
            query = {'uncoarsened_network': ObjectId(netid), 'layer': layer - 1}
        network_id = db.networks.find_one(query, {'_id': 1})
        query2 = {'network': network_id['_id'], 'layout_name': layout, 'dimensions': dimensions}
        layout_ = db.layouts.find_one(query2)
        if not layout_:
            raise LookupError('layout of previous level should have been created beforehand')
        prev_positions = pickle.loads(layout_['data'])
        # make mean
        pos_ = []
        for node in network.nodes():
            # if node has children:
            if len(network.nodes[node]['children']) > 0:
                pos = prev_positions[n.array(list(network.nodes[node]['children']))]
                pos_.append(pos.mean(0))
            else:
                raise LookupError('found metanode that came from no node...')
        positions = n.array(pos_)
    return positions

def mkMetaNetwork(network, method):
    meta_network_ = mkMatch(network, method)  # meta nodes
    meta_network = mkCollapse(network, meta_network_)  # + meta links
    return meta_network

def mkMatch(network, method):
    g_ = network
    if 'kclick' in method:  # k-click communities
        # k_ = int(method.replace('kclick', ''))
        svs = [i for i in x.algorithms.community.k_clique_communities(g_, 10)]
        gg = x.Graph()
        for i, sv in enumerate(svs):
            gg.add_node(i, weight=len(sv), children=sv)
    elif method == 'lab':  # label propagation
        svs = [i for i in x.algorithms.community.label_propagation_communities(g_)]
        gg = x.Graph()
        for i, sv in enumerate(svs):
            gg.add_node(i, weight=len(sv), children=sv)
    elif method == 'cp':
        sub = [i for i in x.connected_component_subgraphs(g_)]
        g = sub[0]
        per = set(x.periphery(g))
        if len(sub) > 1:
            for per_ in sub[1:]:
                per.update(per_.nodes())
        cen = set(x.center(g))
        pc = per.union(cen)
        nodes = set(g.nodes())
        inter = nodes.difference(pc)
        gg = x.Graph()
        gg.add_node(0, label='center', weight=len(cen), children=cen)
        gg.add_node(1, label='intermediary', weight=len(inter), children=inter)
        gg.add_node(2, label='periphery', weight=len(per), children=per)
    return gg  # meta-network

def mkCollapse(network, meta_network):
    nmn = {}
    for node_ in meta_network:
        ch = meta_network.nodes[node_]['children']
        ad = dict.fromkeys(ch, node_)
        nmn.update(ad)
    for e in network.edges():
        mv1 = nmn[e[0]]
        mv2 = nmn[e[1]]
        if mv2 not in meta_network[mv1]:
            meta_network.add_edge(mv1, mv2, weight = 0)
        meta_network[mv1][mv2]['weight'] += 1
    return meta_network

