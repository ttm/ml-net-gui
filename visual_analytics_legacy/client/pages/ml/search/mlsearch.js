import './mlsearch.html';

import { mtonep } from '../../mtone/';
import { MPIXITone, PIXI } from '../../mpixi/';
import { MDBPedia0, MDBPedia, MLOSD } from '../../msparql/';
import { MLSearchConductor } from './searchconductor.js';

window.mthing2 = {
  PIXI, Tone,
  MPIXITone,
  MDBPedia0, MDBPedia, MLOSD,
};

Template.search.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.search.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new MLSearchConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});
