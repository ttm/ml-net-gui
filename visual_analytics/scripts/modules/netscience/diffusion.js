const utils = require('../utils.js')

class Diffusion {
  // network have to have been drown (otherwise will not have pixiElement attributes)
  constructor (net, app, seeds = []) {
    this.seeds = seeds
    if (seeds.length === 0) {
      this.seeds = utils.chooseUnique(net.nodes(), 3)
    }
  }
}

module.exports = { use: { Diffusion } }
