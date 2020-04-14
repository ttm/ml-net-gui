import { BasicML, GreedyML, CommunityML } from '../../../multilevel/';

import { NetConductor } from '../../net/netconductor.js';
export { MLNetConductor };

class MLNetConductor extends NetConductor {
  constructor (mpixi, mtone, mlosd) {
    // mk load specific level by ?level=10 on the URL.
    super(mpixi, mtone, mlosd);
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
    __mc.mkML();
  }
  mkML () {
    let ml;
    if ( qparams.method === 'greedy') {
      console.log('getting greedy');
      ml = new GreedyML(window.mgraph);
    } else if ( qparams.method === 'community') {
      console.log('getting communities');
      ml = new CommunityML(window.mgraph);
    } else {
      ml = new BasicML(window.mgraph);
    }
    ml.ml_ = ml.ml.map( g => g.export() );
    Meteor.call('insertML', ml);
    this.mml = ml;
    this.mkLevelSelector();
    let tlevel = Math.floor( ml.ml.length * 0.75);
    this.frame1.nodeslevel = [];
    this.glinkslevel = [];
    this.currentlevel = 0;

    const c = __mpixi.canvas;
    const textxy = [c.width * 0.01, c.height * 0.05];
    const textwidth = c.width * 0.2;
    const style = new PIXI.TextStyle({
      wordWrap: true,
      wordWrapWidth: textwidth,
      fill: 0xffffff,
      fontSize: 17,
    });
    const text = new PIXI.Text('Hello World', style);
    text.x = textxy[0];
    text.y = textxy[1];
    this.namesprite = text;
    __mpixi.canvas.app.stage.addChild(text);

    this.plotLevel( tlevel );
  }
  plotLevel( level ) {
    // get graph in level
    const g = this.mml.ml[ level ];
    // set x, y as mean of sources for each node
    g.forEachNode( (n, a) => {
      let x = 0;
      let y = 0;
      a.sources.forEach( s => {
        x += window.mgraph.getNodeAttribute(s, 'x');
        y += window.mgraph.getNodeAttribute(s, 'y');
      });
      x = x / a.sources.length;
      y = y / a.sources.length;
      g.setNodeAttribute(n, 'x', x);
      g.setNodeAttribute(n, 'y', y);
    });
    // plot them:
    this.mkLevelNodes( level );
    this.mkLevelLinks( level );
    this.mkSourceLevelLinks( level );
    this.mkNamesOnClick( level );
    this.mkInfoOnHover( level );
    console.log('going to hide level: ', this.currentlevel);
    this.hideLevel( this.currentlevel );
    this.currentlevel = level;
  }
  mkLevelSelector() { // to the right, bellow the control/status column
    // for level in levels, a box with the numner. If clicked, shows that level and hides any other.
    // todo: mk transition (blink nodes which collapse into super node, edges animate, etc..
    console.log('got here');
    this.mkLevelsRect();
    let dc = __mc.frame1.lbtncontainer.refrect;
    const xsep = 0.2;
    const ysep = 0.07;
    let btns = [];
    let self = this;
    this.mml.ml.forEach( (g, i) => {
      const n = __mpixi.mkNode('hex', 0x0000ff);
      const [x, y] = [( i % 5) * xsep, Math.floor( i / 5 ) * ysep];
      n.x = x * dc[2] * 0.9 + dc[0] + dc[2] * 0.05;
      n.y = y * dc[3] * 0.9 + dc[1] + dc[3] * 0.05;
      n.mlevel = i;
      n.mgraph = g;
      n.on('pointerdown', () => {
        console.log('level: ', i);
        self.plotLevel(i);
      });
      n.on('pointerover', () => { // show info about the level TTM
        console.log('hey level: ', i);
      });
      n.mtext = __mpixi.mkText(String(i), [n.x + xsep * 0.1, n.y]);
      n.mtext.visible = true;
      n.mtext.tint = 0xf000ff;
      btns.push(n);
    });
    __mc.frame1.lbtncontainer.btns = btns;
  }
  mkNamesOnClick ( level ) { // the left column
    // names of sources appear when nodes are clicked
  }
  mkInfoOnHover ( level ) {
    // when hovered, show  info such as neighbors, degree, nsources, maybe parents and children.
  }
  mkLevelLinks ( level ) {
    let ns = this.frame1.nodeslevel[ level ];
    let ns_ = ns.reduce( (total, item) => {
      total[item.gid] = item;
      return total;
    }, {});
    __mc.glinkslevel[ level ] = [];
    __mc.mml.ml[ level ].forEach( (s, t) => {
      // console.log('link: ', s, t);
      let pos1 = ns_[s];
      let pos2 = ns_[t];
      let pos1_ = [pos1.x, pos1.y];
      let pos2_ = [pos2.x, pos2.y];
      __mc.glinkslevel[level].push( __mpixi.mkLink(pos1_, pos2_) );
    });
  }
  hideLevel ( level ) {
    let nodes;
    let links;
    if (level == 0) {
      links = __mc.glinks;
      nodes = __mc.frame1.nodes;
    } else {
      nodes = this.frame1.nodeslevel[ level ];
      links = this.glinkslevel[ level ];
    }
    nodes.forEach( n => {
      n.visible = false;
      n.mtext.visible = false;
    });
    links.forEach( l => {
      l.visible = false;
    });
  }
  mkSourceLevelLinks ( level ) { // TTM awesome
    console.log('implement me please');
  }
  mkLevelNodes ( level ) {
    const g = this.mml.ml[ level ];
    const c = __mpixi.canvas;
    const dc = __mc.frame1.container.refrect;
    let nodeslevel = [];
    // const namesprite = __mpixi.mkText('banana', textxy);
    // namesprite.visible = true;
    // namesprite.tint = 0xffffff;
    g.forEachNode( (n_, a_) => {
      // console.log('adding node: ', a_.names);
      const n = __mpixi.mkNode('tri', 0x00ff00);
      const [x, y] = [a_.x, a_.y];
      // console.log('x, y', x, y);

      n.x = x * dc[2] * 0.9 + dc[0] + dc[2] * 0.05;
      n.y = y * dc[3] * 0.9 + dc[1] + dc[3] * 0.05;
      n.gid = n_;
      n.mnames = a_.names;
      const name = a_.names.length === 1 ? a_.names[0] : a_.names[0] + '...' + a_.names[ a_.names.length - 1];
      n.mtext = __mpixi.mkText(name, [n.x, n.y]);
      // n.mtext = __mpixi.mkText(String(n.name), [n.x, n.y]);
      n.mtext.visible = true;
      if (a_.sources.length === 1) {
        n.mtext.tint = 0xff0000;
      } else {
        n.mtext.tint = 0x00ff00;
      }
      n.on('pointerdown', () => {
        const namestring = this.mml.ml[ level ].getNodeAttribute( n_, 'sources')
          .map( s => window.mgraph.getNodeAttribute(s, 'name') ).join(', ')
        console.log(
          namestring
        );
        this.namesprite.text = namestring;
      });
      nodeslevel.push(n);
    });
    __mpixi.frame0.videoloops.push(
      (delta) => {}
    );
    this.frame1.nodeslevel[ level ] = nodeslevel;
  }
  mkLevelsRect () {
    let datacontainer = new PIXI.Container();
    let f = __mpixi.frame0; // to get ref width / height
    let c = __mpixi.canvas;
    c.app.stage.addChild(datacontainer);
    datacontainer.zIndex = 10000;

    let graphics = new PIXI.Graphics();
    datacontainer.addChild(graphics);
    graphics.lineStyle(5, 0xFF0000);
    graphics.beginFill(0xFFFFAA);

    let refrect = [
      c.width * 0.65,
      c.height * 0.4,
      c.width * 0.3,
      c.height * 0.5
    ];
    graphics.drawRect(...refrect);
    graphics.alpha = .2;
    __mc.frame1.lbtncontainer = {
      datacontainer,
      refrect,
    };
  }
}
