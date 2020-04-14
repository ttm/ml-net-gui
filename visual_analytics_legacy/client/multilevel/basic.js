export { BasicML };

const Graph = require('graphology');
import {connectedComponents} from 'graphology-components';


class BasicML {
  constructor (mgraph) { // receives a graphology graph
    this.mgraph = mgraph;
    this.mkMLSequence();
    this.mkCascade();
  }
  mkCascade () {
    // from most reduced level down:
    // get participants what are not meta participants:
    // they must be initialized in this level
    //   initialized by friends which are initialized
    let nodecoms = {};
    this.ml[1].forEachNode( n => {
      nodecoms[n] = {
        from: [],
        to: [],
      };
    });
    let activated = []; 
    let names = []; 
    let levels = {};
    let i = this.ml.length - 2;
    while ( i >= 1 ) {
      let acts = [];
      let actns = [];
      let tos = [];
      let froms = [];
      let tons = [];
      let fromns = [];
      let g = this.ml[i];
      g.forEachNode( (n, a) => {
        // console.log('ttttttt node:', n, a);
        if (a.sources.length == 1) { // candidate to be activated
          let s = a.sources[0];
          if (!activated.includes(s)) { // should be activated
            activated.push(s);
            let name = a.names[0];
            names.push(name);
            let to = [];
            let from = [];
            let ton = [];
            let fromn = [];
            this.ml[1].forEachNeighbor(s, (nn, na) => {
              if (activated.includes(nn)) { // this neighbor should activate participant n
                nodecoms[s].from.push(nn)
                from.push(nn);
                fromn.push(na.name);
              } else {  // this neightbor may be activated by this node, after it is activated
                nodecoms[s].to.push(nn)
                to.push(nn);
                ton.push(na.name);
              }
            });
            acts.push(s);
            actns.push(name);
            tos.push(to);
            froms.push(from);
            tons.push(ton);
            fromns.push(fromn);
          }
        }
      });
      levels[i] = {};
      levels[i].act = acts;
      levels[i].actn = actns;
      levels[i].to = tos;
      levels[i].ton = tons;
      levels[i].from = froms;
      levels[i].fromn = fromns;
      i--;
    }
    // this.activated = activated;
    // this.anames = names;
    // this.nodecoms = nodecoms;
    this.levels = levels;
  }
  mkMLSequence () {
    // separate nodes that are not connected:
    this.components = connectedComponents(this.mgraph);
    let cs = [];
    this.components.forEach( c => {
      let names = [];
      c.forEach( p => {
        names.push(this.mgraph.getNodeAttribute(p, 'name'));
      });
      cs.push(names);
    });
    this.cs = cs;
    // clone graph and make auxiliary attributes so each lavel have them:
    this.mgraph.forEachNode( (n, a) => {
      this.mgraph.setNodeAttribute(n, 'sources', [n]);
      this.mgraph.setNodeAttribute(n, 'names', [a.name]);
    });
    this.mgraph_ = this.mgraph.copy();
    // remove nodes not in gratest connected component:
    let exnodes = [];
    if ( this.components.length > 1 ) {
      for (let i = 1; i < this.components.length; i++) {
        let nodes = this.components[i];
        exnodes = exnodes.concat(nodes);
      }
    }
    exnodes.forEach( n => {
      this.mgraph_.dropNode(n);
    });
    let ml = [this.mgraph, this.mgraph_];
    while ( ml[ ml.length - 1 ].order !== ml[ ml.length - 2 ].order ) {
      let g = new Graph();
      let count = 0;
      let nodes = [];
      ml[ ml.length - 1 ].forEachEdge( (k, a, s, t, sa, ta) => { // basic matching
        if ( !(nodes.includes(s) || nodes.includes(t)) ) {
          g.addNode(
            count,
            {
              preds: [s, t],
              sources: sa.sources.concat(ta.sources),
              names: sa.names.concat(ta.names),
            }
          );
          nodes.push(s);
          nodes.push(t);
          ml[ ml.length - 1 ].setNodeAttribute(s, 'succ', count);
          ml[ ml.length - 1 ].setNodeAttribute(t, 'succ', count);
          count++;
        }
      });
      ml[ ml.length - 1 ].forEachNode( (n) => { // add nodes not matched:
        if ( !nodes.includes(n) ) {
          // console.log('found not matched');
          g.addNode(
            'prev_' + n,
            {
              preds: [n],
              sources: ml[ ml.length - 1].getNodeAttribute(n, 'sources'),
              names: ml[ ml.length - 1].getNodeAttribute(n, 'names'),
            }
          );
          ml[ ml.length - 1 ].setNodeAttribute(n, 'succ', 'prev_' + n);
        }
      });
      ml[ ml.length - 1 ].forEachEdge( (k, a, s, t, sa, ta) => { // add links:
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
