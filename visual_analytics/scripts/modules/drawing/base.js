/* global wand */
const PIXI = require('./pixi').PIXI

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight * 0.95,
  // transparent: true
  backgroundColor: 0x000000
})
app.stage.sortableChildren = true

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
  texto.zIndex = 10
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
    zIndex = 10,
    alpha = 1
  } = {
    text: 'hey',
    fontFamily: 'Arial',
    fontSize: 15,
    color: 0x00ff00,
    pos: [100, 100],
    zIndex: 10,
    alpha: 1
  }) {
  const texto = new PIXI.Text(
    text,
    { fontFamily, fontSize, fill: 0xffffff, align: 'center' }
  )
  texto.tint = color
  texto.x = pos[0]
  texto.y = pos[1]
  texto.zIndex = 10
  app.stage.addChild(texto)
  return texto
}

function mkTextFancy (text, pos, fontSize = 15, color = 0x00ff00, zIndex = 300, alpha = 1) {
  const texto = new PIXI.Text(
    text,
    { fontFamily: 'Arial', fontSize, fill: 0xffffff, align: 'center' }
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
  l.alpha = 0.2
  l.zIndex = 1
  l.moveTo(l.p1.x, l.p1.y)
  l.lineTo(l.p2.x, l.p2.y)
}

app.ticker.add((delta) => { // delta is 1 for 60 fps
  // would or might need to change zIndex:
  // app.renderer.render(app.stage)
})
document.body.appendChild(app.view)

exports.use = { mkNode, mkLink, mkText, mkPaths, updateLink, mkTextFancy, mkTextBetter }
exports.share = { app, paths, PIXI }
