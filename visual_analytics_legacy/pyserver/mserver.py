from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as n, networkx as x, nltk as k

# repo ttm/nettext-pyserver
app = Flask(__name__)
CORS(app)

@app.route("/mynsaFoo/", methods=['POST'])
def geneData():
    r = request.get_json()
    print(r)
    r['myreceived'] = 'ok'
    return jsonify(r)
