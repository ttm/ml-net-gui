const drawnet = require('./conducting/drawnet.js')
const animate = require('./conducting/animate.js')

module.exports = {
  use: {
    DrawnNet: drawnet.use.DrawnNet,
    rotateLayouts: animate.use.rotateLayouts,
    blink: animate.use.blink,
    showMembers: animate.use.showMembers,
    ui: require('./conducting/ui.js').use,
    jgui: require('./conducting/jgui.js'),
    gradus: require('./conducting/gradus.js'),
    parnassum: require('./conducting/parnassum.js'),
    lycoreia: require('./conducting/lycoreia.js'),
    tithorea: require('./conducting/tithorea.js'),
    pages: require('./conducting/pages.js'),
    utils: require('./conducting/utils.js')
  },
  gui: require('./conducting/gui.js')
}
