var PIXI = require('pixi.js')
global.PIXI = PIXI; // fixme: workaround? ask PIXI's community?
require("pixi-projection")
window.mpixi = PIXI

const app = new PIXI.Application({
    width:  window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
})

let mkPaths = function (radius) {
    let dx = Math.cos(Math.PI/6) * radius;
    let dy = Math.sin(Math.PI/6) * radius;
    let p1x = 0;
    let p1y = - radius;
    let p2x = + dx;
    let p2y = + dy;
    let p3x = - dx;
    let p3y = + dy;
    let path = [p1x, p1y, p2x, p2y, p3x, p3y];

    let r = radius;
    let pathrect = [-r, -r, -r, r, r, r, r, -r];

    let an = Math.PI/3;
    let s = Math.sin(an);
    let c = Math.cos(an);
    let pathhex = [
      r, 0,
      r*c, -r*s,
      -r*c, -r*s,
      -r, 0,
      -r*c, r*s,
      r*c, r*s
    ];

    return {
      tri: path,
      rect: pathrect,
      hex: pathhex,
      radius,
      dx,
      dy,
    };
}

let paths = mkPaths(10)

function mkNode (ntype='tri', color = 0xff0000) {
    let path = paths[ntype];
    let v = new PIXI.Graphics();
    v.beginFill(0xFFFFFF);
    v.alpha = 0.4;
    v.scale.set(0.7)
    v.drawPolygon(path);
    v.endFill();
    v.tint = color;
    v.zIndex = 1000;
    v.interactive = true;
    v.mpath = path;
    app.stage.addChild(v);

    // fixme: localization (x,y) left for caller context. Not compliant with other functions in this module.
    v.on('pointerover', () => {
      v.scale.set(1.2);
      v.alpha=0.9;
    });
    v.on('pointerout', () => {
      v.scale.set(0.7);
      v.alpha=0.4;
    });
    //   .on('pointerdown', clickNode)
    //   .on('pointerup', releaseNode)
    //   .on('pointerupoutside', releaseNode2)
    //   .on('pointermove', moveNode);
    return v;
}

function mkText (text, pos) {
  let fill = 0xffffff;
  let texto = new PIXI.Text(
    text,
    {fontFamily : 'Arial', fontSize: 15, fill : fill, align : 'center'}
  );
  texto.tint = 0x00ff00;
  texto.x = pos[0];
  texto.y = pos[1];
  texto.zIndex = 10;
  app.stage.addChild(texto);
  return texto;
}

function mkLink (p1, p2, weight = 1, level = 0, tint = 0xff0000) {
  let line = new PIXI.Graphics();
  // fixme: how to map [1, 10] linewidth to resolution and screensize?
  // this was performed in a previous implementation with this ad-hoc-found relation:
  // line.lineStyle(1 + (9 * weight / this.max_weights[level_]) / (this.networks.length - level_) , 0xFFFFFF);
  line.lineStyle( 1 , 0xffffff);  // always white.
  // fixme: make/migrate colors/palletes to be used.  e.g. line.tint = this.colors[level_];
  line.tint = tint
  line.mlevel = level;
  line.moveTo(p1.x, p1.y);
  line.lineTo(p2.x, p2.y);
  line.alpha = 0.2;
  line.p1 = p1;
  line.p2 = p2;
  app.stage.addChild(line);
  return line;
}

app.ticker.add( (delta) => {
  // delta is 1 for 60 fps
});
document.body.appendChild(app.view);

exports.use = { mkNode, mkLink, mkText, mkPaths }
exports.share = { app, paths, PIXI }
