/* global wand */
const PIXI = require('./pixi').PIXI

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight * 0.85,
  // transparent: true
  backgroundColor: 0x000000
})
app.stage.sortableChildren = true

// const sprites = new PIXI.ParticleContainer(10000, {
//   scale: true,
//   position: true,
//   rotation: true,
//   uvs: true,
//   alpha: true
// })
// app.stage.addChild(sprites)
// app.psys = sprites

const mkPaths = function (radius) {
  const dx = Math.cos(Math.PI / 6) * radius
  const dy = Math.sin(Math.PI / 6) * radius
  const p1x = 0
  const p1y = -radius
  const p2x = +dx
  const p2y = +dy
  const p3x = -dx
  const p3y = +dy
  const path = [p1x, p1y, p2x, p2y, p3x, p3y]

  const r = radius
  const pathrect = [-r, -r, -r, r, r, r, r, -r]

  const an = Math.PI / 3
  const s = Math.sin(an)
  const c = Math.cos(an)
  const pathhex = [
    r, 0,
    r * c, -r * s,
    -r * c, -r * s,
    -r, 0,
    -r * c, r * s,
    r * c, r * s
  ]

  return {
    tri: path,
    rect: pathrect,
    hex: pathhex,
    radius,
    dx,
    dy
  }
}

const paths = mkPaths(10)

function mkNode (ntype = 'tri', color = 0xff0000, version = 1) {
  // fixme: add line to nodes border (linetype should suffice)
  const path = paths[ntype]
  const v = new PIXI.Graphics()
  v.beginFill(0xffffff)
  v.alpha = 0.4
  v.scale.set(0.7)
  v.drawPolygon(path)
  v.endFill()
  v.tint = color
  v.zIndex = 100
  v.interactive = true
  v.mpath = path
  app.stage.addChild(v) // fixme: use internal container?
  // app.psys.addChild(v) // fixme: use internal container?

  if (version === 1) {
    v.on('pointerover', () => {
      if (!v.scaleBlock) {
        v.scale.set(1.5 * (v.currentScale || wand.extra.nodesSize || 1))
        // v.alpha = 0.9
      }
    })
    v.on('pointerout', () => {
      if (!v.scaleBlock) {
        v.scale.set(v.currentScale || wand.extra.nodesSize || 1)
        // v.alpha = 0.4
      }
    })
  }
  //   .on('pointerdown', clickNode)
  //   .on('pointerup', releaseNode)
  //   .on('pointerupoutside', releaseNode2)
  //   .on('pointermove', moveNode);
  window.vvv = v
  return v
}

