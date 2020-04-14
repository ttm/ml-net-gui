import PIXI from 'pixi.js';
global.PIXI = PIXI; // workaround? ask PIXI's community? TTM
require("pixi-projection");
export { MPIXI, PIXI };
// class hierarchy:
// MPIXI basic initialization
// MPIXIE extended basic initialization with functions to draw stuff
//    MPIXIBg makes the background image (wallpaper)
//    MPIXIBgSprites makes the particle container
//    MPIXIBPanels makes the panels
//    MPIXIBDancers makes the Dancers
// ToDo:
//    Add sayings to clicks on panels

class MPIXI {
  constructor () {
    window.__mpixi = this;
    this.PIXI = PIXI;
    this.frame0 = { // initial data
      videoloops: [], // push or remove functions to process every frame
      taps: [0], // to detect rythm, duplicated in Tone TTM
      refwidth: 1360, // to use my current screen as a reference
      refheight: 669,
      aux: {}, // for variables defined afterwards (e.g. delta in anim loop)
    };
    this.frame1 = { // initial data of page (backgrounds)
    };
    let self = this;
    this.canvas = function () {
      console.log('initialized, man!');
      let a = new PIXI.Application({
        width:  window.innerWidth,
        height: window.innerHeight,
      });
      a.stage.sortableChildren = true;
      $('#canvascontainer').append(a.view);
      return {
        app: a,
        width: a.view.width,
        height: a.view.height,
        scalewidth: a.view.width / self.frame0.refwidth,
        scaleheight: a.view.height / self.frame0.refheight,
      };
    }();
    this.canvas.app.ticker.add( (delta) => {
      self.animationLoop(delta);
    });
  }
  animationLoop (delta) {
    this.frame0.aux.delta = delta; // compare with delta from tick
    for (let i=0; i < this.frame0.videoloops.length; i++) {
      this.frame0.videoloops[i](delta);
    }
  }
}
