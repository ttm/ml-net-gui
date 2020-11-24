const Graph = require('graphology')
const { erdosRenyi } = require('graphology-generators/random')
const PIXI = require('pixi.js')

const e = module.exports

e.eR = (order, probability) => {
  return erdosRenyi(Graph, { order, probability })
}

e.ParticleNet = class {
  constructor (app, nodes, edges) {
    this.mkContainers(app)
    this.mkTextures(app)
    this.plot(nodes, edges)
    this.input = { app, nodes, edges }
  }

  mkContainers (app) {
    this.nodeContainer = new PIXI.ParticleContainer(100000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    })
    this.edgeContainer = new PIXI.ParticleContainer(10000000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    })
    app.stage.addChild(this.edgeContainer)
    app.stage.addChild(this.nodeContainer)
  }

  mkTextures (app) {
    const myLine = new PIXI.Graphics()
      .lineStyle(1, 0xff0000)
      .moveTo(0, 0)
      .lineTo(1000, 0)
    const myCircle = new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(0, 0, 5)
      .endFill()
    this.circleTexture = app.renderer.generateTexture(myCircle)
    this.lineTexture = app.renderer.generateTexture(myLine)
  }

  plot (nodes, edges) {
    nodes.forEach(n => this.mkNode(n))
    edges.forEach(e => this.mkEdge(nodes[e[0]], nodes[e[1]]))
  }

  mkNode (pos) {
    const circle = new PIXI.Sprite(this.circleTexture)
    circle.x = pos[0]
    circle.y = pos[1]
    circle.anchor.x = 0.5
    circle.anchor.y = 0.5
    this.nodeContainer.addChild(circle)
  }

  mkEdge (pos1, pos2) {
    const line = new PIXI.Sprite(this.lineTexture)
    const dx = pos2[0] - pos1[0]
    const dy = pos2[1] - pos1[1]
    const length = (dx ** 2 + dy ** 2) ** 0.5
    line.scale.set(length / 1000, 1)
    const angle = Math.atan2(dy, dx)
    line.rotation = angle
    line.x = pos1[0]
    line.y = pos1[1]
    this.edgeContainer.addChild(line)
  }
}
