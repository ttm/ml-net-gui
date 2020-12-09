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
  // todo:
  // put a field for a message, prayer or so.
  //   templates:
  //      Eu <nome> inicio minha mentalizacao.... Frequencias X Y... etc.
  //      Peço a companhia de Jesus, dos mestres iluminados, de meus espíritos aliados e esíritos afins, ...(quaisquer eixos de devoção pessoal)..., para que minha fé seja fortalecida e minhas orações escutadas.
  // a help icon:
  //  when hover, show some guidance:
  //    change volume of headphones
  //    change screen luminosity
  //    concentrate
  //    you can close your eyes if you wish
  //    breath with the vertical position of the circles and the expansion of the circle to the (right, left, center, check bPos index)
  // waveforms for LR
  transfer.findAny({ meditation: mid }).then(s => {
    if (s === null) {
      grid.css('background', 'red')
      countdown.text("don't exist")
      conoff.attr('disabled', true)
      vonoff.text('-----')
    }
    let duration = (s.dateTime.getTime() - (new Date()).getTime()) / 1000
    if (u('t')) duration = parseFloat(u('t'))
    if (duration < 0) {
      vonoff.text('Already started, maybe finished, ask team for another session.')
      conoff.attr('checked', true).attr('disabled', true)
      countdown.text('finished')
      grid.css('background', '#bbaaff')
      return
    }
    setCountdown(duration, fun1, undefined, 'countdown to start: ')
    function fun1 () { // to start the med
      if (!conoff.prop('checked')) {
        grid.css('background', 'blue')
        conoff.prop('disabled', true)
        return
      }
      const { synth, synthR, mod_ } = setSounds(s)
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synthR.volume.rampTo(-40, 1)
      mod_.frequency.rampTo(1 / s.mp1, s.md)
      grid.css('background', 'lightgreen')
      setCountdown(s.d, fun2, [synth, synthR], 'countdown to conclude: ')
    }
    function fun2 (synth, synthR) { // to finish the med
      grid.css('background', '#aaaaff')
      countdown.text('finished')
      synth.volume.rampTo(-400, 10)
      synthR.volume.rampTo(-400, 10)
    }
    grid.css('background', 'yellow')
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
    height: window.innerHeight * 0.85
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

  function setSounds (s) {
    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const myLine = new PIXI.Graphics()
    const segments = 100
    if (s.lemniscate) {
      myCircle4.x = s.bPos === 0 ? x : s.bPos === 1 ? (x - a) / 2 : x + a + (x - a) / 2
      myLine.lineStyle(1, 0xffffff)
        .moveTo(...xy(0))
      const segments = 100
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

    const synth = maestro.mkOsc(0, -400, -1, 'sine')
    const synthR = maestro.mkOsc(0, -400, 1, 'sine')
    const mul = new t.Multiply(s.ma)
    const met2 = new t.DCMeter()
    const mod_ = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true).fan(met2, mul)
    mul.chain(new t.Add(s.fl), synth.frequency)
    mul.chain(new t.Add(s.fr), synthR.frequency)

    const pOsc = parseInt(s.panOsc)
    if (pOsc === 1 || pOsc === 2) { // sinusoid pan oscillation
      let panOsc
      if (pOsc === 1) { // in sync with Martigli oscillation
        panOsc = mod_
      } else { // independent period
        panOsc = maestro.mkOsc(1 / s.panOscPeriod, 0, 0, 'sine')
      }
      const neg = new t.Negate()
      const mul1 = new t.Multiply(1)
      panOsc.fan(neg, mul1)
      mul1.connect(synth.panner.pan)
      neg.connect(synthR.panner.pan)
    } else if (pOsc === 3) { // envelope pan oscillation
      console.log('GOING OK')
      // 1s transition, thus period > 1s
      const env = new t.Envelope({
        attack: 1,
        decay: 0.01,
        sustain: 1,
        release: 1
      }).chain(new t.Multiply(2), (new t.Add(-1)).connect(synth.panner.pan), new t.Negate(), synthR.panner.pan)
      const aPer = parseFloat(s.panOscPeriod)
      new t.Loop(time => {
        env.triggerAttackRelease(aPer, time)
      }, aPer * 2).start()
      t.Transport.start()
    }

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
    app.ticker.add(() => {
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
    return { synth, synthR, mod_ }
  }

  const grid = utils.mkGrid(2)
    .css('background', 'grey')
    .append($('<div/>').text('status:'))
  const countdown = $('<div/>').appendTo(grid).html('loading...')

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Check me!')
  const conoff = $('<input/>', { type: 'checkbox' })
    .appendTo(grid).change(function () {
      if (this.checked) {
        this.disabled = true
        t.start()
        t.Master.mute = true
        vonoff.text('All set!')
        grid.css('background', 'green')
      }
    })

  $('<div/>').text('inhale').appendTo(grid)
  const m1 = $('<div/>').appendTo(grid)
    .css('background', 'rgb(255,255,0)')
    .css('opacity', 0)
  $('<div/>').text('exhale').appendTo(grid)
  const m2 = $('<div/>').appendTo(grid)
    .css('background', 'rgb(255,255,0)')
    .css('opacity', 0)
  t.Master.mute = true
}
