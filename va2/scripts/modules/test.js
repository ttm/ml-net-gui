const utils = require('./utils.js')
const maestro = require('./maestro.js')
const net = require('./net.js')
const transfer = require('./transfer.js')
const u = require('./router.js').urlArgument

const PIXI = require('pixi.js')
const forceAtlas2 = require('graphology-layout-forceatlas2')

const t = require('tone')
const $ = require('jquery')

const e = module.exports

e.rtest = () => console.log('router working!')
e.ttest = () => {
  const synth = maestro.mkOsc(u('l') || 400, -200, -1, 'sine')
  const synth2 = maestro.mkOsc(u('r') || 410, -200, 1, 'sine')
  // const mod = maestro.mkOsc(u('o') || 0.1, 46.02, 0, 'sine', true)
  const mod_ = maestro.mkOsc(u('o') || 0.1, 0, 0, 'sine', true)
  const mul = new t.Multiply(190)
  const mod = mod_.connect(mul)
  const add400 = new t.Add(400)
  const add410 = new t.Add(410)
  mul.connect(add400)
  mul.connect(add410)
  // mod.partials = [22]
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  add400.connect(met)
  add400.connect(met2)
  add400.connect(synth.frequency)
  add410.connect(synth2.frequency)

  const grid = utils.mkGrid(2)

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')

  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synth2.volume.rampTo(-40, 1)
      mod.frequency.rampTo(0.05, 120)
      // play
      vonoff.text('Playing')
    } else {
      synth.volume.rampTo(-200, 1)
      synth2.volume.rampTo(-200, 1)
      // stop
      vonoff.text('Stopped')
    }
  })
  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  setInterval(() => {
    m1.text(met.getValue().toFixed(3))
    m2.text(met2.getValue().toFixed(3))
  }, 100)
  window.sss = { synth, synth2, mod, mod_, met, met2, mul }
  // controls:
  //    freq 1 freq 2
  //    mod depth freqmod freqmod2 duration
  //    panosc
  // display:
  //    cur freq1 freq2 freqmod
  //    countdown to start or to end
}

e.ptest = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  window.ppp_ = { PIXI, app }
  const c = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c)

  const c2 = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c2)

  // myLine.position.set(0, 0)
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(200, 300)
  const texture2 = app.renderer.generateTexture(myLine)
  const line = new PIXI.Sprite(texture2)
  line.x = 150
  line.y = 250
  c.addChild(line)

  const myLine2 = new PIXI.Graphics()
  myLine2.lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(400, 400)
  const texture3 = app.renderer.generateTexture(myLine2)
  const line2 = new PIXI.Sprite(texture3)
  c.addChild(line2)

  const gr = new PIXI.Graphics()
  gr.beginFill(0xffffff)
  gr.drawCircle(30, 30, 30)
  gr.endFill()
  const texture = app.renderer.generateTexture(gr)
  const circle = new PIXI.Sprite(texture)
  c2.addChild(circle)

  // const c = PIXI.Container()
  window.ppp = { c, c2, line, circle }
}

e.lines = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const c = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(c)
  const myLine = new PIXI.Graphics()
    .lineStyle(1, 0xff0000)
    .moveTo(100, 100)
    .lineTo(200, 100)
  const texture2 = app.renderer.generateTexture(myLine)
  const line = new PIXI.Sprite(texture2)
  line.x = 150
  line.y = 250
  c.addChild(line)

  const line2 = new PIXI.Sprite(texture2)
  line2.x = 250
  line2.y = 350
  c.addChild(line2)
  line2.scale.set(2, 1)
  line2.rotation = Math.PI / 3

  const myLine3 = new PIXI.Graphics()
  myLine3.lineStyle(1, 0xff0000)
    .moveTo(350, 200)
    .lineTo(350 + 200 * Math.cos(Math.PI / 3), 200 + 200 * Math.sin(Math.PI / 3))
  app.stage.addChild(myLine3)

  const myLine4 = new PIXI.Graphics()
  myLine4.lineStyle(1, 0xff0000)
    .moveTo(450, 300)
    .lineTo(450 + 100, 300)
  const texture = app.renderer.generateTexture(myLine4)
  const line3 = new PIXI.Sprite(texture)
  // line3.x = 150
  // line3.y = 250
  c.addChild(line3)

  window.lll = { line, line2 }
}

