const Graph = require('graphology')
let scale_free = (size, p) => {  // barabasi-albert model
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

let binomial = (size, p) => {  // erdos-renyi model
  const graph = new Graph()
  for (let i = 0; i < size; i++) {
    graph.addNode(i)
  }
  for (let i = 0; i < size - 1; i++) {
    for (let j = i + 1; j < size; j++) {
      if (Math.random() < p) {
        graph.addEdge(i, j)
      }
    }
  }
  return graph
}

let minimal = () => {
  const graph = new Graph()
  graph.addNode('John')
  graph.addNode('Martha')
  graph.addEdge('John', 'Martha')
  return graph
}

module.exports = {use: {binomial, scale_free, minimal}}
