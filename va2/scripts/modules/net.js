/* global wand */
const e = module.exports
const Graph = require('graphology')
const { erdosRenyi } = require('graphology-generators/random')
const PIXI = require('pixi.js')
const { random } = require('graphology-layout')
const forceAtlas2 = require('graphology-layout-forceatlas2')
const netdegree = require('graphology-metrics/degree')
const subGraph = e.subGraph = require('graphology-utils/subgraph')
const netmetrics = require('graphology-metrics')
const louvain = require('graphology-communities-louvain')
const components = require('graphology-components')

const { chooseUnique } = require('./utils')
const u = require('./router.js').urlArgument

e.netdegree = netdegree

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
      .lineStyle(1, 0xffffff)
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

e.buildFromMongo = (members, friendships) => {
  // minimal network from members and friendships as returned by OA
  const net = new Graph()
  for (let i = 0; i < members.length; i++) {
    const member = members[i]
    net.addNode(member.key, { name: member.attributes.name })
  }
  for (let i = 0; i < friendships.length; i++) {
    const friendship = friendships[i]
    const p1 = friendship.source
    const p2 = friendship.target
    if (!net.hasEdge(p1, p2)) {
      net.addUndirectedEdge(p1, p2)
    }
  }
  return net
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

e.plotFromMongo = (anet, app, keepUnscrapped) => {
  // const net = e.buildFromMongo(anet.nodes, anet.edges)
  let net = new Graph()
  net.import(anet)
  const removedNodes = []
  if (!keepUnscrapped) {
    net.forEachNode((n, a) => {
      if (!a.scrapped) removedNodes.push({ n, a })
    })
    removedNodes.forEach(v => net.dropNode(v.n))
  }
  net = e.getLargestComponent(net, true)
  // let removedNodes
  // do {
  //   netdegree.assign(net)
  //   removedNodes = []
  //   net.forEachNode((n, a) => {
  //     if (a.degree === 0 || !a.scrapped) {
  //       removedNodes.push({ n, a })
  //     }
  //   })
  //   removedNodes.forEach(v => {
  //     net.dropNode(v.n)
  //   })
  // } while (removedNodes.length > 0)
  netdegree.assign(net)
  random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  console.log('the settings:', saneSettings)
  // saneSettings.barnesHutTheta = 1.2
  // saneSettings.scalingRatio = 2
  const atlas = forceAtlas2(net, { iterations: parseInt(u('it')) || 150, settings: saneSettings })
  scale(atlas, app)
  return { net, saneSettings, atlas }
}

e.plotWhatsFromMongo = (data, creator, app, full) => {
  function mkId (n) {
    let name = n[1]
    let tel
    if (name) tel = n[0]
    else name = n[0]
    let anonCount = 0
    if (/^[\d ]*$/.test(name)) name = 'Anon-' + anonCount++
    else if (['you', 'você'].includes(name.toLowerCase())) name = creator || 'Anon-' + anonCount++
    return { name, tel }
  }
  let net = new Graph()
  data.forEach(([n1, n2]) => {
    const m1 = mkId(n1)
    const m2 = mkId(n2)
    if (m1.name === m2.name) return
    if (!net.hasNode(m1.name)) net.addNode(m1.name, m1)
    if (!net.hasNode(m2.name)) net.addNode(m2.name, m2)
    if (!net.hasUndirectedEdge(m1.name, m2.name)) net.addUndirectedEdge(m1.name, m2.name)
  })
  if (!full) net = e.getLargestComponent(net, true)
  netdegree.assign(net)
  random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  const atlas = forceAtlas2(net, { iterations: 150, settings: saneSettings })
  scale(atlas, app)
  return { net, saneSettings, atlas }
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

function scale (positions, app) {
  app = app || wand.app
  const k = Object.values(positions)
  const kx = k.map(kk => kk.x)
  const ky = k.map(kk => kk.y)
  const maxx = Math.max(...kx)
  const minx = Math.min(...kx)
  const maxy = Math.max(...ky)
  const miny = Math.min(...ky)

  const [w_, h_] = [app.renderer.width, app.renderer.height]
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
  constructor (app, net, atlas, interactive = true, bezier = false) {
    this.interactive = interactive
    this.mkContainers(app)
    this.mkTextures(app, bezier)
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
    this.nodeContainer.interactiveChildren = this.interactive
    this.nodeContainer.interactive = this.interactive
    this.edgeContainer = new PIXI.ParticleContainer(100000, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    })
    // this.edgeContainer = new PIXI.Container()
    app.stage.addChild(this.edgeContainer)
    app.stage.addChild(this.nodeContainer)
  }

  mkTextures (app, bezier) {
    const myCircle = new PIXI.Graphics()
      .beginFill(0xffffff)
      .drawCircle(0, 0, 50)
      .endFill()
    this.circleTexture = app.renderer.generateTexture(myCircle)
    const myLine = new PIXI.Graphics()
      .lineStyle(1, 0xffffff)
    if (bezier) setBezier(myLine)
    else {
      myLine
        .moveTo(0, 0)
        .lineTo(1000, 0)
    }
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
      circle.tint = 0x00ffff
      circle.scale.set(0.1)
      circle.interactive = this.interactive
      this.nodeContainer.addChild(circle)
      a.pixiElement = circle
      if (a.name) { // todo: implement rendering of the names on the fly
        const texto = new PIXI.Text(
          a.name,
          { fontFamily: 'Arial', fontSize: 35, fill: 0xffffff, align: 'center' }
        )

        texto.tint = 0xffffff
        texto.x = p.x
        texto.y = p.y
        texto.zIndex = 1000
        texto.alpha = 0
        texto.interactive = this.interactive
        texto.hitArea = new PIXI.Rectangle(-5, -5, 10, 10)
        app.stage.addChild(texto)

        a.textElement = texto
        texto.on('pointerover', () => {
          texto.alpha = 1
        })
        texto.on('pointerout', () => {
          texto.alpha = 0
        })
      }
    })
    net.forEachEdge((e, a, s, t) => {
      a.pixiElement = this.mkEdge(atlas[s], atlas[t]) // , 1, 0, 0xff0000, app)
    })
  }

  mkLink (p1, p2, weight = 1, level = 0, tint = 0xff0000, app = undefined) {
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
    line.tint = 0xff00ff
    this.edgeContainer.addChild(line)
    return line
  }

  hide () {
    this.input.net.forEachNode((k, a) => {
      a.pixiElement.alpha = 0
    })
    this.input.net.forEachEdge((k, a) => {
      a.pixiElement.alpha = 0
    })
  }
}

