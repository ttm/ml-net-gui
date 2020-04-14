import Tone from 'tone'
import { chooseUnique } from '../utils.js';

class MTone {
  constructor () {
    // start of https://www.youtube.com/watch?v=n9V-fduhhWA
    this.Tone = Tone;
    Tone.Transport.stop();
    window.__mtone = this;
  }
  theInit () {
    this.frame0 = {
      taps: [0],
      mdur: 1,  // seconds
      instnames: [ // all instruments in Tone
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
      ],
      islatency: [
        'interactive',
        'playback',
        'balanced',
        'fastest'
      ],
    }
    this.daw = {
      insts: this.frame0.instnames.map( (ins) => { // for standard instruments
        return new Tone[ins]().toMaster()
      }),
      synths: function () { // to define custom synths
        __mtone.initSynths()
      }(),
      loops: function () {
        __mtone.initLoops()
      }(),
    }
  }
  initSynths () {
    console.log('develop me please');
  }
  musicRefs () {
    return [
      'https://youtu.be/_EvQmHoMxHM?t=221',
    ]
  }
}

let mtone = new MTone();

class MTonePlay extends MTone {
  constructor () {
    super();
  }
  initSynths () {
    this.synths = {
      tone: new Tone.Synth().toMaster(),
      metal: new Tone.MetalSynth().toMaster(),
      pluck: new Tone.PluckSynth().toMaster(),
      poly: new Tone.PolySynth(4, Tone.Synth).toMaster(),
      membrane: new Tone.MembraneSynth().toMaster(),
      // filter: function () {
      //   let filter = new Tone.Filter({
      //     type : 'bandpass',
      //     Q : 12
      //   }).toMaster();

      //   let noise = new Tone.Noise("brown").connect(filter);
      //   noise.fadeIn = 100;
      //   noise.fadeOut = 100;
      //   filter.fadeIn = 100;
      //   filter.fadeOut = 100;
      //   noise.start();
      //   noise.playbackRate = chooseUnique([
      //     1024, 257, 512, 511, 1013, 254
      //   ], 1)[0]
      //   function triggerSynth(time){
      //     if (Math.random() < 0.2) {
      //       noise.playbackRate = chooseUnique([
      //         1024, 257, 512, 511, 1013, 254
      //       ], 1)[0]
      //     }
      //     filter.frequency.setValueAtTime('C4', time + 0);
      //     filter.frequency.setValueAtTime('E5', time + 0.5);
      //     filter.frequency.setValueAtTime('G7', time + 1);
      //     filter.frequency.setValueAtTime('B2', time + 1.5);
      //     filter.frequency.setValueAtTime('C3', time + 1.9);
      //     noise.volume.setValueAtTime(-140, time + 0);
      //     noise.volume.linearRampToValueAtTime(0, time + 0.5);
      //     noise.volume.linearRampToValueAtTime(-140, time + 1);
      //     noise.volume.linearRampToValueAtTime(20, time + 1.5);
      //     noise.volume.linearRampToValueAtTime(-140, time + 2.1);
      //     // noise.stop(time + 1.95);
      //   }
      //   // Tone.Transport.schedule(triggerSynth, 1);

      //   return [noise, filter];
      // }(),
      dist: function () {
        let distortion = new Tone.Distortion(120)
        let tremolo = new Tone.Tremolo(230).start()

        let polySynth = new Tone.PolySynth(4, Tone.Synth).chain(
          distortion, tremolo, Tone.Master
        )
        return polySynth;
      }(),
      pwm: function () {
        let pwm = new Tone.PWMOscillator("Bb3").toMaster()
        pwm.volume.value = -110
        return pwm;
      }(),
      speech: function () {
        let synth = window.speechSynthesis;
        let play = () => {
          let ttext = chooseUnique([
            'abracadabra',
            'abracadabra, pêlo de cabra',
            'abra de sésamo',
            'sim sim salabim',
            '96, 96 / 96',
            'peace and grace',
            'Refuá Elohim',
            'I eye and the "I AM"!',
            'chokurei',
            'sina toki e toki sona anu seme?',
            'time is money',
          ], 1)[0]
          let utterThis = new SpeechSynthesisUtterance(ttext);
          utterThis.voice = chooseUnique(synth.getVoices(), 1)[0]
          synth.speak(utterThis);
        }
        synth.mplay = play;
        return synth;
      }(),
    }
  }
  initLoops () {
    Tone.Transport.loopEnd = '1m';
    // add loop size option TTM
    Tone.Transport.loop = true;
    this.initLoop1();
    this.initLoop2();
    return 'ok';
  }
  initLoop2 () {
    // puts puts, every beat
    console.log('develop me please', 'init loop 2');
    let self = this;
    let loop1 = function () {
        function triggerSynth(time){
          // self.synths.pluck.triggerAttackRelease('C1', 0.2, time);
          // self.synths.pluck.triggerAttackRelease('G1', 0.2, time + 1);
          // self.synths.pluck.triggerAttackRelease('G2', 0.2, time + 1.5);
          // self.synths.pluck.triggerAttackRelease('E2', 0.2, time + 1.75);
          self.synths.pluck.triggerAttackRelease('C1', 0.2, time);
          self.synths.pluck.triggerAttackRelease('G3', 0.2, time + 1);
          self.synths.pluck.triggerAttackRelease('G2', 0.2, time + 1.5);
          self.synths.pluck.triggerAttackRelease('E4', 0.2, time + 1.75);
        }
        Tone.Transport.schedule(triggerSynth, 0.01);
        function triggerSynth2(time){
          self.synths.membrane.triggerAttackRelease('C2', 0.8, time);
          self.synths.membrane.triggerAttackRelease('G2', 0.8, time + 1);
        }
        Tone.Transport.schedule(triggerSynth, 0.01);
        Tone.Transport.schedule(triggerSynth2, 0.01);
    }();
  }
  initLoop1 () {
    function triggerSynth(time){
      // synth.frequency = self.freq
      __mtone.synths.tone.triggerAttackRelease('16n', time);
    }
    Tone.Transport.schedule(triggerSynth, 0);
  }
}

let mtonep = new MTonePlay();

export { Tone, mtone, mtonep }

