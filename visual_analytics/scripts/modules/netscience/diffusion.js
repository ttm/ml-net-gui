// basic diffusion process with blinking nodes and activated edges.
// should be performed here and visualized in conductor using artist.
// thus...
// fixme: isolate propagation here. Isolate visualization and animation in conductor.
//        probably: overwrite activateLink(), or add to sequence of functions for activated link.
const utils = require('../utils.js')
const mkLink = require('../artist').use.mkLink

const activateLink = (p1, p2) => {
  const c1 = [p1.x, p1.y]
  const c2 = [p2.x, p2.y]
  const slope = (c1[1] - c2[1]) / (c1[0] - c2[0])
  const orthSlope = -1 / slope
  const size = 5
  const dx = size / Math.sqrt(1 + orthSlope ** 2)
  const dy = orthSlope * dx
  console.log('activating link')
  for (let i = 0; i < 10; i++) {
    const mklink = () => {
      const p = i / 10
      const x = c1[0] * (1 - p) + c2[0] * p
      const y = c1[1] * (1 - p) + c2[1] * p
      const p1 = { x: x + dx, y: y + dy }
      const p2 = { x: x - dx, y: y - dy }
      const link = mkLink(p1, p2, 1, 0, 0x00ff00)
      setTimeout(() => { link.destroy() }, 100 * i)
    }
    setTimeout(() => { mklink() }, 100 * i)
  }
}