e.getComponent = (net, seed, size) => {
  const nodes = [seed]
  let possibleNodes = net.neighbors(seed)
  while (nodes.length < size && possibleNodes.length > 0) {
    const newNode = chooseUnique(possibleNodes, 1)[0]
    nodes.push(newNode)
    possibleNodes.push(...net.neighbors(newNode))
    possibleNodes = possibleNodes.filter(n => !nodes.includes(n))
  }
  const sg = subGraph(net, nodes).copy()
  e.assignDistances(sg, seed)
  return sg
}

e.getSubGraph = (net, nodes) => {
  return subGraph(net, nodes).copy()
}

e.assignDistances = (g, seed) => {
  // has to be connected
  g.setNodeAttribute(seed, 'ndist', 0)
  const nodes = [seed]
  let border = [seed]
  let border_
  let distance = 1
  while (nodes.length !== g.order) {
    border_ = []
    border.forEach(bn => {
      g.forEachNeighbor(bn, (n, a) => {
        if (!nodes.includes(n)) {
          a.ndist = distance
          nodes.push(n)
          border_.push(n)
        }
      })
    })
    distance++
    border = border_.slice()
  }
  g.ndist = netmetrics.extent(g, 'ndist')
  g.h_ = 0.8 / distance--
  g.forEachNode((n, a) => {
    if (a.ndist === distance) g.target = a
    a.ndist_ = a.ndist / g.ndist[1]
    a.ndist__ = a.ndist_ * (0.8 - g.h_) + 0.1
  })
  g.ndist_ = netmetrics.extent(g, 'ndist_')
  g.ndist__ = netmetrics.extent(g, 'ndist__')
  // g.vals_ = vals.sort().map(i => 0.9 * i / g.ndist[1])
  // g.forEachNode((n, a) => {
  //   a.index = g.vals_.findIndex(i => i > a.ndist_)
  // })
}

