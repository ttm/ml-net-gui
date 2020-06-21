/* global requestAnimationFrame */
const dat = require('dat.gui')
const St = require('stats.js')

// window.conductor.gui = {
//   dat,
//   St
// }

const setMinimal = function (loadCallback = r => console.log(r)) {
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

module.exports = { setMinimal, St, dat, atest, basicStats }
