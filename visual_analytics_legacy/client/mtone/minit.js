import Tone from 'tone';
export { Tone, MTone };
// initial class is inherited by synths and instruments
// loops will inherit both synths and instruments.

class MTone { // base class with initialization
  constructor () {
    window.__mtone = this;
    this.Tone = Tone;
    Tone.Transport.stop();
    this.frame0 = {
      taps: [0], // to detect rythm TTM
      mdur: 1,  // seconds, basic duration for beat/note
      islatency: [
        'interactive',
        'playback',
        'balanced',
        'fastest'
      ],
    };
    this.daw = { // insts: synths: loops: in subclasses
    };
  }
  musicRefs () {
    return [
      'https://youtu.be/_EvQmHoMxHM?t=221',
      'start of https://www.youtube.com/watch?v=n9V-fduhhWA',
    ];
  }
}