e.mkCommunities = g => {
  // const gg = components.connectedComponents(g)
  // let gg_ = []
  // for (let i = 0; i < gg.length; i++) {
  //   if (gg[i].length > gg_.length) {
  //     gg_ = gg[i]
  //   }
  // }
  // const sg = subGraph(g, gg_).copy()
  const sg = g
  netdegree.assign(sg)
  netmetrics.centrality.degree.assign(sg)
  sg.communities = louvain.detailed(sg)
  const communitySizes = new Array(sg.communities.count).fill(0)
  for (const key in sg.communities.communities) {
    const index = sg.communities.communities[key]
    sg.setNodeAttribute(key, 'community', index)
    communitySizes[index]++
  }
  sg.communities.sizes = {
    all: communitySizes,
    max: Math.max(...communitySizes),
    min: Math.min(...communitySizes)
  }
  return sg
}

e.getLargestComponent = (g, returnNet) => {
  const gg = components.connectedComponents(g)
  let gg_ = []
  for (let i = 0; i < gg.length; i++) {
    if (gg[i].length > gg_.length) {
      gg_ = gg[i]
    }
  }
  return returnNet ? subGraph(g, gg_).copy() : gg_
}

e.removeNode = (g, n) => {
  g.getNodeAttribute(n, 'pixiElement').destroy()
  g.forEachEdge(n, (e, ea) => {
    ea.pixiElement.destroy()
  })
  g.dropNode(n)
}

e.plotSync = (data, app, toDraw = true) => {
  const key = data.source === 'fb' ? 'id' : 'name'
  const net = new Graph()
  data.nodes.forEach(n => net.addNode(n[key], n))
  data.links.forEach(step => {
    step.forEach(link => {
      net.addEdge(link.from, link.to)
    })
  })
  if (!toDraw) return net
  netdegree.assign(net)
  random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  console.log('bef fa')
  const atlas = forceAtlas2(net, { iterations: 150, settings: saneSettings })
  console.log('aft fa')
  scale(atlas, app)
  return { net, saneSettings, atlas }
}

e.attrNet = (net, app) => { // to be used with e.plotSync(data, --, false)
  netdegree.assign(net)
  random.assign(net)
  const saneSettings = forceAtlas2.inferSettings(net)
  const atlas = forceAtlas2(net, { iterations: 150, settings: saneSettings })
  scale(atlas, app)
  return { net, saneSettings, atlas }
}

function setBezier (bezier, xd = 1000, yd = 0, dx1 = 0.25, dy1 = 30, dx2 = 0.75, dy2 = 30) {
  bezier.position.x = 0
  bezier.position.y = 0
  const localDest = { x: xd, y: yd }
  const cp1 = { x: localDest.x * dx1, y: dy1 }
  const cp2 = { x: localDest.x * dx2, y: dy2 }
  bezier.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, localDest.x, localDest.y)
}

e.assignCC = net => net.forEachNode((n, a) => {
  if (a.degree < 2) a.cc = 0
  else {
    const sg = e.subGraph(net, [...net.neighbors(n), n])
    a.cc = 2 * (sg.size - a.degree) / (a.degree * (a.degree - 1))
  }
})
