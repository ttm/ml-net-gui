// this file holds helpers to enable animation

const rotateLayouts = (drawnNet, app, artist) => {
  const net = drawnNet.net
  let layouts = drawnNet.layouts
  window.lll = layouts
  layouts = Object.values(layouts)

  const totalPositions = 300
  const movingProportion = 0.5
  const nlayouts = layouts.length

  // per section, one section per layout ( == layout[x] -> layout[x+1]):
  const sectionPositions = totalPositions / nlayouts
  const movePositions = Math.floor(sectionPositions * movingProportion)
  const staticPositions = Math.floor(sectionPositions - movePositions)

  // there is one collection of sets of positions per node.
  // one set per layout, thus:
  // array[node][layout][position] = x, y
  const order = net.order
  console.log('HERE', order, nlayouts, movePositions, net, layouts)
  const nodeLayoutPositions = []
  for (let nodekey = 0; nodekey < order; nodekey++) {
    nodeLayoutPositions.push([])
    for (let i = 0; i < nlayouts; i++) {
      const layout1 = layouts[i]
      const layout2 = layouts[(i + 1) % nlayouts]
      nodeLayoutPositions[nodekey].push([])
      for (let j = 0; j < movePositions; j++) {
        const proportion = (movePositions - j) / movePositions
        const inverse = 1 - proportion
        const posx = proportion * layout1[nodekey].x + inverse * layout2[nodekey].x
        const posy = proportion * layout1[nodekey].y + inverse * layout2[nodekey].y
        console.log('MANNN', posx, posy, nodekey, j)
        nodeLayoutPositions[nodekey][i][j] = [posx, posy]
      }
    }
  }

  let positionCounter = 0
  window.nodeLayoutPositions = nodeLayoutPositions
  const sectionPositions_ = Math.floor(sectionPositions)
  let lock = false
  app.ticker.add((delta) => { // delta is 1 for 60 fps
    const section = Math.floor(positionCounter / sectionPositions)
    const positionInSection = positionCounter % sectionPositions_
    const ismoving = positionInSection > staticPositions
    // console.log(ismoving, positionInSection, staticPositions)
    if (ismoving) {
      const positionInMovement = positionInSection - staticPositions
      net.forEachNode((key, attr) => {
        // console.log(key, positionInMovement, positionInSection, section, 'sectionHEYAAAA')
        attr.pixiElement.x = nodeLayoutPositions[key][section][positionInMovement][0]
        attr.pixiElement.y = nodeLayoutPositions[key][section][positionInMovement][1]

        // shake:
        // attr.pixiElement.x = attr.pixiElement.x + Math.random() * (Math.random() > 0.5 ? 1 : -1)
        // attr.pixiElement.y = attr.pixiElement.y + Math.random() * (Math.random() > 0.5 ? 1 : -1)

        // realtime:
        // const prop = positionInMovement / movePositions
        // attr.pixiElement.x = layouts[section][key].x * (1 - prop) + layouts[(section + 1) % nlayouts][key].x * prop
        // attr.pixiElement.y = layouts[section][key].y * (1 - prop) + layouts[(section + 1) % nlayouts][key].y * prop
      })
      net.forEachEdge((key, attr) => {
        artist.use.updateLink(attr.pixiElement)
      })
      lock = false
    } else {
      if (!lock) {
        net.forEachNode((key, attr) => {
          attr.pixiElement.x = layouts[section][key].x
          attr.pixiElement.y = layouts[section][key].y
        })
        net.forEachEdge((key, attr) => {
          artist.use.updateLink(attr.pixiElement)
        })
        lock = true
        console.log('AND LOCK')
      } else {
        net.forEachNode((key, attr) => {
          // wiggle:
          attr.pixiElement.x = attr.pixiElement.x + Math.random() * (Math.random() > 0.5 ? 1 : -1)
          attr.pixiElement.y = attr.pixiElement.y + Math.random() * (Math.random() > 0.5 ? 1 : -1)
        })
        net.forEachEdge((key, attr) => {
          artist.use.updateLink(attr.pixiElement)
        })
      }
    }
    positionCounter++
    positionCounter = positionCounter % totalPositions
  })
}

const blink = (net, app) => {
  app.ticker.add(delta => { // delta is 1 for 60 fps
    if (Math.random() < 0.7) {
      net.forEachNode((key, attr) => {
        if (Math.random() < 0.4) {
          attr.pixiElement.tint = 0xffffff * Math.random()
          attr.pixiElement.alpha = Math.random()
        }
      })
    }
  })
}

module.exports = { use: { rotateLayouts, blink } }
