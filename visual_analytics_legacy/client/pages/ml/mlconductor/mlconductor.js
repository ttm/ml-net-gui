import { BasicML } from '../../../multilevel/';
import { MConductor1 } from '../../../mconductor/';

export { MLConductor }; // , MLNetConductor, MLSearchConductor };

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');

class MLConductor extends MConductor1 {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
  }
  withData () {
    // just as in original class:
    __mc.mkRefRect();
    __mc.mkAtlas();
    __mc.mkNodes();
    __mc.mkLinks();
    // this class's diff:
    __mc.mkML();
  }
  mkML () {
    let ml = new BasicML(window.mgraph);
    __mc.mml = ml;
  }
}

