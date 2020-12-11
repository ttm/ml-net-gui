const PIXI = require('pixi.js')
const forceAtlas2 = require('graphology-layout-forceatlas2')

const t = require('tone')
const $ = require('jquery')

const m = require('./med')
const maestro = require('./maestro.js')
const net = require('./net.js')
const utils = require('./utils.js')
const transfer = require('./transfer.js')
const u = require('./router.js').urlArgument

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
  window.sss = { synth, synth2, mod, mod_, met, met2, mul, add400, add410 }
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

  const s = $('<select/>', { id: 'mselect' }).appendTo(grid)
    .append($('<option/>').val(-1).html('~ creating ~'))
    .attr('title', 'Select template to load, edit, or delete.')
    .on('change', aself => {
      // load them
      const ii = aself.currentTarget.value
      console.log(ii)
      if (ii === '-1') {
        return
      }
      const e = window.allthem2[ii]
      console.log(e)
      mdiv.val(e.meditation)
      fl.val(e.fl)
      fr.val(e.fr)
      mp0.val(e.mp0)
      mp1.val(e.mp1)
      ma.val(e.ma)
      md.val(e.md)
      d.val(e.d)
      mfp.setDate(e.dateTime)
      ellipse.prop('checked', e.ellipse)
      obutton.attr('disabled', false).html(`Open: ${mdiv.val()}`)
      bPos.bindex = e.bPos || 0
      bPos.html(posPos[bPos.bindex])
      rainbowFlakes.prop('checked', e.rainbowFlakes)
      bgc.fromString(e.bgc)
      fgc.fromString(e.fgc)
      bcc.fromString(e.bcc)
      ccc.fromString(e.ccc)
      lcc.fromString(e.lcc)
      if (e.panOsc === undefined) e.panOsc = '0'
      $('#panOsc').val(e.panOsc)
      $('#waveformL').val(e.waveformL || 'sine')
      $('#waveformR').val(e.waveformR || 'sine')
      panOscPeriod.val(e.panOscPeriod ? e.panOscPeriod : '')
      panOscPeriod.attr('disabled', e.panOsc < 2)
      lemniscate.prop('checked', e.lemniscate || false)
      centerC.html(e.lemniscate ? 'left circ color:' : 'center circ color:')
      lateralC.html(e.lemniscate ? 'right circ color:' : 'lateral circ color:')
      communionSchedule.prop('checked', e.communionSchedule || false)
    })
  transfer.findAll({ meditation: { $exists: true } }).then(r => {
    window.allthem2 = r
    r.forEach((i, ii) => {
      s.append($('<option/>', { class: 'pres' }).val(ii).html(i.meditation))
    })
  })
  window.ass = s
  $('<button/>').html('Delete').appendTo(grid)
    .click(() => {
      console.log($(`option[value="${$('#mselect').val()}"].pres`))
      const moption = $(`option[value="${$('#mselect').val()}"].pres`)
      const oind = moption[0].value
      transfer.remove({ meditation: window.allthem2[oind].meditation })
      moption.remove()
      window.allthem2.splice(oind, 1)
    })
    .attr('title', 'Delete the meditation loaded in the dropdown menu.')
  $('<span/>').html('id:').appendTo(grid)
  const mdiv = $('<input/>', {
    placeholder: 'id for the meditation'
  }).appendTo(grid)
    .attr('title', 'The ID for the meditation (will appear on the URL).')

  $('<span/>').html('when:').appendTo(grid)
  const adiv = $('<input/>', {
    placeholder: 'select date and time'
  }).appendTo(grid)
    .attr('title', 'Select a date and time for the mentalization to occur.')
  const mfp = flatpickr(adiv, {
    enableTime: true
  })

  $('<span/>').html('freq left:').appendTo(grid)
  const fl = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the left channel.')

  $('<span/>').html('waveform left:').appendTo(grid)
  const waveformL = $('<select/>', { id: 'waveformL' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))
    .append($('<option/>').val('triangle').html('triangle'))

  $('<span/>').html('freq right:').appendTo(grid)
  const fr = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the right channel.')

  $('<span/>').html('waveform right:').appendTo(grid)
  const waveformR = $('<select/>', { id: 'waveformR' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))
    .append($('<option/>').val('triangle').html('triangle'))

  $('<span/>').html('Martigli amplitude:').appendTo(grid)
  const ma = $('<input/>', {
    placeholder: 'in Herz'
  }).appendTo(grid)
    .attr('title', 'Variation span of the frequency to guide breathing.')

  $('<span/>').html('Martigli initial period:').appendTo(grid)
  const mp0 = $('<input/>', {
    placeholder: 'period in seconds'
  }).appendTo(grid)
    .attr('title', 'Initial duration of the breathing cycle.')

  $('<span/>').html('Martigli final period:').appendTo(grid)
  const mp1 = $('<input/>', {
    placeholder: 'period in seconds'
  }).appendTo(grid)
    .attr('title', 'Final duration of the breathing cycle.')

  $('<span/>').html('Martigli transition:').appendTo(grid)
  const md = $('<input/>', {
    placeholder: 'duration in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the transition from the initial to the final Martigli period.')

  $('<span/>').html('total duration:').appendTo(grid)
  const d = $('<input/>', {
    placeholder: 'in seconds (0 if forever)'
  }).appendTo(grid)
    .attr('title', 'Duration of the meditation in seconds.')

  $('<span/>').html('pan oscillation:').appendTo(grid)
  const panOsc = $('<select/>', { id: 'panOsc' }).appendTo(grid)
    .append($('<option/>').val(0).html('none'))
    .append($('<option/>').val(1).html('synced with Martigli Oscillation'))
    .append($('<option/>').val(2).html('sine independent of Martigli Oscillation'))
    .append($('<option/>').val(3).html('envelope (linear transition, stable sustain)'))
    .attr('title', 'Type of pan oscillation.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      panOscPeriod.attr('disabled', ii < 2)
    })

  $('<span/>').html('pan oscillation period:').appendTo(grid)
  const panOscPeriod = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the pan oscillation in seconds.')
    .attr('disabled', true)

  $('<span/>').html('breathing ellipse:').appendTo(grid)
  const ellipse = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Breath-scaled circle is ellipsoid if checked.')

  $('<span/>').html('breathing position:').appendTo(grid)
  const posPos = ['Center', 'Left', 'Right']
  const bPos = $('<button/>')
    .html('Center')
    .appendTo(grid)
    .attr('title', 'Breath-scaled circle position.')
    .click(() => {
      bPos.bindex = (bPos.bindex + 1) % posPos.length
      bPos.html(posPos[bPos.bindex])
    })
  bPos.bindex = 0

  $('<span/>').html('rainbow flakes:').appendTo(grid)
  const rainbowFlakes = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'The flakes are in all colors if checked.')

  const J = require('@eastdesire/jscolor')
  $('<span/>').html('backgroung color:').appendTo(grid)
  $('<input/>', { id: 'bgc' }).appendTo(grid)
    .attr('title', 'The color of the background.')
  const bgc = new J('#bgc', { value: '#000000' })

  $('<span/>').html('foreground color:').appendTo(grid)
  $('<input/>', { id: 'fgc' }).appendTo(grid)
    .attr('title', 'The color of main drawing (e.g. sinusoid + shaking attractive circle).')
  const fgc = new J('#fgc', { value: '#FFFFFF' })

  $('<span/>').html('breathing circ color:').appendTo(grid)
  $('<input/>', { id: 'bcc' }).appendTo(grid)
    .attr('title', 'The color of circle that expands when to inhale.')
  const bcc = new J('#bcc', { value: '#4444FF' })

  const centerC = $('<span/>').html('center circ color:').appendTo(grid)
  $('<input/>', { id: 'ccc' }).appendTo(grid)
    .attr('title', 'The color of moving circle in (or most to) the middle.')
  const ccc = new J('#ccc', { value: '#00FF00' })

  const lateralC = $('<span/>').html('lateral circ color:').appendTo(grid)
  $('<input/>', { id: 'lcc' }).appendTo(grid)
    .attr('title', 'The color of the moving circle in (or most to) the laterals.')
  const lcc = new J('#lcc', { value: '#FFFF00' })

  $('<span/>').html('lemniscate:').appendTo(grid)
  const lemniscate = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Visualization with lemniscate if checked, sinusoid if not checked.')
    .on('change', function () {
      if (this.checked) {
        console.log('checked L')
        centerC.html('left circ color:')
        lateralC.html('right circ color:')
      } else {
        console.log('unchecked L')
        centerC.html('center circ color:')
        lateralC.html('lateral circ color:')
      }
    })

  $('<span/>').html('<a target="_blank" href="?p=communion">communion schedule</a>:').appendTo(grid)
  const communionSchedule = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Is this meeting to be put on the communion meetings table?')

  const f = parseFloat
  $('<button/>')
    .attr('title', 'Create the meditation with the settings defined.')
    .html('Create')
    .click(() => {
      console.log('the date:', mfp.selectedDates[0])
      console.log('the id:', mdiv.val() === '')
      const mdict = {
        fl: f(fl.val()),
        fr: f(fr.val()),
        mp0: f(mp0.val()),
        mp1: f(mp1.val()),
        ma: f(ma.val()),
        md: f(md.val()),
        d: f(d.val())
      }
      for (const key in mdict) {
        if (isNaN(mdict[key])) {
          window.alert(`define the value for ${key}.`)
          return
        }
      }
      mdict.panOsc = panOsc.val()
      mdict.waveformL = waveformL.val()
      mdict.waveformR = waveformR.val()
      if (mdict.panOsc > 1) {
        const oPeriod = f(panOscPeriod.val())
        if (isNaN(oPeriod)) {
          window.alert('define the value for the pan oscillation period.')
          return
        }
        mdict.panOscPeriod = oPeriod
      }
      console.log(mdict, 'MDICT')
      mdict.dateTime = mfp.selectedDates[0]
      if (mdict.dateTime === undefined || mdict.dateTime < new Date()) {
        if (!window.confirm('the date has passed. Are you shure?')) return
      }
      mdict.meditation = mdiv.val()
      if (mdict.meditation === '') {
        window.alert('define the meditation id.')
      }
      for (let i = 0; i < window.allthem2.length; i++) {
        if (mdict.meditation === window.allthem2[i].meditation) {
          window.alert('change the meditation id to be unique.')
          return
        }
      }
      mdict.ellipse = ellipse.prop('checked')
      mdict.bPos = bPos.bindex
      mdict.rainbowFlakes = rainbowFlakes.prop('checked')
      mdict.bgc = bgc.toString()
      mdict.fgc = fgc.toString()
      mdict.bcc = bcc.toString()
      mdict.ccc = ccc.toString()
      mdict.lcc = lcc.toString()
      mdict.lemniscate = lemniscate.prop('checked')
      mdict.communionSchedule = communionSchedule.prop('checked')
      console.log(fl.val())
      if (f(fr.val()) < 4) return
      transfer.writeAny(mdict).then(resp => console.log(resp))
      // enable button with the name
      s.append($('<option/>', { class: 'pres' }).val(window.allthem2.length).html(mdict.meditation))
      s.val(window.allthem2.length)
      window.allthem2.push(mdict)
      obutton.attr('disabled', false).html(`Open: ${mdiv.val()}`)
    }).appendTo(grid)
  const obutton = $('<button/>')
    .html('Open')
    .attr('title', 'Open URL of the meditation.')
    .click(() => {
      // open url with
      window.open(`?m=${mdiv.val()}`)
    })
    .appendTo(grid)
    .attr('disabled', true)
  window.transfer = transfer
  window.mdiv = mdiv
}

