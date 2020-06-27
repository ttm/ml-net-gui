/* global wand */

const mkRectangle = ({
  wh = [200, 200],
  color = 0xffffff,
  alpha = 0.4,
  zIndex = 100
} = {
  wh: [300, 300],
  color: 0xff0000,
  zIndex: 200
}) => {
  const { PIXI, app } = wand.magic
  const r = new PIXI.Graphics()
  r.beginFill(0xffffff)
  r.lineStyle(0, 0xFF0000)
  r.drawRect(0, 0, wh[0], wh[1])
  r.endFill()
  r.tint = color
  r.alpha = alpha
  r.zIndex = zIndex
  app.stage.addChild(r)
  console.log('ok')
  return r
}

module.exports = { mkRectangle }
