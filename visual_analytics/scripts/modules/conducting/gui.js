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

module.exports = { setMinimal, St, dat }