e.meditation = mid => {
  transfer.findAny({ meditation: mid }).then(r => {
    if (r === null) {
      grid.css('background', 'red')
      countdown.text("don't exist")
      conoff.attr('disabled', true)
      vonoff.text('-----')
    }
    const dur = (r.dateTime.getTime() - (new Date()).getTime()) / 1000
    startTimer(dur, $('<span/>').appendTo('body'), r)
  })
  function startTimer (duration, display, settings) {
    if (duration < 0) {
      vonoff.text('Already started, maybe finished, ask team for another session.')
      conoff.attr('checked', true).attr('disabled', true)
      countdown.text('finished')
      grid.css('background', '#bbaaff')
      return
    }
    setSounds(settings, duration, display)
    // const { synth, synth2, mod } = setSounds(settings, duration, display)
    // const timer = setInterval(function () {
    // }, 100)
  }

  const nodeContainer = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true
  })

  const myCircle = new PIXI.Graphics() // left static circle
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle_ = new PIXI.Graphics() // right static circle
    .beginFill(0xffffff)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle2 = new PIXI.Graphics() // moving sinusoid circle
    .beginFill(0xffff00)
    .drawCircle(0, 0, 5)
    .endFill()
  const myCircle3 = new PIXI.Graphics() // moving sinusoid circle
    .beginFill(0x00ff00)
    .drawCircle(0, 0, 5)
    .endFill()

  const myCircle4 = new PIXI.Graphics() // vertical for breathing
    .beginFill(0x4444ff)
    .drawCircle(0, 0, 5)
    .endFill()

  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  const [w, h] = [app.view.width, app.view.height]

  const circleTexture = app.renderer.generateTexture(myCircle)
  // const circleTexture = PIXI.Texture.from('assets/heart.png') // todo: integrate images
  app.stage.addChild(nodeContainer)
  function mkNode (pos, scale) {
    const circle = new PIXI.Sprite(circleTexture)
    circle.position.set(...pos)
    circle.anchor.set(0.5, 0.5)
    circle.scale.set(scale || 1, scale || 1)
    nodeContainer.addChild(circle)
    return circle
  }
  const [x0, y0] = [w * 0.2, h * 0.2]
  const theCircle = mkNode([x0, y0], 1) // moving white circle to which the flakes go

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
  c.addChild(myCircle4)
  // myCircle4.x = x + dx * 1.05 // todo: give option to use
  myCircle4.x = x + dx / 2
  myCircle.position.set(x, y)
  myCircle_.position.set(x + dx, y)

  function setSounds (s, duration, display) {
    const synth = maestro.mkOsc(0, -400, -1, 'sine') // fixme: dummy freq
    const synth2 = maestro.mkOsc(0, -400, 1, 'sine') // fixme: dummy freq
    // synth.volume.rampTo(-400, 1) // fixme: delete?
    // synth2.volume.rampTo(-400, 1)
    const oscAmp = s.ma
    const mod_ = maestro.mkOsc(1 / s.mp0, 0, 0, 'sine', true)
    const mul = new t.Multiply(oscAmp)
    const mod = mod_.connect(mul)
    const addL = new t.Add(s.fl)
    const addR = new t.Add(s.fr)
    mul.connect(addL)
    mul.connect(addR)
    addL.connect(synth.frequency)
    addR.connect(synth2.frequency)

    const met = new t.Meter()
    const met2 = new t.DCMeter()
    addL.connect(met)
    addL.connect(met2)

    const parts = []
    let prop = 1
    let propx = 1
    let propy = 1
    let rot = Math.random() * 0.1
    let okGiven, started
    const freqRef = s.fl
    const timer = setInterval(() => {
      let minutes = parseInt(duration / 60, 10)
      let seconds = parseInt(duration % 60, 10)

      // todo: hour
      minutes = minutes < 10 ? '0' + minutes : minutes
      seconds = seconds < 10 ? '0' + seconds : seconds

      // display.text('status: countdown on ' + minutes + ':' + seconds)
      countdown.text('countdown on ' + minutes + ':' + seconds)

      duration -= 0.01
      if (!okGiven) {
        if (conoff.attr('disabled')) {
          grid.css('background', 'green')
          okGiven = true
        } else {
          return
        }
      }
      if (duration < 0 && !started) { // todo: start another countdown with s.d
        duration = 0
        started = true
        // display.text('status: started')
        countdown.text('started')
        // t.start()
        t.Master.mute = false
        synth.volume.rampTo(-40, 1)
        synth2.volume.rampTo(-40, 1) // todo: synth2 => synthR
        mod.frequency.rampTo(1 / s.mp1, s.md)
        setTimeout(() => {
          clearInterval(timer)
          grid.css('background', 'blue')
          countdown.text('finished')
          synth.volume.rampTo(-400, 10)
          synth2.volume.rampTo(-400, 10)
        }, s.d * 1000)
      }

      const dc = met2.getValue()
      m1.text(met.getValue().toFixed(3))
      m2.text(dc.toFixed(3))
      const val = (freqRef - dc) / oscAmp
      const avalr = Math.asin(val)
      const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
      const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x

      myCircle2.x = px
      myCircle2.y = myCircle3.y = myCircle4.y = val * dy + y
      myCircle3.x = px2

      const sc = 0.3 + (-val + 1) * 3
      myCircle4.scale.set(sc * propx, sc * propy)
      myCircle4.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        rot = Math.random() * 0.1
        prop = Math.random() * 0.6 + 0.4
        propx = prop
        propy = 1 / prop
      }

      const circ = mkNode([myCircle2.x, myCircle2.y], 0.3)
      parts.push(circ)
      circ.tint = 0xffff00

      const circ2 = mkNode([myCircle3.x, myCircle3.y], 0.3)
      parts.push(circ2)
      circ2.tint = 0x00ff00
      if (Math.random() > 0.98) {
        const circ4 = mkNode([myCircle4.x, myCircle4.y], 0.3)
        parts.push(circ4)
        circ4.tint = 0x5555ff
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
          n.x += sx / mag + (Math.random() - 0.5) * 5
          n.y += sy / mag + (Math.random() - 0.5) * 5
          // n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff // todo: give option
        }
      }
    }, 10)
    return { synth, synth2, mod }
  }
  // sound

  const grid = utils.mkGrid(2)
  $('<div/>').appendTo(grid).text('status:')
  const countdown = $('<div/>', { id: 'countdown' }).appendTo(grid)
  grid.css('background', 'yellow')

  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Check me!')

  const conoff = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = true
      this.disabled = true
      // play
      vonoff.text('All set!')
    }
  })

  $('<div/>').text('meter').appendTo(grid)
  const m1 = $('<div/>', { id: 'meter1' }).appendTo(grid)
  $('<div/>').text('meter DC').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
}

