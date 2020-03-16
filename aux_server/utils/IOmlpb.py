import json, os

fname = '../server/mlpb/input/input-moreno.json'
with open(fname, 'r') as f:
    c = json.load(f)

c['directory'] = '../server/mlpb/abacaxi'
c['input'] = '../server/mlpb/input/moreno.ncol'

fname2 = '../server/mlpb/input/input-moreno2.json'
with open(fname2, 'w') as f:
    json.dump(c, f)

os.system('python3 ../server/mlpb/coarsening.py -cnf ' + fname2)
