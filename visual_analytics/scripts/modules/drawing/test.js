const oneNode = function (use) {
  let n = use.mkNode('rect', 0x0000ff)
  n.x = 100
  n.y = 200
  n = use.mkNode('hex', 0x00ffff)
  n.x = 150
  n.y = 150
}
const basicElements = function (use) {
  const n1 = use.mkNode()
  n1.x = 100
  n1.y = 100
  const n2 = use.mkNode()
  n2.x = 200
  n2.y = 200
  const l = use.mkLink(n1, n2)
  const t = use.mkText('a banana', [100, 200])
  return [n1, n2, l, t]
}

const backImage = function (ambience, PIXI, app) {
  ambience.placeBackgroundImage(PIXI, app)
}
const particleSprites = function (ambience, PIXI, app) {
  ambience.startParticleSprites(PIXI, app, 500, 0.4, 0)
  ambience.startParticleSprites(PIXI, app, 500, 0.4, 1)
}
const panels = function (ambience, app) {
  ambience.initBackgroundPanels(app)
}
const dancers = function (ambience, app) {
  ambience.initCanvasDancers(app)
}
exports.tests = { oneNode, basicElements, backImage, particleSprites, panels, dancers }
