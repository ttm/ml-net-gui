# hold here only the routines used in the models
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

import numpy as n, networkx as x
import warnings

warnings.filterwarnings('ignore')

keys=tuple(sys.modules.keys())
for key in keys:  # for correct and full update of the package if changed
    if ("ml" in key) or ("multilevel" in key):
        del sys.modules[key]
import multilevel as ml
mkSafeFname = ml.utils.mkSafeFname

@app.route("/test/", methods=['POST'])
def atest():
    print('man')
    return 'you'