e.atry = mid => {
  console.log(m)
  m.model1(mid)
}

e.atry2 = mid => {
  console.log(m)
  m.model2(mid)
}

e.tcolor = () => {
  console.log(window.jscolor)
  const J = require('@eastdesire/jscolor')
  console.log(J)
  $('<input/>', {
    id: 'pick'
  }).appendTo('body')
  const jj = new J('#pick', { value: '#FF0000' })
  window.j = { J, jj, PIXI }
}

e.safariOsc = () => {
  const addL = new t.Add(300)
  const mul = new t.Multiply(200)
  mul.connect(addL)
  const met = new t.Meter()
  const met2 = new t.DCMeter()
  addL.connect(met)
  addL.connect(met2)

  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true)
  const mod = mod_.connect(mul)
  window.deb = { addL, mul, met, met2, mod_, mod, t }

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
}

e.safariOsc2 = () => {
  const o = new t.Oscillator(0.1, 'sine').start()
  const met = new t.DCMeter({ channelCount: 1 })
  o.connect(met)

  const l = new t.LFO(0.1, -1, 1).start()
  const met2 = new t.DCMeter()
  l.connect(met2)

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  $('<div/>').text('meter DC o').appendTo(grid)
  const m = $('<div/>').appendTo(grid)
  $('<div/>').text('meter DC l').appendTo(grid)
  const m2 = $('<div/>', { id: 'meter2' }).appendTo(grid)
  setInterval(() => {
    m.text(met.getValue().toFixed(5))
    m2.text(met2.getValue().toFixed(5))
  }, 10)
  // const app = new PIXI.Application()
  // app.ticker.add(() => {
  //   m.text(met.getValue())
  //   m2.text(met2.getValue())
  // })
  window.lll = { l, o, met, met2 }
}

