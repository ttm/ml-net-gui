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

e.recOffline = (fun, dur, bitdepth, filename) => {
  const wavefile = require('wavefile')
  const wav = new wavefile.WaveFile()
  const performance = window.performance
  let now = performance.now()
  t.Offline(() => {
    fun()
  }, dur).then(buffer => {
    console.log((performance.now() - now) / 1000)
    now = performance.now()
    console.log('buffer in')
    if (bitdepth === '16') {
      const bar_ = []
      buffer.toArray().forEach(chan => {
        const [max, min] = chan.reduce((mm, i) => {
          if (i > mm[0]) mm[0] = i
          if (i < mm[1]) mm[1] = i
          return mm
        }, [-Infinity, Infinity])
        console.log('MAXMIN', max, min)
        const chan_ = chan.map(i => Math.floor((2 ** 15 - 1) * (2 * (i - min) / (max - min) - 1)))
        bar_.push(chan_)
      })
      wav.fromScratch(2, 44100, '16', bar_)
      console.log('16', true)
    } else {
      console.log('32', true)
      wav.fromScratch(2, 44100, '32f', buffer.toArray())
      console.log((performance.now() - now) / 1000)
      now = performance.now()
      // wav.fromBuffer(buffer.get())
    }
    doIt()
  })
  function doIt () {
    console.log('wav in')
    const uri = wav.toDataURI()
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = uri
    console.log('URI ok', (performance.now() - now) / 1000)
    now = performance.now()
    console.log('url in')
    a.download = (filename || 'test') + '.wav'
    a.click()
    console.log('click download ok', (performance.now() - now) / 1000)
    console.log('clicked')
  }
}