function mkText (text, pos) {
  const texto = new PIXI.Text(
    text,
    { fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center' }
  )
  texto.tint = 0x00ff00
  texto.x = pos[0]
  texto.y = pos[1]
  texto.zIndex = 1000
  app.stage.addChild(texto)
  return texto
}

function mkTextBetter (
  {
    text = 'abanana',
    fontFamily = 'Arial',
    fontSize = 15,
    color = 0x00ff00,
    pos = [100, 100],
    zIndex = 1000,
    alpha = 1
  } = {
    text: 'hey',
    fontFamily: 'Arial',
    fontSize: 15,
    color: 0x00ff00,
    pos: [100, 100],
    zIndex: 1000,
    alpha: 1
  }) {
  const texto = new PIXI.Text(
    text,
    { fontFamily, fontSize, fill: 0xffffff, align: 'center' }
  )
  texto.tint = color
  texto.x = pos[0]
  texto.y = pos[1]
  texto.zIndex = zIndex
  texto.alpha = alpha
  app.stage.addChild(texto)
  return texto
}

function mkTextFancy (text, pos, fontSize = 15, color = 0x00ff00, zIndex = 300, alpha = 1) {
  const texto = new PIXI.Text(
    text,
    { fontFamily: 'Arial', fontSize, fill: 0xffffff, align: 'center', wordWrap: true, wordWrapWidth: wand.artist.use.width * 0.7 }
  )
  texto.tint = color
  texto.x = pos[0]
  texto.y = pos[1]
  texto.alpha = alpha
  texto.zIndex = zIndex
  app.stage.addChild(texto)
  return texto
}

function mkLink (p1, p2, weight = 1, level = 0, tint = 0xff0000) {
  const line = new PIXI.Graphics()
  // fixme: how to map [1, 10] linewidth to resolution and screensize?
  // this was performed in a previous implementation with this ad-hoc-found relation:
  // line.lineStyle(1 + (9 * weight / this.max_weights[level_]) / (this.networks.length - level_) , 0xFFFFFF);
  line.lineStyle(1, 0xffffff) // always 1 pixel width white.
  // fixme: make/migrate colors/palletes to be used.  e.g. line.tint = this.colors[level_];
  line.tint = tint
  line.mtint = tint
  line.mlevel = level
  line.moveTo(p1.x, p1.y)
  line.lineTo(p2.x, p2.y)
  line.alpha = 0.2
  line.p1 = p1
  line.zIndex = 1
  line.p2 = p2
  app.stage.addChild(line)
  return line
}

function updateLink (l) {
  l.clear()
  l.lineStyle(1, 0xffffff)
  // l.tint = l.mtint, not necessary, preserved
  l.alpha = l.balpha === undefined ? 0.2 : l.balpha
  l.zIndex = 1
  l.moveTo(l.p1.x, l.p1.y)
  l.lineTo(l.p2.x, l.p2.y)
}

function mkArrow (link) {
  // first, let's compute normalized vector for our link:
  const p1 = wand.currentNetwork.getNodeAttribute(link.from, 'pixiElement')
  const p2 = wand.currentNetwork.getNodeAttribute(link.to, 'pixiElement')
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const l = Math.sqrt(dx * dx + dy * dy)

  if (l === 0) return // if length is 0 - can't render arrows

  // This is our normal vector. It describes direction of the graph
  // link, and has length == 1:
  const nx = dx / l
  const ny = dy / l

  // Now let's draw the arrow:
  const arrowLength = 26 // Length of the arrow
  const arrowWingsLength = 12 // How far arrow wings are from the link?

  // This is where arrow should end. We do `(l - NODE_WIDTH)` to
  // make sure it ends before the node UI element.
  const NODE_WIDTH = 15
  const ex = p1.x + nx * (l - NODE_WIDTH)
  const ey = p1.y + ny * (l - NODE_WIDTH)

  // Offset on the graph link, where arrow wings should be
  const sx = p1.x + nx * (l - NODE_WIDTH - arrowLength)
  const sy = p1.y + ny * (l - NODE_WIDTH - arrowLength)

  // orthogonal vector to the link vector is easy to compute:
  const topX = -ny
  const topY = nx

  // Let's draw the arrow:
  const graphics = new wand.magic.PIXI.Graphics()
  // graphics.lineStyle(1, 0xcccccc, 1)
  graphics.lineStyle(1, 0xcccccc)

  graphics.moveTo(ex, ey)
  graphics.lineTo(sx + topX * arrowWingsLength, sy + topY * arrowWingsLength)
  graphics.moveTo(ex, ey)
  graphics.lineTo(sx - topX * arrowWingsLength, sy - topY * arrowWingsLength)
  wand.magic.app.stage.addChild(graphics)
  window.ggg = graphics
  return graphics
}

app.ticker.add((delta) => { // delta is 1 for 60 fps
  // would or might need to change zIndex:
  // app.renderer.render(app.stage)
})
document.body.appendChild(app.view)

function defaultLinkRenderer (link) {
  // first, let's compute normalized vector for our link:
  const p1 = wand.currentNetwork.getNodeAttribute(link.from, 'pixiElement')
  const p2 = wand.currentNetwork.getNodeAttribute(link.to, 'pixiElement')
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const l = Math.sqrt(dx * dx + dy * dy)

  if (l === 0) return // if length is 0 - can't render arrows

  // This is our normal vector. It describes direction of the graph
  // link, and has length == 1:
  const nx = dx / l
  const ny = dy / l

  // Now let's draw the arrow:
  const arrowLength = 13 // 26 // Length of the arrow
  const arrowWingsLength = 6 // 12 // How far arrow wings are from the link?

  // This is where arrow should end. We do `(l - NODE_WIDTH)` to
  // make sure it ends before the node UI element.
  const NODE_WIDTH = 15
  const ex = p1.x + nx * (l - NODE_WIDTH)
  const ey = p1.y + ny * (l - NODE_WIDTH)

  // Offset on the graph link, where arrow wings should be
  const sx = p1.x + nx * (l - NODE_WIDTH - arrowLength)
  const sy = p1.y + ny * (l - NODE_WIDTH - arrowLength)

  // orthogonal vector to the link vector is easy to compute:
  const topX = -ny
  const topY = nx

  // Let's draw the arrow:
  const graphics = new wand.magic.PIXI.Graphics()
  // graphics.lineStyle(1, 0xcccccc, 1)
  graphics.lineStyle(1, 0xcccccc, 1)

  graphics.moveTo(ex, ey)
  graphics.lineTo(sx + topX * arrowWingsLength, sy + topY * arrowWingsLength)
  graphics.moveTo(ex, ey)
  graphics.lineTo(sx - topX * arrowWingsLength, sy - topY * arrowWingsLength)
  wand.magic.app.stage.addChild(graphics)
  graphics.zIndex = 20000
  window.ggg = graphics
  return graphics
}

exports.use = { mkNode, mkLink, mkText, mkPaths, updateLink, mkTextFancy, mkTextBetter, mkArrow, defaultLinkRenderer }
exports.share = { app, paths, PIXI }
