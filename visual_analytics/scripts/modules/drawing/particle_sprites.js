const startParticleSprites = function (PIXI, app, numberOfSprites = 30, dudeSize = 0.8, crowler = 0) {
  // todo: use a particle system for the edges/lines/links, and another for the vertices/triangles/nodes.
  // compare performance for plotting and animation e.g. with performance.now()
  const sprites = new PIXI.ParticleContainer(10000, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true
  })
  app.stage.addChild(sprites)
  const maggots = [] // all the sprites
  let totalSprites = numberOfSprites
  if (app.renderer.type !== PIXI.RENDERER_TYPE.WEBGL) {
    totalSprites = 10
    console.log('***** WEBGL is off ********')
  }
  if (!crowler) {
    crowler = 1 + (Math.random() < 1)
  }
  crowler = ['assets/images/back2/jesus2.jpg', 'assets/images/back2/jesus.jpg'][crowler - 1]
  for (let i = 0; i < totalSprites; i++) {
    // let dude = PIXI.Sprite.from('images/back2/Make_a_Star.jpg');
    // let dude = PIXI.Sprite.from('images/back2/maggot_tiny.png');
    const dude = PIXI.Sprite.from(crowler)
    dude.anchor.set(0.5)
    dude.scale.set((dudeSize + Math.random() * 0.3) * 0.15)
    dude.x = Math.random() * app.screen.width
    dude.y = Math.random() * app.screen.height
    dude.tint = Math.random() * 0x808080
    dude.direction = Math.random() * Math.PI * 2
    dude.turningSpeed = Math.random() - 0.8
    dude.speed = (2 + Math.random() * 2) * 0.2
    dude.offset = Math.random() * 100
    maggots.push(dude)
    sprites.addChild(dude)
  }

  // create a bounding box box for the little maggots
  const dudeBoundsPadding = 100
  const dudeBounds = new PIXI.Rectangle(
    -dudeBoundsPadding,
    -dudeBoundsPadding,
    app.screen.width + dudeBoundsPadding * 2,
    app.screen.height + dudeBoundsPadding * 2
  )

  let tick = 0
  app.ticker.add((delta) => {
    for (let i = 0; i < maggots.length; i++) {
      const dude = maggots[i]
      dude.scale.y = (dudeSize + Math.sin((tick + dude.offset)) * dudeSize * 0.4) * 0.15
      dude.direction += dude.turningSpeed * 0.01
      dude.x += Math.sin(dude.direction) * 16 * (dude.speed * dude.scale.y)
      dude.y += Math.cos(dude.direction) * 16 * (dude.speed * dude.scale.y)
      dude.rotation = -dude.direction + Math.PI
      // wrap the maggots
      if (dude.x < dudeBounds.x) {
        dude.x += dudeBounds.width
      } else if (dude.x > dudeBounds.x + dudeBounds.width) {
        dude.x -= dudeBounds.width
      }

      if (dude.y < dudeBounds.y) {
        dude.y += dudeBounds.height
      } else if (dude.y > dudeBounds.y + dudeBounds.height) {
        dude.y -= dudeBounds.height
      }
    }
    tick += 0.1
    app.renderer.render(app.stage)
  })

  return {
    maggots, // the individual sprites
    sprites, // the particle container
    totalSprites, // number of sprites
    desc: 'particles on wallpaper'
  }
}

exports.use = { startParticleSprites }
