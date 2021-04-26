const PIXI = require('pixi.js')

const net = require('../net.js')
const baseModel = require('./baseModel.js')

const e = module.exports
const tr = PIXI.utils.string2hex

// todo:
// linear vs rampto
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

    function mkNode (pos, scale = 1, tint = 0xffffff) {
      const circle = new PIXI.Sprite(circleTexture)
      circle.position.set(...(pos || [0, 0]))
      circle.anchor.set(0.5, 0.5)
      circle.scale.set(scale, scale)
      circle.tint = tint
      nodeContainer.addChild(circle)
      return circle
    }

    const [x0, y0] = s.lemniscate ? c : [w * 0.2, h * 0.2]
    const theCircle = mkNode([x0, y0]) // moving white circle to which the flakes go
    const myCircle2 = mkNode(undefined, 1, 0xffff00) // lateral (sinus), right (lemniscate)
    const myCircle3 = mkNode(undefined, 1, 0x00ff00) // center (sinus), left (lemniscate)

    app.stage.addChild(bCircle) // breathing cue

    theCircle.tint = tr(s.fgc)
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
    const f1_ = (n, c) => {
      const sx = c.x - n.x
      const sy = c.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      n.x += sx / mag + (Math.random() - 0.5) * 5
      n.y += sy / mag + (Math.random() - 0.5) * 5
    }

    let lastdc = 0

    const a = w * 0.35 // for lemniscate
    bCircle.x = s.bPos === 0 ? c[0] : s.bPos === 1 ? (c[0] - a) / 2 : (3 * c[0] + a) / 2
    myCircle2.position.set(...c)
    myCircle3.position.set(...c)
    const y = h * 0.5
    let seed
    let component
    let seed_
    const ticker = app.ticker.add(() => {
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
      // const avalr = Math.asin(val) // radians in [-pi/2, pi/2]
      bCircle.y = val * a * 0.5 + y

      const sc = 0.3 + (-val + 1) * 3
      bCircle.scale.set(sc * propx, sc * propy)
      bCircle.rotation += rot

      if (s.ellipse && sc - 0.3 < 0.0005) {
        if (seed) {
          component.forEachNode((n, a) => { a.textElement.alpha = a.pixiElement.alpha = 0 })
          component.forEachEdge((e, a) => { a.pixiElement.alpha = 0 })
          seed_.tint = component.target.tint = 0xffffff
        }
        rot = Math.random() * 0.1
        propx = Math.random() * 0.6 + 0.4
        propy = 1 / propx
        seed = component = undefined
      } else if (s.lemniscate === 32) {
        if (!seed && this.anet && this.anet.net) { // choose random seed using rot:
          seed = this.anet.net.nodes()[Math.floor(this.anet.net.order * rot * 10)] // todo: use nodes ordered by degree
          component = net.getComponent(this.anet.net, seed, s.componentSize) // choose 10 members connected to the seed
          console.log(component, 'COMPONENT', component.order, component.ndist, component.ndist_, component.ndist__)
          window.gg = component
          seed_ = component.getNodeAttributes(seed)
          component.forEachNode((n, a) => {
            a.pixiElement.tint = a.textElement.tint = 0xffffff * Math.random()
            // a.textElement.tint = 0xffffff * Math.random()
          })
          component.forEachEdge((e, a) => {
            a.pixiElement.tint = 0xffffff * Math.random()
          })
          seed_.pixiElement.tint = seed_.textElement.tint = myCircle2.tint
          component.target.pixiElement.tint = component.target.textElement.tint = myCircle3.tint
        }
        // show them in proportion to (1 + val) / 2
        const w = (1 + dc) / 2
        // const index = component.vals_.findIndex(i => i > where)
        if (component) {
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
            a.pixiElement.alpha = v
            // a.pixiElement.alpha = index > a.index ? 2 : ((1 + dc) / 2 >= a.ndist__)
          })
          component.forEachEdge((e, a, n1, n2, a1, a2) => {
            a.pixiElement.alpha = Math.min(a1.pixiElement.alpha, a2.pixiElement.alpha)
          })
        }
      }

      parts.push(mkNode([myCircle2.x, myCircle2.y], 0.3, myCircle2.tint))
      parts.push(mkNode([myCircle3.x, myCircle3.y], 0.3, myCircle3.tint))
      if (Math.random() > 0.98) {
        parts.push(mkNode([bCircle.x, bCircle.y], 0.3, bCircle.tint))
      }

      theCircle.x += (Math.random() - 0.5)
      theCircle.y += (Math.random() - 0.5)
      if (s.lemniscate === 32 && component && component.target) {
        f1_(myCircle2, seed_.pixiElement)
        f1_(myCircle3, component.target.pixiElement)
      } else {
        myCircle2.x += (Math.random() - 0.5)
        myCircle2.y += (Math.random() - 0.5)
      }
      myCircle3.x += (Math.random() - 0.5)
      myCircle3.y += (Math.random() - 0.5)
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
