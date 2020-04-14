import { BaseML } from './base.js';
export { CommunityML };

const Graph = require('graphology');
import { connectedComponents } from 'graphology-components';
import louvain from 'graphology-communities-louvain';
import subGraph from 'graphology-utils/subgraph';

class CommunityML extends BaseML {
  constructor (mgraph) { // receives a graphology graph
    super(mgraph);
    this.mltype = 'community';
  }
  mkMLSequence () {
    this.separateComponent();
    let ml = [this.mgraph, this.mgraph_];
    let comss = [];
    while ( ml[ ml.length - 1 ].order !== ml[ ml.length - 2 ].order ) {
      let g = new Graph(); // graph of new level
      let g_ = ml[ ml.length - 1];  // graph of previous level
      if (g_.size === 0) {
        break;
      }
      // 1) get communities
      let com = this.getCommunities(g_);
      comss.push(com);
      // 2) collapse communities into metanodes
      this.collapseCommunities(g, g_, com);
      ml.push(g);
    }
    this.ml = ml;
    this.comss = comss;
    // 5) additional level
    this.mkAdditionalLevel();
  }
  collapseCommunities (g, g_, com) {
    for (let i = 0; i < com.coms.length; i++) {
      let preds = com.coms_[ com.coms[i] ];
      let sources = Array.prototype.concat.apply(
        [],
        preds.map( p => g_.getNodeAttribute(p, 'sources') )
      );
      let names = Array.prototype.concat.apply(
        [],
        preds.map( p => g_.getNodeAttribute(p, 'names'))
      );
      g.addNode(
        i,
        {
          preds: preds,
          sources: sources,
          names: names,
        }
      );
      preds.forEach( n => g_.setNodeAttribute(n, 'succ', i) );
    }
    // 3) add nodes not matched:
    let collapsed = Array.prototype.concat.apply(
      [],
      com.coms.map( c => com.coms_[c] )
    );
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
    // 4) map links from nodes to metanodes:
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
  }
  mkAdditionalLevel () {
    let keylevel = this.ml[2];
    // 1) get their predecessors
    let comss = [];
    keylevel.forEachNode( (n, a) => {
      let preds = a.preds;
      // 2) make subgraph with each
      let subgraph = subGraph(this.mgraph_, preds);
      // 3) make community detection in each
      let com = this.getCommunities(subgraph);  // dict: each key is a participant, each value a community
      comss.push(com);
    });
    let coms = this.joinComs(comss);
    this.comss.push(coms);
    // let g_ = subgraph;
    let g = new Graph(); // graph of new level
    this.collapseCommunities(g, this.ml[1], coms);
    this.ml.splice(2, 0, g);
    // iterate over g to set successor in ml[3]
    let mpred = [];
    g.forEachNode( (n, a) => {
      let pred = a.preds[0];
      // whichever node of keylevel that has pred is the successor
      let succ;
      keylevel.forEachNode( (n_, a_) => {
        if (a_.preds.includes(pred)) {
          succ = n_;
        }
      });
      g.setNodeAttribute(n, 'succ', succ);
      mpred.push([n, succ]);
    });
    // iterate over keylevel to set predecessors in keylevel
    keylevel.forEachNode( (n, a) => {
      let mp = mpred.filter( pred => pred[1] === n );
      let mp_ = mp.map( pred => pred[0] );
      keylevel.setNodeAttribute(n, 'pred', mp_);
    });
  }
  joinComs (comss) {
    console.log('coms ----> ', comss);
    let coms = [];
    let coms_ = {};
    let part_com = {};
    for (let i = 0; i < comss.length; i++) {
      let mcoms = comss[i];
      coms = coms.concat(mcoms.coms);
      mcoms.coms.forEach( c => {
        coms_[c] = mcoms.coms_[c];
      });
      Object.keys(mcoms.part_com).forEach( p => {
        part_com[p] = mcoms.part_com[p];
      });
    }
    return {
      coms_,
      coms,
      part_com,
    };
  }
  getCommunities (g_) {
    let part_com = louvain(g_);  // dict: each key is a participant, each value a community
    let k = Object.values(part_com);
    let coms = [...new Set(k)];
    let coms_ = coms.reduce( (t, c) => {
      t[c] = [];
      return t;
    }, {});
    g_.forEachNode( n => {
      let com = part_com[n];
      coms_[com].push(n);
    });
    return {
      coms_,
      coms,
      part_com,
    };
  }
  getCommunityNames (cid) {
    return this.coms_[cid].map( p => this.mgraph_.getNodeAttribute(p, 'name') );
  }
}
