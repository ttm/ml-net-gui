const PIXI = require('pixi.js')
const forceAtlas2 = require('graphology-layout-forceatlas2')

const t = require('tone')
const $ = require('jquery')
window.jQuery = $
require('paginationjs')
const linkify = require('linkifyjs/html')

const m = require('./med')
const monk = require('./monk')
const maestro = require('./maestro.js')
const net = require('./net.js')
const utils = require('./utils.js')
const transfer = require('./transfer.js')
const u = require('./router.js').urlArgument

const e = module.exports
const a = utils.defaultArg
require('@fortawesome/fontawesome-free/js/all.js')

e.rtest = () => console.log('router working!')
e.sytest = () => {
  const sy = new t.MembraneSynth().toDestination()
  const dat = require('dat.gui')
  // const gui = new dat.GUI({ closed: true, closeOnTop: true })
  const gui = new dat.GUI()
  const param = gui.add({ freq: 500 }, 'freq', 50, 1000).listen()
  const vol = gui.add({ vol: 0 }, 'vol', -100, 30).listen()
  window.sy = sy
  const st = 2 ** (1 / 12)
  const tt = 0.1
  const ttt = tt / 2
  vol.onFinishChange(v => {
    sy.volume.value = v
  })
  function mkSound () {
    const now = t.now()
    sy.triggerAttackRelease(vv, ttt, now)
    sy.triggerAttackRelease(vv * (st ** 3), ttt, now + tt)
    sy.triggerAttackRelease(vv * (st ** 7), ttt, now + 2 * tt)

    sy.triggerAttackRelease(vv * (st ** 4), ttt, now + 3 * tt)
    sy.triggerAttackRelease(vv * (st ** 8), ttt, now + 4 * tt)
    sy.triggerAttackRelease(vv * (st ** 11), ttt, now + 5 * tt)
  }
  let vv = 500
  param.onFinishChange(v => {
    vv = v
    // t.start(0)
    // t.Master.mute = false
    mkSound()
  })
  $('<input/>', {
    type: 'checkbox'
  }).appendTo('body').change(function () {
    if (this.checked) {
      t.start()
      t.Master.mute = false
    }
  })
  $('#loading').hide()
}
e.ttest = () => {
  const synth = maestro.mkOsc(u('l') || 400, -200, -1, 'sine')
  const synth2 = maestro.mkOsc(u('r') || 410, -200, 1, 'sine')
  // const mod = maestro.mkOsc(u('o') || 0.1, 46.02, 0, 'sine', true)
  const mod_ = maestro.mkOsc(u('o') || 0.1, 0, 0, 'sine', true)
  const mul = new t.Multiply(0)
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
  $('#loading').hide()
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
  $('<link/>', {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'
  }).appendTo('head')
  const flatpickr = require('flatpickr')

  const grid = utils.mkGrid(2)
  const gd = () => utils.gridDivider(0, 160, 0, grid)

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
      $('#baseModel').val(e.model || '0')
      if (e.model === '1') {
        mf0.val(e.mf0)
        mf0.show()
        mf0_.show()
        waveformM.show()
        waveformM_.show()
      } else {
        mf0.hide()
        mf0_.hide()
        waveformM.hide()
        waveformM_.hide()
      }
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
      $('#waveformL').val(e.waveformL || 'sine')
      $('#waveformR').val(e.waveformR || 'sine')
      $('#waveformM').val(e.waveformM || 'sine')
      if (e.panOsc === undefined) e.panOsc = '0'
      $('#panOsc').val(e.panOsc)
      panOscPeriod.val(a(e.panOscPeriod, ''))
      panOscPeriod.attr('disabled', e.panOsc < 2)
      panOscTrans.val(a(e.panOscTrans, ''))
      panOscTrans.attr('disabled', e.panOsc < 3)

      e.soundSample = e.soundSample || -1
      $('#soundSample').val(e.soundSample)
      soundSampleVolume.val(a(e.soundSampleVolume, ''))
      soundSampleVolume.attr('disabled', e.soundSample < 0)
      soundSamplePeriod.val(a(e.soundSamplePeriod, ''))
      soundSamplePeriod.attr('disabled', e.soundSample < 0)
      soundSampleStart.val(a(e.soundSampleStart, ''))
      soundSampleStart.attr('disabled', e.soundSample < 0)

      lemniscate.prop('checked', e.lemniscate || false)
      vcontrol.prop('checked', e.vcontrol || false)
      communionSchedule.prop('checked', e.communionSchedule || false)

      centerC.html(e.lemniscate ? 'left circ color:' : 'center circ color:')
      lateralC.html(e.lemniscate ? 'right circ color:' : 'lateral circ color:')
    })
  transfer.findAll({ meditation: { $exists: true } }).then(r => {
    window.allthem2 = r
    r.forEach((i, ii) => {
      s.append($('<option/>', { class: 'pres' }).val(ii).html(i.meditation))
      $('#loading').hide()
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
      obutton.attr('disabled', true).html('Open')
      $('.pres').remove()
      window.allthem2.forEach((i, ii) => {
        s.append($('<option/>', { class: 'pres' }).val(ii).html(i.meditation))
      })
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

  $('<span/>').html('total duration:').appendTo(grid)
  const d = $('<input/>', {
    placeholder: 'in seconds (0 if forever)'
  }).appendTo(grid)
    .attr('title', 'Duration of the meditation in seconds.')

  $('<span/>').html('model:').appendTo(grid)
  const model = $('<select/>', { id: 'baseModel' }).appendTo(grid)
    .append($('<option/>').val(0).html('model 1 - coupled binaural and Martigli'))
    .append($('<option/>').val(1).html('model 2 - decoupled binaural and Martigli'))
    .attr('title', 'Base audiovidual model.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      console.log(ii)
      if (ii === '0') {
        mf0.hide()
        mf0_.hide()
        waveformM.hide()
        waveformM_.hide()
      } else {
        mf0.show()
        mf0_.show()
        waveformM.show()
        waveformM_.show()
      }
    })
  window.model = model

  gd()

  $('<span/>').html('freq left:').appendTo(grid)
  const fl = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the left channel.')

  $('<span/>').html('waveform left:').appendTo(grid)
  const waveformL = $('<select/>', { id: 'waveformL' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))

  $('<span/>').html('freq right:').appendTo(grid)
  const fr = $('<input/>', {
    placeholder: 'freq in Herz'
  }).appendTo(grid)
    .attr('title', 'Frequency on the right channel.')

  $('<span/>').html('waveform right:').appendTo(grid)
  const waveformR = $('<select/>', { id: 'waveformR' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))

  gd()

  const mf0_ = $('<span/>').html('Martigli carrier frequency:').appendTo(grid).hide()
    .css('background', '#D9FF99')
  const mf0 = $('<input/>', {
    placeholder: 'in Herz'
  }).appendTo(grid)
    .attr('title', 'carrier frequency for the Martigli Oscillation.')
    .hide()
  const waveformM_ = $('<span/>').html('Martigli carrier waveform:').appendTo(grid).hide()
    .css('background', '#D9FF99')
  const waveformM = $('<select/>', { id: 'waveformM' }).appendTo(grid)
    .append($('<option/>').val('sine').html('sine'))
    .append($('<option/>').val('triangle').html('triangle'))
    .append($('<option/>').val('square').html('square'))
    .append($('<option/>').val('sawtooth').html('sawtooth'))
    .hide()

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

  gd()

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
      panOscTrans.attr('disabled', ii < 3)
    })

  $('<span/>').html('pan oscillation period:').appendTo(grid)
  const panOscPeriod = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the pan oscillation in seconds.')
    .attr('disabled', true)

  $('<span/>').html('pan oscillation crossfade:').appendTo(grid)
  const panOscTrans = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'Duration of the pan crossfade (half the pan oscillation period or less).')
    .attr('disabled', true)

  gd()

  $('<span/>').html('sound sample:').appendTo(grid)
  const soundSample = $('<select/>', { id: 'soundSample' }).appendTo(grid)
    .append($('<option/>').val(-1).html('none'))
    .attr('title', 'Sound sample to be played continuously.')
    .on('change', aself => {
      const ii = aself.currentTarget.value
      soundSampleVolume.attr('disabled', ii < 0)
      soundSamplePeriod.attr('disabled', ii < 0)
      soundSampleStart.attr('disabled', ii < 0)
    })

  maestro.sounds.forEach((s, ii) => {
    soundSample.append($('<option/>').val(ii).html(`${s.name}, ${s.duration}s`))
  })

  $('<span/>').html('sample volume:').appendTo(grid)
  const soundSampleVolume = $('<input/>', {
    placeholder: 'in decibels',
    value: '-6'
  }).appendTo(grid)
    .attr('title', 'relative volume of the sound sample.')
    .attr('disabled', true)

  $('<span/>').html('sample repetition period:').appendTo(grid)
  const soundSamplePeriod = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'period between repetitions of the sound.')
    .attr('disabled', true)

  $('<span/>').html('sample starting time:').appendTo(grid)
  const soundSampleStart = $('<input/>', {
    placeholder: 'in seconds'
  }).appendTo(grid)
    .attr('title', 'time for the first incidence of the sound.')
    .attr('disabled', true)

  gd()

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

  gd()

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

  gd()

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

  $('<span/>').html('volume control:').appendTo(grid)
  const vcontrol = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Enables volume control widget if checked.')

  $('<span/>').html('<a target="_blank" href="?communion">communion schedule</a>:').appendTo(grid)
  const communionSchedule = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)
    .attr('title', 'Is this meeting to be put on the communion meetings table?')

  const f = v => parseFloat(v.val())
  $('<button/>')
    .attr('title', 'Create the meditation with the settings defined.')
    .html('Create')
    .click(() => {
      console.log('the date:', mfp.selectedDates[0])
      console.log('the id:', mdiv.val() === '')
      const mdict = {
        fl: f(fl),
        fr: f(fr),
        mp0: f(mp0),
        mp1: f(mp1),
        ma: f(ma),
        md: f(md),
        d: f(d)
      }
      if (model.val() === '1') {
        mdict.mf0 = f(mf0)
      }
      for (const key in mdict) {
        if (isNaN(mdict[key])) {
          window.alert(`define the value for ${key}.`)
          return
        }
      }

      if (model.val() === '0' && mdict.ma > Math.min(mdict.fl, mdict.fr)) {
        if (!window.confirm('Martigli amplitude is greater than binaural frequencies. Are you shure?')) return
      }

      mdict.model = model.val()

      mdict.waveformL = waveformL.val()
      mdict.waveformR = waveformR.val()
      if (mdict.model === '1') {
        mdict.waveformM = waveformM.val()
        if (mdict.ma > mdict.mf0) {
          if (!window.confirm('Martigli amplitude is greater than Martigli carrier frequency. Are you shure?')) return
        }
      }

      mdict.panOsc = panOsc.val()
      if (mdict.panOsc > 1) {
        const oPeriod = f(panOscPeriod)
        if (isNaN(oPeriod)) {
          window.alert('define the value for the pan oscillation period.')
          return
        }
        mdict.panOscPeriod = oPeriod
        if (mdict.panOsc === '3') {
          const oTrans = f(panOscTrans)
          if (isNaN(oTrans)) {
            window.alert('define the value for the pan crossfade.')
            return
          }
          if (oPeriod < 2 * oTrans) {
            window.alert('duration of the pan oscillation has to be at least twice that of the pan crossfade:')
            return
          }
          mdict.panOscTrans = oTrans
        }
      }
      mdict.soundSample = soundSample.val()
      if (mdict.soundSample >= 0) {
        const oVolume = f(soundSampleVolume)
        if (isNaN(oVolume)) {
          window.alert('define the volume for the sound sample.')
          return
        }
        mdict.soundSampleVolume = oVolume
        const oPeriod = f(soundSamplePeriod)
        if (isNaN(oPeriod)) {
          window.alert('define the period for the sample repetition.')
          return
        }
        if (oPeriod !== 0 && oPeriod < maestro.sounds[mdict.soundSample].duration) {
          window.alert('define a repetition period which is greater than the samples\' duration or 0 (for looping).')
        }
        mdict.soundSamplePeriod = oPeriod
        const oStart = f(soundSampleStart)
        if (isNaN(oStart) || oStart < 0) {
          window.alert('define a zero or positive starting time for the sample')
        }
        mdict.soundSampleStart = oStart
      }
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
      mdict.vcontrol = vcontrol.prop('checked')
      mdict.lemniscate = lemniscate.prop('checked')
      mdict.communionSchedule = communionSchedule.prop('checked')
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
      window.open(`?_${mdiv.val()}`)
    })
    .appendTo(grid)
    .attr('disabled', true)
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
  skull screening: ${linkL('?binauralMeta&l=400.1&r=400&o=2&a=200&g=0.01')}
  </li>
  <li>
  skull screening 2: ${linkL('?binauralMeta&l=400.2&r=400&o=0.5&a=50&g=0.01')}
  </li>
  <li>
  concentration sweep: ${linkL('?binauralMeta&l=400&r=415&o=0.01&a=200&g=0.01')}
  </li>
  <li>
  concentration sweep2: ${linkL('?binauralMeta&l=400&r=410&o=0.01&a=200&g=0.01')}
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
  // $('<div/>', {
  //   css: {
  //     margin: '0 auto',
  //     padding: '8px',
  //     width: '50%'
  //   }
  // }).appendTo('body').html(`
  const adiv = utils.stdDiv().html(`
  <h2>Communions</h2>

  <p>We have daily meetings around 6h, 12h, and 18h (GMT-3).
  In them we concentrate for Humanity's
  well-being, and by extension also for World and Cosmic well-being.
  </p>

  <p>The intended outline:
  <ul>
    <li>10 minutes to gather, talk, agree on the mentalization subject and preparations in general.</li>
    <li>15 minutes to concentrate/meditate, with breathing and brainwaves synchronized through the online gadgets linked below. Thus <b>anyone that arrives late misses the meditation</b>.</li>
    <li>5 minutes for final words and considerations and farewells.</li>
  </ul>
  </p>

  <p>Join us at <a target="_blank" href="https://meet.google.com/bkr-vzhw-zfc">our video conference</a></a>.</p>
  `)
  const l = t => `<a href="?_${t}" target="_blank">${t.replace(/^_+/, '')}</a>`
  const grid = utils.mkGrid(1, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>when</b>&nbsp;&nbsp; (GMT-0)&nbsp : <b>subject</b>').appendTo(grid)
  // $('<span/>').html('<b>subject</b>').appendTo(grid)
  // $('<span/>').html('').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid)
  transfer.findAll({ communionSchedule: true }).then(r => {
    window.myr = r
    r.sort((a, b) => b.dateTime - a.dateTime)
    r.forEach(e => {
      const adate = (new Date(e.dateTime - 60 * 10 * 1000)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      console.log(adate)
      // $('<span/>').text(adate).appendTo(grid)
      // $('<span/>').html(l(e.meditation)).appendTo(grid)
      $('<span/>', { css: { 'margin-left': '10%' } }).html(`${adate}: ${l(e.meditation)}`).appendTo(grid)
      // $('<span/>').html(l(e.meditation)).appendTo(grid)
    })
    $('<span/>', { css: { 'margin-left': '10%' } }).html('December 1st, 6h: health (for one\'s self, loved ones, people in need, all humanity)').appendTo(grid)
    // $('<span/>').html('health (for one\'s self, loved ones,<br>people in need, all humanity)').appendTo(grid)
    $('#loading').hide()
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
  $('#loading').hide()
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

e.sampler = () => {
  const player = new t.Player('assets/audio/boom.mp3').toDestination()
  window.ppp = player
  // play as soon as the buffer is loaded
  // player.autostart = true
  const grid = utils.mkGrid(2)
  const vonoff = $('<div/>', { id: 'vonoff' }).appendTo(grid).text('Stopped')
  // t.stop()
  $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid).change(function () {
    if (this.checked) {
      t.context.resume()
      t.start()
      player.start()
      t.Master.mute = false
      vonoff.text('Playing')
    } else {
      vonoff.text('Stopped')
    }
  })
}

e.tgui = () => {
  const dat = require('dat.gui')
  const gui = new dat.GUI({ name: 'My Banana', closed: true, closeOnTop: true })
  const master = gui.add({ master: 50 }, 'master', 0, 100).listen()
  const binaural = gui.add({ binaural: 50 }, 'binaural', 0, 100).listen()
  const sample = gui.add({ sample: 50 }, 'sample', 0, 100).listen()
  master.onChange(v => console.log(v, 'CHANGED'))
  binaural.onChange(v => console.log(v, 'CHANGED'))
  sample.onChange(v => console.log(v, 'CHANGED'))
  window.agui = gui
  $('.close-top').text('Open Volume Controls')
  let i = 0
  $('.close-top').click(function () {
    console.log(this, 'yeah2')
    this.textContent = `${i++ % 2 === 0 ? 'Close' : 'Open'} Volume Controls`
    window.ttt = this
  })
}

const link = (text, path) => {
  const ua = window.wand.router.urlArgument
  const lflag = ua('lang') ? `&lang=${ua('lang')}` : ''
  return `<a href="?${path + lflag}">${text}</a>`
}

e.angel = () => {
  const items = [
    `the ${link('Paypal inlet', 'paypal')}; or`,
    `the ${link('Pagseguro inlet', 'pagseguro')}; or`,
    `the ${link('Bitcoin inlet', 'bitcoin')}.`
  ].reduce((a, t) => a + `<li>${t}</li>`, '')

  utils.stdDiv().html(`
  <h2>Aid <b>Æeterni Anima</b></h2>
  <p>
  Please send us feedback on your experience with <b>Æeterni</b> and ideas for enhancements or derivatives, join the coordination, creation and tech tasks, donate through:
  </p>

  ${items}
  <br/>
  <p>
  Write us for a direct bank transfer,
  to help us include other e-coins such as Ethereum,
  and whatnot.
  </p>
  <p>
  Get in touch through <a href="mailto:aeterni.anima@gmail.com" target="_blank">our email</a>.
  </p>
  <p>
  Thank you.
  </p>
    `
  ).appendTo('body')
  $('canvas').hide()
  $('#loading').hide()
}

e.welcome = () => {
  utils.stdDiv().html(`
  <h2>Welcome</h2>

  <p>
  We are glad you are taking time to visit this site.
  </p>
  <p>
  Please visit the links below to enjoy and reinforce the
  <b>Æterni</b> initiatives.
  </p>
  <p>
  They are fostered to be useful to each individual, group and the Cosmos.
  </p>

  `)
  $('#loading').hide()
}

e.about = () => {
  utils.stdDiv().html(`
  <h2>About</h2>

  <p>
  <b>Æterni Anima</b> started in December 2020 to boost longevity and advance the dawning of human immortality.
  </p>
  <p>
  Previous efforts are being consolidated herein:
  <ul>
  <li>audiovisual artifacts for mentalization / meditation / manifestation;</li>
  <li>social coordination mechanisms;</li>
  <li>press (text publisher).</li>
  </ul>
  </p>

  `)
  $('#loading').hide()
}

e.monk = () => {
  const adiv = $('<div/>', {
    css: {
      'background-color': '#c2F6c3',
      padding: '20%',
      margin: '0 auto',
      width: '30%'
    }
  }).appendTo('body')
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

  let tossed = false
  let el
  const but = $('<button/>').html('toss').click(() => {
    if (!tossed) {
      el = utils.chooseUnique(monk.biblePt, 1)[0]
      div.html(`<b>${el.ref}</b>`)
      div2.html('')
      but.html('show')
      tossed = true
    } else {
      div2.html(el.text)
      but.html('toss again')
      tossed = false
    }
  }).appendTo(grid).attr('disabled', true)
  $('<button/>').html('portal').click(() => {
    div.html('')
    div2.html(`
    O que tenho, isto lhe dou:
    Corpo de Luz, em nome de Jesus, o Nazareno, brilhe!
    Em nome de Jesus, o Nazareno, desperte!
    Em  nome de Jesus, o Nazareno, ame!
    Em  nome de Jesus, o Nazareno, ande!
    Em  nome de Jesus, o Nazareno, cresça!
    Em  nome de Jesus, o Nazareno, abençoe e salve todo o planeta!
    
    :::`.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  $('<button/>').html('temas').click(() => {
    div.html('')
    div2.html(`
    Temas principais: cura, saúde, silêncio, Espírito Santo, Paz, Luz, rejuvenescimento, imortalidade, ressureição.
    `)
  }).appendTo(grid)
  $('<button/>').html('segunda').click(() => {
    div.html('')
    div2.html(`
    Segunda-feira é dia de experimentação: fazer sessão com leitura ou escrita, com copo de água, com vela, sem ritmo de respiração, sessão mais longa ou extra, etc.
    `)
  }).appendTo(grid)
  $('<button/>').html('terça').click(() => {
    div.html('')
    div2.html(`
    Terça-feira é o dia em que assumimos as lutas e caminhamos para as conquistas. O principal é orarmos para termos nitidez de nossas batalhas e para termos auxílio nelas. Também o momento de manifestarmos atitudes: escrevermos para amigos, buscarmos novas pessoas/expandir o corpo de Luz, mudarmos nossas atitudes. Por exemplo, podemos reassumir o compromisso de exortarmos as pessoas no nosso entorno, ou visitarmos amigos em nossas redes sociais para reagirmos a algumas fotos e mandarmos um oi.
    `)
  }).appendTo(grid)
  $('<button/>').html('quarta').click(() => {
    div.html('')
    div2.html(`
    Quarta-feira é o dia em que nos avaliamos e relatoriamos. Como tem sido sua experiência com as sessões? O que você planeja conseguir com as sessões? Escreva um depoimento se estiver já usufruindo. Peça o suporte dos colegas se ainda não estiver vibrando no Corpo de Luz. Paz. Direções para mentoria, tutoriais, canais (do whats, por exemplo) para suporte.
    `)
  }).appendTo(grid)
  $('<button/>').html('quinta').click(() => {
    div.html('')
    div2.html(`
    Quinta-feira é o dia em que lembramos dos que não estão conosco. Convidem-os para estar com vocês ou este grupo. Paz.
    `)
  }).appendTo(grid)
  $('<button/>').html('sexta').click(() => {
    div.html('')
    div2.html(`
    Sexta é dia de confraternização. Alguma mensagem mais descontraída, agradecendo pela companhia durante a semana, e avisando que paramos durante o final de semana mas voltamos com as 4 sessões na segunda-feira.
    Tentar também fazer algum encontro online ou ficar em uma sala aberta ou fazer uma ocasião de alguma forma.
    `.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  $('<button/>').html('relato').click(() => {
    div.html('')
    div2.html(`
É um bom momento p ter um relato, mesmo q pequeno, sobre como tem sido as sessões para você:
se tem ajudado e de que forma.
Se vc quiser/puder escrever, pode mandar no grupo (tanto do facebook quanto do whatsapp) ou aqui no chat.
Lógico, não se preocupe com isso, é apenas se vc quiser e é uma super boa contribuição que dá à iniciativa.
    `.replace(/\n/g, '<br>')
    )
  }).appendTo(grid)
  const div = $('<div/>').appendTo(adiv)
  const div2 = $('<div/>').appendTo(adiv)
  $('#loading').hide()
  monk.verses().then(() => {
    but.attr('disabled', false)
  })
}

e.paypal = () => {
  utils.stdDiv().html(`
  <h2>Donate using Paypal</h2>

  <p>
  To transfer any amount, click on the following image:
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
    <img alt="" border="0" src="https://www.paypal.com/pt_BR/i/scr/pixel.gif" width="1" height="1" />
  </form>
  </p>

  <p>
  Or use the following QR code:
  <p>
  <img src="assets/donation/qrPaypal.png" alt="QR Code for donating through Paypal">
  </p>
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.pagseguro = () => {
  utils.stdDiv().html(`
  <h2>Donate using Pagseguro</h2>

  <p>
  Click on the following image to transfer any amount:
  <!-- INICIO FORMULARIO BOTAO PAGSEGURO -->
  <form action="https://pagseguro.uol.com.br/checkout/v2/donation.html" method="post">
  <!-- NÃO EDITE OS COMANDOS DAS LINHAS ABAIXO -->
  <input type="hidden" name="currency" value="BRL" />
  <input type="hidden" name="receiverEmail" value="renato.fabbri@gmail.com" />
  <input type="hidden" name="iot" value="button" />
  <input type="image" src="https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-assina.gif" name="submit" alt="Pague com PagSeguro - é rápido, grátis e seguro!" />
  </form>
  <!-- FINAL FORMULARIO BOTAO PAGSEGURO -->
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  <h2>Donate using Bitcoins</h2>

  <p>Transfer any amount of bitcoins to the wallet in the address:
  <b>bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd</b>
  </p>

  <p>
  <p>
  Or use the QR Code:
  </p>
  <img src="assets/donation/qrBitcoin.png" alt="QR Code for donating using the Bitcoin Wallet">
  </p>

  <br>
  `)
  $('#loading').hide()
}

e.bitcoin = () => {
  utils.stdDiv().html(`
  <h2>Donate using Bitcoins</h2>

  <p>Transfer any amount of bitcoins to the wallet in the address:
  <b>bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd</b>
  </p>

  <p>
  <p>
  Or use the QR Code:
  </p>
  <img src="assets/donation/qrBitcoin.png" alt="QR Code for donating using the Bitcoin Wallet">
  </p>

  <br>
  `)
  $('#loading').hide()
}

e['000-preparation'] = () => {
  utils.stdDiv().html(`
  <h2>on the consequences of longevity</h2>

  <p>
  Among 2020's highlights are some advances in anti-aging.
  In fact, it is now somewhat more reasonable to expect that at least a fraction of the population
  that survive the next few decades will live to at least a few hundred years.
  </p>

  <p>
  But what does that mean for Humanity?
  Does that imply that soon we will be a bit alleviated from the harsh ephemerality of life?
  Or will the near future bring extreme inequality and sectarianism?
  </p>

  <p>
  It probably depends on how well we are to prepare for such extended lifespan advent.
  If we do enhance our ability to collaborate, employ our capacities and time wisely,
  bring the disabled into better conditions, preserve and restore Nature,
  we might see the brightest of the possibilities.
  On the other hand...
  </p>

  <p>
Thu Dec 31 11:17:02 -03 2020
  </p>
  <br>
  `)
  $('#loading').hide()
}

e['001-first-week'] = () => {
  utils.stdDiv().html(`
  <h2>Primeira semana de MMM</h2>

  <p>
  </p>

  <p>
  </p>

  <p>
  </p>

  <p>
Thu Dec 31 11:17:02 -03 2020
  </p>
  <br>
  `)
  $('#loading').hide()
}

e['001-first-week'] = () => {
  utils.stdDiv().html(`
  <h2>Primeira semana de MMM</h2>

  <p>
  Esta foi a primeira semana em que abrimos a participação no MMM para pessoas além das iniciadoras (Renato e Otávio).
  </p>

  <p>
  Começamos na segunda-feira com 4 novas pessoas agendadas, para experimentarmos nós e elas a prática e ver o que aconteceria.
  Uma delas estava de fato em uma situação complicada, já as outras 3 marcaram uma segunda sessão para o dia seguinte, quando tivemos 2 novas pessoas.
  </p>

  <p>
  Este ritmo de novas pessoas e adesão se seguiu pela semana toda,
  o que resultou diariamente em jornadas longas e muitos novos entendimentos
  que recebemos em cada sessão.
  </p>

  <p>
  No geral, as pessoas relataram gostar da prática e proveito quanto ao bem-estar e obtenção de novos entendimentos.
  Percebemos que cuidar desta linha de ação requeriu e irá requerer dedicação contínua e praticamente exclusiva.
  Portanto, consideramos importante para manter a linha de ação:
  <ul>
  <li>
    minimizar o tempo das sessões. Tanto para que os iniciados quando os novatos possam manter as sessões com continuidade.
  </li>
  <li>
    formar novos participantes capazes de conduzir as sessões.
  </li>
  <li>
    estabelecer os períodos diários em que estaremos disponíveis para as sessões.
  </li>
  </ul>
  </p>

  <p>
    Considerações finais de balanço:
    <ul>
    <li>
      Finalizamos a semana com 5 reuniões, mais do que começamos, embora não tivéssemos buscado novas pessoas durante a semana.
    </li>
    <li>
     A última reunião teve 8 pessoas, sobre o tema "verdade", foi fortíssima (no melhor dos sentidos).
    </li>
    <li>
      Uma participante foi considerada já em condições de receber um material mais aprofundado sobre os procedimentos da prática e poderá atuar já como condutora.
    </li>
    <li>
      A condução da sessão ficou já definida e talvez permaneça como está por algum tempo.
    </li>
    <li>
      Recebemos novos entendimentos a cada sessão e tivemos melhoras de bem-estar.
    </li>
    <li>
      Iniciaremos a próxima semana já com participantes embora não tenhamos buscado novas pessoas.
    </li>
    </ul>
  </p>
  <p>
Thu Dec 31 11:17:02 -03 2020
  </p>
  <br>
  `)
  $('#loading').hide()
}

e['t016-Brianna-Mauricio'] = () => {
  utils.stdDiv().html(`
  <h2>Brianna, após as primeiras semanas</h2>
Antes das sessões eu estava muito ansiosa.
Hoje em dia, eu acredito mais em mim.
É como se eu tivesse uma força interior que eu não sabia que tinha.
Agora não estava conseguindo dormi bem.
Estava tendo sono partido, acordava de hora em hora, já fazendo as sessões.
Agora está melhorando mais.
  
  <b>Brianna Mauricio, 22/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t015-Marcus-Vinicius'] = () => {
  utils.stdDiv().html(`
  <h2>Marcus, após os primeiros dias</h2>

  Desde que iniciei as sessões,
  estou conseguindo aos poucos largar o tabagismo
  e também não estou mais tomando remédios para conseguir dormir.

  Namastê
  
  <b>Marcus Vinicius Ferraz, 22/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t014-Janira-Karoline'] = () => {
  utils.stdDiv().html(`
  <h2>Janira, após as primeiras sessões</h2>
  A sessão de ontem Espírito Santo eu senti muita felicidade.
  1 hora depois da sessão minha família me ligou, meu sobrinho,
  minha mãe, pai, irmã e tivemos conversas super edificante.
  Parecia que todos estavam envoltos  pela Luz do Espírito Santo.

  Parecia que a minha mente estava em busca de coisas belas.
  Por conseguinte, eu encontrei uma melodia linda e compartilhei com meu pai.
  
  <b>Janira Karoline, 21/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t013-Renato-Huss'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, após primeira ou primeiras semanas</h2>
  Tenho sentido uma melhora no meu estado psicólogo, no sentido da atenção, do foco e principalmente no aspecto emocional.
  Simplesmente minha ansiedade desapareceu.
  Não tive mais vontade de beber.

  Ainda não sei do que se trata, mas tenho gostado de verdade.

  Sinto que estou as conectado, como se conduzido por uma energia positiva.

  <b>Renato S'Huss, 15/abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t012-Marcos'] = () => {
  utils.stdDiv().html(`
  <h2>Marcos, após aprox. 3 semanas</h2>
Estou vivendo uma experiência nova fazendo meditações através e um artefato visual e sons relaxante,
está me fazendo muito bem, tenho controlado mais minhas ansiedades e respiração mantendo meu corpo saudável,
tenho feito todos os dias, a diferença que eu senti foi significante para minha saúde,
e poder a cada dia me sentir melhor para prosseguir com as tarefas cotidianas,
a cada dia que passa me sinto capaz de realizar conquistas em minha vida graças a meditação.

<b>Marcos Pino Arroyo, 12/abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t011-Mariel'] = () => {
  utils.stdDiv().html(`
  <h2>Mariel, após quase 1 mês e meio</h2>
  Cumpro quarenta dias fazendo as sessões  com o Artefato,
  o tempo todo Renato e Otavio me acolheram e seguiram minha evolução
  (melhora na saúde física, estabilidade psicológica e participação  no grupo AAA e Corpo de Luz).
  Para minha completa cura e crescimento espiritual, estou tentando participar ativamente,  ajudar nas sessões,
  conversar com as pessoas de maneira tímida ainda pela limitação do idioma.
  Meu atuar na elaboração das sessões me esta ajudando com a pratica da ortografia da língua portuguesa,
  além de sentir que estou seguindo no rumo de minha vocação existencial.
  Reitero minha gratitude Renato e Otavio pela paciência e dedicação comigo.
  Não tenho duvida que pela Graça  Divina me guio até vosso Projeto de Luz.

<b>Mariel Elizabeth, 05/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t010-Otavio'] = () => {
  utils.stdDiv().html(`
  <h2>Otávio, após 4 meses</h2>
Antes de começar a meditar, sentia uma necessidade muito grande de cobrar da vida:
cobrar atenção de namorados amigos e familiares, cobrar da comida que fosse gostosa,
cobrar das diversões que fossem divertidas, cobrar dos meus superiores que não fossem chatos,
e cobrar de mim certas conquistas.
Mas nem sempre obtinha sucesso, e às vezes a angústia era forte, e eu ficava sem recursos para me ajudar.
Depois, com a meditação, passei a cobrar menos de vida, e a enxergá-la com mais abertura.
Passei a encarar meus objetivos com mais alegria e menos gravidade.
Quando necessário, ficou mais fácil transformar meus planos.
E ganhei mais objetividade para encará-los.

<b>Otávio Martigli, 05/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t009-rfabbri'] = () => {
  const desafios = [
    'escrever as mensagens antes sobre o tema e depois relatando',
    'Manutenção: colher depoimentos, convidar pessoas para os grupos, responder às mensagens nos grupos',
    'formar pessoas para cuidarem dos grupos (criar sessões, dar suporte)'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const dep = [
    ['Lola', 't007-Lola'],
    ['Renato S\'Huss', 't008-Renato-Huss'],
    ['Edu', 't006-Edu'],
    ['Lisiane', 't005-Lisiane']
  ].map(i => `<a href="?${i[1]}">${i[0]}</a>`).join(', ')
  const feitos = [
    'criamos perguntas e regras para entrarem no grupo',
    'tivemos criação consistente das sessões utilizando templates sonoros e uma interface que comporta usuários criados (mkLight)',
    'tivemos a participação substancial de uma nova pessoa (a Mariel) na manutenção das sessões',
    'foi feito <a href="https://www.youtube.com/watch?v=LxpS1aVcofI">vídeo explicativo para participação das sessões</a> (pelo Otávio)',
    'criamos e populamos o <a href="https://chat.whatsapp.com/BztLyvWDEgW3C1mjXZTTrP">grupo para suporte no Whatsapp</a>',
    `colhemos diversos depoimentos novos (${dep})`
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  utils.stdDiv().html(`
  <h2>Renato, 3 meses depois</h2>
Tenho tido bastante revelação nas sessões e estabilidade na motivação e dedicação.
Tenho também recebido relatos generalizados de melhoras de quadros de saúde física e mental: ansiedade, depressão, dores musculares, dor de cabeça e enxaqueca, respiração melhorada. Também vários relatos de experiências místicas: extracorpóreas, sonhos com parentes falescidos, visões, etc.

Tivemos uma semana bem boa. Além de crescimento de mais de 25% do grupo AAA,  finalmente:
<ul>${feitos}</ul>
Estive toda semana ficando doente na quarta ou quinta-feira.
Esta semana não fiquei doente (acho que graças ao reforço da Mariel na criação das sessões), mas dormi muito na quinta e sexta.
Entendi que estou passando dos limites do meu corpo, portanto ficarei atento e tentarei coisas novas para garantir que eu não esteja me desgastando
e para que eu consiga me dedicar a semana toda de forma mais apropriada.
Desafios atuais:
<ul>${desafios}</ul>
Consegui desenvolver e estabilizar a interface para criação dos artefatos e dos templates, e fiz uma pesquisa sobre potenciais parceiros do ponto de vista acadêmico.

Por fim, acho que seria importante fazermos os relatos semanais de como estamos indo, como estamos entendendo nossas práticas; e tenho concebido fazer vídeos curtos para comunicação com algumas pessoas, em especial com os que estão fazendo acontecer.

<b>Renato Fabbri, 03/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t008-Renato-Huss'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, após poucos dias</h2>
Fantástico, em poucos dias, alcancei uma harmonia e uma paz, que não imaginava conseguir.
Anos de estudo esotérico, não trouxe este resultado.
Grato aos idealizadores e participantes.

<b>Renato S'Huss, 03/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t007-Lola'] = () => {
  utils.stdDiv().html(`
  <h2>Lola, após pouco mais de 1 mês</h2>

  Vou aproveitar p falar do qto sou cética...ver p crer sempre,  fazer o que?

Não busco perfeição,  sou humana, totalmente passiva de erros...quero melhorar, crescer em têrmos de ser.
Bom, tenho feito sessões com os artefatos e com temas variados e, de repente estou conseguindo respirar melhor,
não esse oxigênio que se conhece, mas aquele oxigênio que revigora e renova a alma.
Tenho um temperamento muito forte e ultimamente me pego meio surpresa com a minha "calmaria" ao viver certas situações, sou grata.

Como disse, não busco perfeição e sim aprimoramento e de verdade me sinto confortável aqui.
Desculpa o textão, não consigo ser diferente.
Gratidão Renato,  Adalberto e Otávio por estarem aqui.

<b>Lola Quinto, 02/Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t006-Edu'] = () => {
  utils.stdDiv().html(`
  <h2>Edu, após 2-3 sessões</h2>
As sessões tem me deixado mais calmo, sem a menor dúvida. Espero continuar e melhorar mais.

<b>Edu Viellas, Abril/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t005-Lisiane'] = () => {
  utils.stdDiv().html(`
  <h2>Lisiane, após ~ 3 meses</h2>
Venho aqui fazer um relato sobre a minha experiência com esse lindo trabalho do Renato e Otávio. Comecei a participar desse projeto no mês de janeiro, fazendo diariamente a atividade. Sempre sofri de enxaqueca, mas desde então, curiosamente, não tive mais nenhuma crise 😍.

Esse trabalho está sendo maravilhoso na minha vida, apesar de as vezes eu ter dificuldade de parar para meditar porque tenho um filha de 2 anos e trabalho também em um hospital de Pronto Socorro, devido esse momento de caos na saúde, não está sendo fácil me organizar na vida, além de todo sofrimento emocional por tudo que estou vendo dentro do hospital... mas enfim, procuro tirar ao menos 1x ao dia para realizar a tarefa é quando posso, faço as 4 meditações 💞

Tive mudanças na minha saúde física conforme relatei no início,  além de ter também experiências extra corpórea, contato com antepassados, e também contato com seres que ainda não sei dizer o que são.

Acredite... tenha fé em você, na sua capacidade de se entregar ao trabalho proposto, ppis uma certeza eu tenho: é real, é possível!

Como um pequeno mimo, compartilho com vocês <a href="https://www.facebook.com/lisianefortescanabarro/videos/10216072030674065" target="_blank">essa linda canção das fadas 🦋💐🧚‍♀️🧚‍♂️</a> para que possa tocar o coração e a alma de cada um que aqui se dispõe a fazer a Grande Obra, a verdadeira Arte Real , a mudança interior 💜💙❤.


<b>Lisiane Canabarro, 31/Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t004-Ivone'] = () => {
  utils.stdDiv().html(`
  <h2>Ivonne, após ~1 mês</h2>
... eu estou em tremenda gratidao por vcs tem mellhorado muito meu irmao minha respiracao muito mesmo a gratidao eh imensa.
<b>Ivone Nunes, Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t003-melisabeth'] = () => {
  utils.stdDiv().html(`
  <h2>Mariel, após 2-3 semanas</h2>
Nesta vida tenho muito a agradecer, como sou afortunada. Acredito nos milagres!

Há apenas alguns dias, estava de noite observando as estrelas e clamei por ajuda,
minha vida havia se complicado com problemas e eu não via saída.
Além disso minha saúde física e mental estava deteriorada, estive três vezes no hospital em uma semana.
Recebi uma mensagem de uma pessoa perguntando: "como eu estava?".
Essa pessoa me convidou para participar de um projeto: “formar um corpo de luz” para nos ajudarmos e ajudar a mundo todo.

Eu aceitei, nesses dias minha vida mudou. Minha saúde melhorou notavelmente.
Minha mente não está mais confusa. Meus problemas estão solucionando-se.
Hoje agradeço a Deus pelos seres de luz que chegaram em minha vida, Renato e Otavio, pelo projeto,
pelos tempos e dedicações dos participantes.
Agradeço por todo o bem recebido e a possibilidade de participar ajudando a levar luz e energia positiva a minha família, amigos e a toda a criação.
Agradeço pelo grupo seres maravilhosos que conheci.
Eternamente grata Renato por enxergar minha dor no meio da multidão do Facebook.

<b>Mariel Elisabeth, 07/Março/2021</b>
  `.replace(/\n/g, '<br>')
  )
  $('#loading').hide()
}

e['t002-omartigli'] = () => {
  utils.stdDiv().html(`
  <h2>Otavio, primeira semana</h2>

  <p>
  mais energia, mais pé no chão, certo cansaço, perspectivas positivas, inseguranças, organização da vida, solidez na vida, boas responsabilidades, amor, fé, sutileza, malabarismos de tempo, sono confuso, mais contato, menos silêncio, novos desafios, velhas questões,
  </p>

  <p>
Otavio Martigli,
Sun Jan 10 11:09:40 -03 2021
  </p>
  <br>
  `)
  $('#loading').hide()
}
e['t001-rfabbri'] = () => {
  utils.stdDiv().html(`
  <h2>Renato, primeira semana</h2>

  <p>
  Sendo nossa primeira semana, começamos a desbravar a prática do MMM, as sessões:
  como nos comunicar com os novatos, como conduzir as atividades, quais parametrizações ficam melhor, etc..
  </p>

  <p>
  Logo ao final do primeiro dia ficou nítida a necessidade de (ao menos um pouco de) convenções para os procedimentos, portanto fiquei acordado até de madrugada concebendo o que ficou registrado como nossa liturgia.
  </p>

  <p>
  As sessões todas renderam novos entendimentos profundos, eu os recebia durante a concentração de 15 minutos com o audiovisual.
  Portanto estou ainda mais convicto de que o caminho que estamos trilhando e propondo é excelente e será útil para muitos.
  </p>

  <p>
  Ao final da semana, na última sessão, sobre o tema "verdade", apareceu-me nitidamente 3 recursos básicos para eu manter em uso constantemente:
  <ul>
  <li>
    Deus/Jesus está à minha direita, como me foi revelado há muitos anos.
  </li>
  <li>
    Eu sou mesmo uma antena, sempre captando de tudo à minha volta e emanando.
    Cada pessoa também é assim.
    Ao menos no meu caso, devo estar atento para o que estou captando, de preferência mantendo a coluna ereta e atenção às posições do corpo, contrações musculares, pensamentos e respiração.
  </li>
  <li>
    Arte em todos os aspectos da vida como uma forma de manter esmero e obter resultados trancendentais ("tirar leite de pedra"): em cada coisa que eu fizer, no meu tratamento comigo mesmo, com os outros e com Deus, e na minha vida mental (cada pensamento e o que me propor a absorver/desenvolver).
  </li>
  </p>
  <p>

Renato Fabbri,
Sat Jan  9 19:25:16 -03 2021
  </p>
  <br>
  `)
  $('#loading').hide()
}

function pattern (str, type) {
  const types = {
    pub: /^\d\d\d/, // publication
    tes: /^t\d\d\d/
  }
  if (type in types) {
    return types[type].test(str)
  } else if (type === 'infra') {
    for (const t in types) {
      if (types[t].test(str)) {
        return false
      }
    }
    return true
  }
  return false
}

window.ppp = pattern

e.publications = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'pub')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Publications</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.testimonials = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'tes')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Testimonials</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.testimonials_ = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'tes')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Testimonials</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.infra = () => {
  const pub = []
  for (const i in e) {
    if (pattern(i, 'infra')) {
      console.log(i)
      pub.push(i)
    }
  }
  utils.stdDiv().html(`
  <h2>Infra pages</h2>
  <ul>
  ${pub.map(i => `<li><a href="?${i}">${i}</a></li>`).join('')}
  </ul>
  `)
  $('#loading').hide()
}

e.liturgy101 = () => {
  const sentinela = [
    'mantém-se em silêncio e em oração para abençoar a sessão e para proteger os participantes.',
    'observa e anota os pontos positivos e negativos da sessão e condução feita pelo procurador.',
    'complementa a condução quando estritamente necessário e solicita a Deus quando quiser que algo aconteça.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const procurador = [
    'escuta atentamente o que o neófito disser e fala o mínimo possível.',
    'apresenta a atividade para o neófito e tira dúvidas.',
    'conduz o neófito na atividade, decidindo o tema, criando a sessão, e ajudando a iniciar o artefato audiovisual.',
    'colhe comentários posteriores e finaliza a sessão.',
    'acompanha o tempo para não exceder 30 min de conversa e 30 min de sessão.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const deveres = [
    'manter um ritmo constante de oração. Orar ao menos ao acordar e ao dormir, agradecendo pelo dia, pedindo proteção e louvando a Vida, o Criador, e a Oportunidade (do MMM).',
    'zelar pela limpeza e organização de seus corpos e ambiente.',
    'observar cotidianamente a si própri@ para se certificar de que o cerne de seu trabalho é o bem da Humanidade, e não a vaidade e a cobiça ou mesmo a indiferença.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  const sugestoes = [
    'observar o dia, o clima, a temperatura, e visitar os significados de cada dia: se é dedicado a algum santo, profissão ou aspecto da existência. Também o dia da semana, o dia do mês (número), estação do ano, etc.',
    'adorar e orar apenas para Deus. Já a comunicação pode ser feita com todos os seres viventes, humanos ou não.',
    'realizar cotidianamente a leitura de escrituras sagradas: Bíblia, Alcorão, Mahabharata/Ramáiana, etc.',
    'sempre convidar novas pessoas para o MMM. Idealmente iniciar 4 pessoas por dia. Caso esteja já responável por muitas pessoas, convidar ao menos 1 nova pessoa por semana.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  utils.stdDiv().html(`
  <h1>Liturgia MMM 101</h1>

  Para estarmos lúcidos e cientes da atividade sendo
  desempenhada.
  Em especial, para acentuar nossa atenção aos detalhes, nossa concentração/foco, e nossa nitidez sobre o todo.

  Para isso, ficam aqui propostas 2 incumbências básicas e uma optativa, orações para início e fim de sessão, e algumas observações adicionais.

  <h2>1. Incumbências</h2>

  <h4>Sentinela</h4>
  É o encargo mais importante. A sentinela zela pela proteção do grupo e pela consagração da sessão, além de avaliar os participantes, a condução e proporcionar ajustes finos.
  
  Em resumo, a sentinela:
  <ol>${sentinela}</ol>

  <h4>Interventor, articulador, delegado ou procurador</h4>
  É quem conduz a sessão, i.e. quem articula os conteúdos e os participantes. É praticamente o único que fala com o neófito e garante a progressão da sessão pelos passos necessários.

  Em resumo, o procurador:
  <ol>${procurador}</ol>

  Quando não há neófito, o papel do procurador fica bastante descansado, variando entre totalmente diluído entre as sentinelas e a condução constante (principalmente quando há vários participantes).

  <h4>Neófito</h4>
  O neófito é alguém novo no MMM, sendo iniciado pelas sentinelas e procurador. Em geral deve haver no máximo 1 neófito por sessão. Prefencialmente, ele deve ditar o tema da sessão e deve ser ouvido constantemente. Recomendamos que o neófito passe ao menos 2, e preferencialmente 7, sessões como neófito.

  <h4>Resumo</h4>
  <h5>2 participantes iniciados:</h5>
  Ficam um pouco mais livres os papéis de sentinela e procurador. Preferencialmente conduz quem criou a sessão, assumindo assim o papel de procurador, mas tudo neste caso fica a critério dos 2 participantes.
  É o único caso em que as orações inicial e final são optativas embora ainda assim recomendadas.

  <h5>3 participantes ou mais, todos iniciados:</h5>
  Cada um faz a oração, após isso 1 pessoa fica como procuradora.
  As outras concentram-se como sentinelas.

  <h5>3 participantes ou mais, 1 deles é neófito:</h5>
  Cada iniciado faz a oração, após isso 1 pessoa fica como procuradora.
  As outras concentram-se como sentinelas e então o neófito é convidado.

  <h5>2 participantes, 1 deles é neófito (<b>contraindicado</b>):</h5>
  Faltará foco na função mais importante (a de sentinela).
  Em caso de necessidade, o procurador deverá manter-se atento para realizar também a função de sentinela, fazendo intervalos de silêncio para concentração, limpeza e oração.
  De qualquer forma, fazer um minuto de silêncio antes de convidar o neófito para especial atenção pelo iniciado que será ambos procurador e sentinela.

  <h5>3 participantes ou mais, mais de 1 deles é neófito (<b>contraindicado</b>):</h5>
  A sessão tenderá a não atender aos neófitos.
  Se possível, partir a sessão em mais grupos ou fazer mais sessões.
  De qualquer forma, manter um único procurador, e fazer um minuto de silêncio antes de convidar os neófitos para especial atenção pelo procurador e sentinelas.

  <h2>2. Orações</h2>
  As orações devem ser feitas em todas as sessões,
  se possível em voz alta.
  Deve-se iniciar com a Oração de Abertura e terminar com a Oração de Fechamento.

  <h4>Oração de Abertura</h4>
  Deve ser feita antes do começo da sessão e da entrada do neófito e com as mãos juntas em frente ao rosto, ao peito ou ao abdomem, com o propósito de invocar o Senhor, seus Anjos e demais protetores dos envolvidos:

  <i><pre>
        ${monk.prayers.abertura}
  </pre></i>

  <h4>Oração de Fechamento</h3>
  Deve ser feita ao final da sessão e após o neófito sair e com as mãos abertas e voltadas para cima, com o propósito de agradecer, realizar petições finais, e banir essências não desejadas:

  <i><pre>
        ${monk.prayers.fechamento}
  </pre></i>

  Sopra-se as palmas das mãos ao final da oração.

  <h2>3. Demais observações</h2>
  Deveres do praticamente:
  <ul>${deveres}</ul>

  Sugestões:
  <ul>${sugestoes}</ul>

  Pode haver uso de velas, preferencialmente brancas, principalmente em ocasiões especiais. Também pode haver o uso de túnicas, prefencialmente franciscanas pela simplicidade e fácil acesso.

  <br><br>:::
  `)
  $('#loading').hide()
}

e.aa = ufrj => {
  $('#favicon').attr('href', 'assets/aafav2.png')
  const adiv = utils.stdDiv().html(`
  ${ufrj ? '<img alt="" border="0" src="assets/UFRJ-logo.png" width="7%" style="float:right" />' : ''}
  <h2>AA is Algorithmic Autoregulation</h2>
  Check the <a href="?${ufrj ? 'ufrj-logs2' : 'aalogs3'}" target="_blank">logs</a>.
  `)
  let grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('user id:').appendTo(grid)
  const uid = $('<input/>', {
    placeholder: 'id for user'
  }).appendTo(grid)
    .attr('title', 'The ID for the user (name, nick, etc).')
    .val(u('user') || u('u'))

  $('<span/>').html('shout message:').appendTo(grid)
  const shout = $('<input/>', {
    placeholder: utils.chooseUnique(['learning AA', 'developing X', 'doing Y', 'talking to Z', 'writing W', 'some description'], 1)[0]
  }).appendTo(grid)
    .attr('title', 'The shout description (what have you done or are you doing).')
    .on('keyup', e => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        submitShout.click()
      }
    })

  const shoutStr = ufrj ? 'shoutFran' : 'shout'
  const submitShout = $('<button/>')
    .html('Submit shout')
    .appendTo(grid)
    .attr('title', 'Register the shout message given.')
    .click(() => {
      // get current date and time, user, session ID and submit
      const data = { uid: uid.val(), sessionId: sessionData ? sessionData.sessionId : undefined }
      data[shoutStr] = shout.val()
      console.log(data)
      if (!data.uid) {
        window.alert('please insert a user identification string.')
      } else if (!data[shoutStr]) {
        window.alert('please insert shout message.')
      } else {
        data.date = new Date()
        transfer.writeAny(data, true).then(resp => {
          if (shoutsExpected !== undefined && shoutsExpected > 0) {
            shoutsExp.html(--shoutsExpected)
          }
          shout.val('')
          if (sessionData && (slotsFinished === sessionData.nslots)) {
            if (shoutsExpected <= 0) { // finish session routine:
              ssBtn.attr('disabled', false)
              sdur.attr('disabled', false)
              nslots.attr('disabled', false)
              grid.hide()
              sessionData = undefined
              shoutsExpected = undefined
            }
          }
          console.log(resp)
          window.rrr = resp
        })
      }
    })

  grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('slot duration:').appendTo(grid)
  const sdur = $('<input/>', {
    placeholder: '15'
  }).appendTo(grid)
    .attr('title', 'In minutes.')
    .val(u('d') || 15)

  $('<span/>').html('number of slots:').appendTo(grid)
  const nslots = $('<input/>', {
    placeholder: '8'
  }).appendTo(grid)
    .attr('title', 'Slots to be dedicated and reported on.')
    .val(u('n') || 8)

  const f = e => e.val() === '' ? '' : parseFloat(e.val())
  let sessionData
  const ssBtn = $('<button/>')
    .html('Start session')
    .appendTo(grid)
    .attr('title', 'Start an AA session (sequence of slots with shouts).')
    .click(() => {
      // get current date and time, user, create session ID and submit
      console.log(sdur, nslots)
      window.sss = [sdur, nslots]
      const data = { uid: uid.val(), sdur: f(sdur), nslots: f(nslots) }
      if (!data.uid) {
        window.alert('please insert a user identification string.')
      } else if (isNaN(data.sdur)) {
        // window.alert('type a numeric slot duration (minutes).')
        data.sdur = 15
      } else if (!Number.isInteger(data.nslots)) {
        // window.alert('type an integer number of slots.')
        data.nslots = 8
      } else {
        data.date = new Date()
        transfer.writeAny(data, true).then(resp => {
          data.sessionId = resp.insertedId.toString()
          sessionData = data
          startSession()
        })
      }
    })

  let tLeft
  let slotsFinished
  let shoutsExpected
  grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'])).hide()

  $('<span/>').html('session started at:').appendTo(grid)
  const sStarted = $('<span/>').appendTo(grid)
  $('<span/>').html('slots finished:').appendTo(grid)
  const slotsFin = $('<span/>').appendTo(grid)
  $('<span/>').html('shouts expected:').appendTo(grid)
  const shoutsExp = $('<span/>').appendTo(grid)
  $('<span/>').html('time left in current slot:').appendTo(grid)
  const tLeft2 = $('<span/>', { class: 'notranslate' }).appendTo(grid)

  function startSession () {
    ssBtn.attr('disabled', true)
    sdur.attr('disabled', true)
    nslots.attr('disabled', true)

    sStarted.html(sessionData.date.toLocaleString())
    shoutsExpected = 1
    shoutsExp.html(1)
    grid.show()

    window.ddd = { slotsFin, shoutsExp, tLeft, tLeft2 }

    slotsFinished = 0
    slotsFin.html(0)
    setCountdown(sessionData.sdur, sFun)
  }
  function setCountdown (dur, fun) {
    const duration = dur * 60
    const targetTime = (new Date()).getTime() / 1000 + duration
    setTimeout(() => {
      fun()
      clearInterval(timer)
    }, duration * 1000)
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
      tLeft2.text(`${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  function sFun () {
    mkSound()
    shoutsExp.html(++shoutsExpected)
    if (++slotsFinished !== sessionData.nslots) { // spork new slot:
      setCountdown(sessionData.sdur, sFun)
    }
    slotsFin.html(slotsFinished)
  }

  const dat = require('dat.gui')
  const gui = new dat.GUI()
  let vv = 120
  gui.add({ freq: vv }, 'freq', 50, 1000).onFinishChange(v => {
    vv = v
    vv = v
    mkSound()
  }).listen()

  const sy = new t.MembraneSynth().toDestination()
  sy.volume.value = -25
  gui.add({ vol: sy.volume.value }, 'vol', -100, 30).onFinishChange(v => {
    sy.volume.value = v
    mkSound()
  }).listen()

  const st = 2 ** (1 / 12)
  const tt = 0.1
  const ttt = tt / 2
  function mkSound () {
    const now = t.now()
    sy.triggerAttackRelease(vv, ttt, now)
    sy.triggerAttackRelease(vv * (st ** 3), ttt, now + tt)
    sy.triggerAttackRelease(vv * (st ** 7), ttt, now + 2 * tt)

    sy.triggerAttackRelease(vv * (st ** 4), ttt, now + 3 * tt)
    sy.triggerAttackRelease(vv * (st ** 8), ttt, now + 4 * tt)
    sy.triggerAttackRelease(vv * (st ** 11), ttt, now + 5 * tt)
  }
  utils.confirmExit()
  $('#loading').hide()
}

e.aalogs3 = ufrj => {
  const url = ufrj ? 'ufrj-logs2' : 'aalogs3'
  const url2 = ufrj ? 'ufrj' : 'aa'
  const field = ufrj ? 'shoutFran' : 'shout'

  $('<link/>', { // todo: download to get from repo
    rel: 'stylesheet',
    href: 'https://cdnjs.cloudflare.com/ajax/libs/paginationjs/2.1.5/pagination.css'
  }).appendTo('head')

  function simpleTemplating2 (data) {
    const grid = utils.mkGrid(4, adiv, '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>user</b>').appendTo(grid)
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>shout</b>').appendTo(grid)
    const tz = (new Date()).getTimezoneOffset()
    const tz_ = (tz > 0 ? '-' : '+') + Math.floor(tz / 60)
    $('<span/>', { css: { 'margin-left': '10%' } }).html(`<b>when (GMT${tz_})</b>`).appendTo(grid)
    $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>session</b>').appendTo(grid)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)
    utils.gridDivider(160, 160, 160, grid, 1)

    const func = 'appendTo'
    const r = data
    r.forEach(s => {
      $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?${url}&user=${s.uid}", target="_blank">${s.uid}</a>`)[func](grid)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s[field] }).html(linkify(s[field]))[func](grid)
      const adate = (new Date(s.date - tzoffset)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate)[func](grid)
      const css = { 'margin-left': '10%' }
      if (s.sessionId) {
        const c = utils.mongoIdToRGB(s.sessionId)
        css.background = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.5)`
      }
      $('<span/>', { css, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?${url}&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '')[func](grid)
      if (u('admin')) { // todo: remove the shout correctly
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          window.rrr = window.rrr.filter(s_ => s_._id !== s._id)
          window.rrrBack = window.rrrBack.filter(s_ => s_._id !== s._id)
          mkPag()
        })
      }
      utils.gridDivider(190, 190, 190, grid, 1)
      utils.gridDivider(190, 190, 190, grid, 1)
    })
    return grid
  }

  const data = []
  for (let i = 0; i < 1000; i++) {
    data.push(`${i} YEAH MAN`)
  }
  const user = u('user')
  const session = u('session')
  const adiv = utils.centerDiv('90%', undefined, utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2).html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  <p>This is the logs page ${user ? 'for user <b>' + user + '</b>' : ''}${session ? 'for session <b>' + session.slice(-10) + '</b><span id="sessionDur"></span>' : ''}. Check the <a href="?${url2}" target="_blank">AA interface</a>.</p>
  `)
  $('<button/>', { id: 'rbutton', title: 'retrieve shouts given after last load' }).html('update').appendTo(adiv)
  const sbut = $('<button/>', { id: 'sbutton', title: 'search string in the shouts' }).html('search').appendTo(adiv)
    .click(() => {
      const res = window.prompt('enter search string (empty string to restore all messages):')
      console.log('search me', res, res === '', res === null)
      if (res !== '' && res !== null) {
        const res_ = res.toUpperCase()
        window.rrr = window.rrrBack.filter(i => i[field].toUpperCase().indexOf(res_) !== -1)
        mkPag()
        sbut.html(`search (${res})`)
      } else if (res === '') { // restore shouts:
        window.rrr = window.rrrBack.slice()
        mkPag()
        sbut.html('search')
      }
    })
  $('<div/>', { id: 'apid' }).appendTo(adiv)
  $('<div/>', { id: 'data-container' }).appendTo(adiv)
  const query = {}
  query[field] = { $exists: true }
  if (user) {
    query.uid = user
  }
  if (session) {
    query.sessionId = session
  }
  const tzoffset = (new Date()).getTimezoneOffset() * 60000 // offset in milliseconds
  function updateDuration () {
    const r = window.rrr
    const dur = (r[0].date - r[r.length - 1].date) / (60 * 60 * 1000)
    const h = Math.floor(dur)
    const min = dur - h
    const min_ = Math.round(min * 60)
    // const dstr = `${h}:${min_}`
    const dstr = `${h}h${min_}m`
    $('#sessionDur').html(` (total duration: <b>${dstr}</b>)`)
  }
  function mkPag (data) {
    if (window.apag !== undefined) window.apag.pagination('destroy')
    window.apag = $('#apid').pagination({
      dataSource: window.rrr,
      pageSize: u('l') || 25,
      // autoHidePrevious: true,
      // autoHideNext: true,
      callback: function (data, pagination) {
        const html = simpleTemplating2(data)
        $('#data-container').html(html)
      }
    })
    if (session) updateDuration()
  }
  transfer.findAll(query, true).then(r => {
    console.log(r)
    window.rrr = r
    r.sort((a, b) => b.date - a.date)
    window.rrrBack = window.rrr.slice()
    mkPag()
    $('#rbutton').click(() => {
      console.log('click')
      query._id = { $nin: window.rrrBack.map(s => s._id) }
      transfer.findAll(query, true).then(r_ => {
        r_.sort((a, b) => b.date - a.date)
        window.rrrBack.unshift(...r_)
        window.rrr = window.rrrBack.slice()
        sbut.html('search')
        mkPag()
      })
    })
  })
  $('#loading').hide()
}

e.aalogs = () => {
  const user = u('user')
  const session = u('session')
  // const adiv = utils.stdDiv().html(`
  const adiv = utils.centerDiv('90%', undefined, utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2).html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  <p>This is the logs page ${user ? 'for user <b>' + user + '</b>' : ''}${session ? 'for session <b>' + session.slice(-10) + '</b><span id="sessionDur"></span>' : ''}. Check the <a href="?ufrj" target="_blank">AA interface</a>.</p>
  `)
  // const grid = utils.mkGrid(4, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<button/>', { id: 'rbutton' }).html('update').appendTo(adiv)
  const grid = utils.mkGrid(4, adiv, '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>user</b>').appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>shout</b>').appendTo(grid)
  const tz = (new Date()).getTimezoneOffset()
  const tz_ = (tz > 0 ? '-' : '+') + Math.floor(tz / 60)
  $('<span/>', { css: { 'margin-left': '10%' } }).html(`<b>when (GMT${tz_})</b>`).appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>session</b>').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  const lastSep = utils.gridDivider(160, 160, 160, grid, 1)
  const query = { shout: { $exists: true } }
  if (user) {
    query.uid = user
  }
  if (session) {
    query.sessionId = session
  }
  const ids = []
  const tzoffset = (new Date()).getTimezoneOffset() * 60000 // offset in milliseconds
  function addShout (r, updated) {
    const func = 'appendTo'
    r.sort((a, b) => b.date - a.date)
    r.forEach(s => {
      ids.push(s._id)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?ufrj-logs&user=${s.uid}", target="_blank">${s.uid}</a>`)[func](grid)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout))[func](grid)
      const adate = (new Date(s.date - tzoffset)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate)[func](grid)
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?ufrj-logs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '')[func](grid)
      if (u('admin')) {
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          user.hide()
          shout.hide()
          date.hide()
          session.hide()
        })
      }
      utils.gridDivider(190, 190, 190, grid, 1)
      utils.gridDivider(190, 190, 190, grid, 1)
    })
  }
  function insertShout (r) {
    r.sort((a, b) => a.date - b.date)
    r.forEach(s => {
      ids.push(s._id)
      const adate = (new Date(s.date)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      utils.gridDivider(190, 190, 190, grid, 1, lastSep)
      utils.gridDivider(190, 190, 190, grid, 1, lastSep)
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?ufrj-logs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '').insertAfter(lastSep)
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate).insertAfter(lastSep)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout)).insertAfter(lastSep)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?ufrj-logs&user=${s.uid}", target="_blank">${s.uid}</a>`).insertAfter(lastSep)
      if (u('admin')) {
        shout.click(() => {
          console.log(s)
          transfer.remove({ _id: s._id }, true)
          user.hide()
          shout.hide()
          date.hide()
          session.hide()
        })
      }
    })
  }
  function updateDuration () {
    const r = window.rrr
    const dur = (r[0].date - r[r.length - 1].date) / (60 * 60 * 1000)
    const h = Math.floor(dur)
    const min = dur - h
    const min_ = Math.round(min * 60)
    // const dstr = `${h}:${min_}`
    const dstr = `${h}h${min_}m`
    $('#sessionDur').html(` (total duration: <b>${dstr}</b>)`)
  }
  transfer.findAll(query, true).then(r => {
    console.log(r)
    window.rrr = r
    window.ids = ids
    addShout(r)
    if (session) {
      updateDuration()
    }
    $('#rbutton').click(() => {
      console.log('click')
      query._id = { $nin: ids }
      transfer.findAll(query, true).then(r_ => {
        window.R_ = r_
        insertShout(r_)
        r_.push(...window.rrr)
        window.rrr = r_
        updateDuration()
      })
    })
  })
  $('#loading').hide()
}

e.losd = () => {
  const adiv = utils.stdDiv().html(`
  <h2>LOSD is Linked Open Social Data</h2>
  <b>Æterni Anima</b> artifact for social mobilization.
  `)
  const grid = utils.mkGrid(1, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>source</b>').appendTo(grid)
  utils.gridDivider(160, 160, 160, grid, 1)
  utils.gridDivider(160, 160, 160, grid, 1)
  transfer.losdCall('0', r => {
    console.log(r)
    r.forEach(n => {
      $('<span/>', { css: { 'margin-left': '10%' }, title: `navigate and increment network by ${n.n.value}` }).html(`<a href="?net&s=${n.s.value.split('#')[1]}", target="_blank">${n.n.value}</a>`).appendTo(grid)
      utils.gridDivider(160, 160, 160, grid, 1)
    })
    $('#loading').hide()
  })
}

e.net = () => {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    // transparent: true
    backgroundColor: 0x000000
  })
  app.stage.sortableChildren = true
  document.body.appendChild(app.view)
  window.wand.app = app
  transfer.getNetMembersLinks(u('s'), r => {
    console.log(r)
    const pfs = net.plotFromSparql(r.members, r.friendships)
    window.nnn = pfs
    const dn = new net.ParticleNet2(app, pfs.net, pfs.atlas)
    window.nnn.dn = dn
    $('#loading').hide()
  })
}

e.prayer = () => {
  const onome = u('p')
  const oracao = monk.prayers[onome]

  const adiv = utils.stdDiv().html(`
  <h2>Æterni Anima prayer</h2>
  <p>id da oração: <b title="URL argument p=X where X can be any among: ${Object.keys(monk.prayers).join(', ')}." style="background-color:#ffffaa;cursor:context-menu;padding:1%">${onome}</b></p>
  <i><pre>
${oracao}
  </pre></i>
  `)

  const dd = window.wand.router.timeArgument()
  setCountdown(dd - new Date(), () => {
    if (check.prop('checked')) {
      maestro.speaker.synth.cancel()
      maestro.speaker.play(oracao, 'pt')
    }
  })
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('countdown to start prayer:').appendTo(grid)
  const tLeft2 = $('<span/>', { css: { 'background-color': '#ffffaa', cursor: 'context-menu' }, title: 'URL argument s=HH:MM:SS. MM and SS and HH are optional. If &s= is not given, prayer starts on next minute.' }).appendTo(grid)
  $('<span/>').html('participate:').appendTo(grid)
  const check = $('<input/>', {
    type: 'checkbox'
  }).appendTo(grid)

  function setCountdown (dur, fun) {
    const duration = dur / 1000
    const targetTime = (new Date()).getTime() / 1000 + duration
    setTimeout(() => {
      fun()
      clearInterval(timer)
      tLeft2.text('already started')
    }, duration * 1000)
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
      tLeft2.text(`${hours}${p(minutes)}:${p(seconds)}`)
    }, 100)
  }
  utils.vocalize(oracao, adiv)

  $('#loading').hide()
}

e.tper = () => {
  const percom = require('percom')
  const a = ['asd', 2, 'tre']
  const adiv = utils.stdDiv().html(`
  <h2>Æterni Anima permutation test</h2>
  ${percom.per(a)}
  `)
  console.log(percom.per(a, 3))
  // number of notes (int)
  // f0 (lowest note, float Hz)
  // number of octaves (float)
  // duration of iteration (float seconds)
  const grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

  $('<span/>').html('number of notes.').appendTo(grid)
  const nnotes = $('<input/>').appendTo(grid)
    .val(3)

  $('<span/>').html('number of octaves.').appendTo(grid)
  const noctaves = $('<input/>').appendTo(grid)
    .val(1)

  $('<span/>').html('lowest frequency.').appendTo(grid)
  const f0 = $('<input/>').appendTo(grid)
    .val(200)

  $('<span/>').html('duration of the iteration on all notes.').appendTo(grid)
  const d = $('<input/>').appendTo(grid)
    .val(1.5)

  const f = v => parseFloat(v.val())
  $('<button/>').html('Play').appendTo(grid)
    .click(() => {
      console.log(nnotes.val(), noctaves.val(), f0.val(), d.val())
      const freqSpan = noctaves.val() * 2
      console.log('freq span:', freqSpan)
      const freqFact = freqSpan ** (1 / nnotes.val())
      console.log('freq fact:', freqFact)
      const notes = [f(f0)]
      for (let i = 1; i < f(nnotes); i++) {
        notes.push(f(f0) * (freqFact ** i))
      }
      console.log('notes: ', notes)
      mkSound(notes)
    })
  const sy = new t.MembraneSynth().toDestination()
  function mkSound (notes) {
    const tt = f(d) / notes.length
    const ttt = tt / 2
    const now = t.now()
    for (const note in notes) {
      console.log(notes[note])
      sy.triggerAttackRelease(notes[note], ttt, now + tt * note)
    }
  }

  $('#loading').hide()
}

e.mkMed2 = () => {
  const mk = new m.Mk()
  window.mk = mk
}

e.icons = () => {
  const adiv = utils.stdDiv().html(`
  <h2>testing icons</h2>
  `)
  const iclass = 'fa-play'
  $('<i/>', { class: 'fa ' + iclass, css: { background: '#ff00ee' } }).appendTo(
    adiv
  )
  $('#loading').hide()
}

e.transportTest = () => {
  window.wand.tone = t
}

e.ufrj = () => e.aa(true)

e['ufrj-logs2'] = () => {
  e.aalogs3(true)
}

e.trefoil = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    // const px = a * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
    // const py = Math.sin(angle) * px
    // return vertical ? [py + c[1], px + c[0]] : [px + c[0], py + c[1]]
    const px = a * (Math.sin(angle) + 2 * Math.sin(2 * angle))
    const py = a_ * (Math.cos(angle) - 2 * Math.cos(2 * angle))
    return [px + c[0], py + c[1]]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.hexagram = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.7
  const a_ = h * 0.7
  const r = (a + a_) / 2

  function xy (angle, torus, vertical) {
    if (angle < Math.PI / 8) {
      const dx = Math.sin(angle) * r
      return [dx + c[0], c[1] + r]
    } else if (angle < Math.PI) {
      const an = Math.PI / 8
      const [vx, vy] = [c[0] + Math.sin(an) * r, c[1] + r]
      return [vx - 1, vy - 1] // continue here TTM, -1 dummy
    } else if (angle > 7 * Math.PI / 8) {
      const dx = Math.sin(angle) * r
      return [c[0] - dx, c[1] - r]
    }
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.calendar = () => {
  const l1 = [
    'Respiração diafragmática (pela barriga, peito parado), lenta.',
    'Postura livre mas de preferência com coluna ereta, seja deitada ou sentada ou de pé.',
    'Garantir que ela tenha entendido como ativar o artefato, porque usá-lo e o que esperar das sessões de MMM.' // todo: descrever
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const l2 = [
    'Aquietar a mente.',
    'Concentrar somente no tema.',
    'Mesmo durante os dias, quanto menos o pensamento estiver solto, mais energia (e recursos, vitaminas) sobra para o corpo se curar e rejuvenescer.',
    'Quanto menos os pensamentos estiverem desvairados, mais permissões e responsabilidades espirituais são concedidas a nós.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const l3 = [
    'Curar e manifestar melhoras para si, nossas famílias e mundo todo.',
    'Harmonizar a respiração e o sistema nervoso.',
    'Vibrar no corpo de Luz.',
    'Caridade.',
    'As sessões devem sempre ser feitar em conjuntos, mínimo de 3. A pessoa deve ir agora pensando no objetivo das próximas 3 sessões dela.'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const novato = [
    `Na primeira sessão, tratar de: <ul>${l1}</ul>`,
    `Na segunda sessão, tratar dos pensamentos: <ul>${l2}</ul>`,
    `Na terceira sessão, tratar dos propósitos de estar na sessão: <ul>${l3}</ul>`
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const temas = [
    'Anjo da Guarda',
    'Anjos',
    'Luz',
    'Consciência da Presença do Criador',
    'Caminho Crístico',
    'Contato com E.T.s',
    'Força',
    'Concentração',
    'Pureza',
    'Regeneração'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')

  utils.stdDiv().html(`
  <h1>Calendário</h1>

  No calendário ficam marcadas as sessões:
  quem e em que nível estão.

  Os níveis atuais estão divididos como a seguir.

  <h2>Nível 0</h2>
  Com marcações 1, 2, 3, para primeira, segunda e terceira sessão.
  É o momento de receber a pessoa, escutá-la, avaliar se ela tem condições de estar com
  outras pessoas nas práticas diárias.

  É de primeira importancia garantir que ela tenha as bases para trabalhar nas sessões:
  <ol>${novato}</ol>

  <h2>Nível 1</h2>
  A pessoa fará dois conjuntos de 3 sessões (marcados com A e B no calendário).

  Cada conjunto de 3 sessões é dedicado para algo que ela escolher. A pessoa pode escolher contar ou não o tema para os outros participantes.

  Ao final do primeiro conjunto, contar a ela a distinção entre trabalho maior e menor (horário bem definido para começar ou não).

  Exemplos de temas para sugerir para a pessoa:
  <ul>${temas}</ul>

  <h2>Nível 2</h2>
  Podemos introduzir práticas com leituras ou mais longas ou com dinâmicas de pergunta e resposta, etc.
  A pessoa pode também ficar responsável por algum horário fixo (abrir uma sala, receber as pessoas, repassar o link do artefato, etc).

  <br><br>:::
  `)
  $('#loading').hide()
}

e.fig8 = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 2 + Math.cos(2 * angle)
    return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / 100, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e['003-pequeno-historico'] = () => {
  // não consigo estabelecer relações entre vc, o Otávio e o "arcturianos"
  //
  // Gostaria que vc me contasse a "história" de quando surgiu o artefato,
  // como surgiu a ideia de usá-lo em meditação,
  // como chegou à conclusão que ajudaria pessoas tristes ou com prolemas

  const parags = [
  `
  Em oração constante e estudando diariamente a Palavra, procurei com diligência
  saber a vontade dA Fonte (dO Criador) para meus dias.
  Ele mostrou o que talvez seja a incumbência de todos. Entendi que ao menos minha ela é. 
  Devemos ter uma vida mais funcional, confortável
  e apta a ajudar outras pessoas, a sociedade e o planeta.
  `,
  `
  Mantive-me, então, alternando oração e leitura da Palavra com modelagem,
  escrita de códigos computacionais e pesquisa científica.
  Uma constante busca de orientação divina para influenciar na Terra da melhor forma
  o que nos fosse dada permissão para influenciar.
  `,
  `
  Contei com os Martelos do Recomeço
  ao aplicar MMM (meditação, mentalização e manifestação), com o suporte do audiovisual,
  para a obtenção de entendimentos, revelações e para harmonizar corpo e mente, individual e social.
  `,
  `
  As explorações duraram cerca de duas décadas,
  mas este percurso final em que empregamos conscientemente nossos entendimentos
  levou poucos meses até o momento.
  `,
  `
  Encontrei grande orientação vinculada à alcunha de "Arcturianos".
  As vias pelas quais eram disponibilizadas as mensagens não existem mais e tenho esperança de que estabeleçam novamente
  contato tão luminoso.
  Diz-se que eles tem a missão aqui na Terra de unir espiritualidade e tecnologia e que são mestres
  do balanço (no sentido de equilíbrio, harmonia e proporção).
  Com recorrência associei os Arcturianos ao corpo de Luz que estamos ativando por meio dos
  Artefatos Audiovisuais (a.k.a. Artefatos Arcturianos).
  `,
  `
  -- Ferreiros Renascidos, 01/Mar/2021
  `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Caminho</h1>

  ${parags}

:::
  `)
  $('#loading').hide()
}
e['002-caminho'] = () => {
  // não consigo estabelecer relações entre vc, o Otávio e o "arcturianos"
  //
  // Gostaria que vc me contasse a "história" de quando surgiu o artefato,
  // como surgiu a ideia de usá-lo em meditação,
  // como chegou à conclusão que ajudaria pessoas tristes ou com prolemas

  const parags = [
  `A história do surgimento do artefato,
  de como surgiu a ideia de usá-lo para meditação,
  e como chegamos à conclusão de que é uma panaceia.`,
  `A Verdadeira Luz da Dedicação pediu para eu lhe contar.
  `,
  `Conto aqui nestas linhas.
  Em oração constante e estudando diariamente a Palavra, procurei com diligência
  saber a vontade dA Fonte (dO Criador) para meus dias.
  `,
  `Ele mostrou minha preparação, meu contexto, e então minha incumbência.
  De fato, "os ouvidos que ouvem e os olhos que veem foram feitos pelo Senhor" (Provérbios 20:12)
  e bastava olhar. 
  `,
  `Devemos ter uma vida mais funcional, confortável
  e apta a ajudar outras pessoas, a sociedade e o planeta.
  `,
  `
  Nem sempre é fácil resistir ao dinheiro imediato.
  Seduz a ideia de alcançar melhores condições materiais, mas sei por experiência que
  obedecer a Deus é o melhor que a vida tem para nos oferecer, e além disso
  "Deleite-se no Senhor, e Ele atenderá aos desejos do seu coração" (Salmos 37:4).
  `,
  `
  Assim, apliquei os amadurecimentos que tínhamos, eu e Os Martelos do Recomeço,
  sobre meditação, mentalização e manifestação, sobre os usos do audiovisual
  para obtenção de entendimentos, revelações e para harmonizar o corpo e a mente.
  `,
  `
  O processo durou muitos anos se levados em conta nossas explorações,
  mas este percurso final em que aplicamos conscientemente nossos entendimentos
  levou poucos meses.
  `,
  `
  Foi um processo permeado de oração e leitura da Palavra alternado com modelagem,
  contas e escrita de códigos computacionais.
  Uma constante busca de orientação divina para influenciar na Terra da melhor forma
  o que nos fosse dada permissão.
  `,
  `
  "Não consigo estabelecer relações entre você, os Martelos do Recomeço, e o 'arcturianos'",
  a Verdadeira Luz da Dedicação lembrou.
  Nas dificuldades que enfrentei encontrei grande orientação em mensagens
  transmitidas em nome destes nossos irmãos.
  Diz-se que eles tem a missão aqui na Terra de unir espiritualidade e tecnologia.
  `,
  `
  -- Ferreiros Renascidos, 01/Mar/2021
  `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Caminho</h1>

  ${parags}

:::
  `)
  $('#loading').hide()
}

e.cdraw = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const x = 2.5 * (Math.sin(-5 * angle) ** 2) * (2 ** (Math.cos(Math.cos(4.28 * 2.3 * angle))))
    const y = 2.5 * Math.sin(Math.sin(-5 * angle)) * (Math.cos(4.28 * 2.3 * angle) ** 2)
    return [c[0] + a * x, c[1] + a_ * y]
    // const foo = 2 + Math.cos(2 * angle)
    // return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 10000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(-6 + 12 * i / 10000, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.torus = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 3 + Math.cos(4 * angle)
    return [c[0] + a * foo * Math.cos(3 * angle), c[1] + a_ * foo * Math.sin(3 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.cinq = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 3 + Math.cos(5 * angle)
    return [c[0] + a * foo * Math.cos(2 * angle), c[1] + a_ * foo * Math.sin(2 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.torusDec = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.1
  const a_ = h * 0.1

  function xy (angle, torus, vertical) { // lemniscate x, y given angle
    const foo = 1 + 0.45 * Math.cos(3 * angle) + 0.4 * Math.cos(9 * angle)
    return [c[0] + a * foo * Math.sin(2 * angle), c[1] + a_ * foo * Math.cos(2 * angle)]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0, false, u('v')))
  const segments = 1000
  for (let i = 0; i <= segments; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments, false, u('v')))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.testRecord = () => {
  // const blob = new Blob(chunks, { type: 'audio/wav' })
  const context = new t.OfflineContext(1, 0.5, 44100)
  const dest = context.createMediaStreamDestination()
  const recorder = new window.MediaRecorder(dest.stream, { mimeType: 'audio/wav' })
  const chunks = []
  recorder.ondataavailable = evt => chunks.push(evt.data)
  const osc = new t.Oscillator({ context }).connect(dest)
  context.render().then(buffer => {
    console.log(buffer.numberOfChannels, buffer.duration, osc)
    window.bbb = buffer
    const blob = new window.Blob(chunks, { type: 'audio/wav' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = (this.filename || 'test') + '.wav'
    a.click()
  })
}

e.testRecord2 = () => {
  const wavefile = require('wavefile')
  t.Offline(() => {
    const oscillator = new t.Oscillator().toDestination().start(0)
    window.osc = oscillator
  }, 2).then((buffer) => {
    console.log(buffer.numberOfChannels, buffer.duration)
    window.bbb = buffer
    const wav = new wavefile.WaveFile()
    // wav.fromScratch(2, 44100, '32f', buffer.toArray()) // works
    const bar = buffer.toArray()
    const bar_ = []
    bar.forEach(chan => {
      const [max, min] = chan.reduce((mm, i) => {
        if (i > mm[0]) mm[0] = i
        if (i < mm[1]) mm[1] = i
        return mm
      }, [-Infinity, Infinity])
      const chan_ = chan.map(i => Math.floor((2 ** 15 - 1) * (2 * (i - min) / (max - min) - 1)))
      bar_.push(chan_)
    })
    wav.fromScratch(2, 44100, '16', bar_) // works

    // const blob = new window.Blob(buffer.toArray(), { type: 'audio/wav' })
    // const blob = new window.Blob(buffer.toArray(), { type: 'audio/ogg' })
    // // const blob = new window.Blob(buffer.toArray())

    // const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    // a.href = url
    a.href = wav.toDataURI()
    a.download = (this.filename || 'test') + '.wav'
    a.click()
  })
}

e['004-groups-e-paginas'] = () => {
  const grupos = [ // nossos:
    'https://www.facebook.com/groups/luz.e.graca',
    'https://www.facebook.com/groups/arcturianart',
    'https://www.facebook.com/groups/onchrist',
    'https://www.facebook.com/groups/avmeditation',
    'https://www.facebook.com/groups/avatarheal',
    'https://www.facebook.com/groups/mentaliz',
    'https://www.facebook.com/groups/imortalidade',
    'https://www.facebook.com/groups/brainentrainment'
  ].reduce((a, i) => a + `<li><a href="${i}">${i}</a></li>`, '')

  const grupos2 = [ // de terceiros:
    'https://www.facebook.com/groups/arcturiuno',
    'https://www.facebook.com/groups/mentesdespertas'
  ].reduce((a, i) => a + `<li><a href="${i}">${i}</a></li>`, '')
  utils.stdDiv().html(`
  <h1>Grupos</h1>
  
  De nossa administração:
  <ul>${grupos}</ul>

  De administração de terceiros:
  <ul>${grupos2}</ul>

  :::
  `
  )
  $('#loading').hide()
}

e['005-sprint-2021-04-21'] = () => {
  utils.stdDiv().html(`
  <h1>Sprint 21/Abril/2021</h1>
  
  <pre>
Renato
  refatorei e consolidei o código do mkMed2 e mkLight
  melhorei o AA (inicialização do som e cores das sessões)
  requisitei depoimentos p Luis Henrique, Janira, Marcus Vinícius
  Publicação de contribuição
  Encaminhadas pessoas dos grupos para auxílio no whats, com vídeo do Otávio ou pessoalmente 
  Vídeo inicial de criação sonora nos artefatos (13 minutos).

Otávio
  Reunião com Janira explicando os fundamentos. Possibilidade de diálogo com linha do Grabovoi.
  Participando das sessões e postando sobre os temas e sessões.
  Meditação com 10 min resp ritmada e caminhando x 5 min respiração livre e parado.
  Template novo!

Mariel
  Aprendendo/aprimorando sobre criação sonora nos artefatos.
  Criando artefatos do zero (som e visual e temas/eixos).
  Ensinando o Renato S'Huss.
  Criando as sessões todas.
</pre>

  :::
  `
  )
  $('#loading').hide()
}

e['006-reiki'] = () => {
  const en = [
    'segue a intuição',
    'foca no presente',
    'foca em cada chácra, um por vez',
    'tenta achar onde talvez tenha problema',
    'foca nele, se não tiver retorno/eco, fica nele até ter eco',
    'conversa (antes e depois e durante)'
  ]
  const perm = [
    'os Mestres iluminados do Reiki',
    'e Jesus Cristo e Deus Pai',
    'e para iniciar a pessoa'
  ]
  const ini2 = [
    'Cho Ku Rei',
    'Sei He Ki',
    '-> Corpo de Luz, dilui, quebra <-',
    'mantras (Kodoish Kodoish Kodoish, Adonai Tsebaiosh. Refuá Christus, Refuá Elohim)'
  ]
  const ini = [
    'inicia uma sessão com artefato',
    `iniciamos uma sessão de reiki pedindo assistência e permissão para ${a(perm)}`,
    'iniciamos falando o nome de quem está sendo iniciado e do iniciador',
    `e falando qual iniciação está sendo feita ${a(ini2)}`,
    'e mantalizamos durante a sessão que estamos abrindo um canal no iniciado para aquela energia específica e para comunicação espiritual específica',
    'fechar a sessão soprando as mãos e dizendo "eu entrego em suas mãos" (direcionado aos mestres iluminados do Reiki e a Jesus e a Deus pai)'
  ]
  const ap2 = [
    'os Mestres iluminados do Reiki',
    'e Jesus Cristo e Deus Pai',
    'e para iniciar a pessoa'
  ]
  const ap3 = [
    'pode concentrar chácra por chácra',
    'pode concentrar no ambiente da pessoa',
    'pode usar a sonda'
  ]
  const ap = [
    'Hon Sha Ze Sho Nem ao início da sessão',
    `iniciamos uma sessão de reiki pedindo assistência e permissão para ${a(ap2)}`,
    'iniciamos falando o nome de quem está aplicando e do paciênte',
    `faz símbolos, concentra na energia saindo da mão ${a(ap3)}`,
    'fechar a sessão soprando as mãos e dizendo "eu entrego em suas mãos" (direcionado aos mestres iluminados do Reiki e a Jesus e a Deus pai)'
  ]
  function a (l) {
    const ll = l.reduce((a, i) => a + `<li>${i}</li>`, '')
    return `<ul>${ll}</ul>`
  }
  utils.stdDiv().html(`
  <h1>Iniciando o Reiki no MMM/AAA</h1>
  
<h2>Energização indígena (com as mãos, vinda do Fernando)</h2>
${a(en)}

<h2>Iniciações</h2>
${a(ini)}

<h2>Aplicações</h2>
${a(ap)}
  :::
  `
  )
  $('#loading').hide()
}
e.getPhrase = () => {
  utils.getPhrase().then(r => console.log('HERE MAN', r))
}

e.gstat = () => {
  // const St = window.FooBar // fixme
  const St = require('stats.js')
  const stats = new St()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  this.tasks = [] // list of routines to execute
  this.executing = true
  this.animate = () => {
    stats.begin()
    // monitored code goes here
    for (let i = 0; i < this.tasks.length; i++) {
      this.tasks[i]()
    }
    stats.end()
    if (this.executing) {
      window.requestAnimationFrame(this.animate)
    }
  }
  this.animate()
}

e.mkLight = () => {
  const mk = new m.Mk(true)
  window.mk = mk
}

e.fp = () => {
  const fp = 'banana' // require('get-browser-fingerprint')
  window.fffppp = fp
  const fp_ = fp()
  console.log(fp_)
}

e.lis = () => {
  const app = new PIXI.Application({ // todo: make it resizable
    width: window.innerWidth,
    height: window.innerHeight * 0.80
  })
  $('body').append(app.view)
  const [w, h] = [app.view.width, app.view.height]
  const c = [w / 2, h / 2] // center
  const a = w * 0.4
  const a_ = h * 0.4

  const kx = u('kx')
  const ky = u('ky')
  function xy (angle) { // lemniscate x, y given angle
    const x = a * Math.cos(kx * angle)
    const y = a_ * Math.sin(ky * angle)
    return [c[0] + x, c[1] + y]
  }
  const myLine = new PIXI.Graphics()
  myLine.lineStyle(1, 0xffffff)
    .moveTo(...xy(0))
  const segments = 1000
  const fact = parseFloat(u('f')) || 1
  for (let i = 0; i <= segments * fact; i++) {
    myLine.lineTo(...xy(2 * Math.PI * i / segments))
  }
  app.stage.addChild(myLine)
  if (u('v')) {
    myLine.pivot.x = c[0]
    myLine.pivot.y = c[1]
    myLine.position.set(...c)
    myLine.rotation = Math.PI
  }
  window.lll = myLine
  window.ccc = c
  $('#loading').hide()
}

e.jantunes = () => {
  const url = 'https://jorge-de-freitas-antunes.github.io/assets/leva1/'
  const bio = [
    'Bio em PORTUGUÊS.doc',
    'Bio em FRANCÊS.doc',
    'Bio em INGLÊS.doc'
  ]
  const listagens = [
    'Música de Câmara de Jorge Antunes.doc',
    'CDs e DVDs de Jorge Antunes.doc',
    'OBRAS SINFÔNICAS de Jorge Antunes.doc'
  ]
  const docs = [
    'GEMUNB.doc',
    'Texto de Gerson Valle.doc'
  ]
  const fotos = [
    '1961-O precursor em seu estúdio caseiro,Rua-Orestes, Rio de Janeiro.png',
    'Theremin construído por Jorge Antunes em 1962 (1º).JPG',
    '1967-No Instituto Villa-Lobos.jpg',
    'Em 1971 Antunes ganhou concurso de composição empatado com seu mestre Guerra Peixe.jpg',
    'UTRECHT 1972.jpg',
    '1974-GEMUNB (Grupo de Experimentação Musical da Universidade de Brasília).jpg',
    '1984-Jorge Antunes ensaiando  Sinfonia das Buzinas.jpg',
    '1995 - Xenakis e Antunes.jpg',
    '2006-Cena da ópera OLGA- Prisão da Rua Frei Caneca.jpg'
  ]

  const url2 = 'https://jorge-de-freitas-antunes.github.io/assets/leva2/'
  const notas = [ // imprensa
    'Ambiente I.jpg',
    'D.N.1971 (filho e prêmio).jpg',
    'Premio Angelicum 1971.jpg',
    'O Globo 1972.jpg',
    'JB 1972.jpg',
    'SINFONIA DAS DIRETAS-jornal 6.jpg',
    'SINFONIA DAS DIRETAS-jornal 1.jpg',
    'SINFONIA DAS DIRETAS-jornal 2.jpg',
    'SINFONIA DAS DIRETAS-jornal 3.jpg',
    'SINFONIA DAS DIRETAS-jornal 4.jpg',
    'SINFONIA DAS DIRETAS-jornal 5.jpg',
    'SINFONIA DAS DIRETAS-jornal 7.jpg',
    'SINFONIA DAS DIRETAS-jornal 8.jpg',
    'Sinfonia dosDireitos (C.Braz).jpg',
    'Coli-CONCERTO).nov.2020 2.jpg'
  ]

  const links = [
    ['2009: esnsaio de Carlos Eduardo Amaral, "Ativismo sinfônico – O protesto político nas obras orquestrais de Jorge Antunes"', 'https://ativismosinfonico.wordpress.com/'],
    ['2010: MSc de J.M da Rocha, "Os sons e as cores: propostas de correlação em experiências composicionais"', 'https://repositorio.ufba.br/ri/handle/ri/9170'],
    ['2016: review do álbum "Música Electrónica” [MENT007]"', 'https://avantmusicnews.com/2016/10/05/jorge-antunes-musica-electronica-ment007/'],
    ['2017: sobre a ópera O Espelho (com Coli)', 'https://glosas.mpmp.pt/opera-o-espelho'],
    ['2017: IVL 50 Anos tem texto "IVL 1967-1968: um depoimento" do J. Antunes', 'http://www2.unirio.br/unirio/cla/ivl/publicacoes/ivl_50_anos_edicao_comemorativa_unirio.pdf'], // IVL 1967-1968: um depoimento
    ['2017: entrevista', 'https://www.vice.com/pt/article/d7b54x/jorge-antunes-entrevista'],
    ['2020: sobre a ópera Olga', 'https://operawire.com/baltic-opera-2020-21-review-olga'],
    ['2021: homepage', 'http://jorgeantunes.com.br']
  ].reduce((a, i) => `${a} <li><a href="${i[1]}" target="_blank">${i[0]}</a></li>`, '')

  const dicio = [ // notas de dicionário
    'Aurélio-dicionário.jpg',
    'dicionário.jpg' // como que chama esse dicionário?
  ]

  const texta = [ // textos acadêmicos
    'BORGES_GilbertoAndre_jorgeantunes 2.pdf',
    'Cor_Musica_Andre_Rangel.pdf',
    'Musica_Teatro_Musica-Teatro_e_Percussao.pdf',
    'Performance no teatro instrumental - Daniel Serale 2.pdf',
    'Volpe.pdf',
    'Sinestesia2015_Paper-Basbaum _1_ 3.pdf'
  ]

  const a = l => '<ul>' + l.reduce((a, i) => `${a}<li><a href="${url}${i}" target="_blank">${i}</a></li>`, '') + '</ul>'
  const b = l => '<ul>' + l.reduce((a, i) => `${a}<li><a href="${url2}${i}" target="_blank">${i}</a></li>`, '') + '</ul>'
  const h = t => `<h3>${t}</h3>`

  utils.stdDiv().html(`
  <h1>Jorge Antunes</h1>
  ${h('Biografias')}
  ${a(bio)}

  ${h('Listagens de gravações e obras')}
  ${a(listagens)}

  ${h('Demais textos')}
  Sobre o GEMUNB (Grupo de Experimentação Musical da Universidade de Brasília) e sobre o percurso do compositor (escrito por volta de 2012):
  ${a(docs)}

  ${h('Fotos')}
  ${a(fotos)}

  ${h('Notas na imprensa')}
  ${b(notas)}

  ${h('Entradas em dicionários')}
  ${b(dicio)}

  ${h('Textos acadêmicos')}
  ${b(texta)}

  ${h('Links')}
  <ul>${links}</ul>

  :::
  `)
  $('#loading').hide()
}

e.wiki = () => {
  const itens = [
    `sugira compositores, obras, técnicas, eventos, grupos, etc.
    para serem representados na Wikipédia.
    `,
    `
    Escreva novos artigos na Wikipédia ou melhore os existentes.
    Mesmo que não seja sobre compositores ou sobre música, estas contribuições serão consideradas.
    `,
    `
    Ajude na tradução dos artigos para outras línguas além de português e inglês.
    `,
    `
    Repasse este link para pessoas e entidades potencialmente interessadas na iniciativa.
    `,
    `
    Entre em contato para quaisquer outros assuntos, inclusive se precisar de outra forma, que <b>não a chave Pix</b>, para fazer uma transferência financeira.
    `
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const comp = [
    'Jorge Antunes',
    'Victor Lazarini',
    'Edson Zampronha',
    'Ricardo Tacuchian'
  ].reduce((a, i) => a + `<li>${i}</li>`, '')
  const cont = [
    `O Brasil é agraciado com diversos <b>compositores</b>,
    expressivos tanto para a apreciação quanto pela importância na história da música.
    `,
    `A <b>Wikipédia</b>
    talvez seja a principal referência sobre um determinado assunto e sua importância, em especial os artigos em inglês.
    Muitos compositores brasileiros estão na Wikipédia.
    Muitos não estão, e dentre os que estão, todos os que visitei merecem artigos mais completos e melhor escritos.
    Além disso, muitos possuem páginas apenas em português ou apenas em inglês, ou receberam apenas pequenos rascunhos.
    `,
    `
    As instabilidades da vida e a dedicação aos trabalhos impossibilitaram, nos anos anteriores, que eu criasse mais novos artigos e melhorasse mais os existentes.
    De fato, contribuir para a Wikipédia é gratificante, mas nem sempre fácil. É necessário escrever com esmero e referenciar fontes estrategicamente.
    Além disso, é comum os supervisores não confiarem em autores que não fizeram já várias contribuições, principalmente quando o artigo trata de alguém, algum grupo ou instituição, pois várias vezes a edição não é idônea.
    `,
    `
    Assim, criei esta página para registrar este andamento, conseguir incentivos, colaboradores, e firmar o passo.
    `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  const pars = [
    `
    Caso você queira incentivar financeiramente esta dedicação, transfira uma quantia pela chave Pix <b>compowiki</b>. Há outras formas de contribuir:
    <ul>${itens}</ul>
    `,
    `Você pode entrar em contato pelo email <b>renato [Ponto] fabbri (arroba) gmail PONTO com</b>
    `
  ].reduce((a, i) => a + `<p>${i}</p>`, '')
  utils.stdDiv().html(`
  <h1>Compositores brasileiros na Wikipédia</h1>
  <h2>Andamento</h2>
    <p>
    Alguns dos compositores já em consideração:
    <ul>${comp}</ul>
    </p>
    <p>
    Se você é um compositor e quer que seus artigos (em português e inglês) sejam melhorados ou mesmo criados, sugiro enviar esta página para dois ou mais compositores.
    A contribuição financeira é bem-vinda e é também importante acionar os outros compositores até para mantermos este trabalho ético.
    </p>
  <h2>Contexto</h2>
  ${cont}
  <h2>Incentivo</h2>
  ${pars}

  :::
  `)
  $('#loading').hide()
}

e.colors = () => {
  // tinycolor2:
  //  convert to representations
  //  color transformation
  //  readability
  //
  // color-scheme:
  //  create colorschemes
  //  triad, tetrad, mono, contrast, analogic
  //  pastel, soft, light, hard, pale
  //
  // distinct-colors:
  //  coloschemes customizáveis, não entendi ainda
}
