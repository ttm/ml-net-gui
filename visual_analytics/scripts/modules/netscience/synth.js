const Graph = require('graphology')
const { ladder } = require('graphology-generators/classic')
const { caveman, connectedCaveman } = require('graphology-generators/community')
// todo: contribute to graphology-generators with a barabasi-albert model:
const { clusters, girvanNewman, erdosRenyi } = require('graphology-generators/random')
const { florentineFamilies, karateClub } = require('graphology-generators/social')

const florentineFamilies_ = () => {
  return florentineFamilies(Graph)
}

const karateClub_ = () => {
  return karateClub(Graph)
}

const ladder_ = length => {
  return ladder(Graph, length)
}

const caveman_ = (ncomponents, order) => {
  return caveman(Graph, ncomponents, order)
}

const connectedCaveman_ = (ncomponents, order) => {
  return connectedCaveman(Graph, ncomponents, order)
}

const clusters_ = (order, size, clustersCount, clusterDensity) => {
  return clusters(Graph, { order, size, clusters: clustersCount, clusterDensity })
}

const girvanNewman_ = (zOut) => {
  // don't work in simple visualization for zOut >= 8
  return girvanNewman(Graph, { zOut: zOut })
}

const erdosRenyi_ = (order, probability) => {
  return erdosRenyi(Graph, { order, probability })
}

const minimal = () => {
  const graph = new Graph()
  graph.addNode('John')
  graph.addNode('Martha')
  graph.addEdge('John', 'Martha')
  return graph
}

module.exports = {
  use: {
    // most simple:
    minimal,
    ladder: ladder_,
    // community:
    caveman: caveman_,
    connectedCaveman: connectedCaveman_,
    // random:
    clusters: clusters_,
    girvanNewman: girvanNewman_,
    erdosRenyi: erdosRenyi_,
    // social:
    florentineFamilies: florentineFamilies_,
    karateClub: karateClub_
  }
}
