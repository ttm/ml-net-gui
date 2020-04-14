export { BaseML };

const Graph = require('graphology');
import {connectedComponents} from 'graphology-components';

class BaseML {
  constructor (mgraph) { // receives a graphology graph
    this.mgraph = mgraph;
    this.mgraph_ = mgraph;
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
    console.log('implement me in child class');
  }
  separateComponent () {
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
    this.mgraph.forEachNode( (n, a) => {  // should be separate because not getting component, but preparing graph for ml. TTM
      this.mgraph.setNodeAttribute(n, 'sources', [n]);
      this.mgraph.setNodeAttribute(n, 'names', [a.name]);
    });
    let mgraph_ = this.mgraph.copy();
    let exnodes = [];
    if ( this.components.length > 1 ) {
      for (let i = 1; i < this.components.length; i++) {
        let nodes = this.components[i];
        exnodes = exnodes.concat(nodes);
      }
    }
    exnodes.forEach( n => {
      mgraph_.dropNode(n);
    });
    this.mgraph_ = mgraph_;
    this.exnodes = exnodes;
  }
}

