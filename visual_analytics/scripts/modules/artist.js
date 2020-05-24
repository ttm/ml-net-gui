var draw = require('./drawing/main.js')

const testArtist = () => {
  console.log(draw.use)
  draw.share.test.tests.backImage(draw.use.ambience, draw.share.base.PIXI, draw.share.base.app)
  draw.share.test.tests.particleSprites(draw.use.ambience, draw.share.base.PIXI, draw.share.base.app)
  draw.share.test.tests.panels(draw.use.ambience, draw.share.base.app)
  draw.share.test.tests.dancers(draw.use.ambience, draw.share.base.app)
  draw.share.test.tests.oneNode(draw.use)
  draw.share.test.tests.basicElements(draw.use)
}

const testBasic = () => {
  draw.share.test.tests.basicElements(draw.use)
}

module.exports = { use: draw.use, share: { draw: draw.share, testBasic, testArtist } }
