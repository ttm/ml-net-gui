// import forceAtlas2 from 'graphology-layout-forceatlas2'
const { random, circular } = require('graphology-layout')
const forceAtlas2 = require('graphology-layout-forceatlas2')
const FA2Layout = require('graphology-layout-forceatlas2/worker')
window.fa = forceAtlas2

const scale = positions => {
  // scales force atlas 2 positions to [-1,1], compliant with builtin layouts
  const k = Object.values(positions)
  const kx = k.map(kk => kk.x)
  const ky = k.map(kk => kk.y)
  const maxx = Math.max(...kx)
  const minx = Math.min(...kx)
  const maxy = Math.max(...ky)
  const miny = Math.min(...ky)
  Object.keys(positions).forEach(key => {
    positions[key].x = 2 * ((positions[key].x - minx) / (maxx - minx)) - 1
    positions[key].y = 2 * ((positions[key].y - miny) / (maxy - miny)) - 1
  })
  return positions
}

class DrawnNet {
  constructor (drawer, net, layouts = [], wh = []) {
    const random_ = random.assign(net, { center: 0, scale: 2 })
    console.log('random positions assigned')
    window.saneSettings = forceAtlas2.inferSettings(net)
    layouts = {
      random: random_,
      circular: circular(net),
      atlas: scale(forceAtlas2(net,
        { iterations: 150, settings: window.saneSettings }
      ))
    }
    window.layouts = layouts

    if (wh.length === 0) {
      wh = [drawer.width, drawer.height]
    }
    this._plot(net, drawer, wh, layouts)
    console.log('net drawn')
  }

  _plot (net, drawer, wh, layouts) {
    net.forEachNode((key, attr) => {
      const node = drawer.mkNode()
      node.x = ((layouts.random[key].x + 1) / 2) * wh[0]
      node.y = ((layouts.random[key].y + 1) / 2) * wh[1]
      net.setNodeAttribute(key, 'pixiElement', node)
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
    return [forceAtlas2, FA2Layout]
  }
}

module.exports = { use: { DrawnNet } }
