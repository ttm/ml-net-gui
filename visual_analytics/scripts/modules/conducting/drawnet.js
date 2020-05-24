class DrawnNet {
  constructor (drawer, net, positions = [], wh = []) {
    if (positions.length === 0) {
      net.forEachNode((key, attr) => {
        positions.push([Math.random(), Math.random()])
      })
      console.log('random positions assigned')
    }
    if (wh.length === 0) {
      wh = [drawer.width, drawer.height]
    }
    this._plot(net, drawer, positions, wh)
    console.log('net drawn')
  }

  _plot (net, drawer, positions, wh) {
    net.forEachNode((key, attr) => {
      const node = drawer.mkNode()
      node.x = positions[key][0] * wh[0]
      node.y = positions[key][1] * wh[1]
      net.setNodeAttribute(key, 'pixiElement', node)
      console.log(node.x, node.y, positions[key][0])
    })
    net.forEachEdge((key, attr, source, target, sourceAttr, targetAttr) => {
      console.log(
        sourceAttr.pixiElement,
        targetAttr.pixiElement
      )
      drawer.mkLink(
        sourceAttr.pixiElement,
        targetAttr.pixiElement
      )
    })
  }
}

module.exports = { use: { DrawnNet } }