e.binauralMeta = () => {
  // just as previous function
  // but has a rate for decreasing Martigli oscillation (Hz / min)
  // and for decreasing right channel freq (Hz / min)
  // + 2-3 words to be repeated with some density (words / min)
  $('canvas').hide()
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const out = ctx.destination
  window.ios = { ctx, out }

  const E = ctx.createOscillator() // Modulator
  const F = ctx.createOscillator() // Carrier
  const F2 = ctx.createOscillator() // Carrier2
  const audioContext = ctx

  window.oscs = { E, F, F2 }

  // Setting frequencies
  const a = u
  E.frequency.value = a('o') || 0.01
  F.frequency.value = a('l') || 440
  F2.frequency.value = a('r') || 455

  // Modulation depth
  const eGain = ctx.createGain()
  eGain.gain.value = a('a') || 400

  // Wiring everything up
  E.connect(eGain)
  eGain.connect(F.frequency)
  eGain.connect(F2.frequency)

  // pan:
  let pan, pan2
  if (ctx.createStereoPanner) { // chrome and firefox:
    pan = ctx.createStereoPanner()
    pan2 = ctx.createStereoPanner()
    pan.pan.value = -1
    pan2.pan.value = 1
  } else { // todo: make ok for safari:
    pan = ctx.createPanner()
    pan.panningModel = 'equalpower'
    pan.setPosition(pan, 0, 1 - Math.abs(pan))
  }

  // master gain:
  const eGain2 = ctx.createGain()
  eGain2.gain.value = a('g') || 0.01

  F.connect(pan).connect(eGain2)
  F2.connect(pan2).connect(eGain2)
  eGain2.connect(out)

  // Start making sound
  $('<span/>').html('Play/Payse').appendTo(
    $('<button/>', {
      'data-playing': 'false',
      'aria-checked': 'false',
      role: 'switch',
      id: 'mbtn'
    }).appendTo('body').click(function () {
      if (audioContext.state === 'suspended') { // autoplay policy
        audioContext.resume()
      }

      if (this.dataset.playing === 'false') {
        E.start()
        F.start()
        F2.start()
        this.dataset.playing = 'true'
        // const d = (a('d') || 0) / 600 // because it will change freq each 100ms
        const b = (a('b') || 0) / 600 // because it will change freq each 100ms
        const d = Math.pow(0.5, 1 / 600)
        setInterval(() => {
          E.frequency.value *= d
          F2.frequency.value -= b
        }, 100)
      } else {
        E.stop()
        F.stop()
        F2.stop()
        this.dataset.playing = 'false'
      }
    })
  )
  $('<div/>').html(`
  <h2>Hyper-binaural beats</h2>
  This page makes available a simple interface for binaural beats + Martigli oscillations.

  <h3>URL arguments description:</h3>
  <ul>
  <li>
  l: left frequency. Default: 440 Hz. Current: ${a('l')} Hz
  </li>
  <li>
  r: right frequency. Default: 455 Hz. Current: ${a('r')} Hz
  </li>
  <li>
  o: Martigli oscillation frequency. Default: 0.01 Hz. Current: ${a('o')} Hz
  </li>
  <li>
  a: Martigli oscillation depth. Default: 400 Hz. Current: ${a('a')} Hz
  </li>
  <li>
  g: master gain. Default: 0.01 RMS. Current: ${a('g')} RMS
  </li>
  </ul>

  Examples:
  <ul>
  <li>
  skull screening: ${linkL('?p=binauralMeta&l=400.1&r=400&o=2&a=200&g=0.01')}
  </li>
  <li>
  skull screening 2: ${linkL('?p=binauralMeta&l=400.2&r=400&o=0.5&a=50&g=0.01')}
  </li>
  <li>
  concentration sweep: ${linkL('?p=binauralMeta&l=400&r=415&o=0.01&a=200&g=0.01')}
  </li>
  <li>
  concentration sweep2: ${linkL('?p=binauralMeta&l=400&r=410&o=0.01&a=200&g=0.01')}
  </li>
  <li>
  Alpha (|l - r| in 8-13 Hz).
  </li>
  <li>
  Beta (|l - r| in 13-30 Hz).
  </li>
  <li>
  Theta (|l - r| in 1-5 Hz).
  </li>
  <li>
  Delta (|l - r| in 4-8 Hz).
  </li>
  </ul>
  <br><br>
  :::
  `).appendTo('body')
}

