const Graph = require('graphology')
exports.you = () => 'man';

exports.net = [1,2,3];

// fixme: develop and use synth
exports.synth = (size, p) => {
  const graph = new Graph()
  for (let i = 0; i < size; i++) {
    graph.addNode(i)
    graph.forEachNode( (key, attr) => {
      if (Math.random() < p) {
        graph.addEdge(i, key)
      }
    })
  }
  return graph
}

const graph = new Graph()
graph.addNode('John')
graph.addNode('Martha')
graph.addEdge('John', 'Martha')
exports.net2 = graph
