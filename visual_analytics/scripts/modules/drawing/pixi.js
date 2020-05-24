const PIXI = require('pixi.js')

global.PIXI = PIXI // fixme: workaround to import pixi-projection? ask PIXI's community?
require('pixi-projection')

exports.PIXI = PIXI
