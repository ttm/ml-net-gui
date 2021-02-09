const PIXI = require('pixi.js')
const t = require('tone')
const $ = require('jquery')
const percom = require('percom')

const transfer = require('../transfer.js')
const maestro = require('../maestro.js')
const utils = require('../utils.js')
const w = require('./common.js').waveforms
const p = require('./common.js').permfuncs
const u = require('../router.js').urlArgument

const e = module.exports
const tr = PIXI.utils.string2hex

e.Med = class {
  constructor (med2) {
    transfer.findAny({ 'header.med2': med2 }).then(r => {
      this.setting = r
      this.voices = []
      for (let i = 0; i < r.voices.length; i++) {
        const v = r.voices[i]
        this.voices.push(this['add' + v.type.replace('-', '')](v))
      }
      this.visuals = this.setVisual(r.visSetting)
      this.setStage(r.header)
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
      // symmetric, rotation and mirror/reverse. Maybe also compound
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
    const sampler = new t.Player(`assets/audio/${maestro.sounds[s.soundSample].name}.mp3`).toDestination()
    sampler.volume.value = parseFloat(s.soundSampleVolume)
    sampler.loop = s.soundSamplePeriod === 0
    let theSamp
    if (sampler.loop) {
      theSamp = sampler // .start(tt + (s.soundSampleStart || 0))
    } else {
      theSamp = new t.Loop(time => {
        sampler.start(time)
      }, s.soundSamplePeriod) // .start(tt + (s.soundSampleStart || 0))
    }
    return {
      start: tt => {
        theSamp.start(tt + (s.soundSampleStart || 0))
      },
      stop: tt => {
        sampler.volume.rampTo(-400, 1, tt)
        theSamp.stop(tt + 1)
      }
    }
  }

  setVisual (s) {
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
    const a = w * 0.35

    function mkNode (pos, scale = 1, tint = 0xffffff) {
      const circle = new PIXI.Sprite(circleTexture)
      circle.position.set(...(pos || [0, 0]))
      circle.anchor.set(0.5, 0.5)
      circle.scale.set(scale, scale)
      circle.tint = tint
      nodeContainer.addChild(circle)
      return circle
    }
    function xy (angle, vertical) { // lemniscate x, y given angle
      const px = a * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
      const py = Math.sin(angle) * px
      return vertical ? [py + c[1], px + c[0]] : [px + c[0], py + c[1]]
    }

    const [x, y] = [w * 0.1, h * 0.5] // for sinusoid
    const [dx, dy] = [w * 0.8, h * 0.4] // for sinusoid

    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const myLine = new PIXI.Graphics()
    const segments = 100

    if (s.lemniscate) {
      bCircle.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
      myLine.lineStyle(1, 0xffffff)
        .moveTo(...xy(0))
      for (let i = 0; i <= segments; i++) {
        myLine.lineTo(...xy(2 * Math.PI * i / 100))
      }
    } else {
      bCircle.x = s.bPos === 0 ? x + dx / 2 : s.bPos === 1 ? x * 0.5 : x + dx * 1.05
      myLine.lineStyle(1, 0xffffff)
        .moveTo(x, y)
      for (let i = 0; i <= segments; i++) {
        myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
      }
      mkNode([x0, y0]) // fixed left
        .position.set(x + dx, y)
        .tint = tr(s.fgc)
      mkNode([x0, y0]) // fixed right
        .position.set(x, y)
        .tint = tr(s.fgc)
    }

    const theCircle = mkNode([x0, s.lemniscate ? y / 2 : y0]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(undefined, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(undefined, 1, 0x00ff00) // center (sinus), left (lemniscate)

    // const co = new PIXI.Container()
    // app.stage.addChild(co)
    // co.addChild(myLine)
    // co.addChild(myCircle4) // breathing cue
    app.stage.addChild(myLine)
    app.stage.addChild(bCircle) // breathing cue

    theCircle.tint = myLine.tint = tr(s.fgc)
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

    const ticker = app.ticker.add(() => {
      // todo: solve for unexisting met (make a standard met?)
      const dc = this.meter ? this.meter.getValue() : 0
      // console.log('DC:', dc)
      const cval = (1 - Math.abs(dc))
      if (dc - lastdc > 0) { // inhale
        // mais proximo de 0, mais colorido
        this.guiEls.inhale.css('background', `rgba(255,255,0,${cval})`)
        this.guiEls.exhale.css('background', 'rgba(0,0,0,0)')
      } else { // exhale
        // mais proximo de 0, mais colorido
        this.guiEls.exhale.css('background', `rgba(255,255,0,${cval})`)
        this.guiEls.inhale.css('background', 'rgba(0,0,0,0)')
      }
      lastdc = dc
      const val = -dc
      const avalr = Math.asin(val) // radians in [-pi/2, pi/2]
      if (s.lemniscate) {
        const p = xy(avalr < 0 ? 2 * Math.PI + avalr : avalr)
        myCircle2.x = p[0]
        myCircle2.y = myCircle3.y = p[1]
        myCircle3.x = 2 * c[0] - p[0]
        bCircle.y = val * a * 0.5 + y
      } else {
        const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
        const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
        myCircle2.x = px
        myCircle2.y = myCircle3.y = bCircle.y = val * dy + y
        myCircle3.x = px2
      }

      const sc = 0.3 + (-val + 1) * 3
      bCircle.scale.set(sc * propx, sc * propy)
      bCircle.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
      }

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.3, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.3, myCircle3.tint))
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
    setTimeout(() => ticker.stop(), 200)

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
    const adiv = utils.centerDiv(undefined, $('#canvasDiv'), utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0]).css('text-align', 'center')
    // const grid = utils.mkGrid(2, $('#canvasDiv'))
    const countdownMsg = $('<span/>').html('countdown to start:') // .appendTo(grid)
    const countdownCount = $('<span/>').html('--:--:--') // .appendTo(grid)
    //  .css('margin-left', '1%')
    $('<p/>').appendTo(adiv)
      .append(countdownMsg)
      .append(countdownCount)
    // $('<span/>').html('participation:') // .appendTo(grid)
    const lpar = $('<p/>').appendTo(adiv)
    const label = $('<label/>', {
      class: 'switch',
      css: {
        margin: '0 auto'
        // 'text-align': 'center'
      }
    }).appendTo(lpar)
    const check = $('<input/>', {
      type: 'checkbox'
    }).appendTo(label).change(() => {
      if (check.prop('checked')) {
        clearTimeout(badTimer)
        clearInterval(badCounter)
        check.prop('disabled', true)
        this.startGoodTimer(s)
      }
    })
    $('<div/>', { class: 'slider round' }).appendTo(label)

    const inhale = $('<span/>').html(' inhale ')
    const exhale = $('<span/>').html(' exhale ')
    $('<p/>').appendTo(adiv)
      .append($('<span/>').html('✡'))
      .append(inhale)
      .append($('<span/>').html('✡'))
      .append(exhale)
      .append($('<span/>').html('✡'))
    const badTimer = setTimeout(() => {
      check.prop('disabled', true)
      $('.slider').css('background', '#cacaca')
      countdownMsg.html('session already started or ended. No new participants allowed.')
      countdownCount.html('')
    }, this.getDurationToStart(s) * 1000)
    const badCounter = setInterval(() => {
      countdownCount.html(' ' + utils.secsToTime(this.getDurationToStart(s)))
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

  getDurationToStart (s) {
    const dt = u('s') ? utils.timeArgument() : s.datetime
    let duration = (dt.getTime() - (new Date()).getTime()) / 1000
    if (u('t')) duration = parseFloat(u('t'))
    return duration
  }

  startGoodTimer (s) {
    t.start(0)
    t.Transport.start(0)
    t.Master.mute = false

    const duration = this.getDurationToStart(s)
    this.voices.forEach(v => {
      console.log('yeyaa', v)
      if (!v) return
      console.log('yey', v)
      v.start(duration)
      v.stop(duration + s.d)
    })

    let finished = false
    const loop = new t.Loop(time => { // update counter before starts and before ends
      t.Draw.schedule(() => {
        if (!finished) {
          // const mm = this.getDurationToStart(s)
          // const mm = (s.datetime.getTime() - (new Date()).getTime()) / 1000
          const mm = duration - time
          this.guiEls.countdownCount.html(' ' + utils.secsToTime(mm > 0 ? mm : mm + s.d))
        }
      }, time)
    }, 0.1).start(0)

    t.Transport.schedule((time) => { // change message to ongoing
      t.Draw.schedule(() => {
        this.guiEls.countdownMsg.html('countdown to finish:')
      }, time)
    }, duration)

    t.Transport.schedule((time) => { // change message to finished
      t.Draw.schedule(() => {
        console.log('finished:', time)
        finished = true
        loop.stop()
        this.guiEls.countdownMsg.html('session finished.')
        this.guiEls.countdownCount.html('')
      }, time)
    }, duration + s.d)
    this.visuals.start()
  }
}
