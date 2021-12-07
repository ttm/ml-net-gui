const PIXI = require('pixi.js')
const t = require('tone')
const $ = require('jquery')
const dat = require('dat.gui')
const NS = require('nosleep.js')

const transfer = require('../transfer.js')
const maestro = require('../maestro.js')
const net = require('../net.js')
const utils = require('../utils.js')
const w = require('./common.js').waveforms
const p = require('./common.js').permfuncs
const nextSync = require('./common.js').nextSync
const u = require('../router.js').urlArgument

const tr = PIXI.utils.string2hex
const e = module.exports

// todo:
// linear vs rampto

e.Med = class {
  constructor (r) {
    this.PIXI = PIXI
    this.tone = t
    this.finalFade = 5
    this.initialFade = 2
    this.initialVolume = -20
    this.isMobile = utils.mobileAndTabletCheck()
    this.app = new PIXI.Application({ // todo: make it resizable
      width: window.innerWidth,
      height: window.innerHeight * 0.80,
      antialias: true
    })
    if (r instanceof Array) {
      console.log('the options:', r)
      r = this.promptForSelection(r)
    }
    $('#canvasDiv').append(this.app.view)
    if (u('offline')) { // for recording
      $('#loading').hide()
      $('<button/>').appendTo('body').html('RECORD YEAH')
        .click(() => {
          maestro.recOffline(() => {
            this.doIt(r)
            $('#startChecked').click()
          }, r.header.d + 10, u('b16') ? '16' : '32f', r.header.med2)
        })
    } else {
      if (r === null) {
        window.alert(`Failed to retrieve the session artifact. Please reload. Such "${r.header.med2}" artifact may not exist.`)
        return
      }
      if (r.visSetting.isNetwork) {
        const after = () => {
          this.anet.dn = new net.ParticleNet2(this.app, this.anet.net, this.anet.atlas, false)
          this.anet.dn.hide()
          this.doIt(r)
        }
        if (r.visSetting.uid) {
          transfer.fAll.omark({ 'userData.id': r.visSetting.uid }).then(r0 => {
            this.anet = net.plotFromMongo(r0.net, this.app, !r.visSetting.network) // 1 is only scrapped, 0 is all
            this.anet.net.nodes_ = this.anet.net.nodes()
            after()
          })
        } else if (r.visSetting.comName) {
          transfer.fAll.oaeterni({ comName: r.visSetting.comName }).then(r0 => {
            r0.network.nodes.sort((a, b) => {
              const [aa, ab] = [a.attributes, b.attributes]
              if (aa.origDegree !== ab.origDegree) return aa.origDegree - ab.origDegree
              const [ai, bi] = [aa.sid || aa.nid, ab.sid || ab.nid]
              // return ai > bi ? 1 : -1
              return ai.split('').reverse().join('') > bi.split('').reverse().join('') ? 1 : -1
            })
            const memberSets = window.memberSets = utils.chunkArray(r0.network.nodes, r.visSetting.ssize)
            window.memberSet = memberSets[r.visSetting.network]
            this.anet = net.plotFromMongo(r0.network, this.app)
            this.anet.net.nodes_ = window.memberSet.map(i => i.key)
            after()
          })
        } else { // fixme: download only the network to be used:
          transfer.fAll.ttm({ sid: { $exists: true } }, { name: 1, sid: 1 }, 'test').then(r0 => {
            r0.sort((a, b) => a.name > b.name ? 1 : -1)
            transfer.fAll.ttm({ sid: r0[r.visSetting.network].sid }, {}, 'test').then(rr => {
              this.anet = net.plotFromMongo(JSON.parse(rr[0].text), this.app)
              this.anet.net.nodes_ = this.anet.net.nodes()
              after()
            })
          })
        }
      } else {
        this.doIt(r)
      }
    }
  }

  promptForSelection (r) {
    if (r.length === 1) return r[0]
    const opts = [
      'sinusoid',
      'lemniscate',
      'trefoil (triquetra)',
      'figure-eight (Listing\'s) knot',
      'torus knot',
      'cinquefoil knot',
      'decorative torus knot',
      'Lissajous 3-4',
      'Ray',
      'void'
    ]
    const options = []
    r.forEach((rr, i) => {
      let p1
      if (rr.header.onlyOnce === false) {
        p1 = 'Æternal!'
      } else {
        p1 = rr.header.datetime.toISOString().split('.')[0].replace('T', ', ')
      }
      const p2 = `is template: ${rr.header.communionSchedule}`
      const p3 = `background: ${rr.visSetting.bgc}`
      const p4 = `shape: ${opts[rr.visSetting.lemniscate]}`
      const p5 = `voices: ${rr.voices.length}`
      options.push(i + ')' + [p1, p2, p3, p4, p5].join(', '))
    })
    return r[window.prompt('Select artifact:\n' + options.join('\n'))]
  }

  doIt (r) {
    this.setting = r
    this.voices = []
    for (let i = 0; i < r.voices.length; i++) {
      const v = r.voices[i]
      this.voices.push({ ...this['add' + v.type.replace('-', '')](v), type: v.type, isOn: v.isOn, iniVolume: v.iniVolume })
    }
    this.visualsCommon = this.setVisualCommon(r.visSetting)
    this.visuals = this.setVisual(r.visSetting) // this changes between model2-3
    this.setControl()
    this.setStage(r.header)
    $('#loading').hide()
  }

  addMartigli (s) {
    const synthM = maestro.mkOsc(0, -150, 0, w[s.waveformM], false, true)
    const addmf0 = new t.Add(s.mf0)
    const mul = new t.Multiply(s.ma).chain(addmf0, synthM.frequency)
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // this.setVisual() checks if this var is existent.
    }
    s.iniVolume = s.iniVolume || 0
    return {
      start: tt => {
        synthM.start(tt)
        mod.start(tt)
        synthM.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
        mod.frequency.linearRampTo(1 / s.mp1, s.md, tt) // todo: check if better than rampTo
      },
      stop: tt => {
        synthM.volume.linearRampTo(-200, this.finalFade, tt)
        synthM.stop('+' + (tt + this.finalFade))
        mod.stop('+' + (tt + this.finalFade))
      },
      nodes: {
        synthM, mul, mod, addmf0
      },
      volume: { synthM }
    }
  }

  addBinaural (s) {
    const synthL = maestro.mkOsc(s.fl, -150, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -150, 1, w[s.waveformR], false, true)
    const pan = this.setPanner(s, synthL, synthR)
    const all = [synthL, synthR, pan]
    s.iniVolume = s.iniVolume || 0
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
        synthR.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
      },
      stop: tt => {
        synthL.volume.linearRampTo(-150, this.finalFade, tt)
        synthR.volume.linearRampTo(-150, this.finalFade, tt)
        all.forEach(i => i.stop('+' + (tt + this.finalFade)))
      },
      nodes: {
        synthL, synthR, pan
      },
      volume: { synthL, synthR }
    }
  }

  addMartigliBinaural (s) {
    const synthL = maestro.mkOsc(s.fl, -150, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -150, 1, w[s.waveformR], false, true)
    const synthL_ = (new t.Add(s.fl)).connect(synthL.frequency)
    const synthR_ = (new t.Add(s.fr)).connect(synthR.frequency)
    const mul = new t.Multiply(s.ma).fan(
      synthL_,
      synthR_
    )
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // this.setVisual check if this var is existent.
    }
    const pan = this.setPanner(s, synthL, synthR, mod)
    const all = [synthL, synthR, mod, pan]
    s.iniVolume = s.iniVolume || 0
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
        synthR.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
        mod.frequency.linearRampTo(1 / s.mp1, s.md, tt) // todo: check if better than rampTo
      },
      stop: tt => {
        synthL.volume.linearRampTo(-150, this.finalFade, tt)
        synthR.volume.linearRampTo(-150, this.finalFade, tt)
        all.forEach(i => i.stop('+' + (tt + this.finalFade)))
      },
      nodes: {
        synthL, synthR, mul, mod, synthL_, synthR_, pan
      },
      volume: { synthL, synthR }
    }
  }

  addSymmetry (s) {
    const freqFact = 2 ** (s.noctaves / s.nnotes)
    const notes = [s.f0]
    for (let i = 1; i < s.nnotes; i++) {
      notes.push(s.f0 * (freqFact ** i))
    }
    const syOptions = { oscillator: { type: w[s.waveform] } }
    const noteSep = s.d / notes.length
    // if (noteSep > 10) syOptions.envelope = { attack: 2, decay: 2 }
    const sy = new t.Synth(syOptions).toDestination()
    sy.volume.value = -150
    const noteDur = noteSep / 2
    const permfunc = utils.permutations[p[s.permfunc]]
    const loop = new t.Loop(time => {
      // todo: implement compound and peals
      permfunc(notes)
      for (const note in notes) { // fixme: use Pattern instead of Loop for this
        sy.triggerAttackRelease(notes[note], noteDur, time + noteSep * note)
      }
    }, s.d)
    s.iniVolume = s.iniVolume || 0
    return {
      start: tt => {
        loop.start(tt)
        sy.volume.linearRampTo(s.iniVolume + this.initialVolume, this.initialFade, tt)
      },
      stop: tt => {
        loop.stop('+' + (tt + this.finalFade))
        sy.volume.linearRampTo(-150, this.finalFade, tt)
      },
      nodes: {
        sy, loop
      },
      volume: { sy }
    }
  }

  addSample (s) {
    const sampler = new t.Player(`assets/audio/${maestro.sounds[s.soundSample].name}.mp3`).toDestination()
    s.iniVolume = s.iniVolume || 0
    sampler.volume.value = parseFloat(s.iniVolume + this.initialVolume)
    sampler.loop = s.soundSamplePeriod === 0
    const nodes = { sampler }
    let theSamp
    if (sampler.loop) {
      theSamp = sampler
    } else {
      theSamp = new t.Loop(time => {
        sampler.start(time)
      }, s.soundSamplePeriod)
      nodes.theSamp = theSamp
    }
    return {
      start: tt => {
        theSamp.start(tt + (s.soundSampleStart || 0))
      },
      stop: tt => {
        sampler.volume.linearRampTo(-150, this.finalFade, tt)
        theSamp.stop('+' + (tt + this.finalFade))
      },
      nodes,
      volume: { sampler }
    }
  }

  setVisual (s) { // gets overwritten by subclasses
  }

  setTimeToStart (s) {
    if (s.onlyOnce === undefined || s.onlyOnce) return
    s.datetime = nextSync()
  }

  setStage (s) {
    this.setTimeToStart(s)
    const isMobile = this.isMobile
    const adiv = utils.centerDiv(undefined, $('#canvasDiv'), utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0])
      .css('text-align', 'center')
      .css('padding', '0.4% 1%')
    const countdownMsg = $('<span/>', {
      css: {
        'font-size': isMobile ? '3vw' : '1vw'
      }
    // }).html(`countdown to start (at ${nextSync(true)}):`)
    }).html(`starts at ${nextSync(true)}, countdown:`)
    const countdownCount = $('<span/>', {
      class: 'notranslate',
      css: {
        'font-size': isMobile ? '3vw' : '1vw'
      }
    }).html('--:--:--')
    $('<p/>').appendTo(adiv)
      .append(countdownMsg)
      .append(countdownCount)
    const lpar = $('<p/>').appendTo(adiv)
    const label = $('<label/>', {
      class: 'switch',
      css: {
        margin: '0 auto'
      }
    }).appendTo(lpar)
    const noSleep = new NS()
    // t.setContext(new t.Context({ latencyHint: 'playback' })) // fixme: why does teh counter stop??
    const check = $('<input/>', {
      type: 'checkbox',
      id: 'startChecked'
    }).appendTo(label).change(() => {
      if (check.prop('checked')) {
        noSleep.enable()
        clearTimeout(badTimer)
        clearInterval(badCounter)
        check.prop('disabled', true)
        this.pset.destroy()
        this.startGoodTimer(s)
      }
    })
    $('<div/>', { class: 'slideraa round' }).appendTo(label)
    // utils.mkBtn('cog', 'Config artifact', () => {
    //   this.openConfs()
    // }, label).css('vertical-align', 'bottom')
    // $('<div/>', { css: { width: '2%', height: '2%', background: 'green' } }).appendTo(lpar).click(() => console.log('clicked jowww')) // todo: make a way to start the artifact at once, maybe in the dat.gui

    const inhale = $('<span/>').html(' inhale ')
    const exhale = $('<span/>').html(' exhale ')
    $('<p/>', {
      css: {
        'font-size': isMobile ? '3vw' : '1vw'
      }
    }).appendTo(adiv)
      .append($('<span/>').html('✡'))
      .append(inhale)
      .append($('<span/>').html('✡'))
      .append(exhale)
      .append($('<span/>').html('✡'))
    this.updateScheduling(s) // to update s.datetime
    const badTimer = setTimeout(() => {
      check.prop('disabled', true)
      $('.slideraa').css('background', '#cacaca')
      countdownMsg.html('No late participants allowed. Time since session started:')
      this.pset.destroy()
      countdownCount.html('')
      setTimeout(() => {
        window.wand.modal.show(4000)
      }, 4000)
    }, this.getDurationToStart(s))
    const badCounter = setInterval(() => {
      countdownCount.html(' ' + utils.secsToTime(this.getDurationToStart(s) / 1000))
    }, 100)
    this.guiEls = { countdownMsg, countdownCount, label, inhale, exhale }
  }

  setPanner (s, synthL, synthR, mod) {
    if (s.panOsc === 0) {
      return { start: () => { }, stop: () => { }, dispose: () => { } }
    } else if (s.panOsc === 1) { // linear transition and hold
      const mul2 = new t.Multiply(2)
      const addm1 = new t.Add(-1)
      const negate = new t.Negate()
      const env = new t.Envelope({
        attack: s.panOscTrans,
        decay: 0.01,
        sustain: 1,
        release: s.panOscTrans,
        attackCurve: 'linear',
        releaseCurve: 'linear'
      }).chain(mul2, addm1.connect(synthL.panner.pan), negate, synthR.panner.pan)
      // todo: check if 2x period is the right way to go and if the settings are 100% ok.
      const loop = new t.Loop(time => {
        env.triggerAttackRelease(s.panOscPeriod, time)
      }, s.panOscPeriod * 2)
      return {
        start: tt => loop.start(tt), // has to have transport started
        stop: tt => loop.stop(tt),
        dispose: () => {
          env.dispose()
          mul2.dispose()
          addm1.dispose()
          negate.dispose()
        }
      }
    } else if ([2, 3].includes(s.panOsc)) { // sine
      // todo: implement arbitrary Martigli to sync the pan
      let panOsc
      let ret
      if (s.panOsc === 3) { // in sync with Martigli oscillation:
        panOsc = mod
        ret = { start: () => { }, stop: () => { }, dispose: () => { } }
      } else { // independent:
        panOsc = maestro.mkOsc(1 / s.panOscPeriod, 0, 0, 'sine', true, true)
        ret = { start: tt => panOsc.start(tt), stop: tt => panOsc.stop(tt + 1), dispose: () => panOsc.dispose() }
      }
      const neg = new t.Negate()
      const mul1 = new t.Multiply(1)
      panOsc.fan(neg, mul1)
      mul1.connect(synthL.panner.pan)
      neg.connect(synthR.panner.pan)
      return ret
    }
  }

  getDurationToStart () { // in ms
    return this.setting.header.datetime.getTime() - (new Date()).getTime()
  }

  d () {
    return this.getDurationToStart() / 1000
  }

  startGoodTimer (s) {
    this.visuals.start()
    this.visualsCommon.start()
    if (s.vcontrol) this.volumeControl()
    this.voices.forEach(v => {
      if (!v) return
      v.start('+' + this.d())
      // v.stop(this.d() + s.d)
      v.stop('+' + (this.d() + s.d))
    })

    let started = false
    t.Transport.schedule((time) => { // change message to ongoing
      started = true
      t.Draw.schedule(() => {
        this.guiEls.countdownMsg.html('countdown to finish:')
        if (!window.sessionL) return
        window.wand.transfer.fAll.ucosta(
          { _id: window.sessionL.insertedId },
          { started: new Date() }
        )
      }, time)
    }, '+' + this.d())

    let finished = false
    t.Transport.schedule((time) => { // change message to finished
      finished = true
      t.Draw.schedule(() => {
        this.guiEls.countdownMsg.html('session finished. Time elapsed:')
        window.wand.modal.show(5000)
        if (!window.sessionL) return
        window.wand.transfer.fAll.ucosta(
          { _id: window.sessionL.insertedId },
          { finishedSession: new Date() }
        )
      }, time)
    }, '+' + (this.d() + s.d))

    new t.Loop(time => { // update counter before starts and then before ends.
      t.Draw.schedule(() => {
        const mm = this.d()
        this.guiEls.countdownCount.html(' ' + utils.secsToTime(mm > 0 ? mm : mm + s.d))
      }, time)
    }, 0.1).start(0)

    window.onfocus = () => {
      if (started && !finished) {
        this.guiEls.countdownMsg.html('countdown to finish:')
      } else if (finished) {
        this.guiEls.countdownMsg.html('session finished. Time elapsed:')
      }
    }
    t.start(0)
    t.Transport.start('+0.1')
    t.Master.mute = false
  }

  startGoodTimer2 (s) { // not being used!
    this.visuals.start()
    setTimeout(() => { // change message to ongoing
      this.guiEls.countdownMsg.html('countdown to finish:')
    }, this.getDurationToStart(s))

    setTimeout(() => { // change message to finished
      this.guiEls.countdownMsg.html('session finished. Time elapsed:')
    }, this.getDurationToStart(s) + s.d * 1000)

    setInterval(() => {
      const mm = this.getDurationToStart(s) / 1000
      this.guiEls.countdownCount.html(' ' + utils.secsToTime(mm > 0 ? mm : mm + s.d))
    }, 100)

    t.start(0)
    t.Transport.start(0)
    t.Master.mute = false
    this.voices.forEach(v => {
      if (!v) return // todo: find when !v or remove conditional
      v.start(this.getDurationToStart(s) / 1000)
      v.stop(this.getDurationToStart(s) / 1000 + s.d)
    })
  }

  updateScheduling (s) {
    if (u('s')) {
      s.datetime = utils.timeArgument()
    } else if (u('t')) {
      const dt = new Date()
      dt.setSeconds(dt.getSeconds() + parseFloat(u('t')))
      s.datetime = dt
    }
  }

  setControl () {
    const set = {}
    set.width = window.innerWidth / 3.5
    if (this.isMobile) set.width = window.innerWidth * 0.98
    const pset = this.pset = new dat.GUI(set)
    let mRef
    const vv = this.setting.voices
    vv.some((v, i) => {
      if (v.isOn) {
        mRef = i
        return true
      }
      return false
    })
    if (mRef !== undefined) {
      const mVoices = []
      vv.forEach((v, i) => {
        // if (i === mRef) return
        if (v.type.includes('Martigli')) {
          if (v.mp0 === vv[mRef].mp0 && v.mp1 === vv[mRef].mp1) mVoices.push(i)
        }
      })
      pset.add({ 'final period': vv[mRef].mp1 }, 'final period', 1, 60, 1).listen().onFinishChange(val => {
        mVoices.forEach(i => {
          vv[i].mp1 = val
          this.voices[i].nodes.mod.frequency.linearRampTo(1 / val, vv[i].md, '+' + this.d())
        })
      })
      pset.add({ 'initial period': vv[mRef].mp0 }, 'initial period', 1, 60, 1).listen().onFinishChange(val => {
        mVoices.forEach(i => {
          this.voices[i].nodes.mod.frequency.value = 1 / val
        })
      })
      pset.add({ transition: vv[mRef].md }, 'transition', 60, 60 * 30, 30).listen().onFinishChange(val => {
        mVoices.forEach(i => {
          vv[i].md = val
          this.voices[i].nodes.mod.frequency.linearRampTo(1 / vv[i].mp1, val, '+' + this.d())
        })
      })
    }
    this.dsli = pset.add({ duration: this.setting.header.d }, 'duration', 120, 60 * 60, 60).listen().onFinishChange(val => {
      this.setting.header.d = val
    })
    this.prop = pset.add({ proportion: 0.5 }, 'proportion', 0.1, 0.9, 0.05).listen().onFinishChange(val => {
      this.prop_ = val
    })
    this.mplay = pset.add({
      play: () => {
        if (!window.confirm('Are you sure that you prefer to start now instead of waiting for the next Angel hour?')) return
        console.log('play')
        const dt = new Date()
        dt.setSeconds(dt.getSeconds() + 3)
        this.setting.header.datetime = dt
        $('#startChecked').click()
      }
    }, 'play').name('... Start now! ...')
    const color = '#496284'
    $('.function').css('background', color).css('border-left', color)
    this.tuneControls(true)
  }

  volumeControl () {
    // const gui = new dat.GUI({ closed: true, closeOnTop: true })
    const set = {}
    set.width = window.innerWidth / 3.5
    if (this.isMobile) set.width = window.innerWidth / 2
    const gui = this.theGui = new dat.GUI(set)
    const counts = this.voices.reduce((a, v) => {
      a[v.type] = 0
      return a
    }, {})
    const n = type => type === 'Martigli-Binaural' ? 'Mar_Bin' : type
    let master = 0
    const instruments = []
    for (let i = 0; i < this.voices.length; i++) {
      const v = this.voices[i]
      let label
      if (v.isOn) {
        label = `REF ${n(v.type)}`
      } else {
        label = `${n(v.type)}-${++counts[v.type]}`
      }
      const d = {}
      d[label] = 50 + v.iniVolume
      const voiceGui = gui.add(d, label, 0, 100).listen()
      const instr = []
      for (const instrument in v.volume) {
        v.volume[instrument].defVolume = v.iniVolume + this.initialVolume
        instr.push(v.volume[instrument])
      }
      instruments.push({ voiceGui, instr })
      voiceGui.onChange(val => {
        for (const instrument in v.volume) {
          v.iniVolume = val - 50
          v.volume[instrument].volume.value = val + this.initialVolume - 50 + master
        }
      })
    }
    const masterGui = gui.add({ master: 50 }, 'master', 0, 100).listen()
    masterGui.onChange(val => {
      master = val - 50
      instruments.forEach(i => {
        i.instr.forEach(ii => {
          ii.volume.value = i.voiceGui.getValue() + ii.defVolume - 50 + master
        })
      })
    })
    this.tuneControls()
  }

  tuneControls (isSet) {
    if (this.isMobile) {
      const size = (isSet ? 67 : 37) + 'px'
      $('.dg.main .close-button.close-bottom')
        .css('padding-bottom', '10px').css('padding-top', '10px')
      $('.dg .cr.number').css('height', size)
      $('.dg .c .slider').css('height', size)
      let open = true
      $('.dg.main .close-button.close-bottom').click(() => {
        if (open) {
          $('.dg .cr.number').css('height', '0px')
        } else {
          $('.dg .cr.number').css('height', size)
        }
        open = !open
      })
    }
    const size = (isSet && this.isMobile ? 33 : 24) + 'px'
    $('.dg').css('font-size', size)
    // $('.close-button').css('background-color', '#777777')
    $('.close-button')
      .css('background-color', 'rgba(0,0,0,0)')
      .css('border', 'solid #777777')
      .click()
    if (this.isMobile && isSet) $('.dg .cr.number input[type=text]').css('font-size', '36px')
    $('.dg .c input[type=text]').css('width', '15%')
    $('.dg .c .slider').css('width', '80%')
  }

  setVisualCommon (s) {
    const app = this.app
    const nodeContainer = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true
    })
    app.stage.addChild(nodeContainer)

    const circleTexture = app.renderer.generateTexture( // for flakes and any other circle
      new PIXI.Graphics()
        .beginFill(0xffffff)
        .drawCircle(0, 0, 5)
        .endFill()
    )

    function mkNode (pos, scale = 1, tint = 0xffffff) {
      const circle = new PIXI.Sprite(circleTexture)
      circle.position.set(...(pos || [0, 0]))
      circle.anchor.set(0.5, 0.5)
      circle.scale.set(scale, scale)
      circle.tint = tint
      nodeContainer.addChild(circle)
      return circle
    }

    const [w, h] = [app.view.width, app.view.height]
    const c = [w / 2, h / 2] // center
    const a = w * 0.35 // for non-sinusoid?
    const [dx, dy] = [w * 0.8, h * 0.4] // for sinusoid, period and amplitude

    const theCircle = mkNode([s.lemniscate ? c[0] : w * 0.3, h * 0.2]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(c, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(c, 1, 0x00ff00) // center (sinus), left (lemniscate)
    const bCircle = new PIXI.Graphics() // vertical for breathing
      .beginFill(0xffffff)
      .drawCircle(0, 0, 5)
      .endFill()
    bCircle.zIndex = 1000
    bCircle.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
    app.stage.addChild(bCircle) // breathing cue
    app.stage.sortableChildren = true

    theCircle.tint = tr(s.fgc)
    myCircle2.tint = tr(s.lcc)
    myCircle3.tint = tr(s.ccc)
    bCircle.tint = tr(s.bcc)
    app.renderer.backgroundColor = tr(s.bgc)

    this.visCom = { app, mkNode, bCircle, theCircle, myCircle2, myCircle3, w, h, c, a, dx, dy }

    // ticker stuff:
    let propx = 1
    let propy = 1
    let rot = Math.random() * 0.1
    const parts = []
    let f1 = (n, sx, sy, mag) => {
      n.x += sx / mag + (Math.random() - 0.5) * 5
      n.y += sy / mag + (Math.random() - 0.5) * 5
    }
    if (s.rainbowFlakes) {
      f1 = (n, sx, sy, mag) => {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
    let lastdc = 0
    this.bounceFuncs = []
    this.notBouncingFuncs = []
    if (s.ellipse) {
      this.bounceFuncs.push(() => {
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
      })
    }
    const y = h / 2
    this.inhale = true
    const ticker = app.ticker.add(() => {
      const dc = this.meter ? this.meter.getValue() : 0
      const cval = (1 - Math.abs(dc))
      this.dc = dc
      this.cval = cval

      if (dc + 1 < 0.0005) {
        this.bounceFuncs.forEach(f => f())
      } else {
        this.notBouncingFuncs.forEach(f => f())
      }

      if (dc - lastdc > 0) { // inhale
        this.inhale = true
        this.guiEls.inhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.exhale.css('background', 'rgba(0,0,0,0)')
      } else { // exhale
        this.inhale = false
        this.guiEls.exhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.inhale.css('background', 'rgba(0,0,0,0)')
      }
      lastdc = dc
      const val = -dc
      // if (this.lemniscate) { // todo: conditional really necessary?
      //   bCircle.y = val * a * 0.5 + y
      // } else {
      //   bCircle.y = val * dy + y
      // }
      bCircle.y = val * dy + y // todo: test
      const sc = 0.3 + (-val + 1) * 3
      bCircle.scale.set(sc * propx, sc * propy)
      bCircle.rotation += rot

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.2, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.2, myCircle3.tint))
      if (Math.random() > 0.98) {
        parts.push(mkNode([bCircle.x, bCircle.y], 0.3, bCircle.tint))
      }

      theCircle.x += (Math.random() - 0.5)
      theCircle.y += (Math.random() - 0.5)
      for (let ii = 0; ii < parts.length; ii++) {
        const n = parts[ii]
        const sx = theCircle.x - n.x
        const sy = theCircle.y - n.y
        const mag = (sx ** 2 + sy ** 2) ** 0.5
        if (mag < 5) {
          parts.splice(ii, 1)
          n.destroy()
        } else {
          f1(n, sx, sy, mag)
        }
      }
    })
    ticker.stop()
    // utils.basicStats() // for probing computational cost

    return {
      start: () => {
        ticker.start()
      },
      stop: () => {
        ticker.stop()
      }
    }
  }

  // openConfs () {
  //   $('<div/>', {
  //     id: 'myModal2',
  //     class: 'modal',
  //     role: 'dialog'
  //   }).appendTo('body')
  //     .append($('<div/>', {
  //       id: 'mcontent0',
  //       class: 'modal-content',
  //       css: { background: '#eeffee' }
  //     }).html('<h2>Yo</h2>')
  //       .append($('<p/>', { id: 'mcontent2' }))
  //     )
  //   $('#myModal2').css('z-index', 0)
  //   this.diag2 = $('<div/>', {
  //     id: 'diag2'
  //   })
  //   $('#myModal2').show()
  // }
}
