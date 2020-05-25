const utils = require('../utils.js')

const activate = nodeAttr => {
  nodeAttr.activated = true
  nodeAttr.pixiElement.tint = 0xffffff
}

const activateById = (net, id) => {
  activate(net.getNodeAttributes(id))
}

const neighborPropagate = net => {
  const newNeighbors = []
  const newNeighborsAttrs = []
  net.forEachEdge((key, attr, source, target, sourceAttr, targetAttr) => {
    let nkey = null
    let nattr = null
    if (sourceAttr.activated === true) {
      if (!newNeighbors.includes(target)) {
        nkey = target
        nattr = targetAttr
      }
    } else if (targetAttr.activated === true) {
      if (!newNeighbors.includes(source)) {
        nkey = source
        nattr = sourceAttr
      }
    }
    if (nkey !== null) {
      newNeighbors.push(nkey)
      newNeighborsAttrs.push(nattr)
    }
  })
  for (let i = 0; i < newNeighborsAttrs.length; i++) {
    activate(newNeighborsAttrs[i])
  }
}

const neighborPropagateNodes = (net, activated) => {
  const alreadyActive = activated.length
  for (let i = 0; i < alreadyActive; i++) {
    const key = activated[i]
    const attr = net.getNodeAttributes(key)
    if (attr.activated === true) {
      net.forEachNeighbor((neighborKey, neighborAttr) => {
        if (!(neighborAttr.activated === true)) {
          activate(neighborAttr)
          activated.push(neighborKey)
        }
      })
    }
  }

  net.forEachEdge((key, attr, source, target, sourceAttr, targetAttr) => {
    if (sourceAttr.activated === true) {
      activate(targetAttr)
    } else if (targetAttr.activated === true) {
      activate(sourceAttr)
    }
  })
}

class Diffusion {
  // network have to have been drown (otherwise will not have pixiElement attributes)
  constructor (net, app, seeds = [], paused = false, iterate = null) {
    this.seeds = seeds
    if (seeds.length === 0) {
      this.seeds = utils.chooseUnique(net.nodes(), 1)
    }
    for (let i = 0; i < this.seeds.length; i++) {
      activateById(net, this.seeds[i])
    }
    this.iterate = iterate
    if (iterate === null) {
      this.iterate = neighborPropagate
    } else if (iterate === 'keeplist') {
      const iter = net => neighborPropagateNodes(net, seeds)
      this.iterate = iter
    }
    this.paused = paused
    this.totalTime_ = 0
    const framesPerSecond = 60
    const secondsPerFrame = 1 / framesPerSecond
    const ticker = app.ticker.add(delta => { // delta is 1 for 60 fps
      this.totalTime_ += delta * secondsPerFrame
      if (!this.paused) {
        if (this.totalTime_ > 3) {
          this.iterate(net)
          this.totalTime_ = 0
        }
      }
    })
    ticker.speed = 2 // speed * 60 FPS
  }
}

module.exports = { use: { Diffusion } }
