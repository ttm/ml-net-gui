const PIXI = require('pixi.js')
const t = require('tone')
const $ = require('jquery')
const percom = require('percom')
const dat = require('dat.gui')
const NS = require('nosleep.js')

const maestro = require('../maestro.js')
const net = require('../net.js')
const transfer = require('../transfer.js')
const utils = require('../utils.js')
const w = require('./common.js').waveforms
const p = require('./common.js').permfuncs
const u = require('../router.js').urlArgument

const e = module.exports
const tr = PIXI.utils.string2hex

// todo:
// linear vs rampto
// line thickness
// 3d drawing
// draw as trajectory happens

e.Med = class {
  constructor (r, light = false) {
    console.log('in model 3')
    this.finalFade = 5
    this.initialFade = 2
    this.initialVolume = -40
    this.isMobile = utils.mobileAndTabletCheck()
    const doIt = r => {
      this.setting = r
      this.voices = []
      for (let i = 0; i < r.voices.length; i++) {
        const v = r.voices[i]
        this.voices.push({ ...this['add' + v.type.replace('-', '')](v), type: v.type, isOn: v.isOn })
      }
      this.visuals = this.setVisual(r.visSetting)
      this.setStage(r.header)
      $('#loading').hide()
    }
    const query = { 'header.med2': r.header.med2 }
    if (light) query['header.creator'] = { $exists: true }
    if (u('offline')) { // for recording
      $('#loading').hide()
      $('<button/>').appendTo('body').html('RECORD YEAH')
        .click(() => {
          maestro.recOffline(() => {
            doIt(r)
            $('#startChecked').click()
          }, r.header.d + 10, u('b16') ? '16' : '32f', r.header.med2)
        })
    } else {
      if (r === null) {
        window.alert(`Failed to retrieve the session artifact. Please reload. Such "${r.header.med2}" artifact may not exist.`)
        return
      }
      doIt(r)
    }
  }

  addMartigli (s) {
    const synthM = maestro.mkOsc(0, -150, 0, w[s.waveformM], false, true)
    const mul = new t.Multiply(s.ma).chain(new t.Add(s.mf0), synthM.frequency)
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // this.setVisual() checks if this var is existent.
    }
    return {
      start: tt => {
        synthM.start(tt)
        mod.start(tt)
        synthM.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
        mod.frequency.linearRampTo(1 / s.mp1, s.md, tt) // todo: check if better than rampTo
      },
      stop: tt => {
        synthM.volume.linearRampTo(-200, this.finalFade, tt)
        synthM.stop('+' + (tt + this.finalFade))
        mod.stop('+' + (tt + this.finalFade))
      },
      volume: { synthM }
    }
  }

  addBinaural (s) {
    const synthL = maestro.mkOsc(s.fl, -150, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -150, 1, w[s.waveformR], false, true)
    const pan = this.setPanner(s, synthL, synthR)
    const all = [synthL, synthR, pan]
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
        synthR.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
      },
      stop: tt => {
        synthL.volume.linearRampTo(-150, this.finalFade, tt)
        synthR.volume.linearRampTo(-150, this.finalFade, tt)
        all.forEach(i => i.stop('+' + (tt + this.finalFade)))
      },
      volume: { synthL, synthR }
    }
  }

  addMartigliBinaural (s) {
    const synthL = maestro.mkOsc(s.fl, -150, -1, w[s.waveformL], false, true)
    const synthR = maestro.mkOsc(s.fr, -150, 1, w[s.waveformR], false, true)
    const mul = new t.Multiply(s.ma).fan(
      (new t.Add(s.fl)).connect(synthL.frequency),
      (new t.Add(s.fr)).connect(synthR.frequency)
    )
    const mod = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true, true).connect(mul)
    if (s.isOn) {
      const met = new t.DCMeter()
      mod.connect(met)
      this.meter = met // this.setVisual check if this var is existent.
    }
    const pan = this.setPanner(s, synthL, synthR, mod)
    const all = [synthL, synthR, mod, pan]
    return {
      start: tt => {
        all.forEach(i => i.start(tt))
        synthL.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
        synthR.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
        mod.frequency.linearRampTo(1 / s.mp1, s.md, tt) // todo: check if better than rampTo
      },
      stop: tt => {
        synthL.volume.linearRampTo(-150, this.finalFade, tt)
        synthR.volume.linearRampTo(-150, this.finalFade, tt)
        all.forEach(i => i.stop('+' + (tt + this.finalFade)))
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
    const sy = new t.Synth({ oscillator: { type: w[s.waveform] } }).toDestination()
    sy.volume.value = -150
    window.sy = sy
    const noteSep = s.d / notes.length
    const noteDur = noteSep / 2
    const permfunc = utils.permutations[p[s.permfunc]]
    const loop = new t.Loop(time => {
      // todo: implement compound and peals
      permfunc(notes)
      for (const note in notes) {
        sy.triggerAttackRelease(notes[note], noteDur, time + noteSep * note)
      }
    }, s.d)
    window.percom = percom
    return {
      start: tt => {
        loop.start(tt)
        sy.volume.linearRampTo(this.initialVolume, this.initialFade, tt)
      },
      stop: tt => {
        loop.stop('+' + (tt + this.finalFade))
        sy.volume.linearRampTo(-150, this.finalFade, tt)
      },
      volume: { sy }
    }
  }

  addSample (s) {
    const sampler = new t.Player(`assets/audio/${maestro.sounds[s.soundSample].name}.mp3`).toDestination()
    sampler.volume.value = parseFloat(s.soundSampleVolume)
    sampler.loop = s.soundSamplePeriod === 0
    let theSamp
    if (sampler.loop) {
      theSamp = sampler
    } else {
      theSamp = new t.Loop(time => {
        sampler.start(time)
      }, s.soundSamplePeriod)
    }
    return {
      start: tt => {
        theSamp.start(tt + (s.soundSampleStart || 0))
      },
      stop: tt => {
        sampler.volume.linearRampTo(-150, this.finalFade, tt)
        theSamp.stop('+' + (tt + this.finalFade))
      },
      volume: { sampler }
    }
  }

  setVisual (s) { // todo: enhance code quality
    const nodeContainer = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true
    })

    const bCircle = new PIXI.Graphics() // vertical for breathing
      .beginFill(0xffffff)
      .drawCircle(0, 0, 5)
      .endFill()

    const app = new PIXI.Application({ // todo: make it resizable
      width: window.innerWidth,
      height: window.innerHeight * 0.80
    })

    if (s.lemniscate === 32) {
      transfer.fAll.ttm({ sid: 'renato.fabbri.125' }, {}, 'test').then(r => {
        this.anet = net.plotFromMongo(JSON.parse(r[0].text), app)
        this.anet.dn = new net.ParticleNet2(app, this.anet.net, this.anet.atlas)
        this.anet.dn.hide()
      })
    }

    const circleTexture = app.renderer.generateTexture( // for flakes and any other circle
      new PIXI.Graphics()
        .beginFill(0xffffff)
        .drawCircle(0, 0, 5)
        .endFill()
    )

    // document.body.appendChild(app.view)
    $('#canvasDiv').append(app.view)
    app.stage.addChild(nodeContainer)
    const [w, h] = [app.view.width, app.view.height]
    const c = [w / 2, h / 2] // center

    function mkNode (pos, scale = 1, tint = 0xffffff) {
      const circle = new PIXI.Sprite(circleTexture)
      circle.position.set(...(pos || [0, 0]))
      circle.anchor.set(0.5, 0.5)
      circle.scale.set(scale, scale)
      circle.tint = tint
      nodeContainer.addChild(circle)
      return circle
    }

    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const theCircle = mkNode([x0, y0]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(undefined, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(undefined, 1, 0x00ff00) // center (sinus), left (lemniscate)

    app.stage.addChild(bCircle) // breathing cue

    theCircle.tint = tr(s.fgc)
    myCircle2.tint = tr(s.lcc)
    myCircle3.tint = tr(s.ccc)
    bCircle.tint = tr(s.bcc)
    app.renderer.backgroundColor = tr(s.bgc)

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

    const a = w * 0.35 // for lemniscate
    bCircle.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
    myCircle2.position.set(...c)
    myCircle3.position.set(...c)
    const y = h * 0.5
    let seed
    let component
    const ticker = app.ticker.add(() => {
      const dc = this.meter ? this.meter.getValue() : 0
      const cval = (1 - Math.abs(dc))
      if (dc - lastdc > 0) { // inhale
        this.guiEls.inhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.exhale.css('background', 'rgba(0,0,0,0)')
      } else { // exhale
        this.guiEls.exhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.inhale.css('background', 'rgba(0,0,0,0)')
      }
      lastdc = dc
      const val = -dc
      // const avalr = Math.asin(val) // radians in [-pi/2, pi/2]
      bCircle.y = val * a * 0.5 + y

      const sc = 0.3 + (-val + 1) * 3
      bCircle.scale.set(sc * propx, sc * propy)
      bCircle.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        if (seed) {
          component.forEachNode((n, a) => { a.pixiElement.alpha = 0 })
          component.forEachEdge((e, a) => { a.pixiElement.alpha = 0 })
        }
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
        seed = component = undefined
      } else {
        console.log(dc)
        if (!seed && this.anet && this.anet.net) { // choose random seed using rot:
          seed = this.anet.net.nodes()[Math.floor(this.anet.net.order * rot * 10)] // todo: use nodes ordered by degree
          component = net.getComponent(this.anet.net, seed, 10) // choose 10 members connected to the seed
          // component.forEachNode((n, a) => { a.pixiElement.alpha = 1 })
          // component.forEachEdge((e, a) => { a.pixiElement.alpha = 1 })
          console.log(component, 'COMPONENT', component.order, component.ndist, component.ndist_)
        }
        // show them in proportion to (1 + val) / 2
        component.forEachNode((n, a) => {
          a.pixiElement.alpha = (0.02 + (1 + dc) / 2 >= a.ndist_)
        })
        component.forEachEdge((e, a, n1, n2, a1, a2) => {
          a.pixiElement.alpha = (a1.pixiElement.alpha + a2.pixiElement.alpha) / 2
        })
      }

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.3, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.3, myCircle3.tint))
      if (Math.random() > 0.98) {
        parts.push(mkNode([bCircle.x, bCircle.y], 0.3, bCircle.tint))
      }

      theCircle.x += (Math.random() - 0.5)
      theCircle.y += (Math.random() - 0.5)
      myCircle2.x += (Math.random() - 0.5)
      myCircle2.y += (Math.random() - 0.5)
      myCircle3.x += (Math.random() - 0.5)
      myCircle3.y += (Math.random() - 0.5)
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
    // setTimeout(() => ticker.stop(), 200)
    ticker.stop()
    // utils.basicStats()

    return {
      start: () => {
        ticker.start()
      },
      stop: () => {
        ticker.stop()
      }
    }
  }

  setStage (s) {
    const isMobile = this.isMobile
    const adiv = utils.centerDiv(undefined, $('#canvasDiv'), utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0])
      .css('text-align', 'center')
      .css('padding', '0.4% 1%')
    const countdownMsg = $('<span/>', {
      css: {
        'font-size': isMobile ? '3vw' : '1vw'
      }
    }).html('countdown to start:')
    const countdownCount = $('<span/>', {
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
    const check = $('<input/>', {
      type: 'checkbox',
      id: 'startChecked'
    }).appendTo(label).change(() => {
      if (check.prop('checked')) {
        noSleep.enable()
        clearTimeout(badTimer)
        clearInterval(badCounter)
        check.prop('disabled', true)
        this.startGoodTimer(s, badTimer, badCounter)
      }
    })
    $('<div/>', { class: 'slideraa round' }).appendTo(label)

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
      countdownCount.html('')
    }, this.getDurationToStart(s))
    const badCounter = setInterval(() => {
      countdownCount.html(' ' + utils.secsToTime(this.getDurationToStart(s) / 1000))
    }, 100)
    this.guiEls = { countdownMsg, countdownCount, label, inhale, exhale }
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

  getDurationToStart (s) { // in ms
    return s.datetime.getTime() - (new Date()).getTime()
  }

  startGoodTimer (s) {
    this.visuals.start()
    if (s.vcontrol) this.volumeControl()
    const d = () => this.getDurationToStart(s) / 1000
    t.start(0)
    t.Transport.start(0)
    t.Master.mute = false
    this.voices.forEach(v => {
      if (!v) return
      v.start('+' + d())
      v.stop(d() + s.d)
      // v.stop('+' + (d() + s.d))
    })

    let started = false
    t.Transport.schedule((time) => { // change message to ongoing
      started = true
      t.Draw.schedule(() => {
        this.guiEls.countdownMsg.html('countdown to finish:')
      }, time)
    }, '+' + d())

    let finished = false
    t.Transport.schedule((time) => { // change message to finished
      finished = true
      t.Draw.schedule(() => {
        this.guiEls.countdownMsg.html('session finished. Time elapsed:')
      }, time)
    }, '+' + (d() + s.d))

    new t.Loop(time => { // update counter before starts and then before ends.
      t.Draw.schedule(() => {
        const mm = d()
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

  volumeControl () {
    // const gui = new dat.GUI({ closed: true, closeOnTop: true })
    const set = {}
    set.width = window.innerWidth / 3.5
    if (this.isMobile) set.width = window.innerWidth / 2
    const gui = new dat.GUI(set)
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
      d[label] = 50
      const voiceGui = gui.add(d, label, 0, 100).listen()
      const instr = []
      for (const instrument in v.volume) {
        v.volume[instrument].defVolume = this.initialVolume
        instr.push(v.volume[instrument])
      }
      instruments.push({ voiceGui, instr })
      voiceGui.onChange(val => {
        for (const instrument in v.volume) {
          v.volume[instrument].volume.value = val + v.volume[instrument].defVolume - 50 + master
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
    if (this.isMobile) {
      $('.dg.main .close-button.close-bottom')
        .css('padding-bottom', '10px').css('padding-top', '10px')
      $('.dg .cr.number').css('height', '37px')
      $('.dg .c .slider').css('height', '37px')
      let open = true
      $('.dg.main .close-button.close-bottom').click(() => {
        if (open) {
          $('.dg .cr.number').css('height', '0px')
        } else {
          $('.dg .cr.number').css('height', '37px')
        }
        open = !open
      })
    }
    $('.dg').css('font-size', '24px')
    // $('.close-button').css('background-color', '#777777')
    $('.close-button')
      .css('background-color', 'rgba(0,0,0,0)')
      .css('border', 'solid #777777')
      .click()
    $('.dg .c input[type=text]').css('width', '15%')
    $('.dg .c .slider').css('width', '80%')
  }
}
