const PIXI = require('./pixi').PIXI
const chooseUnique = require('./utils').chooseUnique
const moveSprite = require('./interaction_helpers').moveSprite

const initCanvasDancers = function (app) {
  // todo: tweak parameters, make function parametrizable.

  const isoScalingContainer = new PIXI.Container()
  isoScalingContainer.scale.y = 0.5
  isoScalingContainer.position.set(app.screen.width * 0.505, app.screen.height * 0.865)
  app.stage.addChild(isoScalingContainer)

  const isometryPlane = new PIXI.Graphics()
  isometryPlane.sortableChildren = true
  isometryPlane.rotation = Math.PI / 4
  isoScalingContainer.addChild(isometryPlane)

  isometryPlane.lineStyle(2, 0xff00ff)
  for (let i = 0; i < 100; i += 100) {
    isometryPlane.moveTo(-150, i)
    isometryPlane.lineTo(150, i)
    isometryPlane.moveTo(i, -150)
    isometryPlane.lineTo(i, 150)
  }
  isometryPlane.drawCircle(0, 0, 100)

  const mscale = 0.4
  const fire = new PIXI.Graphics()
  fire.beginFill(0xFFFFFF)
  fire.drawCircle(0, 0, 170)
  fire.endFill()
  fire.scale.set(0.5 * mscale, 0.7 * mscale)
  fire.x = isometryPlane.x / 2
  fire.y = isometryPlane.y / 2
  isometryPlane.addChild(fire)

  const backdancers = []
  // todo: make other sets of images.
  const filenames = ['angel.jpeg', 'chief.jpg', 'fish.png', 'hand.jpeg', 'hand.png', 'mickey.png', 'mine.jpg', 'queen.png', 'queen2.png', 'toad.png']
  filenames.forEach(filename => {
    const containerSprite = new PIXI.projection.Sprite2d(
      PIXI.Texture.from('assets/images/sprites/' + filename)
    )
    containerSprite.mfilename = filename
    containerSprite.anchor.set(0.5, 1.0)
    containerSprite.proj.affine = PIXI.projection.AFFINE.AXIS_X

    containerSprite.scale.set(0.3 * mscale, 0.5 * mscale)
    backdancers.push(containerSprite)
  })
  const backdancers_ = chooseUnique(backdancers).slice( // fixme: move filtering/selection to before loading files.
    backdancers.length - 6, backdancers.length
  )
  backdancers_.forEach(d => {
    isometryPlane.addChild(d)
    d.interactive = true
    d.on('pointerdown', moveSprite) // todo: make better jump or move or at least other moves for the dancers
  })

  let step = 0
  const sep = 2 * Math.PI / 5
  app.ticker.add((delta) => {
    step += delta
    for (let i = 0; i < backdancers_.length; i++) {
      const sprite = backdancers_[i]
      const speed = 0.005
      const angle = (step * speed + sep * i) % (2 * Math.PI)
      const aval = Math.sin(angle)
      fire.tint = 0xFF0000 + Math.floor(aval * (0x009999))
      sprite.rotation = step * 0.05
      const radius = 100
      let py = Math.sin(angle) * radius
      if (sprite.jumping) {
        py -= 60 * Math.sin(Math.PI * sprite.perturbation++ / 200)
        if (sprite.perturbation === 200) {
          sprite.jumping = false
          delete sprite.perturbation
        }
      }
      sprite.zIndex = py
      sprite.position.set(
        Math.cos(angle) * radius,
        py
      )
    }
  })
  return [isoScalingContainer, isometryPlane, fire, backdancers_]
}

exports.use = { initCanvasDancers }
