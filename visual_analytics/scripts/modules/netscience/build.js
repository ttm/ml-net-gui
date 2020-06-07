const Graph = require('graphology')

const buildFromSparql = (members, friendships) => {
  // specialized to build network from members and friendships as returned by sparql queries in losd
  const net = new Graph()
  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    net.addNode(member.p.value, { name: member.n.value })
  }
  for (let i = 0; i < friendships.length; i++) {
    const friendship = friendships[i]
    const p1 = friendship.p1.value
    const p2 = friendship.p2.value
    if (!net.hasEdge(p1, p2)) {
      net.addUndirectedEdge(p1, p2)
    }
  }
  return net
}

module.exports = { buildFromSparql }
