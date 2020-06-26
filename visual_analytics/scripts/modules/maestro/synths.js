/* global SpeechSynthesisUtterance */

const chooseUnique = require('../utils.js').chooseUnique

class Speaker {
  play (ttext = undefined) {
    if (!ttext) {
      ttext = chooseUnique(this.sentences, 1)[0]
    }
    const utterThis = new SpeechSynthesisUtterance(ttext)
    utterThis.voice = chooseUnique(this.languages, 1)[0]
    this.synth.speak(utterThis)
  }

  constructor (sentences = [], languages = []) {
    this.synth = window.speechSynthesis
    this.languages = languages
    this.sentences = sentences
    if (languages.length === 0) {
      this.languages = this.synth.getVoices()
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
        'time is money'
      ]
    }
  }
}

module.exports = { Speaker }
