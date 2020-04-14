import { MTone, Tone } from './minit.js';
export { MToneSynths, Tone };
import { chooseUnique } from '../utils.js';

class MToneSynths extends MTone {
  constructor () {
    super();
    this.daw.synths = {
      tone: new Tone.Synth().toMaster(),
      metal: new Tone.MetalSynth().toMaster(),
      pluck: new Tone.PluckSynth().toMaster(),
      poly: new Tone.PolySynth(4, Tone.Synth).toMaster(),
      membrane: new Tone.MembraneSynth().toMaster(),
      dist: function () {
        let distortion = new Tone.Distortion(120)
        let tremolo = new Tone.Tremolo(230).start()
        let polySynth = new Tone.PolySynth(4, Tone.Synth).chain(
          distortion, tremolo, Tone.Master
        )
        return polySynth;
      }(),
      speech: new MSpeaker(),
      pwm: function () {
        let pwm = new Tone.PWMOscillator("Bb3").toMaster()
        pwm.volume.value = -110
        return pwm;
      }(),
    };
  }
}

class MSpeaker {
  play () {
      let ttext = chooseUnique(this.sentences, 1)[0]
      let utterThis = new SpeechSynthesisUtterance(ttext);
      utterThis.voice = chooseUnique(this.languages, 1)[0];
      this.synth.speak(utterThis);
  }
  constructor (sentences = [], languages = []) {
    this.synth = window.speechSynthesis;
    this.languages = languages;
    this.sentences = sentences;
    if (languages.length === 0) {
      this.languages = this.synth.getVoices();
    }
    if (sentences.length === 0) {
      this.sentences = [
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
      ];
    }
  }
}
