/* global SpeechSynthesisUtterance */

const chooseUnique = require('../utils.js').chooseUnique

const playSound = (url) => {
  const audio = document.createElement('audio')
  audio.style.display = 'none'
  audio.src = url
  audio.autoplay = true
  audio.onended = function () {
    audio.remove() // Remove when played.
  }
  document.body.appendChild(audio)
}

class Speaker {
  play (ttext = undefined, lang = undefined) {
    if (!ttext) {
      ttext = chooseUnique(this.sentences, 1)[0]
    }
    const utterThis = new SpeechSynthesisUtterance(ttext)
    utterThis.volume = this.volume || 1
    if (!lang) {
      lang = chooseUnique(this.languages, 1)[0]
    } else {
      lang = this.languages.filter(i => i.lang.slice(0, 2) === lang)
      lang = chooseUnique(lang, 1)[0]
    }
    utterThis.voice = lang
    this.synth.speak(utterThis)
  }

  langs () {
    console.log(this.languages.map(i => i.lang))
  }

  langsNames () {
    console.log(this.languages.map(i => [i.lang, i.name]))
  }

  constructor (sentences = [], languages = []) {
    this.synth = window.speechSynthesis
    this.languages = languages
    this.sentences = sentences
    if (!languages || languages.length === 0) {
      this.languages = this.synth.getVoices()
      setTimeout(() => {
        this.languages = this.synth.getVoices()
      }, 100)
    }
    if (!sentences || sentences.length === 0) {
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

const speaker = new Speaker()
module.exports = { Speaker, playSound, speaker }
