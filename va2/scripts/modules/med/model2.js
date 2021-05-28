const PIXI = require('pixi.js')
const c = require('chroma-js')

const baseModel = require('./baseModel.js')

const e = module.exports
const tr = PIXI.utils.string2hex

// todo:
// line thickness
// 3d drawing
// draw as trajectory happens

e.Med = class extends baseModel.Med {
  setVisual (s) { // todo: enhance code quality
    const { app, mkNode, bCircle, myCircle2, myCircle3, w, h, c, a, dx, dy } = this.visCom

    const [x, y] = [w * 0.1, h * 0.5] // for sinusoid, left-most point
    const [aLx, aLy] = [w * 0.4, h * 0.4]
    const [aLx_, aLy_] = [aLx / 15, aLy / 15]
    const [a_, a__, h_] = [w * 0.13, h * 0.15, h * 0.05] // for trefoil

    const myLine = new PIXI.Graphics()
      .lineStyle(1, 0xffffff)
    myLine.tint = tr(s.fgc)
    app.stage.addChild(myLine)
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

    function xyRay (angle) {
      const foo = 2 * angle + 1 / angle
      const x = aLx_ * (foo + 2 * Math.cos(14 * angle))
      const y = aLy_ * (foo + 2 * Math.sin(15 * angle))
      return [c[0] / 6 + x, c[1] / 6 + y]
    }

    let [prevX1, prevY1] = c
    let [prevX2, prevY2] = c
    function xyVoid (angle) {
      prevX1 += 0.1 * aLx_ * (Math.random() - 0.5)
      prevY1 += 0.1 * aLy_ * (Math.random() - 0.5)
      prevX2 += 0.1 * aLx_ * (Math.random() - 0.5)
      prevY2 += 0.1 * aLy_ * (Math.random() - 0.5)
      return [[prevX1, prevY1], [prevX2, prevY2]]
    }

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
      const foo = [0, xyL, xyT, xy8, xyTorus, xyCinque, xyTorusDec, xyLis35, xyRay]
      foo[31] = xyVoid
      foo[32] = () => { }
      window.fooo = foo
      xy = foo[s.lemniscate]
      if (s.lemniscate !== 8) {
        for (let i = 0; i <= segments; i++) {
          table.push(xy(2 * Math.PI * i / segments))
        }
      } else if (s.lemniscate < 30) {
        for (let i = 0; i <= segments; i++) {
          table.push(xy(1 + 13 * i / segments))
        }
      }
    } else { // sinusoid
      bCircle.x = s.bPos === 0 ? x + dx / 2 : s.bPos === 1 ? x * 0.5 : x + dx * 1.05
      for (let i = 0; i <= segments; i++) {
        table.push([x + dx * i / segments, y + Math.sin(2 * Math.PI * i / segments) * dy])
      }
      mkNode([x, y]) // fixed left
        .tint = tr(s.fgc)
      mkNode([x + dx, y]) // fixed right
        .tint = tr(s.fgc)
    }

    if (s.lemniscate < 30) {
      myLine.moveTo(...table[0])
      for (let i = 1; i <= segments; i++) {
        myLine.lineTo(...table[i])
      }
    }

    const ticker = app.ticker.add(() => {
      const val = -this.dc
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
      } else if (s.lemniscate === 8) { // Ray
        const pos = xy(1 + (1 + val) * 6.5)
        myCircle2.y = myCircle3.y = pos[1]
        myCircle3.x = pos[0]
        myCircle2.x = 2 * c[0] - pos[0]
        bCircle.y = val * a * 0.5 + y
      } else if (s.lemniscate === 31) { // Void
        const p = xy()
        myCircle2.position.set(...p[0])
        myCircle3.position.set(...p[1])
      } else if (s.lemniscate !== 32) { // sinusoid:
        const px = (avalr < 0 ? 2 * Math.PI + avalr : avalr) / (2 * Math.PI) * dx + x
        const px2 = (Math.PI - avalr) / (2 * Math.PI) * dx + x
        myCircle2.x = px
        myCircle2.y = myCircle3.y = val * dy + y
        myCircle3.x = px2
      }
    })
    ticker.stop()
    const tickers = [ticker]
    let ticker2
    if (['uid', 'comName', 'network'].some(x => x in s)) {
      ticker2 = this.initNetwork(s, app, myCircle2, myCircle3)
    }
    if (ticker2 === undefined) {
      ticker2 = { start: () => { }, stop: () => { } }
    }
    tickers.push(ticker2)

    return {
      start: () => {
        tickers.forEach(t => t.start())
      },
      stop: () => {
        tickers.forEach(t => t.stop())
      }
    }
  }

  initNetwork (s, app, myCircle2, myCircle3) {
    let component
    let seed_
    let seed
    const cs = c.scale([myCircle2.tint, myCircle3.tint])
    this.bounceFuncs.push(() => {
      if (seed) {
        // component.forEachNode((n, a) => { a.textElement.alpha = a.pixiElement.alpha = 0 })
        // component.forEachEdge((e, a) => { a.pixiElement.alpha = 0 })
        seed_.tint = component.target.tint = 0xffffff
        seed = undefined
      }
    })
    this.notBouncingFuncs.push(() => {
      if (!seed && this.anet && this.anet.net) { // choose random seed using rot:
        seed = this.anet.net.nodes_[Math.floor(this.anet.net.nodes_.length * Math.random())] // todo: use nodes ordered by degree
        component = window.wand.net.getComponent(this.anet.net, seed, s.componentSize) // choose 10 members connected to the seed
        window.gg = component
        seed_ = component.getNodeAttributes(seed)
        const cs_ = window.cs_ = cs.colors(component.ndist[1] + 1, 'num')
        component.forEachNode((n, a) => {
          // a.pixiElement.tint = a.textElement.tint = 0xffffff * Math.random()
          a.pixiElement.tint = a.textElement.tint = cs_[a.ndist]
        })
        component.forEachEdge((e, a, n1, n2, a1, a2) => {
          // a.pixiElement.tint = 0xffffff * Math.random()
          a.pixiElement.tint = cs_[Math.min(a1.ndist, a2.ndist)]
        })
        seed_.pixiElement.tint = seed_.textElement.tint = myCircle2.tint
        component.target.pixiElement.tint = component.target.textElement.tint = myCircle3.tint
      } else if (component) {
        const w = (1 + this.dc) / 2
        component.forEachNode((n, a) => {
          const h = a.ndist__
          let v
          if (w < h) {
            v = 0
            a.textElement.alpha = 0
          } else if (w > h + component.h_) {
            v = 1
            a.textElement.alpha = 0
          } else {
            v = (w - h) / component.h_
            a.textElement.alpha = v ** 0.2
          }
          a.pixiElement.alpha = !this.inhale || v
        })
        component.forEachEdge((e, a, n1, n2, a1, a2) => {
          a.pixiElement.alpha = Math.min(a1.pixiElement.alpha, a2.pixiElement.alpha)
        })
      }
    })
    const f1_ = (n, c) => {
      const sx = c.x - n.x
      const sy = c.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      n.x += sx / mag + (Math.random() - 0.5) * 5
      n.y += sy / mag + (Math.random() - 0.5) * 5
    }
    let ticker
    if (s.lemniscate === 32) {
      ticker = app.ticker.add(() => {
        if (component && component.target) {
          f1_(myCircle2, seed_.pixiElement)
          f1_(myCircle3, component.target.pixiElement)
        } else {
          myCircle2.x += (Math.random() - 0.5)
          myCircle2.y += (Math.random() - 0.5)
        }
      })
      ticker.stop()
    }
    return ticker
  }
}
