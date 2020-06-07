// (meta, hyper, super, or parent, or X) network analysis
// given that xnodes have x children, or represent x nodes.
// xnetworks are renormalized versions of the original network
// very similar to multilevel strategies, differences:
// . models in which only a no xnode may pertain to an xnode
// . includes diffusion-based models (contagion, consensus, gossip, adoption, etc)
// . new strategies:
//   . starting from less connected nodes
//   . starting from intermediary or specific nodes
//   . prioritizing less connected nodes
//   . maximizing, minimizing or parametrizing diffusion duration
//   . redundancy
// . extra choices and calculations:
//   . which of the nodes must a node activate?
//     . follow neighbors in parents or children?
//   . what is the expected number of people activated indirectly?
//     . with 1 non-represented participants?
//     . with 2 non-represented participants?
//     . supose each participant as related-to (influencing) other 1000 participants?
//     . make a calculation assuming more indirect participants for peripherals?
//
// nomenclatue:
//   while in multilevel a node in a coarsened (meta) network is a supernode,
//   in meta, a metanode is only a metanode if it represents more than 1 node.
//

const utils = require('../utils.js')
const netutils = require('./utils.js')

class MetaNetworkBase {
  // base class with only annotations and fundamental attributes.
  // By definition, this class receives a network and obtain from it a sequence of networks
  // i.e. a succession of incrementally smaller networks,
  // in which supernodes in a network represents sets of nodes in the previous network.
  // The superlinks are complied with such supernodes-nodes relations.
  // supernodes and superlinks may be regarded as parent nodes and links, meta(nodes, links) or hyper(nodes, links)
  constructor (net, attr = {}) {
    // fixme: disalow selfloops ? might have to iterate through links and remove them, then set allowSefloops = false
    this.hierarchy = [net]
    this.attr = attr
  }

  start () {
    this.makeHierarchy()
  }

  stopCriterion () {
    const h = this.hierarchy
    const l = h.length - 1
    if (h[l].order === h[l - 1].order) {
      return true
    }
    return false
  }

  makeHierarchy () { // push networks to hierarchy
    do {
      this.match() // creates this.superNodes
      this.collapse() // increments hierarchy implied by given superNodes
      this.level++
    } while (!this.stopCriterion())
  }

  match () {
    // selects sets of nodes to be represented by supernodes.
    // criteria / algorithm is arbitrary and thus defined in derived classes.
    // returns [[<node>]], a sequence of nodes in each supernode.
    // random sets
    // equally chosen sets
    // degree +-
    const nodes = this.hierarchy[this.hierarchy.length - 1].nodes()
    utils.inplaceShuffle(nodes)
    this.superNodes = utils.randChunkSplit(
      nodes, this.superNodeSizeMin, this.superNodeSizeMax
    )
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
    const net = this.hierarchy[this.hierarchy.length - 1].copy()
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

class MetaNetworkCanon extends MetaNetworkBase {
  // holds most basic matching algorithms
  constructor (net, attr = {}, start = false) {
    super(net, attr)
    this.attr = attr
    this.level = 0
    this.initMatchingAlgorithms()
  }

  initMatchingAlgorithms () {
    const self = this
    this.matchAlgs = {
      randomPartitions: {
        superNodeSizeMin: 2,
        superNodeSizeMax: 10,
        alg: function () {
          const nodes = self.hierarchy[self.hierarchy.length - 1].nodes()
          utils.inplaceShuffle(nodes)
          self.superNodes = utils.randChunkSplit(
            nodes, this.superNodeSizeMin, this.superNodeSizeMax
          )
        }
      },
      equalRandomPartitions: {
        superNodeSize: 5,
        alg: function () {
          const nodes = self.hierarchy[self.hierarchy.length - 1].nodes()
          utils.inplaceShuffle(nodes)
          self.superNodes = utils.chunkArray(nodes, this.superNodeSize)
        }
      },
      degree: {
        superNodeSize: 5,
        seedSelection: 'igreedy', // smalled degrees first, also 'greedy', 'random'
        neighborSelection: 'random', // also: greedy, igreedy
        alg: function () {
          const net = self.hierarchy[self.hierarchy.length - 1]
          const nodes = netutils.nodesDegreeOrder(net, net.nodes(), this.seedSelection)
          const superNodes = []
          let totalMatched = 0
          for (let ni = 0; ni < nodes.length; ni++) {
            const node = nodes[ni]
            if (net.getNodeAttribute(node, 'joined')) {
              continue
            }
            const superNode = [node]
            let neighbors = net.neighbors(node).filter(n => !net.getNodeAttribute(n, 'joined'))
            neighbors = netutils.nodesDegreeOrder(net, neighbors)
            for (let i = 0; i < neighbors.length; i++) {
              const neigh = neighbors[i]
              if (!net.getNodeAttribute(neigh, 'joined')) {
                superNode.push(neigh)
              }
              if (superNode.length === this.superNodeSize) {
                break
              }
            }
            if (superNode.length > 1) {
              superNode.forEach(n => {
                net.setNodeAttribute(n, 'joined', true)
              })
              superNodes.push(superNode)
            }
            totalMatched += superNode.length
            if (totalMatched === net.order) {
              break
            }
          }
          self.superNodes = superNodes
        }
      },
      neighbors: {
        superNodeSize: 5
      }
    }
    if (this.attr.match === undefined || this.attr.match.name === undefined) {
      this.matchAlg = this.matchAlgs.degree
      this.matchAlg.name = 'degree'
    } else {
      this.matchAlg = {
        ...this.matchAlgs[this.attr.match.name],
        ...this.attr.match
      }
      this.matchAlg.name = this.attr.match.name
    }
  }

  makeHierarchy () {
    this.assignLevel() // assigns level to node attributes
    do {
      console.log('starting level', this.level)
      this.match() // creates this.superNodes
      this.collapse() // increments hierarchy implied by given superNodes
      this.level++
      this.assignLevel()
    } while (!this.stopCriterion())
  }

  assignLevel () {
    const h = this.hierarchy
    const net = h[h.length - 1]
    net.forEachNode((n, a) => {
      a.level = this.level
    })
  }

  match () {
    this.matchAlg.alg()
  }

  report () {
    const orders = this.hierarchy.map(g => g.order)
    const sizes = this.hierarchy.map(g => g.size)
    return {
      orders,
      sizes,
      length: this.hierarchy.length
    }
  }
}

class MetaNetworkMulti {
  // this class holds lists of functions to be performed in each action
  constructor (metaNetwork) {
    this.banana = 'quente'
  }
}

module.exports = { use: { MetaNetworkBase, MetaNetworkCanon, MetaNetworkMulti } }
