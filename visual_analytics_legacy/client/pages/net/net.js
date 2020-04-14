import './net.html';

import { Tone, mtonep } from '../../mtone/';
import { MPIXITone, PIXI } from '../../mpixi/'; // TTM NOW
import { MDBPedia0, MDBPedia, MLOSD } from '../../msparql/';
import { MConductor, MConductor1 } from '../../mconductor/';
import { NetConductor } from './netconductor.js';

window.mthing2 = {
  PIXI, Tone, //, mpixi, mpixib,
  MPIXITone,
  MConductor,
  MDBPedia0, MDBPedia, MLOSD,
};

Template.net.onCreated(function helloOnCreated(some) {
  console.log('thing -->', some);
});

Template.net.onRendered(function helloOnCreated() {
  let mpixitone = new MPIXITone();
  let mc = new NetConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});
