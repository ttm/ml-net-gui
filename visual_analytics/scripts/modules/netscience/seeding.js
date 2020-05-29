// 1) choose nodes which are among the less connected in the largest component which are farthest apart
// 2) choose up to b=5 neighbors to be activated by criterion (implement random)
// 3) such b neighbors are nodes to be collapsed into the supernode
// 4) repeat 2-3 until only the seeds are not collapsed or only lonly nodes are left to be supernodes.

const chooseUnique = require('../utils.js').chooseUnique

const random = (net, n = 5) => {
  return chooseUnique(net.nodes(), n)
}

module.exports = { use: { random } }
