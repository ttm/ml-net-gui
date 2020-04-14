import { texts } from './mtexts.js';
export { MConductor };

class MConductor {
  // coordenates mpixi, mtone, mlosg
  constructor (mpixi, mtone, mlosd) {
    window.__mc = this;
    this.mpixi = mpixi;
    this.mtone = mtone;
    this.mlosd = mlosd;
    this.initMusicalElements();
    this.startInteractivity();
    this.mpixi.initCanvasText(texts);
    // to populate with initial data in child classes
    this.frame0 = {}; // preliminary data used in initialization
    this.frame1 = {}; // data used in initialized instance
    this.getData();
  }
  getData () {
    let q = this.mlosd.q1;
    this.mlosd.callfuncs = [
      this.withData,
      () => console.log('mconductor got LOSD data'),
    ];
    this.mlosd.queryEndpoint(q);
  }
  withData () {
    // map window.losd to visual elements
    // map window.losd to sonic elements
  }
  initMusicalElements () {
  }
  startInteractivity () {
  }
}