e.binauralMeta2 = () => {
  // just as binauralMeta but also add oscillation on the pan
}

e.binauralMeta3 = () => {
  // just as binauralMeta2 but add encoded time to start on the URL
  // and let add more than one oscillatory voice
}

const linkL = path => {
  return `<a href="${path}">${path}</a>`
}

e.communion = () => {
  $('<div/>', {
    css: {
      margin: '0 auto',
      padding: '8px',
      width: '50%'
    }
  }).appendTo('body').html(`
  <h2>Communions</h2>

  <p>We have daily meetings 0h, 6h, 12h, and 18h (GMT-3).
  They are dedicated to be a group concentration for humanity's
  well-being (by extention also for the world and all creation's well-being).</p>

  <p>The outline is not rigid and intended as follows:
  <ul>
    <li>10 minutes to gather, talk, agree on the mentalization subject and preparations in general.</li>
    <li>15 minutes of meditation, with breathing and brainwaves synchronized through the online gadgets linked below. Thus <b>anyone that arrives late misses the meditation, there is no way around it</b>.</li>
    <li>5 minutes for final words and considerations and farewells.</li>
  </ul>

  <p>Join us at <a target="_blank" href="https://meet.google.com/bkr-vzhw-zfc">our video conference</a></a>.</p>
  `)
  const l = t => `<a href="?m=${t}" target="_blank">${t}</a>`
  const grid = utils.mkGrid(2)
  $('<span/>').html('<b>when</b> (GMT-0)').appendTo(grid)
  $('<span/>').html('<b>subject</b>').appendTo(grid)
  transfer.findAll({ communionSchedule: true }).then(r => {
    window.myr = r
    r.sort((a, b) => b.dateTime - a.dateTime)
    r.forEach(e => {
      const adate = (new Date(e.dateTime - 60 * 10 * 1000)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      console.log(adate)
      $('<span/>').text(adate).appendTo(grid)
      $('<span/>').html(l(e.meditation)).appendTo(grid)
    })
    $('<span/>').text('December 1st, 6h:').appendTo(grid)
    $('<span/>').html('health (for one\'s self, loved ones,<br>people in need, all humanity)').appendTo(grid)
  })
}

e.panTest2 = () => {
  const synth = maestro.mkOsc(0, -400, -1, 'sine')
  const synthR = maestro.mkOsc(0, -400, -1, 'sine')
  const mul = new t.Multiply(20)
  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true).connect(mul)
  const addL = new t.Add(700)
  const addR = new t.Add(200)

  mul.connect(addL)
  mul.connect(addR)
  addL.connect(synth.frequency)
  addR.connect(synthR.frequency)

  const neg = new t.Negate()
  const mul1 = new t.Multiply(1)
  mod_.connect(neg)
  mod_.connect(mul1)
  mul1.connect(synth.panner.pan) // dc
  neg.connect(synthR.panner.pan) // -dc

  const met2 = new t.DCMeter()
  const me = new t.DCMeter()
  const meN = new t.DCMeter()
  mod_.connect(met2)
  neg.connect(meN)
  setInterval(() => {
    console.log([met2, me, meN].map(i => i.getValue()))
    console.log(synth.panner.pan.value, synthR.panner.pan.value)
  }, 500)
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      // t.context.resume()
      t.start()
      synth.volume.rampTo(-20, 1)
      synthR.volume.rampTo(-20, 1)
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  window.maux = { mod_, me, meN, neg, synth, synthR }
}

