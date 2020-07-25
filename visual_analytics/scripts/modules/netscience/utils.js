const Graph = require('graphology')
const utils = require('../utils.js')

function nodesDegreeOrder (net, nodes, increase = false) {
  // todo: check increase order
  if (increase === 'random') {
    utils.inplaceShuffle(nodes)
    return nodes
  }
  const degrees = nodes.map(n => {
    return { degree: net.degree(n), id: n }
  })
  degrees.sort((i, j) => {
    if (increase === 'greedy') {
      return i.degree - j.degree
    } else {
      return j.degree - i.degree
    }
  })
  return degrees.map(i => i.id)
}

const loadJsonString = s => {
  const agraph = new Graph()
  agraph.import(JSON.parse(s))
  return agraph
}

const mergeGraphs = graphSequence => {
  const g = new Graph.UndirectedGraph({ multi: false, allowSelfLoops: false })
  window.gggg = g
  graphSequence.forEach(ag => {
    ag.forEachNode((n, a) => {
      // console.log('merging node', n, a.name)
      g.mergeNode(n, a)
    })
    ag.forEachEdge((e, ea, s, t, sa, ta) => {
      // console.log('merging edge', a)
      // console.log('edge:', e, ea, s, sa, t, ta)
      if (!g.hasEdge(s, t) && s !== t) {
        g.addUndirectedEdge(s, t)
      }
    })
  })
  return g
}

module.exports = { nodesDegreeOrder, loadJsonString, mergeGraphs }
