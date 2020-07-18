const drawnet = require('./conducting/drawnet.js')
const animate = require('./conducting/animate.js')
const ui = require('./conducting/ui.js')
const gui = require('./conducting/gui.js')
const jgui = require('./conducting/jgui.js')
const pages = require('./conducting/pages.js')

module.exports = {
  use: {
    DrawnNet: drawnet.use.DrawnNet,
    rotateLayouts: animate.use.rotateLayouts,
    blink: animate.use.blink,
    showMembers: animate.use.showMembers,
    ui: ui.use,
    jgui,
    gradus: require('./conducting/gradus.js'),
    parnassum: require('./conducting/parnassum.js'),
    lycoreia: require('./conducting/lycoreia.js'),
    pages
  },
  gui
}
