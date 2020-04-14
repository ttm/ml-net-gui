import './search.html';

import { Tone, mtonep } from '../../mtone/';
import { MPIXITone, PIXI } from '../../mpixi/'; // TTM NOW
import { MDBPedia0, MDBPedia, MLOSD } from '../../msparql/';
import { SearchConductor } from './searchconductor.js';

window.mthing2 = {
  PIXI, Tone, //, mpixi, mpixib,
  MPIXITone,
  MDBPedia0, MDBPedia, MLOSD,
};

Template.search.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.search.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new SearchConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});

