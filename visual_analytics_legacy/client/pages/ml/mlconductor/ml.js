import './ml.html';

import { Tone, mtonep } from '../../../mtone/';
import { MPIXITone } from '../../../mpixi/'; // TTM NOW
import { MDBPedia0, MDBPedia, MLOSD } from '../../../msparql/';
import { MLConductor } from './mlconductor.js';

window.mthing2 = {
  Tone, mtonep, //, mpixi, mpixib,
  MPIXITone,
  MLConductor,
  MLOSD,
};

Template.ml.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.ml.onRendered(function helloOnCreated() {
  console.log('hey, rendering yeah');
  let mpixitone = new MPIXITone();
  let mc = new MLConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});

