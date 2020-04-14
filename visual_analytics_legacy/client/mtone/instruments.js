import { MTone, Tone } from './minit.js';
export { MToneInstruments };

class MToneInstruments extends MTone {
  constructor () {
    super();
    this.frame0.instnames = [ // all instruments in Tone
      'AMSynth',
      'DuoSynth',
      'FMSynth',
      'Instrument',
      'MembraneSynth',
      'MetalSynth',
      'MonoSynth',
      'Monophonic',
      'NoiseSynth',
      'PluckSynth',
      'PolySynth',
      'Sampler',
      'Synth',
    ];
    this.daw.insts = this.frame0.instnames.map( // initialize them
      (ins) => {
        return new Tone[ins]().toMaster();
      }
    );
  }
}
