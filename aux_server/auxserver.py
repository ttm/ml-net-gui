# hold here only the routines used in the models
import sys
import os
import warnings
import json
from io import StringIO
from bson.objectid import ObjectId

from flask import Flask, jsonify, request
from flask_cors import CORS

import numpy as n
import networkx as x

app = Flask(__name__)
CORS(app)

warnings.filterwarnings('ignore')

keys = tuple(sys.modules.keys())
for key in keys:  # for correct and full update of the package if changed
    if ("ml" in key) or ("multilevel" in key):
        del sys.modules[key]
import multilevel as ml
mkSafeFname = ml.utils.mkSafeFname

DB = ml.db.Connection()


@app.route("/test/")
def atest():
    print('man')
    return 'you'


# for the multilevel2/topdown model and page (check frontend):
@app.route("/biMLDBgetinfo/", methods=['POST'])
def biMLDBgetinfo():
    netid = request.form['netid']
    query = {'_id': ObjectId(netid), 'layer': 0}
    network_ = DB.networks.find_one(query)
    data = network_['data']
    links = n.loadtxt(StringIO(data), skiprows=0, dtype=float).astype(int)
    nnodes = len(set(links[:, 0]).union(links[:, 1]))
    fltwo = len(set(links[:, 0]))
    info = {
        'n2': nnodes - fltwo,
        'n1': fltwo,
        'l': len(links)
    }
    return jsonify(info)


@app.route("/biMLDBtopdown/", methods=['POST'])
def biMLDBtopdown():
    bi = parseBi(request)
    globals().update(bi)
    netid = request.form['netid']
    # dim = int(request.form['dim'])

    dname = './mlpb/' + mkSafeFname(netid) + mkSafeFname(str(bi))
    if not os.path.isdir(dname):
        DB.dumpFirstNcol(netid)
        fname = './mlpb/input/input-moreno.json'
        with open(fname, 'r') as f:
            c = json.load(f)

        c['directory'] = dname
        c['input'] = './mlpb/input/%s.ncol' % (mkSafeFname(netid),)
        nvertices = DB.getBiNvertices(netid)
        c['vertices'] = nvertices

        c['reduction_factor'] = [float(i) for i in reduction]
        c['max_levels'] = [int(i) for i in max_levels]
        c['global_min_vertices'] = [int(i) for i in global_min_vertices]
        c['matching'] = matching
        c['similarity'] = similarity
        c['upper_bound'] = [float(i) for i in upper_bound]
        c['itr'] = [int(i) for i in itr]
        c['tolerance'] = [float(i) for i in tolerance]
        fname2 = './mlpb/input/input-moreno3.json'
        with open(fname2, 'w') as f:
            json.dump(c, f)

        os.system('python3 ./mlpb/coarsening.py -cnf ' + fname2)
        os.system('cp ./mlpb/input/'+mkSafeFname(netid)+'.ncol '+dname+'/moreno-0.ncol')

    fnames = [i for i in os.listdir(dname) if i.endswith('.ncol')]
    fnames.sort()
    count = 0
    layers = []
    for fname in fnames:
        fname = dname+'/'+fname
        links = n.loadtxt(fname, skiprows=0, dtype=float).astype(int)
        nnodes = len(set(links[:, 0]).union(links[:, 1]))
        fltwo = len(set(links[:, 0]))
        links = links.tolist()
        if count != 0:  # level 0 has no such files:
            sou = parseMlTxt(fname.replace('.ncol', '.source'))
            pred = parseMlTxt(fname.replace('.ncol', '.predecessor'))
            suc = parseMlTxt(fname.replace('.ncol', '.successor'), False)
        else:
            sou = pred = suc = [[]] * nnodes
        if count == len(fnames) - 1:
            suc = [None] * nnodes
        layer_ = {
            'links': links, 'sources': sou,
            'children': pred, 'parents': suc,
            'layer': count, 'fltwo': fltwo
        }
        layers.append(layer_)
        count += 1

    return jsonify(layers)


def parseBi(request):
    reduction = request.form.getlist('bi[reduction][]')
    max_levels = request.form.getlist('bi[max_levels][]')
    global_min_vertices = request.form.getlist('bi[global_min_vertices][]')
    matching = request.form.getlist('bi[matching][]')
    similarity = request.form.getlist('bi[similarity][]')
    upper_bound = request.form.getlist('bi[upper_bound][]')
    itr = request.form.getlist('bi[itr][]')
    tolerance = request.form.getlist('bi[tolerance][]')

    bi = locals()
    del bi['request']
    return bi


def parseMlTxt(fname, split=True):
    with open(fname, 'r') as f:
        data = f.read()
    if split:
        return [[int(i) for i in j.split(' ') if i] for j in data.split('\n') if j]
    else:
        return [int(i) for i in data.split('\n') if i]


@app.route("/layoutOnDemand/", methods=['POST'])
def layoutOnDemand():
    # print(request.form)
    r = request.get_json()
    l = r['layout']
    d = r['dim']
    nodes = r['nodes']
    links = r['links']
    g = x.Graph()
    for n_ in nodes: g.add_node(n_)
    for ll in links: g.add_edge(ll[0], ll[1], weight=ll[2])
    if 'bipartite' in l:
        l_ = layouts[l](g, r['l0'])
    else:
        l_ = layouts[l](g, dim=d)
    l__ = n.array([l_[i] for i in nodes])
    if l__.shape[0] != 1:
        l__[:, 0] -= n.min(l__[:, 0])
        l__[:, 1] -= n.min(l__[:, 1])
        l__[:, 0] /= n.max(n.abs(l__[:, 0]))
        l__[:, 1] /= n.max(n.abs(l__[:, 1]))
        l__[:, 0] *= 2
        l__[:, 1] *= 2
        l__[:, 0] -= 1
        l__[:, 1] -= 1
    if r['lonely']:
        l__[:, 1] *= 0.9
        l__[:, 1] += 0.1
    # pos = {n: l_[n].tolist() for n in nodes}
    # pos = l__.tolist()
    pos = {n: l__[i].tolist() for i, n in enumerate(nodes)}
    return jsonify(pos)


layouts = {
        'circular' : x.layout.circular_layout,
        'fruch' : x.layout.fruchterman_reingold_layout, # same as spring?
        'kamada' : x.layout.kamada_kawai_layout, # cool
        'random' : x.layout.random_layout,
        'shell' : x.layout.shell_layout, # arrumar 3d
        'spectral' : x.layout.spectral_layout,
        'spring' : x.layout.spring_layout,
        'h-bipartite': lambda g, l0 : x.layout.bipartite_layout(g, l0, 'horizontal'),
        'v-bipartite': lambda g, l0 : x.layout.bipartite_layout(g, l0),
        }

