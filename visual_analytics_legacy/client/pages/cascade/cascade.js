import './cascade.html';

import { MPIXITone } from '../../mpixi/';
import { mtonep } from '../../mtone/';
import { MLOSD } from '../../msparql/';
import { CascadeConductor } from './cascadeconductor.js';

Template.cascade.onRendered(function cascadeOnRendered() {
  let mpixitone = new MPIXITone();
  let mc = new CascadeConductor(mpixitone, mtonep, MLOSD);
  window.mc = mc;
});
