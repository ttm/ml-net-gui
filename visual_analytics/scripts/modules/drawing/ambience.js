const particleSprites = require('./particle_sprites')
const panels = require('./panels')
const dancers = require('./dancers')

const chooseUnique = require('../utils').chooseUnique

const placeBackgroundImage = function (PIXI, app) {
  const landsScape = new PIXI.Sprite(
    PIXI.Texture.from(
      // fixme: better names for the images folders?
      'assets/images/back0/' + chooseUnique([
        'business.jpg',
        'alieneye.jpg',
        'cows3.jpg',
        'cows3.jpg',
        'cows.jpg',
        'extasy.jpg',
        'indu.jpg',
        'jumbo.jpg',
        'saints.jpg',
        'saints2.jpg',
        'saints3.jpg',
        'sheep.jpg'
      ], 1
      )[0]
    )
  )
  landsScape.width = app.view.width
  landsScape.height = app.view.height
  landsScape.tint = 0xaaaaaa
  app.stage.addChild(landsScape)
}

exports.use = { placeBackgroundImage, startParticleSprites: particleSprites.use.startParticleSprites, initBackgroundPanels: panels.use.initBackgroundPanels, initCanvasDancers: dancers.use.initCanvasDancers }
