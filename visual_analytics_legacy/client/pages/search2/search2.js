import './search2.html';

import { Tone, mtonep } from '../../mtone/';
import { MPIXITone, PIXI } from '../../mpixi/'; // TTM NOW
import { MDBPedia0, MDBPedia, MLOSD } from '../../msparql/';
import { SearchConductor2 } from './searchconductor2.js';

window.mthing2 = {
  PIXI, Tone, //, mpixi, mpixib,
  MPIXITone,
  MDBPedia0, MDBPedia, MLOSD,
};

Template.search2.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.search2.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new SearchConductor2(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});

