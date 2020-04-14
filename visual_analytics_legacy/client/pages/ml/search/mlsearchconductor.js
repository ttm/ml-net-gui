import { MConductor } from '../../mconductor/';
export { MLSearchConductor };

let Fuse = require('fuse.js');

import { random, circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';

const Graph = require('graphology');

import jsnx from 'jsnetworkx';
window.jsnx = jsnx;

window.ything = {
  Fuse, Graph, jsnx
};

class MLSearchConductor extends MLConductor {
  constructor (mpixi, mtone, mlosd) {
    super(mpixi, mtone, mlosd);
  }
}
