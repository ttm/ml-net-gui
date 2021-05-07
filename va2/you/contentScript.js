const Graph = require('graphology')
function mkGraph () {
  const graph = new Graph()
  graph.addNode('one', { name: 'aname' })
  graph.addNode('two', { name: 'nothername' })
  graph.addUndirectedEdge('one', 'two')
  console.log(graph.export())
}
mkGraph()
