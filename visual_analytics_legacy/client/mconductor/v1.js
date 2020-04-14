import { MConductor } from './basic.js';
export { MConductor1 };

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');

const graph = new Graph();
graph.addNode('John');
graph.addNode('Martha');
graph.addEdge('John', 'Martha');

console.log('Number of nodes', graph.order);
console.log('Number of edges', graph.size);

graph.forEachNode(node => {
  graph.forEachNeighbor(node, neighbor => console.log(node, neighbor));
});

window.ggy = {
  Graph, forceAtlas2, FA2Layout, random, circular
};

class MConductor1 extends MConductor {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
  }
  withData () {
    // plot a square where nodes should be
    // (a container with gray background)
    __mc.mkRefRect();
    // plot losd with elements from pixie
    __mc.mkAtlas();


    __mc.mkNodes();
    // plot relations
    __mc.mkLinks();
  }
  mkAtlas () {
    window.mgraph = new Graph();
    losd.forEach( p => {
      window.mgraph.addNode( p.s.value );
    });
    losd.forEach( p => {
      let name1 = p.n.value;
      losd.forEach( p2 => {
        let name2 = p2.n.value;
        if (name1 === name2 || name1 === 'Renato Fabbri' || name2 === 'Renato Fabbri') {
          window.mgraph.addEdge(p.s.value, p2.s.value);
        }
      });
    });
    window.saneSettings = forceAtlas2.inferSettings(window.mgraph);
    random.assign(window.mgraph);
    window.positions = forceAtlas2(window.mgraph,
      {iterations: 150, settings: window.saneSettings}
    );
    window.positions2 = random(window.mgraph);
    window.positions3 = circular(window.mgraph);
    window.positions_ = this.scale(window.positions); // scales between [0, 1] for both x and y
    // __mc.frame1.nodes.forEach( (n) => {
    //   n.x = this.scale(window.positions_[n.muri].x, 'w'); // in width being used
    //   n.y = this.scale(window.positions_[n.muri].y, 'h'); // in height being used
    // });
  }
  scale (val, dim = 'w') {
    let val_;
    if ( typeof val !== 'number' ) {
      const k = Object.values(val);
      const kx = k.map( kk => kk.x );
      const ky = k.map( kk => kk.y );
      const maxx = Math.max( ...kx );
      const minx = Math.min( ...kx );
      const maxy = Math.max( ...ky );
      const miny = Math.min( ...ky );
      const keys = Object.keys(val);
      val_ = {};
      for ( let i = 0; i < keys.length; i++) {
        const key = keys[i];
        val_[key] = {};
        val_[key].x = (val[key].x - minx) / (maxx - minx);
        val_[key].y = (val[key].y - miny) / (maxy - miny);
      }
      return val_;
    }
    let dc = __mc.frame1.container.refrect;
    if (dim === 'w') {
      val_ = val * ( dc[2] ) * 0.9 + dc[0] + ( dc[2] ) * 0.05;
    } else if (dim === 'h') {
      val_ = val * ( dc[3] ) * 0.9 + dc[1] + ( dc[3] ) * 0.05;
    } else {
      console.log('did not understand dimension when scaling, TTM');
    }
    return val_;
  }
  mkLinks () {
    let ns = __mc.frame1.nodes;
    let links = [];
    for (let i = 0; i < ns.length; i++) {
      let name1 = ns[i].mname;
      let uri1 = ns[i].muri;
      for (let j = i + 1; j < ns.length; j++) {
        let name2 = ns[j].mname;
        let uri2 = ns[j].muri;
        if (name1 === name2) {
          window.mgraph.addEdge(uri1, uri2);
          links.push([i, j]);
        } else if (name1 === 'Renato Fabbri' || name2 === 'Renato Fabbri') {
          window.mgraph.addEdge(uri1, uri2);
          links.push([i, j]);
        }
      }
    }
    console.log('links: ', links);
    for (let i = 0; i < links.length; i++) {
      let l = links[i];
      let n1 = ns[l[0]];
      let n2 = ns[l[1]];
      let p1 = [n1.x, n1.y];
      let p2 = [n2.x, n2.y];
      __mpixi.mkLink( p1, p2 );
    }
  }
  mkNodes () {
    let c = __mpixi.canvas;
    let dc = __mc.frame1.container.refrect;
    let nodes = [];
    window.mgraph = new Graph();

    losd.forEach( e => {
      window.mgraph.addNode( e.s.value );
      let n = __mpixi.mkNode();
      let pos = window.positions_[e.s.value];
      let [x, y] = [pos.x, pos.y];
      n.x = x * dc[2] * 0.9 + dc[0] + dc[2] * 0.05;
      n.y = y * dc[3] * 0.9 + dc[1] + dc[3] * 0.05;
      n.mname = e.n.value;
      n.muri = e.s.value;
      n.mtext = __mpixi.mkText(n.mname, [n.x, n.y]);
      n.mtext.visible = false;
      n.zIndex = 1000;
      n.on('click', function () { 
        window.mnode = this; 
        this.mtext.visible = this.isclicked ? false : true;
        this.isclicked = this.isclicked ? false : true;
      });
      nodes.push(n);
    });
    __mc.frame1.nodes = nodes;
    __mpixi.frame0.videoloops.push(
      () => {
        for (let i = 0; i < nodes.length; i++) {
          if (Math.random() < 0.001) {
            nodes[i].mtext.visible = true;
          } else {
            if (nodes[i].mtext.visible) {
              if (Math.random() < 0.01 && !nodes[i].isclicked) {
                nodes[i].mtext.visible = false;
              }
            }
          }
          // show node text in its position
        }
      }
    );
  }
  mkRefRect () {
    let datacontainer = new PIXI.Container();
    let f = __mpixi.frame0; // to get ref width / height
    let c = __mpixi.canvas;
    c.app.stage.addChild(datacontainer);
    datacontainer.zIndex = 10000;

    let graphics = new PIXI.Graphics();
    datacontainer.addChild(graphics);
    graphics.lineStyle(5, 0xFF0000);
    graphics.beginFill(0xFFFF00);

    let refrect = [
      c.width * 0.2,
      c.height * 0.05,
      c.width * 0.43,
      c.height * 0.6
    ];
    graphics.drawRect(...refrect);
    graphics.alpha = .3;
    __mc.frame1.container = {
      datacontainer,
      refrect,
    };
  }
}
