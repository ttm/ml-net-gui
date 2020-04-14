import { MConductor } from '../../mconductor/';
export { CascadeConductor };

const Graph = require('graphology');
window.MGraph = Graph;

let mltexts = [
  {
    color: 0xff00ff,
    mkline: () => {
      return `Network size: ${mml.ml[0].order}`;
    },
    monclick: () => {
    },
  },
  {
    color: 0xff00ff,
    mkline: () => {
      // return `Cascade levels: ${__mc.mpixi.frame0.aux.refwidth}`;
      return `Cascade levels: ${mml.ml.length}`;
    },
    monclick: () => {
    },
  },
  {
    color: 0xffffff,
    mkline: () => {
      return `Participant: ${mml.ml[0].getNodeAttribute(qparams.pid, 'name')}`; // change to use some ID in the graph
    },
    monclick: () => {
    },
  },
  {
    color: 0xffffff,
    mkline: () => {
      return `Friends: ${mml.ml[0].degree(qparams.pid)}`; // change to use some ID in the graph
    },
    monclick: () => {
    },
  },
];

class CascadeConductor extends MConductor {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
    this.frame1.ml = {};
    Meteor.call('getML', window.uparams._id, (e, r) => {
      console.log(e, r, 'HERE');
      r.ml = r.ml_.map( sg => {
        let g = new Graph();
        g.import(sg);
        return g;
      });
      window.mml = r;
      __mc.withData77();
    });
  }
  withData77 () {
    __mc.mkRefRect77();
    __mc.mkTextInfo77();
  }
  mkTextInfo77 () {
    // info geral sobre a cascata:
    //   nome relacionado aa rede em que o processo ocorre
    //     info sobre ela
    //  quantos niveis, etc etc.
    //
    // nome da pessoa sendo buscada
    // info sobre ela (grau, clust, setor?,
    //   nivel em q a pessoa deve ser ativada, por quem, quem ela deve ativar
    let f = __mpixi.frame0; // to get ref width / height
    let c = __mpixi.canvas;
    let [x, y] = [c.width * 0.65, c.height * 0.4];
    let dy = 20;
    let textobjs = [];
    mltexts.forEach( (t, i) => {
      let to = new PIXI.Text(t.mkline(),{fontFamily : 'Arial', fontSize: 18 * c.scaleheight, fill: 0xffffff, align : 'center'});
      to.tint = t.color;
      to.x = x;
      to.y = (y + dy * i);
      to.interactive = true;
      to.buttonMode = true;
      to.zIndex = 1000;
      textobjs.push(to);
      c.app.stage.addChild(to);
    });
    __mc.frame1.ml.textobjs = textobjs;
  }
  mkRefRect77 () {
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
    this.frame1.container = {
      datacontainer,
      refrect,
    };
  }
}
