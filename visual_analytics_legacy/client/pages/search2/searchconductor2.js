import { MConductor } from '../../mconductor/';
export { SearchConductor2 };

let Fuse = require('fuse.js');

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');


import jsnx from 'jsnetworkx';
window.jsnx = jsnx;
// use https://graphology.github.io/read.html#selfloop to make de force atlas

window.ything = {
  Fuse, Graph, jsnx
};

class SearchConductor2 extends MConductor {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
  }
  getData () { // called on initialization
    console.log(`${qparams.mstring}`);
    this.mtime = performance.now();
    Meteor.call("getParticipants", [], (e, r) => {
      window.xthing = [e, r];
      if (r.length === 0) {
        // make query and insert data! LOADING... TTM

        console.log('ok, getting participants, not alredy in this meteor');
        let q2 = `SELECT DISTINCT ?p ?n ?sid ?sname WHERE {
          ?p a po:Participant .
          ?p po:observation ?o .
          ?o po:name ?n .
          ?p po:snapshot ?s .
          ?s po:name ?sname .
          ?s po:snapshotID ?sid .
          ?s po:socialProtocol "Facebook" .
        }`;
        console.log('the q2', q2);
        this.mlosd.callfuncs = [
          this.insertParticipants,
          () => console.log('mconductor got LOSD data'),
        ];
        this.mlosd.queryEndpoint(q2);
      } else {
        console.log('ok, meteor instance has participants!');
        __mc.theparticipants = r;
        this.withData();
      }
    });
  }
  insertParticipants () {
    __mc.theparticipants = losd.map( p => {
      return {
        name: p.n.value,
        uri: p.p.value,
        sid: p.sid.value,
        sname: p.sname.value,
      }
    });
    Meteor.call('insertParticipants', __mc.theparticipants);
    // insert participants in collection
    __mc.withData();
  }
  withData () {
    let atime = ( performance.now() - __mc.mtime ) / 1000
    console.log(`took: ${atime}s`);
    // plot a square where nodes should be
    // (a container with gray background)
    __mc.mkRefRect();

    let keys = ['name']; // fields to be searched
    let fuse = new Fuse(__mc.theparticipants, { keys } );
    window.mfuse = fuse;
    __mc.tname = window.mfuse.search(window.qparams.mstring)[0].name;
    this.getSnapshots();
  }
  getSnapshots () {
    // snapshots of ego with name
    // shanpshots with participant with name
    // these snapshots will not be used for now in the page, but may be opened in the net/id=<sid>?
    console.log('in getSnapshots!!');
    let q = `SELECT DISTINCT ?s ?sid WHERE {
      ?s po:name '${__mc.tname}' .
      ?s po:snapshotID ?sid .
    }`;
    __mc.mlosd.callfuncs = [
      __mc.withSnaps0,
      () => console.log(`mconductor got snapshots of Ego: ${__mc.tname}`),
    ];
    __mc.mlosd.queryEndpoint(q);
  }
  withSnaps0 () {
    __mc.msnaps0 = losd;
    let q = `SELECT DISTINCT ?s ?sid ?p ?sname ?date WHERE {
      ?o po:name '${__mc.tname}' .
      ?p po:observation ?o .
      ?p po:snapshot ?s .
      ?s po:snapshotID ?sid .
      ?s po:name ?sname .
      ?s po:dateObtained ?date .
    }`;
    __mc.mlosd.callfuncs = [
      __mc.withSnaps1,
      () => console.log(`mconductor got snapshots with participant: ${__mc.tname}`),
    ];
    __mc.mlosd.queryEndpoint(q);
  }
  withSnaps1 () {
    if (typeof window.losdall_ === 'undefined') {
      __mc.msnaps1 = losd.reduce( (t, s) => {
        let name = s.sname.value;
        for (let i = 0; i < t.length; i++) {
          let name2 = t[i].sname.value;
          if ( name === name2 ) { // make a better filter or merge of similar snapshots TTM
            return t
          }
        }
        t.push(s);
        return t
      }, []);
      window.losdall_ = []
    } else {
      window.losdall_.push( losd );
    }
    let s = __mc.msnaps1[ window.losdall_.length ];
    if ( typeof s === 'undefined' ) {
      __mc.withAllFriends();
      return
    }
    // in each of snapshots1,
    // get full snapshots
    let q = `SELECT DISTINCT ?p ?n WHERE {
      ?p po:snapshot <${s.s.value}> .
      ?p po:observation ?o .
      ?o po:name ?n .
    }`;
    __mc.mlosd.callfuncs = [
      __mc.withSnaps1,
      () => console.log(`mconductor got all participants in snapshot:` + s.s.value),
    ];
    __mc.mlosd.queryEndpoint(q);
  }
  withAllFriendships () {
    __mc.mgraphs = [];
    for (let si = 0; si < window.losdall_.length; si++) { // for each snapshot
      let mgraph = new Graph();
      window.losdall_[si].forEach( p => {
        mgraph.mergeNode( p.p.value, {name: p.n.value});
      });
      for (let i = 0; i < window.losdallf[si].length; i++) {
        let puri1 = window.losdallf[si][i].p1.value;
        let puri2 = window.losdallf[si][i].p2.value;
        // console.log('added link', puri1, puri2);
        mgraph.mergeUndirectedEdge(puri1, puri2);
      }

      let neighs = mgraph.neighbors( __mc.msnaps1[si].p.value );
      let mgraph2 = new Graph();
      neighs.forEach( p => {
        mgraph2.mergeNode(
          p,
          { name: mgraph.getNodeAttribute(p, 'name') }
        );
      });
      neighs.forEach( n => {
          mgraph.forEachNeighbor(
            n,
            n2 => {
              if (neighs.includes(n2)) {
                mgraph2.mergeUndirectedEdge(n, n2);
              }
            }
          );
        }
      );
      __mc.mgraphs.push({
        full: mgraph,
        lego: mgraph2, // local ego, of the searched target in the larger network
        name: __mc.msnaps1[si].sname.value,
        puri: __mc.msnaps1[si].p.value,
      });
    }
    __mc.mixNets();
    __mc.plotNets();
  }
  mixNets () {
    // mix the __mc.mgraphs[i].lego networks into:
    // a network where the node keys are names, and uris is an attribute with the uri in each snapshot.
    let mixedgraph = new Graph();
    let gs = __mc.mgraphs;
    gs.forEach( (g, i) => {
      g.lego.forEachNode( (node, attrs) => {
        let name = attrs.name;
        mixedgraph.mergeNode( name )
        if ( mixedgraph.hasNodeAttribute(name, 'uris') ) {
          mixedgraph.updateNodeAttribute( name, 'uris', u => {
            u.push(node);
            return u;
          });
        } else {
          mixedgraph.setNodeAttribute( name, 'uris', [node] );
        }
        if ( mixedgraph.hasNodeAttribute( name, 'names') ) {
          mixedgraph.updateNodeAttribute( name, 'names', u => {
            u.push(g.name);
            return u;
          });
        } else {
          mixedgraph.setNodeAttribute( name, 'names', [g.name] );
        }
        if ( mixedgraph.hasNodeAttribute(name, 'uriSameAs') ) {
          mixedgraph.updateNodeAttribute( name, 'uriSameAs', u => {
            u.push(g.puri);
            return u;
          });
        } else {
          mixedgraph.setNodeAttribute( name, 'uriSameAs', [g.puri] );
        }
      });
      g.lego.forEachEdge( (edge, attrs, source, target, sattrs, tattrs) => {
        let sname = sattrs.name;
        let tname = tattrs.name;
        mixedgraph.mergeUndirectedEdge(sname, tname);
      });
    });
    __mc.mixedgraph = mixedgraph;
    let nodes = mixedgraph.nodes();
    let nodes_ = nodes.map( n => [n, mixedgraph.degree(n)]);
    nodes_.sort( (i, j) => i[1] - j[1] );
    __mc.mixedNodes = nodes_;
    // enhance the names of the node atributes, and the mgraph attributes, to make the model more readable. TTM
  }
  plotNets () {
    __mc.mkAtlas();
    __mc.mkNodes();
    __mc.mkLinks();

  }
  withAllFriends () {
    if (typeof window.losdallf === 'undefined') {
      window.losdallf = []
    } else {
      window.losdallf.push( losd );
    }
    let s = __mc.msnaps1[ window.losdallf.length ];
    if ( typeof s === 'undefined' ) {
      __mc.withAllFriendships();
      return
    }
    // in each of snapshots1, get the friends of the person we are seeking.
    // __mc.msnaps1.forEach( s => {
    // 1) get friends of the person beeing searched for
    let q = `SELECT DISTINCT ?p1 ?p2 WHERE {
      ?f a po:Friendship .
      ?f po:snapshot <${s.s.value}> .
      ?f po:member ?p1, ?p2 .
      FILTER(?p1 != ?p2)
    }`;
    __mc.mlosd.callfuncs = [
      __mc.withAllFriends,
      () => console.log(`mconductor got all friendships in snapshot: ` + s.s.value),
    ];
    __mc.mlosd.queryEndpoint(q);
  }
  getFriends () {
    __mc.tname = name;
    console.log('the name for the query string: ', name);
    let q = `SELECT DISTINCT ?p ?n ?sid ?sname WHERE {
          ?o2 po:name '${name}' .
          ?p2 po:observation ?o2 .
          ?f a po:Friendship .
          ?f po:member ?p2 .
          ?f po:member ?p .
          ?p a po:Participant .
          ?p po:observation ?o .
          ?o po:name ?n .
          ?p po:snapshot ?s .
          ?s po:name ?sname .
          ?s po:snapshotID ?sid .
          ?s po:socialProtocol 'Facebook' .
          FILTER(?p != ?p2)
    }`;
    this.mlosd.callfuncs = [
      () => console.log(`mconductor got LOSD friends of ${name}`),
      this.withFriends2,
    ];
    this.mlosd.queryEndpoint(q);
  }
  withFriends2 () {
    __mc.thefriends = losd;
    // get snapshots where the name is incident
    //
    // get snapshots with name == name.
    // get the whole network if existent.
    let q1 = `SELECT DISTINCT ?s WHERE {
      ?o po:name '${__mc.tname}' .
      ?p po:observation ?o .
      ?o po:snapshot ?s .
      ?s po:socialProtocol 'Facebook' .
    }`;
    // let q = `SELECT DISTINCT ?p ?p2 ?p3 WHERE {
    //   ?o po:name '${__mc.tname}' .
    //   ?p po:observation ?o .
    //   ?p a po:Participant .
    //   ?p po:snapshot ?s .
    //   ?s po:socialProtocol "Facebook" .
    //   ?f1 a po:Friendship .
    //   ?f1 po:member ?p, ?p2 .
    //   FILTER(?p != ?p2) .
    //   ?f2 a po:Friendship .
    //   ?f2 po:member ?p, ?p3 .
    //   FILTER(?p != ?p3) .
    //   ?f3 a po:Friendship .
    //   ?f3 po:snapshot ?s3 .
    //   ?s3 po:socialProtocol 'Facebook' .
    //   ?f3 po:member ?p2, ?p3 .
    //   FILTER(?p2 != ?p3) .
    // }`;
    // let q = `SELECT (COUNT(?f) as ?cf) WHERE {
    //   ?f1 a po:Friendship .
    //   
    // `;
    // window.fss = [q];
    __mc.mlosd.callfuncs = [
      __mc.withSnaps1,
      () => console.log(`mconductor got LOSD friendships of friends of ${name}`),
    ];
    // plot ppl and friendships
    // include interactions TTM
    __mc.mlosd.queryEndpoint(q1);
  }
  withSnaps1_ () {
    __mc.snaps1 = losd;
    let q2 = `SELECT DISTINCT ?s WHERE {
      ?s po:name '${__mc.tname}' .
      ?s a po:Snapshot .
      ?s po:socialProtocol 'Facebook' .
    }`;
    __mc.mlosd.callfuncs = [
      __mc.withSnaps2,
      () => console.log(`mconductor got LOSD friendships of friends of ${name}`),
    ];
    // plot ppl and friendships
    // include interactions TTM
    __mc.mlosd.queryEndpoint(q2);
  }
  withSnaps2 () {
    __mc.snaps2 = losd;
  }
  withFriends () {
    __mc.thefriends = losd;
    let uris = losd.map( f => f.p.value );
    let fstr1 = '?p1 = ' + uris.join(' || ?p1 = ');
    let fstr2 = '?p2 = ' + uris.join(' || ?p2 = ');
    let q = `SELECT DISTINCT ?p1 ?p2 WHERE {
      ?f a po:Friendship .
      ?f po:snapshot ?s .
      ?s po:socialProtocol "Facebook" .
      ?f po:member ?p1, ?p2 .
      FILTER( (?p1 != ?p2) && (${fstr1}) && (${fstr2}))
    }`;
    window.fss = [uris, fstr1, fstr2, q];
    __mc.mlosd.callfuncs = [
      __mc.withFriendships,
      () => console.log(`mconductor got LOSD friendships of friends of ${name}`),
    ];
    // plot ppl and friendships
    // include interactions TTM
    __mc.mlosd.queryEndpoint(q);
  }
  withFriendships () {
    
  }
  getLinks () {
  }
  mkAtlas () {
    window.saneSettings = forceAtlas2.inferSettings(__mc.mixedgraph);
    random.assign(__mc.mixedgraph);
    window.positions = forceAtlas2(__mc.mixedgraph,
      {iterations: 50, settings: window.saneSettings}
    );
    window.positions_ = this.scale(window.positions); // scales between [0, 1] for both x and y
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
      total[item.mname] = item;
      return total;
    }, {});
    console.log('hey man: ');
    __mc.mixedgraph.forEach( (s, t) => {
      // console.log('link: ', s, t);
      let pos1 = ns_[s];
      let pos2 = ns_[t];
      let pos1_ = [pos1.x, pos1.y];
      let pos2_ = [pos2.x, pos2.y];
      __mpixi.mkLink(pos1_, pos2_);
    });
  }
  withData4 () {
    let links = losd;
    __mc.friendships = links;
    __mc.mkAtlas(links);
    __mc.mkNodes();
    __mc.mkLinks();
  }
  mkNodes () {
    let G = new jsnx.Graph();
    window.G = G;
    let c = __mpixi.canvas;
    let dc = __mc.frame1.container.refrect;
    let nodes = [];
    __mc.mixedNodes.forEach( (e, i) => {
      console.log('added node: ', e[0]);
      G.addNode(e[0]);
      let n = __mpixi.mkNode();
      let pos = window.positions_[e[0]];
      let [x, y] = [pos.x, pos.y];
      n.x = x * dc[2] * 0.9 + dc[0] + dc[2] * 0.05;
      n.y = y * dc[3] * 0.9 + dc[1] + dc[3] * 0.05;
      n.mid = i;
      n.mname = e[0];
      n.mdegree = e[1];
      n.mtext = __mpixi.mkText(n.mname, [n.x, n.y]);
      n.mtext.visible = false;
      n.on('pointerover', function () { 
          n.mtext.visible = true;
	  n.mtext.tint = 0xff0000;
      });
      n.on('pointerout', function () {
          n.mtext.visible = false;
	  n.mtext.tint = 0x000000;
      });
      n.on('pointerdown', function () { 
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