const nodes = [
  [130, 200],
  [230, 350],
  [50, 100],
  [500, 100]
]
const edges = [
  [0, 1],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3]
]
e.net1 = () => {
  function plotNet (nodes, edges) {
    nodes.forEach(n => mkNode(n))
    edges.forEach(e => mkEdge(nodes[e[0]], nodes[e[1]]))
  }
  function mkNode (pos) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    nodeContainer.addChild(circle)
  }
  function mkEdge (pos1, pos2) {
    edgeContainer.ppp = pos1
    const line = new PIXI.Sprite(lineTexture)
    const dx = pos2[0] - pos1[0]
    const dy = pos2[1] - pos1[1]
    const length = (dx ** 2 + dy ** 2) ** 0.5
    line.scale.set(length / 1000, 1)
    const angle = Math.atan2(dy, dx)
    line.rotation = angle
    line.x = pos1[0]
    line.y = pos1[1]
    edgeContainer.addChild(line)
  }
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })
  const edgeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })
  const myLine = new PIXI.Graphics()
    .lineStyle(1, 0xff0000)
    .moveTo(0, 0)
    .lineTo(1000, 0)

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const circleTexture = app.renderer.generateTexture(myCircle)
  const lineTexture = app.renderer.generateTexture(myLine)
  app.stage.addChild(edgeContainer)
  app.stage.addChild(nodeContainer)
  plotNet(nodes, edges)
}

e.net2 = () => {
  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  window.___ = new net.ParticleNet(app, nodes, edges)
}

e.net3 = () => {
  const er = net.eR(100, 0.5)
  window.er = er
  const saneSettings = forceAtlas2.inferSettings(er)
  const mpos = forceAtlas2(er,
    { iterations: 150, settings: saneSettings }
  )
  window.mpos = { mpos, saneSettings }

  const mkNodes = order => {
    const bw = 0.1 * w
    const bh = 0.1 * h
    return Array(order).fill(0).map(i => [
      w * 0.8 * Math.random() + bw,
      h * 0.8 * Math.random() + bh
    ])
  }
  const mkEdges = order => {
    const edges = []
    for (let i = 0; i < order - 1; i++) {
      for (let j = i + 1; j < order; j++) {
        if (Math.random() > 0.98) {
          edges.push([i, j])
        }
      }
    }
    return edges
  }

  const app = new PIXI.Application()
  document.body.appendChild(app.view)
  const w = app.renderer.width
  const h = app.renderer.height

  console.log('start!')
  const order = 20000
  const performance = window.performance
  const now1 = performance.now()
  const nodes = mkNodes(order)
  const now2 = performance.now()
  console.log('made the nodes:', now2 - now1)
  const edges = mkEdges(order)
  const now3 = performance.now()
  console.log('made the edges:', now3 - now2, edges.length)
  window.___ = new net.ParticleNet(app, nodes, edges)
  const now4 = performance.now()
  console.log('plot finished:', now4 - now3)
}