e.panBug = () => { // todo: post on tonejs' github
  const synth = maestro.mkOsc(0, -400, -1, 'sine')
  const synth2 = maestro.mkOsc(0, -400, -1, 'sine')
  const synth3 = maestro.mkOsc(0, -400, -1, 'sine')
  const mul = new t.Multiply(20)
  const mod_ = maestro.mkOsc(0.1, 0, 0, 'sine', true).connect(mul)
  const addL = new t.Add(700)
  const addR = new t.Add(200)

  mul.connect(addL)
  mul.connect(addR)
  addL.connect(synth.frequency)
  addR.connect(synth2.frequency)

  const neg = new t.Negate()
  const mul1 = new t.Multiply(1)
  mod_.connect(neg)
  mod_.connect(mul1)
  mul1.connect(synth.panner.pan)
  neg.connect(synth2.panner.pan)
  mod_.connect(synth3.panner.pan) // this should entail the same result as synth + mul1, no?

  setInterval(() => {
    console.log(synth.panner.pan.value, synth2.panner.pan.value, synth3.panner.pan.value)
  }, 500)
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      synth.volume.rampTo(-20, 1)
      synth2.volume.rampTo(-20, 1)
      synth3.volume.rampTo(-20, 1)
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  window.maux = { mod_, neg, synth, synth2, synth3 }
}

