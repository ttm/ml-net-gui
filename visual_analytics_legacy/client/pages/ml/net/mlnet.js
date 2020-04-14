import './mlnet.html';

import { mtonep } from '../../../mtone/';
import { MPIXITone, PIXI } from '../../../mpixi/';
import { MLOSD } from '../../../msparql/';
import { MLNetConductor } from './mlnetconductor.js';

window.mthing2 = {
  MPIXITone, mtonep,
  MLNetConductor,
  MLOSD,
};

Template.mlnet.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.mlnet.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new MLNetConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});

