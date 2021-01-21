/* global wand */
const Graph = require('graphology')
const { erdosRenyi } = require('graphology-generators/random')
const PIXI = require('pixi.js')
const { random } = require('graphology-layout')
const forceAtlas2 = require('graphology-layout-forceatlas2')
const netdegree = require('graphology-metrics/degree')

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

e.buildFromSparql = (members, friendships) => {
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

e.plotFromSparql = (members, friendships) => {
  const net = e.buildFromSparql(members, friendships)
  netdegree.assign(net)
  const removedNodes = []
  net.forEachNode((n, a) => {
    if (a.degree === 0) {
      removedNodes.push({ n, a })
    }
  })
  removedNodes.forEach(v => {
    net.dropNode(v.n)
  })
  random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  const atlas = forceAtlas2(net, { iterations: 150, settings: saneSettings })
  scale(atlas)
  return { net, saneSettings, atlas }
}

function scale (positions) {
  const k = Object.values(positions)
  const kx = k.map(kk => kk.x)
  const ky = k.map(kk => kk.y)
  const maxx = Math.max(...kx)
  const minx = Math.min(...kx)
  const maxy = Math.max(...ky)
  const miny = Math.min(...ky)

  const [w_, h_] = [wand.app.renderer.width, wand.app.renderer.height]
  const w = w_ * 0.8
  const h = h_ * 0.8
  const w0 = w_ * 0.1
  const h0 = h_ * 0.1
  Object.keys(positions).forEach(key => {
    positions[key].x = w * (positions[key].x - minx) / (maxx - minx) + w0
    positions[key].y = h * (positions[key].y - miny) / (maxy - miny) + h0
  })
  return positions
}

e.ParticleNet2 = class { // using graphology net and positions as given by forceatlas2
  constructor (app, net, atlas) {
    this.mkContainers(app)
    this.mkTextures(app)
    this.plot(net, atlas, app)
    this.input = { app, net, atlas }
  }

  mkContainers (app) {
    this.nodeContainer = new PIXI.ParticleContainer(100000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    })
    console.log('INTERACTIVE:', this.nodeContainer.interactiveChildren)
    this.nodeContainer.interactiveChildren = true
    this.nodeContainer.interactive = true
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

  plot (net, atlas, app) {
    net.forEachNode((k, a) => {
      const p = atlas[k]
      const circle = new PIXI.Sprite(this.circleTexture)
      circle.x = p.x
      circle.y = p.y
      circle.anchor.x = 0.5
      circle.anchor.y = 0.5
      circle.interactive = true
      this.nodeContainer.addChild(circle)
      a.pixiElement = circle
      if (a.name) { // todo: implement rendering of the names on the fly
        const texto = new PIXI.Text(
          a.name,
          { fontFamily: 'Arial', fontSize: 35, fill: 0xffffff, align: 'center' }
        )

        texto.tint = 0x00ff00
        texto.x = p.x
        texto.y = p.y
        texto.zIndex = 1000
        texto.alpha = 0
        texto.interactive = true
        texto.hitArea = new PIXI.Rectangle(-5, -5, 10, 10)
        app.stage.addChild(texto)

        a.textElement = texto
        texto.on('pointerover', () => {
          console.log(a.name)
          texto.alpha = 1
        })
        texto.on('pointerout', () => {
          texto.alpha = 0
        })
      }
    })
    net.forEachEdge((e, a, s, t) => {
      this.mkEdge(atlas[s], atlas[t])
    })
  }

  mkEdge (pos1, pos2) {
    const line = new PIXI.Sprite(this.lineTexture)
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const length = (dx ** 2 + dy ** 2) ** 0.5
    line.scale.set(length / 1000, 1)
    const angle = Math.atan2(dy, dx)
    line.rotation = angle
    line.x = pos1.x
    line.y = pos1.y
    this.edgeContainer.addChild(line)
  }
}
