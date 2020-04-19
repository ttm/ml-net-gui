let oneNode = function (use) {
    let n = use.mkNode('rect', 0x0000ff)
    n.x = 100
    n.y = 200
    n = use.mkNode('hex', 0x00ffff)
    n.x = 150
    n.y = 150
}
let basicElements = function (use) {
    let n1 = use.mkNode()
    n1.x = 100
    n1.y = 100
    let n2 = use.mkNode()
    n2.x = 200
    n2.y = 200
    let l = use.mkLink(n1, n2)
    let t = use.mkText('a banana', [100, 200])
}

let backImage = function (ambience, PIXI, app) {
    ambience.placeBackgroundImage(PIXI, app)
}
let particleSprites = function (ambience, PIXI, app) {
    ambience.startParticleSprites(PIXI, app, 5, 0.4, 0)
    ambience.startParticleSprites(PIXI, app, 5, 0.4, 1)
}
let panels = function (ambience, app) {
    ambience.initBackgroundPanels(app)
}
let dancers = function (ambience, app) {
    ambience.initCanvasDancers(app)
}
exports.tests = { oneNode, basicElements, backImage, particleSprites, panels, dancers }
