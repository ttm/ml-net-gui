import { MPIXIBDancers, PIXI } from './background.js';
import {
  OnDragStart2, OnDragStart, OnDragEnd, OnDragMove 
} from './helpers.js';

export { MPIXITone, MPIXIBDancers, PIXI, mpixitone };

class MPIXITone extends MPIXIBDancers {
  // final handler given to the Conductor
  constructor () {
    super();
    console.log('ok, mpixitone constructor');
    this.initCanvasWidgets(); // after backgrounds
  }
  initCanvasWidgets (mdata) {
    // for now, call initCanvasText(texts) on the Conductor.
    // elements: TTM
    // a triangle toggles to square for play-stop
    // a loop button
    // a timeline where:
  }

  initCanvasText (texts) {
    this.texts = texts;
    let [x, y] = [900, 20];
    let dy = 20;
    this.textobjs = [];
    for (let i = 0; i < this.texts.length; i++) {
      let t = this.texts[i]
      let to = new PIXI.Text(t.mkline(),{fontFamily : 'Arial', fontSize: 18 * this.canvas.scaleheight, fill: 0xffffff, align : 'center'});
      to.tint = t.color;
      to.x = x * this.canvas.scalewidth;
      to.y = (y + dy * i) * this.canvas.scaleheight;
      to.interactive = true;
      to.buttonMode = true;
      to.zIndex = 1000;
      if (!t.clicking) {
        to
          .on('pointerdown', OnDragStart(t.monclick))
          .on('pointerup', OnDragEnd(t.monclick))
          .on('pointerupoutside', OnDragEnd(t.monclick))
          .on('pointermove', OnDragMove(t.monclick));
      } else {
        to.on('pointerdown', OnDragStart2(t.monclick));
      }
      this.textobjs.push(to);
      this.canvas.app.stage.addChild(to);
    }
    this.frame0.videoloops.push((delta) => {
      for (let i = 0; i < this.texts.length; i++) {
        this.textobjs[i].text = this.texts[i].mkline();
      }
    });
  }
}
