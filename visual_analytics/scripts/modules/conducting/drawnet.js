/* global wand */
// this file has basics for drawing a network, which includes obtaining layouts

// import forceAtlas2 from 'graphology-layout-forceatlas2'
const { random, circular } = require('graphology-layout')
const forceAtlas2 = require('graphology-layout-forceatlas2')
// todo: use this webworker to animate layout while changing settings:
// todo: check implementation as web worker of the package to learn and explore:
// const FA2Layout = require('graphology-layout-forceatlas2/worker')

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

const makeLayouts = (net, wh, border) => {
  const random_ = random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  const layouts = {
    random: random_,
    circular: circular(net, { center: 0.75, scale: 0.5 }),
    atlas: scale(forceAtlas2(net,
      // todo: explore settings to optimize and result enhancements:
      { iterations: 150, settings: saneSettings }
    ))
  }
  scaleLayoutsToCanvas(layouts, wh, border)
  return layouts
}

const scaleLayoutsToCanvas = (layouts, wh, border) => {
  const layoutNames = Object.keys(layouts)
  const nodes = Object.keys(layouts[layoutNames[0]])
  const size = nodes.length
  const wh_ = wh.map(i => i * (1 - border))
  const border_ = wh.map(i => i * border / 2)
  window.layouts = layouts
  for (let i = 0; i < layoutNames.length; i++) {
    const name = layoutNames[i]
    for (let j = 0; j < size; j++) {
      const pos = layouts[name][nodes[j]]
      const x = pos.x * wh_[0] + border_[0] + (wand.extra.winDim[0] - wh[0]) / 2
      const y = pos.y * wh_[1] + border_[1] + (wand.extra.winDim[1] - wh[1]) / 2
      layouts[name][nodes[j]].x = x
      layouts[name][nodes[j]].y = y
    }
  }
}

class DrawnNet {
  constructor (drawer, net, wh = [], layouts = [], border = 0.1) {
    if (wh.length === 0) {
      wh = wand.extra.winDim
    }
    if (layouts.length === 0) {
      layouts = makeLayouts(net, wh, border)
    }
    this._plot(net, drawer, layouts.atlas)
    console.log('net drawn')
    this.layouts = layouts
    this.net = net
  }

  remove () {
    this.net.forEachNode((n, a) => {
      a.pixiElement.destroy()
      // a.textElement.destroy()
    })
    this.net.forEachEdge((n, a) => a.pixiElement.destroy())
  }

  _plot (net, drawer, layout) {
    net.forEachNode((key, attr) => {
      const node = drawer.mkNode()
      node.x = layout[key].x
      node.y = layout[key].y
      attr.pixiElement = node
    })
    net.forEachEdge((key, attr, source, target, sourceAttr, targetAttr) => {
      attr.pixiElement = drawer.mkLink(
        sourceAttr.pixiElement, targetAttr.pixiElement,
        1, -1, 0xffff00
      )
    })
  }
}

module.exports = { use: { DrawnNet } }
