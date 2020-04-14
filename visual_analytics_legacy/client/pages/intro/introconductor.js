import { MConductor } from '../../mconductor/';
export { IntroConductor };

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');

import jsnx from 'jsnetworkx';
window.jsnx = jsnx;
// use https://graphology.github.io/read.html#selfloop to make de force atlas

let texts__ = {
  argument: `Reptilians abound in our social structures.
    Some of our friends are sometimes captive, and
    reptilians themselves walk among us.

    By freeing their influence and helping key-friends,
      you unlock abilities which enables you to harness
    your social circuits for achieving arbitrary goals of your
    choice/discernment for world transcendence.`,
  proposal: `You are being called by The Great Fraternity of Light
    to free humanity from slavery.
    
    We welcome you, beloved light-workers.`,
};

class IntroConductor extends MConductor {
  constructor (mpixi, mtone, mlosd) {
    mpixi.initCanvasText = (mtexts) => {};
    super(mpixi, mtone, mlosd);
    // this.mkText();
  }
  mkText () {
    let to = new PIXI.Text(texts__.proposal, {fontFamily : 'Arial', fontSize: 18 * this.mpixi.canvas.scaleheight, fill: 0xffffff, align : 'center'});
    let to2 = new PIXI.Text(texts__.argument, {fontFamily : 'Arial', fontSize: 18 * this.mpixi.canvas.scaleheight, fill: 0xffffff, align : 'center'});
    let to3 = new PIXI.Text('foo', {fontFamily : 'Arial', fontSize: 18 * this.mpixi.canvas.scaleheight, fill: 0xffffff, align : 'center'});
    // let [x, y] = [900, 20];
    // let dy = 20;
    // to.x = x * this.mpixi.canvas.scalewidth;
    // to.y = (y + dy) * this.mpixi.canvas.scaleheight;
    // to
    //   .on('pointerdown', function () { console.log(this, 'this pointerdown'); })
    //   .on('pointerup', function () { console.log(this, 'this pointerup'); })
    //   .on('pointerupoutside', function () { console.log(this, 'this pointerupoutside'); })
    //   .on('pointermove', function () { console.log(this, 'this pointermove 22'); })
    let tos = [to, to2, to3];
    let cs = [];
    let x0 = 100;
    let y0 = 100;
    let dx = 300;
    for (let i = 0; i < tos.length; i++) {
      let c = new PIXI.Container();
      c.addChild(tos[i]);
      c.zIndex = 1000;
      this.mpixi.canvas.app.stage.addChild(c);
      cs.push(c);
    }
  }
  getData () {
  }
}


