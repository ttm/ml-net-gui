/* global performance, wand */
// this file holds helpers to enable animation

const chooseUnique = require('../utils.js').chooseUnique

const rotateLayouts = (drawnNet, app, artist, totalPositions = 300) => {
  const net = drawnNet.net
  let layouts = drawnNet.layouts
  window.lll = layouts
  layouts = Object.values(layouts)

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
        nodeLayoutPositions[nodekey][i][j] = [posx, posy]
      }
    }
  }

  let positionCounter = 0
  const sectionPositions_ = Math.floor(sectionPositions)
  let lock = false
  const anim = delta => { // delta is 1 for 60 fps
    const section = Math.floor(positionCounter / sectionPositions)
    const positionInSection = positionCounter % sectionPositions_
    const ismoving = positionInSection > staticPositions
    if (ismoving) {
      const positionInMovement = positionInSection - staticPositions
      net.forEachNode((key, attr) => {
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
  }
  app.ticker.add(anim)
  return anim
}

const blink = (net, app) => {
  const anim = delta => { // delta is 1 for 60 fps
    if (Math.random() < 0.7) {
      net.forEachNode((key, attr) => {
        if (Math.random() < 0.4) {
          attr.pixiElement.tint = 0xffffff * Math.random()
          attr.pixiElement.alpha = Math.random()
        }
      })
    }
  }
  app.ticker.add(anim)
  return anim
}

function showMembers (net, artist, alternate = false) {
  net.forEachNode((key, attr) => {
    const text = artist.use.mkTextBetter({
      text: attr.name,
      pos: [attr.pixiElement.x, attr.pixiElement.y],
      fontSize: 35
    })
    attr.textElement = text
  })
  if (alternate) {
    const colorLoop = delta => {
      // delta is 1 for 60 fps
      if (Math.random() < 0.1) {
        net.forEachNode((key, attr) => {
          if (Math.random() < 0.1) {
            attr.textElement.tint = 0xffffff * Math.random()
            attr.textElement.alpha = Math.random()
          }
        })
      }
    }
    artist.share.draw.base.app.ticker.add(colorLoop)
    return colorLoop
  }
}

function showMembersAndBlink (net, artist, alternate = false) {
  // fixme: does not find the element to .scale(1) when network changes
  // fixme: not used or has a test
  net.forEachNode((key, attr) => {
    const text = artist.use.mkTextBetter({
      text: attr.name,
      pos: [attr.pixiElement.x, attr.pixiElement.y],
      fontSize: 35
    })
    attr.textElement = text
  })
  if (alternate) {
    const blinkMembers = delta => {
      // delta is 1 for 60 fps
      if (Math.random() < 0.1) {
        net.forEachNode((key, attr) => {
          if (Math.random() < 0.1 && !attr.blinking) {
            attr.blinking = true
            attr.textElement.tint = 0xffffff * Math.random()
            attr.textElement.alpha = Math.random()
            const color = attr.pixiElement.tint
            const now = performance.now()
            attr.pixiElement.scale.set(2)
            const id = setInterval(() => {
              if (!attr || !attr.pixiElement) {
                clearInterval(id)
                return
              }
              attr.pixiElement.tint = 0xffffff * Math.random()
              if (performance.now() - now > 500) {
                attr.pixiElement.tint = color
                attr.pixiElement.scale.set(1)
                delete attr.blinking
                clearInterval(id)
              }
            }, 100)
            window.iidd = id
          }
        })
      }
    }
    artist.share.draw.base.app.ticker.add(blinkMembers)
    return blinkMembers
  }
}

function blinkChangeColorsAndSayNames () {
  // fixme: not used nor tested
  const { artist, currentNetwork } = wand
  const net = currentNetwork

  this.sayNames = (density = 0.1) => {
    const nodes = net.nodes()
    let speaker = new wand.maestro.synths.Speaker()
    artist.share.draw.base.app.ticker.add(delta => {
      // delta is 1 for 60 fps
      if (Math.random() < density) {
        if (!speaker.synth.speaking) {
          const node = chooseUnique(nodes, 1)[0]
          const name = net.getNodeAttribute(node, 'name')
          speaker = new wand.maestro.synths.Speaker()
          speaker.play(name)
          window.speaker = speaker

          const textElement = net.getNodeAttribute(node, 'textElement')
          const pixiElement = net.getNodeAttribute(node, 'pixiElement')
          textElement.tint = 0xffffff * Math.random()
          textElement.alpha = Math.random()
          textElement.visible = true
          const color = pixiElement.tint
          const now = performance.now()
          pixiElement.scale.set(2)
          const id = setInterval(() => {
            pixiElement.tint = 0xffffff * Math.random()
            if (performance.now() - now > 500) {
              pixiElement.tint = color
              pixiElement.scale.set(1)
              clearInterval(id)
            }
          }, 100)
        } else {
          net.forEachNode((key, attr) => {
            if (Math.random() < 0.1) {
              attr.textElement.tint = 0xffffff * Math.random()
              attr.textElement.alpha = Math.random()
            }
          })
        }
      }
    })
  }
}

module.exports = { use: { rotateLayouts, blink, blinkChangeColorsAndSayNames, showMembersAndBlink, showMembers } }
