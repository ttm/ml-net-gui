const utils = require('./utils.js')
const maestro = require('./maestro.js')
const net = require('./net.js')
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
    const dc = met2.getValue()
    m1.text(met.getValue().toFixed(3))
    m2.text(dc.toFixed(3))
  }, 100)
  window.sss = { synth, synth2, mod, mod_, met, met2, mul }
}
