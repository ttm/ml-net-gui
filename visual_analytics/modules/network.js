const Graph = require('graphology')

exports.basic = function () {
  return 'Network  hi!'
}

exports.initialize = function () {
  return 'network  initialized!'
}

exports.synth_erdos_renyi = function (size, p) {
  const graph = new Graph()
  const nodes = []
  const links = []
  for (let node1 = 0; node1 < size; node1++) {
    for (let node2 = 0; node2 < nodes.length; node2++) {
      links.push([node1, node2])
    }
    nodes.push(node1)
  }
  graph.addNode('John')
  graph.addNode('Martha')
  graph.addEdge('John', 'Martha')
  return 'network  initialized!'
}