const activate = (nodeAttr, fancy = true) => {
  nodeAttr.activated = true
  nodeAttr.pixiElement.tint = 0xffffff
  window.ppp = nodeAttr.pixiElement
  if (fancy === true) {
    nodeAttr.pixiElement.tint = 0xffff00
    setTimeout(c => { nodeAttr.pixiElement.tint = c }, 1000, 0xffffff)
  }
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
    if (sourceAttr.activated === true && targetAttr.activated !== true) {
      if (!newNeighbors.includes(target)) {
        activateLink(sourceAttr.pixiElement, targetAttr.pixiElement)
        nkey = target
        nattr = targetAttr
      }
    } else if (targetAttr.activated === true && sourceAttr.activated !== true) {
      if (!newNeighbors.includes(source)) {
        activateLink(targetAttr.pixiElement, sourceAttr.pixiElement)
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
  net.totalActivated += newNeighbors.length
}

const neighborPropagateNodes = (net, activated) => {
  const alreadyActive = activated.length
  const newNeighbors = []
  const newNeighborsAttrs = []
  for (let i = 0; i < alreadyActive; i++) {
    const key = activated[i]
    const attr = net.getNodeAttributes(key)
    if (attr.activated === true) {
      net.forEachNeighbor(key, (nkey, nattr) => {
        if (nattr.activated !== true && !newNeighbors.includes(nkey)) {
          newNeighbors.push(nkey)
          newNeighborsAttrs.push(nattr)
        }
      })
    }
  }
  net.totalActivated = activated.length + newNeighbors.length
  for (let i = 0; i < newNeighborsAttrs.length; i++) {
    activate(newNeighborsAttrs[i])
    activated.push(newNeighbors[i])
  }
}

class Diffusion {
  // network have to have been drown (otherwise will not have pixiElement attributes)
  constructor (net, app, seeds = [], paused = true, iterate = null) {
    // starts from seeds and spreads to each link.
    // same diffusion is performed by neighborPropagate and neighborPropagateNodes
    // change iterate() function to perform a different diffusion
    this.net = net
    this.app = app
    this.seeds = seeds
    if (seeds.length === 0) {
      const nseeds = 1
      this.seeds = utils.chooseUnique(net.nodes(), nseeds)
      this.net.totalActivated = nseeds
    }
    for (let i = 0; i < this.seeds.length; i++) {
      activateById(net, this.seeds[i])
    }
    this.iterate = iterate
    if (iterate === null) {
      this.iterate = neighborPropagate
    } else if (iterate === 'keeplist') {
      const iter = net => neighborPropagateNodes(net, this.seeds)
      this.iterate = iter
    }
    this.paused = paused
  }

  bindIterator () {
    this.totalTime_ = 0
    const framesPerSecond = 60
    const secondsPerFrame = 1 / framesPerSecond
    // fixme: find out how to remove this ticket altogether instead of just pausing it.
    // fixme: decide if not better to just use ticker.stop()
    this.ticker = this.app.ticker.add(delta => { // delta is 1 for 60 fps
      this.totalTime_ += delta * secondsPerFrame
      if (!this.paused) {
        if (this.totalTime_ > 3) {
          this.iterate(this.net)
          this.totalTime_ = 0
        }
        console.log(this.net.totalActivated, this.net.order)
        if (this.net.totalActivated === this.net.order) {
          console.log('diffusion finished')
          this.paused = true
        }
      }
    })
    this.ticker.speed = 2 // speed * 60 FPS
    this.iteratorBinded = true
  }

  start () {
    if (!this.iteratorBinded) {
      this.bindIterator()
    }
    this.paused = false
  }
}

class MultilevelDiffusionBase {
  // base class with only annotations and fundamental attributes.
  // By definition, this class receives a network and obtain from it a sequence of networks.
  // It is a succession of incrementally smaller networks,
  // in which supernodes in a network represents sets of nodes in the previous network.
  // The superlinks are complied with such supernodes-nodes relations.
  // supernodes and superlinks may be regarded as parent nodes and links, meta(nodes, links) or hyper(nodes, links)
  constructor (net, attr = {}, start = false) {
    this.net = net
    this.attr = attr
    this.hierarchy = [this.net]
    if (start) {
      this.makeHierarchy()
    }
  }

  makeHierarchy () { // push networks to hierarchy
    this.level = 0
    this.stop = false
    while (!this.stop) {
      this.match() // creates this.superNodes
      this.collapse() // increments hierarchy implied by given superNodes
      this.level++
    }
  }

  match () {
    // selects sets of nodes to be represented by supernodes.
    // criteria / algorithm is arbitrary and thus defined in derived classes.
    // returns [[<node>]], a sequence of nodes in each supernode.
    // basic:
    // random sets
    // equally chosen sets
    // degree +-
    let nodes = this.hierarchy[this.hierarchy.length - 1].nodes()
    nodes = utils.inplaceShuffle(nodes)
    const superNodeSize = 5 // number of nodes
    this.superNodes = utils.chunkArray(nodes, superNodeSize())
  }

  collapse () { // each sequence of nodes in superNodes => superNode
    // replace nodes into supernodes and updates links as entailed.
    // resulting supernodes have the list of nodes is represents.
    // return resulting network and any further data structures as needed.
    //
    // this algorithm is +- determined, vary mostly if keeping weight of not
    // or if network more elaborate, e.g. k-partite.
    //
    // variations:
    // bipartite, k-partite, logitudinal net, threshold on the weight of the link,
    // or in the number of links to yield superlink.
    const net = this.net.copy()
    // iterate through supernode sets:
    for (let i = 0; i < this.superNodes.length; i++) {
      const superNodeId = `supernode-${this.level}-${i}`
      const superNode = this.superNodes[i]
      const superNeighbors = []
      for (let j = 0; j < superNode.length; j++) { // get neighbors and simplify net
        const node = superNode[j]
        superNeighbors.push(...net.neighbors(node).filter(n => {
          return !(superNeighbors.includes(n) || superNode.includes(n))
        }))
        net.dropNode(node)
      }
      net.addNode(superNodeId, {
        weight: superNode.length,
        children: superNode,
        level: this.level
      })
      superNeighbors.forEach(n => {
        if (!net.hasEdge(superNodeId, n)) {
          net.addUndirectedEdge(superNodeId, n)
        }
      })
    }
    this.hierarchy.push(net)
  }
}

class MultilevelDiffusionMinimalFunctional extends MultilevelDiffusionBase {
  match () {
    // choose sets of nodes at random to obtain supernodes
  }

  collapse () {
  }
}

class MultilevelDiffusionSketch {
  constructor (net, seeds) {
    this.makeHierrarchy(net, seeds)
  }

  makeHierrarchy (net, seeds) {
    // 1) choose up to b=5 neighbors to be activated by criterion (implement random)
    // 2) such b neighbors are nodes to be collapsed into the supernode
    // 3) repeat 1-2 until only the seeds are not collapsed or only lonly nodes are left to be supernodes.
    const hierarchy = [net]
    let superNodes = this.match(net, seeds)
    let level = 0
    let net_ = hierarchy[hierarchy.length - 1]
    while (superNodes.length !== 0) {
      const collapseResult = this.collapse(net_, superNodes, level)
      net_ = collapseResult[0]
      const seeds_ = collapseResult[1]
      hierarchy.push(net_)
      superNodes = this.match(net_, seeds_)
      window.ddd = { hierarchy, net_, seeds_, superNodes }
      level++
    }
  }

  match (net, seeds, b = 5) {
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]
      net.setNodeAttribute(seed, 'activated', true)
    }
    const superNodes = []
    const nodesTaken = []
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i]
      // other criteria:
      // choose neighbor by being more or less connected
      const neighs = net.neighbors(seed)
      let superNode = neighs.filter(n => {
        console.log('inside filtering')
        if (net.getNodeAttribute(n, 'activated') !== true) {
          if (!nodesTaken.includes(n)) {
            return true
          }
        }
        return false
      })
      if (superNode.length > b) {
        superNode = superNode.splice(0, b)
      }
      superNodes.push(superNode)
      nodesTaken.push(...superNode)
    }
    return superNodes.filter(s => s.length > 0)
  }

  collapse (net_, superNodes, level) {
    const net = net_.copy()
    const seeds = []
    for (let i = 0; i < superNodes.length; i++) {
      const superNode = superNodes[i]
      const superNeighbors = []
      for (let j = 0; j < superNode.length; j++) {
        const node = superNode[j]
        console.log(`going to delete ${node}`)
        superNeighbors.push(...net.neighbors(node).filter(n => {
          return !(superNeighbors.includes(n) || superNode.includes(n))
        }))
        net.dropNode(node)
      }
      const node = `super-node-${level}-${i}`
      const seed = net.addNode(node, {
        weight: superNode.length,
        level: level
      })
      seeds.push(seed)

      superNeighbors.forEach(n => {
        if (!superNode.includes(n)) {
          if (!net.hasEdge(node, n)) {
            net.addUndirectedEdge(node, n)
          }
        }
      })
      for (let j = i + 1; j < superNodes.length; j++) {
        superNodes[j] = superNodes[j].map(n => {
          if (superNode.includes(n)) {
            return node
          }
          return n
        })
      }
    }
    return [net, seeds]
  }
}

module.exports = { use: { Diffusion, MultilevelDiffusionSketch, MultilevelDiffusionMinimalFunctional } }
