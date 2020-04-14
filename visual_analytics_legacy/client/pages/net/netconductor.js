import { MConductor } from '../../mconductor/';
export { NetConductor };

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');


import jsnx from 'jsnetworkx';
window.jsnx = jsnx;
// use https://graphology.github.io/read.html#selfloop to make de force atlas

class NetConductor extends MConductor {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
  }
  getData () {
    let q = this.mlosd.q1;
    // use qparams.id to build query to get all participants and all participants
    // then all relationships of each participant, query in packs of 100
    let q2 = `SELECT ?p WHERE {
      ?p a po:Participant .
      ?p po:snapshot ?s .
      ?s po:snapshotID "${qparams.id}" .
    }`;
    console.log('the q2', q2);
    this.mlosd.callfuncs = [
      this.withData,
      () => console.log('mconductor got LOSD data'),
    ];
    this.mlosd.queryEndpoint(q2);
  }
  withData () {
    // plot a square where nodes should be
    // (a container with gray background)
    __mc.mkRefRect();
    __mc.getNames();
  }
  getNames () {
    // make another SPARQL question to know if anonymized. friendshipsAnonymized is not consistent TTM
    let q = `
    ASK  { 
      ?s po:snapshotID  "${qparams.id}" .
      ?s po:friendshipsAnonymized false .
    }`;
    this.mlosd.callfuncs = [
      this.withData2,
      () => console.log('netcond got if net is anon'),
    ];
    this.mlosd.askEndpoint(q);
  }
  withData2 () {
    console.log('names: ', losd_ask);
    if (1) {
      // get names
      let q = `SELECT DISTINCT ?p ?n WHERE {
        ?s po:snapshotID "${qparams.id}" .
        ?p a po:Participant .
        ?p po:snapshot ?s .
        ?p po:observation ?o .
        ?o po:name ?n .
      }`;
      __mc.mlosd.callfuncs = [
        () => console.log('netcond got uris and names of participants'),
        __mc.withData3,
      ];
      __mc.mlosd.queryEndpoint(q);
    } else {
      let q = `SELECT ?sname WHERE {
        ?s po:snapshotID ${qparams.id} .
        ?s po:name ?sname .
      }`;
      alert('anonymized network, currently not supported');
    }
  }
  withData3 () {
    console.log('ok, wd3');
    // plot losd with elements from pixie
    __mc.participants = losd;
    __mc.getLinks();

  }
  getLinks () {
    let q = `SELECT DISTINCT ?p1 ?p2 WHERE {
      ?f a po:Friendship .
      ?f po:snapshot ?s .
      ?s po:snapshotID '${qparams.id}' .
      ?f po:member ?p1, ?p2 .
      FILTER(?p1 != ?p2)
    }`;
    __mc.mlosd.callfuncs = [
      () => console.log('netcond got friendships'),
      __mc.withData4,
    ];
    __mc.mlosd.queryEndpoint(q);
  }
  mkAtlas (links) {
    window.mgraph = new Graph();
    __mc.participants.forEach( p => {
	    window.mgraph.mergeNode( p.p.value, {name: p.n.value});
    });
    for (let i = 0; i < links.length; i++) {
      let puri1 = links[i].p1.value;
      let puri2 = links[i].p2.value;
      // console.log('added link', puri1, puri2);
      window.mgraph.mergeUndirectedEdge(puri1, puri2);
    }
    window.saneSettings = forceAtlas2.inferSettings(window.mgraph);
    random.assign(window.mgraph);
    window.positions = forceAtlas2(window.mgraph,
      {iterations: 50, settings: window.saneSettings}
    );
    // scales between [0, 1] for both x and y
    window.positions_ = this.scale(window.positions);
    __mc.participants.forEach( p => {
      let pos = positions_[p.p.value];
      window.mgraph.setNodeAttribute(p.p.value, 'x', pos.x);
      window.mgraph.setNodeAttribute(p.p.value, 'y', pos.y);
    });
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
    // mklinks using positions_ and pixi nodes
    let ns = __mc.frame1.nodes;
    let ns_ = ns.reduce( (total, item) => {
      total[item.muri] = item;
      return total;
    }, {});
    __mc.glinks = [];
    let links = {};
    window.mgraph.forEach( (s, t) => {
      // console.log('link: ', s, t);
      const pos1 = ns_[s];
      const pos2 = ns_[t];
      const pos1_ = [pos1.x, pos1.y];
      const pos2_ = [pos2.x, pos2.y];
      const l = __mpixi.mkLink(pos1_, pos2_);
      __mc.glinks.push(l);
      if (links[s] === undefined){
        links[s] = {};
      }
      links[s][t] = l;
    });
    __mc.frame1.links = links;
    // console.log(links);
    //  // get the nodes in ns to get the positions
    //  let n1 = ns_[puri1];
    //  let n2 = ns_[puri2];
    //  let p1 = [n1.x, n1.y];
    //  let p2 = [n2.x, n2.y];
    //  // __mpixi.mkLink( p1, p2 );
    // for (let i = 0; i < ns.length; i++) {
    //   let name1 = ns[i].mname;
    //   for (let j = i + 1; j < ns.length; j++) {
    //     let name2 = ns[j].mname;
    //     if (name1 === name2) {
    //       links.push([i, j]);
    //     } else if (name1 === 'Renato Fabbri' || name2 === 'Renato Fabbri') {
    //       links.push([i, j]);
    //     }
    //   }
    // }
    // console.log('links: ', links);
    // for (let i = 0; i < links.length; i++) {
    //   let l = links[i];
    //   let n1 = ns[l[0]];
    //   let n2 = ns[l[1]];
    //   let p1 = [n1.x, n1.y];
    //   let p2 = [n2.x, n2.y];
    //   __mpixi.mkLink( p1, p2 );
    // }
  }
  withData4 () {
    let links = losd;
    // mk struct uri -> node (or node id - nodes[i].mid)
    // this.mkUniqueLinks(losd);
    __mc.friendships = links;
    __mc.mkAtlas(links);
    __mc.mkNodes();
    // plot relations
    __mc.mkLinks();
    __mc.mkInteractive();
  }
  mkNodes () {
    let G = new jsnx.Graph();
    window.G = G;
    let c = __mpixi.canvas;
    let dc = __mc.frame1.container.refrect;
    let nodes = [];
    let nodesuri = {}
    
    __mc.participants.forEach( (e, i) => {
      // console.log('added node: ', e.p.value);
      G.addNode(e.p.value);
      let n = __mpixi.mkNode();
      
      let pos = window.positions_[e.p.value];
      let [x, y] = [pos.x, pos.y];
      n.x = x * dc[2] * 0.9 + dc[0] + dc[2] * 0.05;
      n.y = y * dc[3] * 0.9 + dc[1] + dc[3] * 0.05;
      n.mid = i;
      n.muri = e.p.value;
      n.mname = e.n.value;
      n.mtext = __mpixi.mkText(n.mname, [n.x, n.y]);
      n.mtext.visible = false;
      n.clickcount = 0;
      nodesuri[n.muri] = n;      

      nodes.push(n);

    });
    __mc.frame1.nodes = nodes;
    __mc.frame1.nodesuri = nodesuri;
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
  mkInteractive() {
    let neighborsuri = {};
    __mc.frame1.clickeduri = [];
    __mc.frame1.nodes.forEach( (n) => { 
      neighborsuri[n.muri] = window.mgraph.neighbors(n.muri);
      n.on('pointerover', function (){
        n.mtext.visible = true;
        n.mtext.tint = 0xff0000;
        n.scale.set(1.2);
        n.alpha=0.9;
      });
      n.on('pointerout', function () {
        n.mtext.visible = false;
        n.mtext.tint = 0x000000;
        n.alpha=0.2;
        n.scale.set(0.5);
        n.clickcount = 0;
      });
      n.on('pointerdown', function () { 
        window.mnode = this; 
        this.mtext.visible = this.isclicked ? false : true;
        this.isclicked = this.isclicked ? false : true;
        n.clickcount += 1;
        if (__mc.frame1.clickeduri.length < 2) {
          __mc.frame1.clickeduri.push(n.muri);
        } else {
          __mc.frame1.clickeduri[1] = n.muri;
        }
        if (n.clickcount == 1) {
          neighborsuri[n.muri].forEach( (nuri) => {
            let nn = __mc.frame1.nodesuri[nuri];
            if (__mc.frame1.links[n.muri] !== undefined) {
              let link = __mc.frame1.links[n.muri][nuri];
              if (link === undefined) {
                link = __mc.frame1.links[nuri][n.muri];
              } else {
                nn.alpha = 0.9;
                nn.scale.set(0.9);
                let p1 = [n.x, n.y];
                let p2 = [nn.x, nn.y];
                //link.scale.set(1.4);
                let w = link.line.width;
                link.clear();
                link.lineStyle(w*1.4, 0xff3300);
                link.moveTo(...p1);
                link.lineTo(...p2);
                link.alpha = 0.9;
                console.log('Hey Neighboour');
              }
              if (link === undefined) {

              } else {
                nn.alpha = 0.9;
                nn.scale.set(0.9);
                let p1 = [n.x, n.y];
                let p2 = [nn.x, nn.y];
                //link.scale.set(1.4);
                let w = link.line.width;
                link.clear();
                link.lineStyle(w*1.4, 0xff3300);
                link.moveTo(...p1);
                link.lineTo(...p2); 
                link.alpha = 0.9;
                //link.scale.set(1.4);
                console.log('Hey Neighboour');
              }
            }

          });
        }
        if( __mc.frame1.clickeduri.length > 1){
          let node = __mc.frame1.nodesuri[__mc.frame1.clickeduri[0]];
          neighborsuri[ node.muri ].forEach( (nuri) => {
            let nn = __mc.frame1.nodesuri[nuri];
            if (__mc.frame1.links[node.muri] !== undefined) {
              let link = __mc.frame1.links[node.muri][nuri];
              if (link === undefined) {
                link = __mc.frame1.links[nuri][node.muri];
              } else {
                nn.alpha = 0.2;
                nn.scale.set(0.5);
                let p1 = [node.x, node.y];
                let p2 = [nn.x, nn.y];
                //link.scale.set(1.4);
                let w = link.line.width;
                link.clear();
                link.lineStyle(w/1.4, 0xffffff);
                link.moveTo(...p1);
                link.lineTo(...p2);
                link.alpha = 0.2;
                console.log('Hey Neighboour');
              }
              if (link === undefined) {

              } else {
                nn.alpha = 0.2;
                nn.scale.set(0.5);
                let p1 = [node.x, node.y];
                let p2 = [nn.x, nn.y];
                //link.scale.set(1.4);
                let w = link.line.width;
                link.clear();
                link.lineStyle(w/1.4, 0xffffff);
                link.moveTo(...p1);
                link.lineTo(...p2); 
                link.alpha = 0.2;
                //link.scale.set(1.4);
                console.log('Hey Neighboour');
              }
            }

          });
          if (__mc.frame1.clickeduri.length === 2)
            __mc.frame1.clickeduri[0] = __mc.frame1.clickeduri[1];
        }
      });
    });
  }
}
