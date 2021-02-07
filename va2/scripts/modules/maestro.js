const d = require('./utils.js').defaultArg
const { chooseUnique } = require('./utils.js')
const t = require('tone')

const e = module.exports

e.mkOsc = (freq, vol, pan, type, noConnect, nostart) => {
  const panner = new t.Panner(d(pan, 1))
  if (!noConnect) panner.toDestination()
  const synth = new t.Oscillator(d(freq, 200), d(type, 'sine')).connect(panner)
  if (!nostart) synth.start()
  synth.volume.value = d(vol, -200)
  synth.panner = panner
  return synth
}

e.sounds = [
  ['aloop', 38],
  ['ocean1', 65],
  ['boom', 1.5]
].map(i => { return { name: i[0], duration: i[1] } })

e.Speaker = class {
  play (ttext, lang, loop) {
    if (!ttext) {
      ttext = chooseUnique(this.sentences, 1)[0]
    }
    const utterThis = new window.SpeechSynthesisUtterance(ttext)
    utterThis.volume = this.volume || 1
    if (!lang) {
      lang = chooseUnique(this.languages, 1)[0]
    } else {
      if (lang.length === 2) {
        lang = this.languages.filter(i => i.lang.slice(0, 2) === lang)
      } else {
        lang = this.languages.filter(i => i.lang === lang)
      }
      lang = lang.filter(i => !i.name.includes('Google'))
      lang = chooseUnique(lang, 1)[0]
    }
    console.log(lang)
    utterThis.voice = lang
    this.synth.speak(utterThis)
    if (loop) {
      utterThis.onend = () => this.synth.speak(utterThis)
      return utterThis
    }
  }

  langs () {
    console.log(this.languages.map(i => i.lang))
  }

  langsNames () {
    console.log(this.languages.map(i => [i.lang, i.name]))
  }

  constructor (sentences = [], languages = []) {
    this.synth = window.speechSynthesis
    if (!this.synth) {
      return
    }
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

e.speaker = new e.Speaker()
