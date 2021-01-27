const PIXI = require('pixi.js')
const forceAtlas2 = require('graphology-layout-forceatlas2')

const t = require('tone')
const $ = require('jquery')
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
  let tossed = false
  let el
  const but = $('<button/>').html('toss').click(() => {
    if (!tossed) {
      el = utils.chooseUnique(monk.biblePt, 1)[0]
      div.html(el.ref)
      but.html('show')
      tossed = true
    } else {
      div.html(el.text)
      but.html('toss again')
      tossed = false
    }
  }).appendTo(adiv)
  const div = $('<div/>').appendTo(adiv)
  $('#loading').hide()
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

e.aa = () => {
  $('#favicon').attr('href', 'assets/aafav2.png')
  // for enabling AA
  // fields: nick/id/name
  // shout
  // (slot dur, n slots) to start a session
  const adiv = utils.stdDiv().html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  Check the <a href="?aalogs" target="_blank">logs</a>.
  `)
  let grid = utils.mkGrid(2, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>').html('user id:').appendTo(grid)
  const uid = $('<input/>', {
    placeholder: 'id for user'
  }).appendTo(grid)
    .attr('title', 'The ID for the user (name, nick, etc).')
    .val(u('user'))

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

  const submitShout = $('<button/>')
    .html('Submit shout')
    .appendTo(grid)
    .attr('title', 'Register the shout message given.')
    .click(() => {
      // get current date and time, user, session ID and submit
      const data = { uid: uid.val(), shout: shout.val(), sessionId: sessionData ? sessionData.sessionId : undefined }
      console.log(data)
      if (!data.uid) {
        window.alert('please insert a user identification string.')
      } else if (!data.shout) {
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
    .val(15)

  $('<span/>').html('number of slots:').appendTo(grid)
  const nslots = $('<input/>', {
    placeholder: '8'
  }).appendTo(grid)
    .attr('title', 'Slots to be dedicated and reported on.')
    .val(8)

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
  const tLeft2 = $('<span/>').appendTo(grid)

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
    mkSound()
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
    // t.start(0)
    // t.Master.mute = false
    vv = v
    vv = v
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

e.aalogs = () => {
  const user = u('user')
  const session = u('session')
  // const adiv = utils.stdDiv().html(`
  const adiv = utils.centerDiv('90%', undefined, utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2).html(`
  <h2>AA is Algorithmic Autoregulation</h2>
  This is the logs page${user ? 'for user <b>' + user + '</b>' : ''}${session ? 'for session <b>' + session.slice(-10) + '</b>' : ''}. Check the <a href="?aa" target="_blank">AA interface</a>.
  `)
  // const grid = utils.mkGrid(4, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<button/>', { id: 'rbutton' }).html('update').appendTo(adiv)
  const grid = utils.mkGrid(4, adiv, '100%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>user</b>').appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>shout</b>').appendTo(grid)
  $('<span/>', { css: { 'margin-left': '10%' } }).html('<b>when</b>').appendTo(grid)
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
  function addShout (r, updated) {
    const func = 'appendTo'
    r.sort((a, b) => b.date - a.date)
    r.forEach(s => {
      ids.push(s._id)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?aalogs&user=${s.uid}", target="_blank">${s.uid}</a>`)[func](grid)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout))[func](grid)
      const adate = (new Date(s.date)).toISOString()
        .replace(/T/, ' ')
        .replace(/:\d\d\..+/, '')
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate)[func](grid)
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?aalogs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '')[func](grid)
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
      const session = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts in session ${s.sessionId}` }).html(s.sessionId ? `<a href="?aalogs&session=${s.sessionId}" target="_blank">${s.sessionId.slice(-10)}</a>` : '').insertAfter(lastSep)
      const date = $('<span/>', { css: { 'margin-left': '10%' }, title: adate }).html(adate).insertAfter(lastSep)
      const shout = $('<span/>', { css: { 'margin-left': '10%' }, title: s.shout }).html(linkify(s.shout)).insertAfter(lastSep)
      const user = $('<span/>', { css: { 'margin-left': '10%' }, title: `see shouts by user ${s.uid}` }).html(`<a href="?aalogs&user=${s.uid}", target="_blank">${s.uid}</a>`).insertAfter(lastSep)
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
  transfer.findAll(query, true).then(r => {
    console.log(r)
    window.rrr = r
    window.ids = ids
    addShout(r)
    $('#rbutton').click(() => {
      console.log('click')
      query._id = { $nin: ids }
      transfer.findAll(query, true).then(r_ => {
        window.R_ = r_
        insertShout(r_)
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

  const dd = utils.timeArgument()
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
