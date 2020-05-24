// import forceAtlas2 from 'graphology-layout-forceatlas2'
const { random, circular } = require('graphology-layout')
const forceAtlas2 = require('graphology-layout-forceatlas2')
// todo: use this webworker to animate layout while changing settings:
// todo: check implementation as web worker of the package to learn and explore:
// const FA2Layout = require('graphology-layout-forceatlas2/worker')
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
    positions[key].x = (positions[key].x - minx) / (maxx - minx)
    positions[key].y = (positions[key].y - miny) / (maxy - miny)
  })
  return positions
}

const makeLayouts = net => {
  const random_ = random.assign(net)
  window.saneSettings = forceAtlas2.inferSettings(net)
  return {
    random: random_,
    circular: circular(net, { center: 0.75, scale: 0.5 }),
    atlas: scale(forceAtlas2(net,
      // todo: explore settings to optimize and result enhancements:
      { iterations: 150, settings: window.saneSettings }
    ))
  }
}

class DrawnNet {
  constructor (drawer, net, wh = [], layouts = [], border = 0.1) {
    if (layouts.length === 0) {
      layouts = makeLayouts(net)
    }
    window.layouts = layouts

    if (wh.length === 0) {
      wh = [drawer.width, drawer.height]
    }
    this._plot(net, drawer, wh, layouts.atlas, border)
    console.log('net drawn')
  }

  _plot (net, drawer, wh, layout, border) {
    const wh_ = wh.map(i => i * (1 - border))
    const border_ = wh.map(i => i * border / 2)
    net.forEachNode((key, attr) => {
      const node = drawer.mkNode()
      node.x = layout[key].x * wh_[0] + border_[0]
      node.y = layout[key].y * wh_[1] + border_[1]
      net.setNodeAttribute(key, 'pixiElement', node)
    })
    net.forEachEdge((key, attr, source, target, sourceAttr, targetAttr) => {
      drawer.mkLink(
        sourceAttr.pixiElement, targetAttr.pixiElement,
        1, -1, 0xffff00
      )
    })
  }
}

module.exports = { use: { DrawnNet } }
