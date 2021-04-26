const PIXI = require('pixi.js')

const baseModel = require('./baseModel.js')

const e = module.exports
const tr = PIXI.utils.string2hex

// todo:
// line thickness
// 3d drawing
// draw as trajectory happens

e.Med = class extends baseModel.Med {
  setVisual (s) { // todo: enhance code quality
    const nodeContainer = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true
    })

    const bCircle = new PIXI.Graphics() // vertical for breathing
      .beginFill(0xffffff)
      .drawCircle(0, 0, 5)
      .endFill()

    const app = this.app
    const circleTexture = app.renderer.generateTexture( // for flakes and any other circle
      new PIXI.Graphics()
        .beginFill(0xffffff)
        .drawCircle(0, 0, 5)
        .endFill()
    )

    app.stage.addChild(nodeContainer)
    const [w, h] = [app.view.width, app.view.height]
    const c = [w / 2, h / 2] // center
    const a = w * 0.35 // for lemniscate
    const [aLx, aLy] = [w * 0.4, h * 0.4]
    const [a_, a__, h_] = [w * 0.13, h * 0.15, h * 0.05] // for trefoil

    function mkNode (pos, scale = 1, tint = 0xffffff) {
      const circle = new PIXI.Sprite(circleTexture)
      circle.position.set(...(pos || [0, 0]))
      circle.anchor.set(0.5, 0.5)
      circle.scale.set(scale, scale)
      circle.tint = tint
      nodeContainer.addChild(circle)
      return circle
    }

    const [x, y] = [w * 0.1, h * 0.5] // for sinusoid, left-most point
    const [dx, dy] = [w * 0.8, h * 0.4] // for sinusoid, period and amplitude

    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const myLine = new PIXI.Graphics()
    const segments = 1000

    function xyL (angle, vertical) { // lemniscate x, y given angle. todo: use the vertical
      const px = a * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
      const py = Math.sin(angle) * px
      return vertical ? [py + c[1], px + c[0]] : [px + c[0], py + c[1]]
    }

    function xyT (angle) { // trefoil x, y given angle. todo: add downward
      const px = a_ * (Math.sin(angle) + 2 * Math.sin(2 * angle))
      const py = a__ * (Math.cos(angle) - 2 * Math.cos(2 * angle))
      return [px + c[0], py + c[1] + h_]
    }

    function xy8 (angle) {
      const foo = (2 + Math.cos(2 * angle))
      return [c[0] + a_ * foo * Math.cos(3 * angle), c[1] + a__ * foo * Math.sin(3 * angle)]
    }

    const [aX, aY] = [a_ * 0.8, a__ * 0.8]
    function xyTorus (angle, torus, vertical) { // torus knot x, y given angle
      const foo = 3 + Math.cos(4 * angle)
      return [c[0] + aX * foo * Math.cos(3 * angle), c[1] + aY * foo * Math.sin(3 * angle)]
    }

    function xyCinque (angle, torus, vertical) { // torus knot x, y given angle
      const foo = 3 + Math.cos(5 * angle)
      return [c[0] + aX * foo * Math.cos(2 * angle), c[1] + aY * foo * Math.sin(2 * angle)]
    }

    const [aXX, aYY] = [a_ * 1.8, a__ * 1.8]
    const c1 = c[1] * 0.84
    function xyTorusDec (angle, torus, vertical) { // lemniscate x, y given angle
      const foo = 1 + 0.45 * Math.cos(3 * angle) + 0.4 * Math.cos(9 * angle)
      return [c[0] + aXX * foo * Math.sin(2 * angle), c1 + aYY * foo * Math.cos(2 * angle)]
    }

    function xyLis (angle, kx, ky) { // torus knot x, y given angle
      const x = aLx * Math.cos(kx * angle)
      const y = aLy * Math.sin(ky * angle)
      return [c[0] + x, c[1] + y]
    }
    const xyLis35 = angle => xyLis(angle, 3, 4)

    const xyLisDyn = angle => xyLis(angle, 3, 4.02)
    // let [lastX, lastY] = xyLisDyn(0)
    function xyDyn (angle) { // Lis with dynamic
      const [x, y] = xyLisDyn(angle)
      return [c[0] + x, c[1] + y]
    }
    window.xyDyn = xyDyn
    // 3, 2
    // 3, 8
    // 3,4
    // 3,9, avalr / 2
    // 3,12, avalr / 2

    let xy
    const table = []
    if (s.lemniscate) {
      xy = [0, xyL, xyT, xy8, xyTorus, xyCinque, xyTorusDec, xyLis35][s.lemniscate]
      // xy = s.lemniscate === 1 ? xyL : s.lemniscate === 2 ? xyT : xy8
      bCircle.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
      myLine.lineStyle(1, 0xffffff)
      //  .moveTo(...xy(0))
      for (let i = 0; i <= segments; i++) {
        // myLine.lineTo(...xy(2 * Math.PI * i / 100))
        table.push(xy(2 * Math.PI * i / segments))
      }
    } else {
      bCircle.x = s.bPos === 0 ? x + dx / 2 : s.bPos === 1 ? x * 0.5 : x + dx * 1.05
      myLine.lineStyle(1, 0xffffff)
      for (let i = 0; i <= segments; i++) {
        // myLine.lineTo(x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy)
        table.push([x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy])
      }
      mkNode([x0, y0]) // fixed left
        .position.set(x, y)
        .tint = tr(s.fgc)
      mkNode([x0, y0]) // fixed right
        .position.set(x + dx, y)
        .tint = tr(s.fgc)
    }

    myLine.moveTo(...table[0])
    for (let i = 1; i <= segments; i++) {
      myLine.lineTo(...table[i])
    }
    window.ttable = table

    const theCircle = mkNode([x0, s.lemniscate ? y / 2 : y0]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(undefined, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(undefined, 1, 0x00ff00) // center (sinus), left (lemniscate)

    app.stage.addChild(myLine)
    app.stage.addChild(bCircle) // breathing cue

    theCircle.tint = myLine.tint = tr(s.fgc)
    myCircle2.tint = tr(s.lcc)
    myCircle3.tint = tr(s.ccc)
    bCircle.tint = tr(s.bcc)
    app.renderer.backgroundColor = tr(s.bgc)

    // ticker stuff:
    let propx = 1
    let propy = 1
    let rot = Math.random() * 0.1
    const parts = []
    let f1 = (n, sx, sy, mag) => {
      n.x += sx / mag + (Math.random() - 0.5) * 5
      n.y += sy / mag + (Math.random() - 0.5) * 5
    }
    if (s.rainbowFlakes) {
      f1 = (n, sx, sy, mag) => {
        n.x += sx / mag + (Math.random() - 0.5) * 5
        n.y += sy / mag + (Math.random() - 0.5) * 5
        n.tint = (n.tint + 0xffffff * 0.1 * Math.random()) % 0xffffff
      }
    }
    let lastdc = 0

    const ticker = app.ticker.add(() => {
      // todo: solve for unexisting met (make a standard met?)
      const dc = this.meter ? this.meter.getValue() : 0
      const cval = (1 - Math.abs(dc))
      if (dc - lastdc > 0) { // inhale
        this.guiEls.inhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.exhale.css('background', 'rgba(0,0,0,0)')
      } else { // exhale
        this.guiEls.exhale.css('background', `rgba(255,255,0,${cval})`) // mais proximo de 0, mais colorido
        this.guiEls.inhale.css('background', 'rgba(0,0,0,0)')
      }
      lastdc = dc
      const val = -dc
      const avalr = Math.asin(val) // radians in [-pi/2, pi/2]
      if (s.lemniscate === 1) { // lemniscate:
        const p = xy(avalr < 0 ? 2 * Math.PI + avalr : avalr)
        myCircle2.x = p[0]
        myCircle2.y = myCircle3.y = p[1]
        myCircle3.x = 2 * c[0] - p[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 2) { // trefoil:
        const pos = xy(avalr + 3 * Math.PI / 2)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        // const where = Math.floor(((avalr + 3 * Math.PI / 2) / (2 * Math.PI)) * segments)
        // const pos = table[where]
        // myCircle2.y = myCircle3.y = pos[1]
        // myCircle3.x = pos[0]
        // myCircle2.x = 2 * c[0] - pos[0]

        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 3) { // fig8:
        const pos = xy(avalr)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 4) { // Torus:
        const pos = xy(-avalr)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 5) { // Cinque:
        const avalr_ = avalr + Math.PI / 4
        const pos = xy(avalr_)
        const pos2 = xy(avalr_ + Math.PI)
        myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.y = pos2[1]
        myCircle2.x = pos2[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 6) { // TorusDec:
        const pos = xy(avalr - Math.PI / 2)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 7) { // Lis34
        const pos = xy(-avalr)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 8) { // dynamic drawing
      } else { // sinusoid:
        const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
        const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
        myCircle2.x = px
        myCircle2.y = myCircle3.y = bCircle.y = val * dy + y
        myCircle3.x = px2
        // myCircle2.y = myCircle3.y = bCircle.y = val * dy + y
        // const av = avalr < 0 ? 2 * Math.PI + avalr : avalr
        // const av2 = Math.PI - avalr
        // // console.log(Math.floor(table.length * av / (2 * Math.PI)), table)
        // myCircle2.x = table[Math.floor(table.length * av / (2 * Math.PI))][0]
        // myCircle3.x = table[Math.floor(table.length * av2 / (2 * Math.PI))][0]
      }

      const sc = 0.3 + (-val + 1) * 3
      bCircle.scale.set(sc * propx, sc * propy)
      bCircle.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
      }

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.3, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.3, myCircle3.tint))
      if (Math.random() > 0.98) {
        parts.push(mkNode([bCircle.x, bCircle.y], 0.3, bCircle.tint))
      }

      theCircle.x += (Math.random() - 0.5)
      theCircle.y += (Math.random() - 0.5)
      for (let ii = 0; ii < parts.length; ii++) {
        const n = parts[ii]
        const sx = theCircle.x - n.x
        const sy = theCircle.y - n.y
        const mag = (sx ** 2 + sy ** 2) ** 0.5
        if (mag < 5) {
          parts.splice(ii, 1)
          n.destroy()
        } else {
          f1(n, sx, sy, mag)
        }
      }
    })
    // setTimeout(() => ticker.stop(), 200)
    ticker.stop()
    // utils.basicStats()

    return {
      start: () => {
        ticker.start()
      },
      stop: () => {
        ticker.stop()
      }
    }
  }
}
