import './mconductor.html';

import { Tone, mtonep } from '../mtone/';
import { MPIXITone, PIXI } from '../mpixi/'; // TTM NOW
import { MDBPedia0, MDBPedia, MLOSD } from '../msparql/';
import { MConductor1 } from './';
// https://www.npmjs.com/package/graphology-layout-forceatlas2#webworker
window.mthing = {
  PIXI, Tone, //, mpixi, mpixib,
  MPIXITone,
  MConductor1,
  MDBPedia0, MDBPedia, MLOSD,
};

Template.mconductor.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new MConductor1(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});