e.envPan = () => {
  const sub1 = new t.Add(-1)
  const mul = new t.Multiply(2).connect(sub1)
  const env = new t.Envelope({
    attack: 3,
    decay: 0.2,
    sustain: 1,
    release: 5
  }).connect(mul)
  const synth = maestro.mkOsc(200, -400, -1, 'sine')
  sub1.connect(synth.panner.pan) // dc

  const sub1_ = new t.Negate()
  sub1.connect(sub1_)

  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.start()
      synth.volume.rampTo(-20, 1)
      env.triggerAttackRelease(10)
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
  const met2 = new t.DCMeter()
  env.connect(met2)
  const met = new t.DCMeter()
  sub1.connect(met)
  const met3 = new t.DCMeter()
  sub1_.connect(met3)
  setInterval(() => {
    console.log('val:', met3.getValue(), met2.getValue(), met.getValue(), synth.panner.pan.value)
  }, 200)
}

e.lemniscate = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight * 0.85
  })
  document.body.appendChild(app.view)
  // const c = [300, 200] // center
  const c = [app.view.width / 2, app.view.height / 2] // center
  // const a = 200 // half width
  const a = app.view.width / 4
  const xy = ii => {
    const px = a * Math.cos(ii) / (1 + Math.sin(ii) ** 2)
    const py = Math.sin(ii) * px
    return [px + c[0], py + c[1]]
    // return [py + c[1], px + c[0]]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xff0000)
    .moveTo(...xy(0))
  const segments = 100
  for (let i = 1; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100))
  }
  app.stage.addChild(myLine)
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(...xy(0), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(...xy(Math.PI), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0xffff00)
      .drawCircle(...xy(Math.PI / 2), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(4 * Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(6 * Math.PI / 5), 5)
      .endFill()
  )
  app.stage.addChild(
    new PIXI.Graphics()
      .beginFill(0x00ff00)
      .drawCircle(...xy(9 * Math.PI / 5), 5)
      .endFill()
  )
}

