const drawnet = require('./conducting/drawnet.js')
const animate = require('./conducting/animate.js')
const ui = require('./conducting/ui.js')
module.exports = {
  use: {
    DrawnNet: drawnet.use.DrawnNet,
    rotateLayouts: animate.use.rotateLayouts,
    blink: animate.use.blink,
    showMembers: animate.use.showMembers,
    ui: ui.use
  }
}
