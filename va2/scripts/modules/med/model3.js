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
  //  if clicked, show the inhale / exhale text
  // waveforms for LR
  // info on the settings
  console.log(mid, 'TMID')
  transfer.findAny({ meditation: mid }).then(s => { // s === settings
    if (s === null) {
      grid.css('background', 'red')
      countdown.text("don't exist")
      conoff.attr('disabled', true)
      vonoff.text('-----')
    }
    let duration = (s.dateTime.getTime() - (new Date()).getTime()) / 1000
    if (u('t')) {
      duration = parseFloat(u('t'))
    }
    if (duration < 0) {
      vonoff.text('Already started, maybe finished, ask team for another session.')
      conoff.attr('checked', true).attr('disabled', true)
      countdown.text('finished')
      grid.css('background', '#bbaaff')
      return
    }
    setCountdown(duration, fun1)
    function fun1 () { // to start the med
      if (!conoff.prop('checked')) {
        grid.css('background', 'blue')
        countdown.text('finished')
        conoff.prop('disabled', true)
        return
      }
      const { synth, synthR, mod_ } = setSounds(s)
      countdown.text('started')
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synthR.volume.rampTo(-40, 1)
      mod_.frequency.rampTo(1 / s.mp1, s.md)
      grid.css('background', 'lightgreen')
      setCountdown(s.d, fun2, [synth, synthR])
    }
    function fun2 (synth, synthR) { // to finish the med
      grid.css('background', 'blue')
      countdown.text('finished')
      synth.volume.rampTo(-400, 10)
      synthR.volume.rampTo(-400, 10)
    }
    grid.css('background', 'yellow')
  })
  function setCountdown (duration, fun, args) { // duration in seconds
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
      countdown.text(`countdown on ${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true
  })

  const myCircle = new PIXI.Graphics() // left static circle
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
  window.appp = app
  const [w, h] = [app.view.width, app.view.height]

  const circleTexture = app.renderer.generateTexture(myCircle)
  // const circleTexture = PIXI.Texture.from('assets/heart.png') // todo: integrate images: chokurei, sei-he-ki, heart, jesus, dove, star of david
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale = 1, tint = 0xffffff) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.position.set(...pos)
    circle.anchor.set(0.5, 0.5)
    circle.scale.set(scale, scale)
    circle.tint = tint
    nodeContainer.addChild(circle)
    return circle
  }
  const [x0, y0] = [w * 0.2, h * 0.2]
  const theCircle = mkNode([x0, y0]) // moving white circle to which the flakes go
  const myCircle_ = mkNode([x0, y0]) // fixed left
  const myCircle__ = mkNode([x0, y0]) // fixed right
  const myCircle2 = mkNode([x0, y0], 1, 0xffff00) // lateral
  const myCircle3 = mkNode([x0, y0], 1, 0x00ff00) // center

  // to draw the sinusoid:
  const myLine = new PIXI.Graphics()
  const [x, y] = [w * 0.1, h * 0.5]
  const [dx, dy] = [w * 0.8, h * 0.4]
  myLine.lineStyle(1, 0xffffff)
    .moveTo(x, y)
  const segments = 100
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
  }

  const c = new PIXI.Container()
  app.stage.addChild(c)
  c.addChild(myLine)
  c.addChild(myCircle)
  c.addChild(myCircle4)
  myCircle.position.set(-x, -y)
  myCircle__.position.set(x, y)
  myCircle_.position.set(x + dx, y)

  function setSounds (s) {
    theCircle.tint = myCircle_.tint = myCircle__.tint = myLine.tint = tr(s.fgc)
    myCircle2.tint = tr(s.lcc)
    myCircle3.tint = tr(s.ccc)
    myCircle4.tint = tr(s.bcc)
    myCircle4.x = s.bPos === 0 ? x + dx / 2 : s.bPos === 1 ? x * 0.5 : x + dx * 1.05
    console.log(s, 'SET')
    app.renderer.backgroundColor = tr(s.bgc)
    const synth = maestro.mkOsc(0, -400, -1, 'sine')
    const synthR = maestro.mkOsc(0, -400, 1, 'sine')
    const mul = new t.Multiply(s.ma)
    const mod_ = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true).connect(mul)
    const addL = new t.Add(s.fl)
    const addR = new t.Add(s.fr)
    mul.connect(addL)
    mul.connect(addR)
    addL.connect(synth.frequency)
    addR.connect(synthR.frequency)
    window.sss = { synth, synthR }

    const met2 = new t.DCMeter()
    mod_.connect(met2)

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
      const sub1 = new t.Add(-1)
      const mul = new t.Multiply(2).connect(sub1)
      const env = new t.Envelope({
        attack: 1,
        decay: 0.01,
        sustain: 1,
        release: 1
      }).connect(mul)
      const sub1_ = new t.Negate()
      sub1.connect(sub1_)
      sub1.connect(synth.panner.pan)
      sub1_.connect(synthR.panner.pan)
      const aPer = parseFloat(s.panOscPeriod)
      new t.Loop(time => {
        env.triggerAttackRelease(aPer, time)
      }, aPer * 2).start()
      t.Transport.start()
      console.log('TTHING', s)
    }

    let propx = 1
    let propy = 1
    let rot = Math.random() * 0.1
    const parts = []
    window.pparts = parts
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
      // const intensity = (1 - Math.abs(dc)) * 255
      if (dc - lastdc > 0) { // inhale
        // mais proximo de 1, mais azul
        // m1.css('background', `rgba(${intensity}, ${intensity}, 0, ${1 - Math.abs(dc)})`)
        m1.css('opacity', 1 - Math.abs(dc))
        m2.css('opacity', 0)
      } else { // exhale
        // mais proximo de -1, mais azul
        m2.css('opacity', 1 - Math.abs(dc))
        m1.css('opacity', 0)
        // m2.css('background', `rgba(${intensity}, ${intensity}, 0, ${1 - Math.abs(dc)})`)
      }
      lastdc = dc
      // m1.text(met.getValue().toFixed(3))
      // m2.text(dc.toFixed(3))
      const val = -dc
      const avalr = Math.asin(val)
      // const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
      // const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
      const px = avalr / (2 * Math.PI) * dx + x
      const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x

      myCircle2.x = px
      myCircle2.y = myCircle3.y = myCircle4.y = val * dy + y
      myCircle3.x = px2

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
    // }, 10)
    return { synth, synthR, mod_ }
  }

  const grid = utils.mkGrid(2)
  $('<div/>').appendTo(grid).text('status:')
  const countdown = $('<div/>', { id: 'countdown' }).appendTo(grid)
  grid.css('background', 'grey')

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Check me!')

  t.Master.mute = true
  window.ttt = t
  const conoff = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      this.disabled = true
      t.start()
      t.Master.mute = true
      vonoff.text('All set!')
      grid.css('background', 'green')
    }
  })

  $('<div/>').text('inhale').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
    .css('background', 'rgb(255,255,0)')
    .css('opacity', 0)
  $('<div/>').text('exhale').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
    .css('background', 'rgb(255,255,0)')
    .css('opacity', 0)
  window.mm = { m1, m2 }
}
