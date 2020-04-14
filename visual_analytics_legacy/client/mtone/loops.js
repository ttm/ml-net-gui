import { MToneSynths, Tone } from './synths.js';
export { MToneLoops, Tone };

class MToneLoops extends MToneSynths {
  constructor () {
    super();
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = '4m';
    // put explicit info about time signature, swing, BPM, etc. TTM
    Tone.Transport.timeSignature = 4; // 4 / 4. timesig is always base 4
    Tone.context.latencyHint = 'interactive'; // see myconductor for more info
    Tone.context.lookAhead = 0.1;
    Tone.Transport.swing = 0;
    this.daw.loops = {
      // fooloop: this.fooLoop(),
      perloop: this.initLoop1(),
      permeasure: this.initLoop2(),
      perbeat: this.initLoop3(),
    };
  }
  fooLoop () {
    var loop = new Tone.Loop(
      (time) => {
	//triggered every eighth note.
        this.daw.synths.pluck.triggerAttackRelease('C1', time);
	console.log(time);
      }, "8n"
    ).start(0); // 8n is always the beat, the denominator in the time signature
  }
  initLoop1 () { // once per whole transport loop
    return Tone.Transport.schedule( (time) => {
      this.daw.synths.pluck.triggerAttackRelease('C3', '4n', time);
      this.daw.synths.pluck.triggerAttackRelease('G4', '4n', time + 4);
    }, 0);
  }
  initLoop2 () { // once per measure (use loop? use trigger in tranport?
    return new Tone.Loop(
      (time) => {
        this.daw.synths.membrane.triggerAttackRelease('C2', time);
	console.log(time);
      },
      "1m" // 8n is always the beat, the denominator in the time signature
    ).start(0);
  }
  initLoop3 () { // once per beat in every measure
    return new Tone.Loop(
      (time) => {
	//triggered every eighth note.
        this.daw.synths.tone.triggerAttackRelease('G1', '16n', time);
	console.log(time);
      },
      "8n" // 8n is always the beat, the denominator in the time signature
    ).start(0);
  }
}
