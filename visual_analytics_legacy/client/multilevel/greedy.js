import { BaseML } from './base.js';
export { GreedyML };

const Graph = require('graphology');
import {connectedComponents} from 'graphology-components';

class GreedyML extends BaseML {
  constructor (mgraph) { // receives a graphology graph
    super(mgraph);
    this.mltype = 'greedy';
  }
  mkMLSequence () {
    this.separateComponent();
    let ml = [this.mgraph, this.mgraph_];
    while ( ml[ ml.length - 1 ].order !== ml[ ml.length - 2 ].order ) {
      let g = new Graph(); // graph of new level
      let g_ = ml[ ml.length - 1];  // graph of previous level
      // 1) order nodes by degree
      let nodes = g_.nodes();
      let degrees = nodes.map( n => [n, g_.degree(n)] );
      let degrees_ = degrees.sort( (a, b) => b[1] - a[1] );
      window.nnn = [nodes, degrees, degrees_];
      let collapsed = [];
      // 2) colapse priority to highest degree
      let count = 0;
      degrees_.forEach( nd => {
        let [node, degree] = nd;
        if (collapsed.includes(node)) { // node already collapsed
          return;
        }
        console.log(node, degree, 'yeah');
        let best = ['', 0];
        // 3) highest degree matches highest degree (or greatest edge weight TTM)
        g_.forEachNeighbor( node, (neigh, neigha) => {
          if ( !collapsed.includes(neigh) ) { // not collapsed is candidate, keep record of degree and name
            let tdegree = g_.degree( neigh );
            if ( tdegree > best[0] ) {
              best[1] = tdegree;
              best[0] = neigh;
            }
          }
        });
        if (best[1] > 0) {  // match!
          let sources = g_.getNodeAttribute(node, 'sources').concat(
            g_.getNodeAttribute(best[0], 'sources')
          );
          let names = g_.getNodeAttribute(node, 'names').concat(
            g_.getNodeAttribute(best[0], 'names')
          );
          g.addNode(
            count,
            {
              preds: [node, best[0]],
              sources: sources,
              names: names,
            }
          );

          g_.setNodeAttribute(node, 'succ', count);
          g_.setNodeAttribute(best[0], 'succ', count);

          collapsed.push(node);
          collapsed.push(best[0]);
          count++;
        }
      });
      // 4) add nodes not matched:
      g_.forEachNode( (n) => {
        if ( !collapsed.includes(n) ) {
          g.addNode(
            n,
            {
              preds: [n],
              sources: g_.getNodeAttribute(n, 'sources'),
              names: g_.getNodeAttribute(n, 'names'),
            }
          );
          g_.setNodeAttribute(n, 'succ', n);
        }
      });
      // 5) map links from nodes to metanodes:
      g_.forEachEdge( (k, a, s, t, sa, ta) => { // add links:
        let n1 = sa.succ;
        let n2 = ta.succ;
        // console.log('n1, n2', n1, n2);
        if ( n1 !== undefined && n2 !== undefined && n1 != n2 ) {
          if ( g.hasEdge(n1, n2) ) {
            g.updateEdgeAttribute(n1, n2, 'weight', w => w + 1);
          } else {
            g.addEdge(n1, n2);
          }
        }
      });

      ml.push(g);
    }
    this.ml = ml;
  }
}

