const t = require('tone')
const $ = require('jquery')
const percom = require('percom')

const transfer = require('../transfer.js')
const maestro = require('../maestro.js')
const utils = require('../utils.js')
const w = require('./common.js').waveforms
const p = require('./common.js').permfuncs

const e = module.exports

e.Med = class {
  constructor (med2) {
    transfer.findAny({ 'header.med2': med2 }).then(r => {
      this.setting = r
      this.voices = []
      for (let i = 0; i < r.voices.length; i++) {
        const v = r.voices[i]
        this.voices.push(this['add' + v.type.replace('-', '')](v))
      }
      this.setVisual(r.visSetting)
      this.setStage()
      $('#loading').hide()
    })
  }

  addMartigli (s) {
    console.log('in martigli voice')
    const synthM = maestro.mkOsc(0, -400, 0, w[s.waveformM], false, true)
    const mul = new t.Multiply(s.ma).chain(new t.Add(s.mf0), synthM.frequency)
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // in setVisual, check if this var is existent.
    }
    // return the start and the finish function
    return {
      start: tt => {
        synthM.start(tt)
        mod.start(tt)
        synthM.volume.rampTo(-40, 1, tt)
        mod.frequency.rampTo(1 / s.mp1, s.md, tt)
      },
      stop: tt => {
        synthM.volume.rampTo(-200, 1, tt)
        synthM.stop(tt + 1)
        mod.stop(tt + 1)
      }
    }
  }

  addBinaural (s) {
    console.log('in binaural voice')
    const synthL = maestro.mkOsc(s.fl, -400, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -400, 1, w[s.waveformR], false, true)
    const pan = this.setPanner(s, synthL, synthR)
    const all = [synthL, synthR, pan]
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.rampTo(-40, 1, tt)
        synthR.volume.rampTo(-40, 1, tt)
      },
      stop: tt => {
        synthL.volume.rampTo(-400, 1, tt)
        synthR.volume.rampTo(-400, 1, tt)
        all.forEach(i => i.stop(tt + 1))
      }
    }
  }

  addMartigliBinaural (s) {
    console.log('in martigli binaural voice')
    const synthL = maestro.mkOsc(s.fl, -400, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -400, 1, w[s.waveformR], false, true)
    const mul = new t.Multiply(s.ma).fan(
      (new t.Add(s.fl)).connect(synthL.frequency),
      (new t.Add(s.fr)).connect(synthR.frequency)
    )
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // in setVisual, check if this var is existent.
    }
    const pan = this.setPanner(s, synthL, synthR, mod)
    const all = [synthL, synthR, mod, pan]
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.rampTo(-40, 1, tt)
        synthR.volume.rampTo(-40, 1, tt)
      },
      stop: tt => {
        synthL.volume.rampTo(-400, 1, tt)
        synthR.volume.rampTo(-400, 1, tt)
        all.forEach(i => i.stop(tt + 1))
      }
    }
  }

  addSymmetry (s) {
    console.log('in symmetry voice')
    const freqSpan = s.noctaves * 2
    const freqFact = freqSpan ** (1 / s.nnotes)
    const notes = [s.f0]
    for (let i = 1; i < s.nnotes; i++) {
      notes.push(s.f0 * (freqFact ** i))
    }
    // const sy = maestro.mkOsc(s.fl, -400, -1, w[s.waveform], false, true)
    const sy = new t.Synth({ oscillator: { type: w[s.waveform] } }).toDestination()
    sy.volume.value = -400
    window.sy = sy
    const noteSep = s.d / notes.length
    const noteDur = noteSep / 2
    const permfunc = utils.permutations[p[s.permfunc]]
    const loop = new t.Loop(time => {
      // check types of permutations. Implement at least:
      // symmetric, rotation and mirror. Maybe also compound
      permfunc(notes)
      for (const note in notes) {
        console.log(note, notes[note], notes, time, time + noteSep * note)
        sy.triggerAttackRelease(notes[note], noteDur, time + noteSep * note)
      }
    }, s.d)
    window.percom = percom
    return {
      start: tt => {
        loop.start(tt)
        sy.volume.rampTo(-40, 1, tt)
      },
      stop: tt => {
        loop.stop(tt + 1)
        sy.volume.rampTo(-400, 1, tt)
      }
    }
  }

  addSample (s) {
    console.log('in sample voice')
    return {
      start: () => {
      },
      stop: () => {
      }
    }
  }

  setVisual (s) {
    console.log('in set visual')
    return {
      start: () => {
      },
      stop: () => {
      }
    }
  }

  setStage () {
    const check = $('<input/>', {
      type: 'checkbox'
    }).appendTo('body').change(() => {
      if (check.prop('checked')) {
        t.start()
        t.Master.mute = false
        t.Transport.start(0)
        this.voices.forEach(v => {
          console.log('yeyaa', v)
          if (!v) return
          console.log('yey', v)
          v.start(5)
          v.stop(15)
        })
      }
    })
    window.check = check
  }

  setPanner (s, synthL, synthR, mod) {
    if (s.panOsc === 0) {
      return { start: () => { }, stop: () => { } }
    } else if (s.panOsc === 1) { // linear transition and hold
      const env = new t.Envelope({
        attack: s.panOscTrans,
        decay: 0.01,
        sustain: 1,
        release: s.panOscTrans,
        attackCurve: 'linear',
        releaseCurve: 'linear'
      }).chain(new t.Multiply(2), (new t.Add(-1)).connect(synthL.panner.pan), new t.Negate(), synthR.panner.pan)
      // todo: check if 2x period is the right way to go and if the settings are 100% ok.
      const loop = new t.Loop(time => {
        env.triggerAttackRelease(s.panOscPeriod, time)
      }, s.panOscPeriod * 2)
      return {
        start: tt => loop.start(tt), // has to have transport started
        stop: tt => loop.stop(tt)
      }
    } else if ([2, 3].includes(s.panOsc)) { // sine
      // todo: implement arbitrary Martigli to sync the pan
      let panOsc
      let ret
      if (s.panOsc === 3) { // in sync with Martigli oscillation:
        panOsc = mod
        ret = { start: () => { }, stop: () => { } }
      } else { // independent:
        panOsc = maestro.mkOsc(1 / s.panOscPeriod, 0, 0, 'sine', true, true)
        ret = { start: tt => panOsc.start(tt), stop: tt => panOsc.stop(tt + 1) }
      }
      const neg = new t.Negate()
      const mul1 = new t.Multiply(1)
      panOsc.fan(neg, mul1)
      mul1.connect(synthL.panner.pan)
      neg.connect(synthR.panner.pan)
      return ret
    }
  }
}
