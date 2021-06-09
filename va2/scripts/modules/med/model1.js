const t = require('tone')
const $ = require('jquery')
const PIXI = require('pixi.js')
const maestro = require('../maestro.js')
const transfer = require('../transfer.js')
const utils = require('../utils.js')
const u = require('../router.js').urlArgument

const e = module.exports
const tr = PIXI.utils.string2hex

e.meditation = mid => {
  transfer.findAny({ meditation: mid }).then(s => {
    window.sss = s
    $('#loading').hide()
    evocation.on('click', () => {
      $('#myModal').css('display', 'block')
      $('#mcontent').html(`
      <h2>Evocation <button onclick="wand.$('#techdiv').toggle()" id="techBtn">tech</button></h2>
      <p>
      I, [your name], will start my mentalization soon (or am mentalizing),
      and will concentrate for a total of ${s.d} seconds on the theme "${s.meditation.replaceAll('_', '')}".</p><br><br>
      <span id="techdiv"><p>I'll be using binaural frequencies ${s.fl} and ${s.fr} Hertz in the waveforms
      ${s.waveformL} and ${s.waveformR},<br>
      and respiration cycles from ${s.mp0} to ${s.mp1} seconds in a transition of ${s.md} seconds.<br>
      The respiration represented with oscillations of ${s.ma} Herz in the binaural frequencies.
      <br><br></p></span>
      <p>I ask [name of one or more entitites you worship or admire],<br>
      and my ally and akin essences,<br>
      for your company and conduction.
      </p><br><br><br>:::
      `)
      $('#techBtn').click()
    })
    if (s === null) {
      grid.css('background', '#ffaaaa')
      countdown.text("don't exist")
      conoff.attr('disabled', true)
      vonoff.text('-----')
    }
    const dt = u('s') ? utils.timeArgument() : s.dateTime
    let duration = (dt.getTime() - (new Date()).getTime()) / 1000
    if (u('t')) duration = parseFloat(u('t'))
    function caseConcluded () {
      vonoff.text('ask team to open a new session.')
      countdown.text('concluded')
    }
    function caseOnOrConcluded () {
      conoff.attr('checked', true).attr('disabled', true)
      console.log(duration, s.d)
      if (-duration < s.d) { // ongoing
        vonoff.text('join a session before it starts.')
        // start timer for s.d - duration
        setCountdown(s.d + duration, caseConcluded, undefined, 'ongoing; countdown to conclude: ')
      } else { // finished
        caseConcluded()
      }
      grid.css('background', '#ddddff')
    }
    if (duration < 0) {
      return caseOnOrConcluded()
    }
    let sampler
    if (s.soundSample > 0) {
      sampler = new t.Player(`assets/audio/${maestro.sounds[s.soundSample].name}.mp3`).toDestination()
      sampler.volume.value = parseFloat(s.soundSampleVolume)
      sampler.loop = s.soundSamplePeriod === 0
    }

    const { ticker, synth, synthR, synthM, mod_ } = initialize(s)

    setCountdown(duration, fun1, undefined, 'countdown to start: ')
    function fun1 () { // to start the med
      if (!conoff.prop('checked')) {
        return caseOnOrConcluded()
      }
      setSounds(ticker)
      t.Master.mute = false
      if (s.vcontrol) tgui(synth, synthR, synthM, sampler)
      if (s.soundSample > 0) {
        setTimeout(() => {
          if (sampler.loop) {
            sampler.start()
          } else {
            new t.Loop(time => {
              sampler.start()
            }, s.soundSamplePeriod).start()
          }
        }, (s.soundSampleStart || 0) * 1000)
      }
      synth.volume.rampTo(-40, 1)
      synthR.volume.rampTo(-40, 1)
      synthM.volume.rampTo(-40, 1)
      mod_.frequency.rampTo(1 / s.mp1, s.md)
      grid.css('background', 'lightgreen')
      setCountdown(s.d, fun2, [synth, synthR, synthM], 'countdown to conclude: ')
    }
    function fun2 (synth, synthR, synthM) { // to finish the med
      grid.css('background', '#aaaaff')
      countdown.text('finished')
      synth.volume.rampTo(-400, 10)
      synthR.volume.rampTo(-400, 10)
      synthM.volume.rampTo(-400, 10)
    }
    grid.css('background', '#ffffaa')
  })
  function setCountdown (duration, fun, args, countdownText) { // duration in seconds
    const targetTime = (new Date()).getTime() / 1000 + duration
    setTimeout(() => {
      fun(...(args || []))
      clearInterval(timer)
    }, duration * 1000, ...(args || []))
    const reduce = dur => [Math.floor(dur / 60), Math.floor(dur % 60)]
    const p = num => num < 10 ? '0' + num : num
    const timer = setInterval(() => {
      const moment = targetTime - (new Date()).getTime() / 1000
      let [minutes, seconds] = reduce(moment)
      let hours = ''
      if (minutes > 59) {
        [hours, minutes] = reduce(minutes)
        hours += ':'
      }
      countdown.text((countdownText || 'countdown on ') + `${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true
  })

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle4 = new PIXI.Graphics() // vertical for breathing
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80,
    antialias: true
  })
  document.body.appendChild(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.35

  const circleTexture = app.renderer.generateTexture(myCircle)
  // const circleTexture = PIXI.Texture.from('assets/heart.png') // todo: integrate images: chokurei, sei-he-ki, heart, jesus, dove, star of david
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale = 1, tint = 0xffffff) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.position.set(...(pos || [0, 0]))
    circle.anchor.set(0.5, 0.5)
    circle.scale.set(scale, scale)
    circle.tint = tint
    nodeContainer.addChild(circle)
    return circle
  }

  // to draw the sinusoid or lemniscate:
  const xy = (angle, vertical) => { // lemniscate x, y given angle
    const px = a * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
    const py = Math.sin(angle) * px
    return vertical ? [py + c[1], px + c[0]] : [px + c[0], py + c[1]]
  }
  const [x, y] = [w * 0.1, h * 0.5] // for sinusoid
  const [dx, dy] = [w * 0.8, h * 0.4] // for sinusoid

  function initialize (s) {
    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const myLine = new PIXI.Graphics()
    const segments = 100
    if (s.lemniscate) {
      myCircle4.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
      myLine.lineStyle(1, 0xffffff)
        .moveTo(...xy(0))
      for (let i = 0; i <= segments; i++) {
        myLine.lineTo(...xy(2 * Math.PI * i / 100))
      }
    } else {
      myLine.lineStyle(1, 0xffffff)
        .moveTo(x, y)
      for (let i = 0; i <= segments; i++) {
        myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
      }
      const myCircle_ = mkNode([x0, y0]) // fixed left
      const myCircle__ = mkNode([x0, y0]) // fixed right
      myCircle__.position.set(x, y)
      myCircle_.position.set(x + dx, y)
      myCircle_.tint = myCircle__.tint = tr(s.fgc)
      myCircle4.x = s.bPos === 0 ? x + dx / 2 : s.bPos === 1 ? x * 0.5 : x + dx * 1.05
    }

    const theCircle = mkNode([x0, s.lemniscate ? y / 2 : y0]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(undefined, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(undefined, 1, 0x00ff00) // center (sinus), left (lemniscate)

    const co = new PIXI.Container()
    app.stage.addChild(co)
    co.addChild(myLine)
    co.addChild(myCircle4) // breathing cue

    theCircle.tint = myLine.tint = tr(s.fgc)
    myCircle2.tint = tr(s.lcc)
    myCircle3.tint = tr(s.ccc)
    myCircle4.tint = tr(s.bcc)
    app.renderer.backgroundColor = tr(s.bgc)

    const synth = maestro.mkOsc(s.fl, -400, -1, s.waveformL || 'sine')
    const synthR = maestro.mkOsc(s.fr, -400, 1, s.waveformR || 'sine')
    const mul = new t.Multiply(s.ma)
    const met2 = new t.DCMeter()
    const mod_ = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true).fan(met2, mul)
    let synthM
    if (s.model === '0') {
      mul.chain(new t.Add(s.fl), synth.frequency)
      mul.chain(new t.Add(s.fr), synthR.frequency)
    } else if (s.model === '1') {
      synthM = maestro.mkOsc(0, -400, 0, s.waveformM || 'sine')
      mul.chain(new t.Add(s.mf0), synthM.frequency)
    }

    const pOsc = parseInt(s.panOsc)
    if (pOsc === 1 || pOsc === 2) { // sinusoid pan oscillation
      let panOsc
      if (pOsc === 1) { // in sync with Martigli oscillation
        panOsc = mod_
      } else { // independent period
        panOsc = maestro.mkOsc(1 / s.panOscPeriod, 0, 0, 'sine', true)
      }
      const neg = new t.Negate()
      const mul1 = new t.Multiply(1)
      panOsc.fan(neg, mul1)
      mul1.connect(synth.panner.pan)
      neg.connect(synthR.panner.pan)
    } else if (pOsc === 3) { // envelope pan oscillation
      // 1s transition, thus period > 1s
      let oTrans = parseFloat(s.panOscTrans)
      oTrans = oTrans === undefined ? 1 : oTrans
      const env = new t.Envelope({
        attack: oTrans,
        decay: 0.01,
        sustain: 1,
        release: oTrans,
        attackCurve: 'linear',
        releaseCurve: 'linear'
      }).chain(new t.Multiply(2), (new t.Add(-1)).connect(synth.panner.pan), new t.Negate(), synthR.panner.pan)
      const aPer = parseFloat(s.panOscPeriod)
      new t.Loop(time => {
        env.triggerAttackRelease(aPer, time)
      }, aPer * 2).start()
      t.Transport.start()
    }

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
      const dc = met2.getValue()
      if (dc - lastdc > 0) { // inhale
        // mais proximo de 0, mais colorido
        m1.css('opacity', 1 - Math.abs(dc))
        m2.css('opacity', 0)
      } else { // exhale
        // mais proximo de 0, mais colorido
        m2.css('opacity', 1 - Math.abs(dc))
        m1.css('opacity', 0)
      }
      lastdc = dc
      const val = -dc
      const avalr = Math.asin(val) // radians in [-pi/2, pi/2]
      if (s.lemniscate) {
        const p = xy(avalr < 0 ? 2 * Math.PI + avalr : avalr)
        myCircle2.x = p[0]
        myCircle2.y = myCircle3.y = p[1]
        myCircle3.x = 2 * c[0] - p[0]
        myCircle4.y = val * a * 0.5 + y
      } else {
        const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
        const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
        myCircle2.x = px
        myCircle2.y = myCircle3.y = myCircle4.y = val * dy + y
        myCircle3.x = px2
      }

      const sc = 0.3 + (-val + 1) * 3
      myCircle4.scale.set(sc * propx, sc * propy)
      myCircle4.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
      }

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.3, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.3, myCircle3.tint))
      if (Math.random() > 0.98) {
        parts.push(mkNode([myCircle4.x, myCircle4.y], 0.3, myCircle4.tint))
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
    return { mod_, synth, synthR, synthM, ticker }
  }
  function setSounds (ticker) {
    ticker.start()
  }

  const grid = utils.mkGrid(2)
    .css('background', 'grey')
    .append($('<div/>').text('status:'))
  const countdown = $('<div/>').appendTo(grid).html('loading...')

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Check me to join in:')
  const conoff = $('<input/>', { type: 'checkbox' })
    .appendTo(grid).change(function () {
      if (this.checked) {
        this.disabled = true
        t.start()
        t.Master.mute = true
        vonoff.text('All set! Just wait.')
        grid.css('background', 'lightgreen')
      }
    })

  $('<div/>').text('inhale').appendTo(grid)
  const m1 = $('<div/>').appendTo(grid)
    .css('background', 'rgb(255,255,0)')
    .css('opacity', 0)
  $('<div/>').text('exhale').appendTo(grid)
  const m2 = $('<div/>').appendTo(grid)
    .css('opacity', 0)
  t.Master.mute = true

  $('<div/>', { id: 'myModal', class: 'modal' }).appendTo('body')
    .append($('<div/>', { class: 'modal-content' })
      .append($('<span/>', { class: 'close' }).html('&times;')
        .on('click', () => {
          $('#myModal').css('display', 'none')
        })
      )
      .append($('<p/>', { id: 'mcontent' }))
    )
  window.onclick = function (event) {
    if (event.target === $('#myModal')[0]) {
      $('#myModal').css('display', 'none')
    }
  }
  // $('#mgrid-0 div').css('background-color', 'rgba(1,0,0,0.9)')
  $('#mgrid-0 *').each((i, e) => {
    window.eee = e
    e.style.backgroundColor = `rgba(255,255,255,${Math.floor(i / 2) % 2 === 1 ? 0.3 : 0})`
    e.style.padding = '1%'
  })
  m1.css('background', 'rgb(255,255,0)')
  m2.css('background', 'rgb(255,255,0)')
  const evocation = $('<button/>', {
    css: {
      'background-color': 'white',
      // border: '2px solid #a7a7a7',
      border: '2px solid #cafbfb',
      color: 'black',
      cursor: 'pointer',
      'transition-duration': '0.4s',
      'border-radius': '6px',
      'margin-left': '5%',
      'margin-right': '5%',
      'margin-top': '2px'
    }
  }).html('Evocation').appendTo(grid).hover(function (e) {
    $(this).css('background-color', e.type === 'mouseenter' ? '#cafbfb' : 'white')
  })
  const gitems = [
    'use headphones whenever possible;',
    'breath with the vertical position of the oval or circular visual cue that don\'t change horizontal position and that expands and contracts;',
    'adjust the sound volume and the screen luminosity;',
    'concentrate;',
    'close your eyes whenever you wish;',
    'such breathing cycles are also represented in the status and help colored section, at the bottom of the page;',
    'repeat the concentration a number of times so you develop the means to better perform;',
    'read the evocation message and adapt it to your repertoire;',
    'mentally visualize the changes in your life, in the life of the loved and known ones, the ones that need the most, and the whole of humanity;',
    'it is usually best to breath using less air when the breathing cycle is fast, and more air as it slows down;',
    'be flexible in your breathing and use the cues mainly to maintain the breathing rhythm: you may hold air in your lungs or hold your breath without air as you wish.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  $('<button/>', {
    css: {
      'background-color': 'white',
      border: '2px solid #cafbfb',
      color: 'black',
      cursor: 'pointer',
      'transition-duration': '0.4s',
      'border-radius': '6px',
      'margin-left': '5%',
      'margin-right': '5%',
      'margin-top': '2px'
    }
  }).html('Guidance').appendTo(grid)
    .on('click', () => {
      $('#myModal').css('display', 'block')
      $('#mcontent').html(`
      <h2>Guidance</h2>
      Some considerations for you to have a nice experience:<br>
      <ul>${gitems}</ul>

      Good luck and thank you!
      <br><br><br>:::
      `)
    }).hover(function (e) {
      $(this).css('background-color', e.type === 'mouseenter' ? '#cafbfb' : 'white')
    })
}

function tgui (synth, synthR, synthM, sampler) {
  console.log(synth, synthR, synthM, 'HEREEE')
  const dat = require('dat.gui')
  const gui = new dat.GUI({ closed: true, closeOnTop: true })

  const binaural = gui.add({ binaural: 50 }, 'binaural', 0, 100).listen()
  let masterV = 0
  const syInitV = -40
  binaural.onChange(v => {
    const aval = v - 50 + masterV + syInitV
    synthR.volume.rampTo(aval, 0.1)
    synth.volume.rampTo(aval, 0.1)
  })
  const syInitM = -40
  if (synthM) {
    const m = gui.add({ Martigli: 50 }, 'Martigli', 0, 100).listen()
    m.onChange(v => {
      const aval = v - 50 + masterV + syInitM
      synthM.volume.rampTo(aval, 0.1)
    })
  }
  let sInitV
  if (sampler) {
    sInitV = sampler.volume.value
    const sample = gui.add({ sample: 50 }, 'sample', 0, 100).listen()
    sample.onChange(v => {
      sampler.volume.value = v - 50 + masterV + sInitV
    })
  }
  if (sampler || synthM) {
    const master = gui.add({ master: 50 }, 'master', 0, 100).listen()
    master.onChange(v => {
      masterV = v - 50
      const aval = v - 50 + masterV + syInitV
      console.log(aval, 'AVAL')
      synthR.volume.rampTo(aval, 0.1)
      synth.volume.rampTo(aval, 0.1)
      if (sampler) sampler.volume.rampTo(v - 50 + masterV + sInitV, 0.1)
      if (synthM) synthM.volume.rampTo(v - 50 + masterV + syInitM, 0.1)
    })
  }
  window.agui = gui
  $('.close-top').text('Open Volume Controls')
  let i = 0
  $('.close-top').click(function () {
    console.log(this, 'yeah2')
    this.textContent = `${i++ % 2 === 0 ? 'Close' : 'Open'} Volume Controls`
    window.ttt = this
  })
}
