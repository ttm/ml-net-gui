/* global requestAnimationFrame, wand */
const dat = require('dat.gui')
const St = require('stats.js')

// start using the global object, initialize
// window.wand in the main.js, add objects as needed

function NetGUI (loadCallback = r => console.log(r)) {
  this.callBack = loadCallback
  const self = this
  this.FizzyText = function () {
    const uel = document.getElementById('file-input')
    uel.onchange = res => {
      const f = uel.files[0]
      f.text().then(t => {
        wand.transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
        window.anet = wand.net.use.utils.loadJsonString(t)
        const drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, window.anet, [])
        wand.conductor.use.showMembers(drawnNet.net, wand.artist, true)
        netsui.name(f.name)
      })
    }
    this.netfield = function () {
      uel.click()
    }
    this.nets = 'anet1'
    console.log('did it')
  }
  var text = new this.FizzyText()
  var gui = new dat.GUI()
  const netsui = gui.add(text, 'netfield')
  const netobj = { net1: 'anet1', net2: 'anet2' }
  window.netobj = netobj
  const nets = gui.add(text, 'nets', netobj).listen()
  nets.onFinishChange(v => {
    if (v === 'upload') {
    }
    console.log(v)
  })
  gui.remember(text)
  // add drop-down menu with all the networks found
  // add proper onchange to erase/destroy previously selected network and view current
  // make it talk to net upload properly
  window.agui = { netsui, nets, gui, text, self, netobj }
  return { netsui, nets, gui, text, self }
}

function setMinimal (loadCallback = r => console.log(r)) {
  this.callBack = loadCallback
  const self = this
  this.FizzyText = function () {
    const uel = document.getElementById('file-input')
    uel.onchange = res => {
      // fReader.readAsDataURL(uel.files[0])
      uel.files[0].text().then(self.callBack)
    }
    this.netfield = function () {
      uel.click()
    }
  }
  var text = new this.FizzyText()
  var gui = new dat.GUI()
  gui.remember(text)
  const netsui = gui.add(text, 'netfield')
  return { netsui, gui, text, self }
}

const atest = function () {
  this.FizzyText = function () {
    this.message = 3
    this.speed = 0.8
    this.displayOutline = false
    this.color0 = '#ffae23' // CSS string
    this.color1 = [0, 128, 255] // RGB array
    this.color2 = [0, 128, 255, 0.3] // RGB with alpha
    this.color3 = { h: 350, s: 0.9, v: 0.3 } // Hue, saturation, value
    this.explode = function () { }
    // Define render logic ...
    console.log('an explode')
  }
  var text = new this.FizzyText()
  // var gui = new dat.GUI({ load: JSONoutput })
  var gui = new dat.GUI()
  gui.remember(text)
  var f1 = gui.addFolder('network')
  const nets = f1.add(text, 'message', { net1: 'net1', net2: 3, net3: ['asd', 'qwe'] })
  const speed = f1.add(text, 'speed', -5, 5).listen()
  f1.open()
  var f2 = gui.addFolder('diffusion')
  f2.add(text, 'displayOutline')
  const explode = f2.add(text, 'explode')
  gui.addColor(text, 'color0')
  const color1 = gui.addColor(text, 'color1')
  const color2 = gui.addColor(text, 'color2')
  const color3 = gui.addColor(text, 'color3')
  nets.onFinishChange(v => { console.log('YEY', v) })
  speed.onFinishChange(v => { console.log('YEY', v) })
  explode.onFinishChange(v => { console.log('YEY', v) })
  explode.onChange(v => { console.log('YEY', v) })
  const uel = document.getElementById('file-input')
  // const fReader = new FileReader()
  // fReader.onloadend = r => {
  //   console.log('READ', r, 'READ')
  //   uel.files[0].text().then(r => console.log(r))
  // }
  uel.onchange = res => {
    // fReader.readAsDataURL(uel.files[0])
    uel.files[0].text().then(r => console.log(r))
  }
  color1.onFinishChange(v => { uel.click() })
  color2.onFinishChange(v => { console.log('YEY', v) })
  color3.onFinishChange(v => { console.log('YEY', v) })

  const update = () => {
    requestAnimationFrame(update)
    if (Math.random() < 0.02) { // speed has have listen():
      text.speed = Math.random() * 5
    }
    if (Math.random() < 0.02) { // color2 has not have listen()
      const c = color2.getValue()
      // notice that the color changes but not the alpha value:
      text.color2 = [Math.floor(Math.random() * 200), c[1], c[2], Math.random().toFixed(2)]
      color2.updateDisplay()
    }
  }
  update()
  this.text = text
  this.gui = gui
  this.color2 = color2
  return this
}

function basicStats () {
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
      requestAnimationFrame(this.animate)
    }
  }
  this.animate()
  return this
}

const mkBtn = (iclass, fid, title, fun, ref) => {
  const $ = wand.$
  const btn = $('<button/>', {
    class: 'btn',
    id: `${fid}-button`,
    click: () => {
      fun()
    }
  }).attr('atitle', title)
  if (!ref) {
    btn.prependTo('body')
  } else {
    btn.insertAfter(ref)
  }
  $('<i/>', { class: 'fa ' + iclass, id: `${fid}-icon` }).appendTo(
    btn
  )
  return btn
}

module.exports = { setMinimal, St, dat, atest, basicStats, NetGUI, mkBtn }