e.aeterni = () => {
  const itemsB = [
    ['https://nypost.com/2020/11/20/scientists-reverse-human-aging-process-in-breakthrough-study/', 'hyperbaric oxygen chambers to target specific cells and DNA linked to shorter lifespans ']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a></li>`, '')
  const items = [
    ['https://www.calicolabs.com/', 'Calico', ', a multi billion dollar company dedicated to combating aging and associated diseases.'],
    ['http://paloaltoprize.com/', 'Palo Alto Longevity Prize', ': long term initiative upholding prizes for advances in longevity.'],
    ['https://www.lifespan.io/', 'Life Extension Advocacy Foundation', ': crowdfunding longevity.'],
    ['https://www.rlecoalition.com/', 'Coalition for Radical Life Extension', ': a not-for-profit organization to galvanize a popular movement.'],
    ['https://www.longevity.vc/', 'The Longevity Fund', ': backing entrepreneurs developing therapeutics for age-related disease.']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a>${i[2]}</li>`, '')
  const itemsW = [
    ['https://en.wikipedia.org/wiki/Life_extension', 'Life extension'],
    ['https://en.wikipedia.org/wiki/Anti-aging_movement', 'Anti-aging movement'],
    ['https://en.wikipedia.org/wiki/Aging_brain', 'Aging brain'],
    ['https://en.wikipedia.org/wiki/Ageing', 'Aging'],
    ['https://en.wikipedia.org/wiki/Compression_of_morbidity', 'Compression of morbidity'],
    ['https://en.wikipedia.org/wiki/Immortality', 'Immortality'],
    ['https://en.wikipedia.org/wiki/Futures_studies', 'Futurism'],
    ['https://en.wikipedia.org/wiki/Transhumanism', 'Transhumanism'],
    ['https://en.wikipedia.org/wiki/Maximum_life_span', 'Maximum life span'],
    ['https://en.wikipedia.org/wiki/Ray_Kurzweil', 'Ray Kurzweil'],
    ['https://en.wikipedia.org/wiki/Marios_Kyriazis', 'Marios Kyriazis'],
    ['https://en.wikipedia.org/wiki/Aubrey_de_Grey', 'Aubrey de Grey'],
    ['https://en.wikipedia.org/wiki/Extropianism', 'Extropia / Extropianism'],
    ['https://en.wikipedia.org/wiki/Self-experimentation', 'Self-experimentation'],
    ['https://en.wikipedia.org/wiki/Psychonautics', 'Psychonautics'],
    ['https://en.wikipedia.org/wiki/Mind_machine', 'Mind Machine'],
    ['https://en.wikipedia.org/wiki/Brainwave_entrainment', 'Brainwave entrainment'],
    ['https://en.wikipedia.org/wiki/Senolytic', 'Senolytics']
  ].reduce((a, i) => a + `<li><a href="${i[0]}" target="_blank">${i[1]}</a></li>`, '')
  $('<div/>', {
    css: {
      margin: '0 auto',
      padding: '8px',
      width: '50%'
    }
  }).append(`<h2>Hints</h2>
  <div>
    on the probably soon-to-come immortality.
    <p>
      The approach taken here is that, through successive life extension breakthroughs,
      our bodies may reach the historical period in which technological immortality is attained.
    </p>
    <p>
      The <b>Œternum</b> initiative is dedicated to providing mechanisms for
      improving the chances of attaining immortality:
      the individual may expand s/he's lifespan and the society may be more effective in developing the technologies.
    </p>
    <p>Breakthroughs:
<ul>${itemsB}</ul>
    </p>
    <p>Initiatives (preliminary list):
<ul>${items}</ul>
    </p>
    <p>Relevant Wikipedia articles:
<ul>${itemsW}</ul>
    </p>
    <p>
    Further keywords: hallmarks of aging, rejuvenation biotechnology, 
  </div>
  `).appendTo('body')
}

e.accounts = () => {
  $('body').css('background-color', '#aaaaaa')
  // $("<style type='text/css'> .rcol { border-left: 1px solid #000000 ; margin-left: 3%; padding-left: 3%; } </style>").appendTo('head')
  const grid = utils.mkGrid(2, 'body', '70%', '#ffffff')
    .append($('<span/>').html('<b>github</b>'))
    .append($('<span/>', { class: 'rcol' }).html('<b>gmail prefix</b>'))
  const items = [
    ['aeterni', 'aeterni.anima'],
    ['s1te', 'wowsitewow'],
    ['l4bs', 'entrainment.l4bs'],
    ['f466r1', 'f466r1'],
    ['extropia', 'extropia.extropia'],
    ['theopoesis', 'theopoesis.path'],
    ['divinization', 'divinization.path'],
    ['worldhealing', 'sync.aquarium'],
    ['markturian', 'markarcturian'],
    ['five-and-seven', 'five.and.seven.publishing'],
    ['litteratura', 'litteratura.publishing']
  ]
  items.forEach(i => {
    grid.append($('<span/>').html(i[0]))
    grid.append($('<span/>', { class: 'rcol' }).html(i[1]))
  })
  $('<div/>', {
    css: {
      margin: '0 auto',
      padding: '8px',
      width: '50%'
    }
  }).append('<h2>Partners</h2>')
    .append(grid)
    .appendTo('body')
}
