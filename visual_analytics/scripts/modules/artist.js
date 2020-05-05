var draw = require('./drawing/main.js')

// fixme: move to page (path) test/
// after client-side router is in place.
// include usage of networks.
let testing = 1
if (testing) {
    console.log(draw.use)
    draw.share.test.tests.backImage(draw.use.ambience, draw.share.base.PIXI, draw.share.base.app)
    draw.share.test.tests.particleSprites(draw.use.ambience, draw.share.base.PIXI, draw.share.base.app)
    draw.share.test.tests.panels(draw.use.ambience, draw.share.base.app)
    draw.share.test.tests.dancers(draw.use.ambience, draw.share.base.app)
    draw.share.test.tests.oneNode(draw.use)
    draw.share.test.tests.basicElements(draw.use)
} else {
  // fixme: put in client router in path most-basic-init/
  draw.share.test.tests.basicElements(draw.use)
}

module.exports = { use: draw.use, share: draw.share }
