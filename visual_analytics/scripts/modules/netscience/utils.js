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

module.exports = { nodesDegreeOrder, loadJsonString }
