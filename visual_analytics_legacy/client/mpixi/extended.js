import { MPIXI, PIXI } from './base.js';
export { MPIXIE, PIXI };

class MPIXIE extends MPIXI { // with facilities for drawing
  constructor () {
    super()
    this.mkPaths()
  }
  mkPaths() {
    let radius = 10;

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

    this.frame1.paths = {
      tri: path,
      rect: pathrect,
      hex: pathhex,
      radius,
      dx,
      dy,
    };
  }
  mkNode (ntype='tri', color = 0xff0000) {
    let path = this.frame1.paths[ntype];
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
    this.canvas.app.stage.addChild(v);

    v.on('pointerover', () => {
      v.scale.set(1.2);
      v.alpha=0.9;
    });
    v.on('pointerout', () => {
      v.scale.set(0.7);
      v.alpha=0.4;
    });
    // v

    //   .on('pointerdown', clickNode)
    //   .on('pointerup', releaseNode)
    //   .on('pointerupoutside', releaseNode2)
    //   .on('pointermove', moveNode);
    return v;
  }
  mkText (text, pos) {
    let fill = 0xffffff;
    let texto = new PIXI.Text(
      text,
      {fontFamily : 'Arial', fontSize: 15, fill : fill, align : 'center'}
    );
    texto.tint = 0x000000;
    texto.x = pos[0];
    texto.y = pos[1];
    texto.zIndex = 10;
    this.canvas.app.stage.addChild(texto);
    return texto;
  }
  mkLink (p1, p2, weight = 1, level = 0) {
    let line = new PIXI.Graphics();
    // line.lineStyle(1 + (9 * weight / this.max_weights[level_]) / (this.networks.length - level_) , 0xFFFFFF);
    line.lineStyle( 1 , 0xFFFFFF);
    // line.tint = this.linkcolors[level_];
    line.mlevel = level;
    line.moveTo(...p1);
    line.lineTo(...p2);
    line.alpha = 0.2;
    line.p1 = p1;
    line.p2 = p2;
    this.canvas.app.stage.addChild(line);
    return line;
  }
}
