# hold here only the routines used in the models
import sys
import warnings

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

import numpy as n, networkx as x

app = Flask(__name__)
CORS(app)

warnings.filterwarnings('ignore')

keys=tuple(sys.modules.keys())
for key in keys:  # for correct and full update of the package if changed
    if ("ml" in key) or ("multilevel" in key):
        del sys.modules[key]
import multilevel as ml
mkSafeFname = ml.utils.mkSafeFname

@app.route("/test/")
def atest():
    print('man')
    return 'you'