e.particles1 = () => {
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    alpha: true
  })

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application()
  document.body.appendChild(app.view)

  const circleTexture = app.renderer.generateTexture(myCircle)
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  const [x0, y0] = [100, 200]
  const theCircle = mkNode([x0, y0])

  // to draw the sinusoid:
  const myLine = new PIXI.Graphics()
  const [x, y] = [100, 300]
  const [dx, dy] = [500, 200]
  myLine.lineStyle(1, 0xff0000)
    .moveTo(x, y)
  const segments = 100
  for (let i = 0; i < segments; i++) {
    myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
  }
  const c = new PIXI.Container()
  app.stage.addChild(c)
  // c.addChild(new PIXI.Sprite(app.renderer.generateTexture(myLine)))
  c.addChild(myLine)
  c.addChild(myCircle)
  // myCircle.x = x
  // myCircle.y = y
  myCircle.position.set(x, y)
  let i = 0
  // const nodes = []
  app.ticker.add(delta => {
    const [xx, yy] = [x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy]
    i = (i + 1) % segments
    myCircle.position.set(xx, yy)
    const circ = mkNode([xx, yy], 0.3)
    nodes.push(circ)
    circ.tint = Math.random() * 0xffffff
    // const toRemove = []
    for (let ii = 0; ii < nodes.length; ii++) {
      const n = nodes[ii]
      const sx = theCircle.x - n.x
      const sy = theCircle.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      if (mag < 5) {
        nodes.splice(ii, 1)
        n.destroy()
        window.nnn = n
      } else {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
    theCircle.x += (Math.random() - 0.5) * 5
    theCircle.y += (Math.random() - 0.5) * 5
  })
  window.mmm = { myCircle, app, nodes }
}

e.particles2 = () => {
  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    // rotation: true,
    // alpha: true,
    position: true
  })

  const myCircle = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle_ = new PIXI.Graphics()
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle2 = new PIXI.Graphics()
    .beginFill(0xffff00)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle3 = new PIXI.Graphics()
    .beginFill(0x00ff00)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  const [w, h] = [app.view.width, app.view.height]

  const circleTexture = app.renderer.generateTexture(myCircle)
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  // const [x0, y0] = [100, 200]
  const [x0, y0] = [w * 0.2, h * 0.2]
  const theCircle = mkNode([x0, y0], 1)

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
  c.addChild(myCircle_)
  c.addChild(myCircle2)
  c.addChild(myCircle3)
  myCircle.position.set(x, y)
  myCircle_.position.set(x + dx, y)
  window.mmm = { myCircle, app }

  // sound
  const synth = maestro.mkOsc(u('l') || 400, -200, -1, 'sine') // fixme: dummy freq
  const synth2 = maestro.mkOsc(u('r') || 410, -200, 1, 'sine') // fixme: dummy freq
  // const mod = maestro.mkOsc(u('o') || 0.1, 46.02, 0, 'sine', true)
  const mod_ = maestro.mkOsc(u('o') || 0.1, 0, 0, 'sine', true)
  const oscAmp = 190
  const freqRef = 700
  const mul = new t.Multiply(oscAmp)
  const mod = mod_.connect(mul)
  const add400 = new t.Add(freqRef)
  const add410 = new t.Add(410)
  mul.connect(add400)
  mul.connect(add410)
  // mod.partials = [22]
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  add400.connect(met)
  add400.connect(met2)
  add400.connect(synth.frequency)
  add410.connect(synth2.frequency)

  const grid = utils.mkGrid(2)

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')

  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
      synth.volume.rampTo(-40, 1)
      synth2.volume.rampTo(-40, 1)
      mod.frequency.rampTo(0.05, 120)
      // play
      vonoff.text('Playing')
    } else {
      synth.volume.rampTo(-200, 1)
      synth2.volume.rampTo(-200, 1)
      // stop
      vonoff.text('Stopped')
    }
  })

  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  const parts = []
  setInterval(() => {
    const dc = met2.getValue()
    m1.text(met.getValue().toFixed(3))
    m2.text(dc.toFixed(3))
    const val = (freqRef - dc) / oscAmp
    window.aval = val
    const avalr = Math.asin(val)
    const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
    myCircle2.x = px
    myCircle2.y = val * dy + y
    const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
    myCircle3.x = px2
    myCircle3.y = val * dy + y

    theCircle.x += (Math.random() - 0.5)
    theCircle.y += (Math.random() - 0.5)

    const circ = mkNode([myCircle2.x, myCircle2.y], 0.3)
    parts.push(circ)
    circ.tint = 0xffff00

    const circ2 = mkNode([myCircle3.x, myCircle3.y], 0.3)
    parts.push(circ2)
    circ2.tint = 0x00ff00
    for (let ii = 0; ii < parts.length; ii++) {
      const n = parts[ii]
      const sx = theCircle.x - n.x
      const sy = theCircle.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      if (mag < 5) {
        parts.splice(ii, 1)
        n.destroy()
        window.nnn = n
      } else {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        // n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
  }, 10)
  window.sss = { synth, synth2, mod, mod_, met, met2, mul, parts }
}

e.mkMed = () => {
  console.log('YEY')
  // define:
  // id (any string without points), date and time,
  // freq1, freq2, mod freq1-2 and duration transition and depth
  // and total duration
  // save to mongo
  $('<link/>', {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'
  }).appendTo('head')
  const flatpickr = require('flatpickr')

  const grid = utils.mkGrid(2)

  $('<span/>').html('id:').appendTo(grid)
  const mdiv = $('<input/>', {
    placeholder: 'id for the meditation'
  }).appendTo(grid)

  $('<span/>').html('when:').appendTo(grid)
  const adiv = $('<input/>', {
    placeholder: 'select date and time'
  }).appendTo(grid)
  const mfp = flatpickr(adiv, {
    enableTime: true
  })

  $('<span/>').html('freq left:').appendTo(grid)
  const fl = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)

  $('<span/>').html('freq right:').appendTo(grid)
  const fr = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)

  $('<span/>').html('Martigli initial freq:').appendTo(grid)
  const mf0 = $('<input/>', {
    placeholder: 'freq in miliHerz'
  }).appendTo(grid)

  $('<span/>').html('Martigli final freq:').appendTo(grid)
  const mf1 = $('<input/>', {
    placeholder: 'freq in miliHerz'
  }).appendTo(grid)

  $('<span/>').html('Martigli amplitude:').appendTo(grid)
  const ma = $('<input/>', {
    placeholder: 'in Herz'
  }).appendTo(grid)

  $('<span/>').html('Martigli transition:').appendTo(grid)
  const md = $('<input/>', {
    placeholder: 'duration in seconds'
  }).appendTo(grid)

  $('<span/>').html('total duration:').appendTo(grid)
  const d = $('<input/>', {
    placeholder: 'in seconds (0 if forever)'
  }).appendTo(grid)

  $('<button/>')
    .html('Create')
    .click(() => {
      console.log('the date:', mfp.selectedDates[0])
      console.log('the id:', mdiv.val())
      transfer.writeAny({
        meditation: mdiv.val(),
        dateTime: mfp.selectedDates[0],
        fl: fl.val(),
        fr: fr.val(),
        mf0: mf0.val(),
        mf1: mf1.val(),
        ma: ma.val(),
        md: md.val(),
        d: d.val()
      }).then(resp => console.log(resp))
    }).appendTo(grid)
  window.transfer = transfer
  window.mdiv = mdiv
}

e.meditation = mid => {
  // load med from mongo, open similar to particles2
  // regressive counter to start, button to give ok
  transfer.findAny({ meditation: mid }).then(r => {
    console.log(r)
    window.rrr = r
    window.startTimer = startTimer
    const dur = (r.dateTime.getTime() - (new Date()).getTime()) / 1000
    startTimer(dur, $('<span/>').appendTo('body'))
  })
  function startTimer (duration, display) {
    setInterval(function () {
      let minutes = parseInt(duration / 60, 10)
      let seconds = parseInt(duration % 60, 10)

      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds

      display.text('status: countdown on ' + minutes + ':' + seconds)

      duration -= 0.1
      if (duration < 0) {
        duration = 0
        display.text('status: started')
      }
    }, 100)
  }
}
