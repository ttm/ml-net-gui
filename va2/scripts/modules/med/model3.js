const net = require('../net.js')
const baseModel = require('./baseModel.js')

const e = module.exports

// todo:
// linear vs rampto
// line thickness
// 3d drawing
// draw as trajectory happens

e.Med = class extends baseModel.Med {
  setVisual (s) { // todo: enhance code quality
    const { app, myCircle2, myCircle3 } = this.visCom

    const f1_ = (n, c) => {
      const sx = c.x - n.x
      const sy = c.y - n.y
      const mag = (sx ** 2 + sy ** 2) ** 0.5
      n.x += sx / mag + (Math.random() - 0.5) * 5
      n.y += sy / mag + (Math.random() - 0.5) * 5
    }

    let component
    let seed_
    if (s.lemniscate === 32) {
      let seed
      this.bounceFuncs.push(() => {
        if (seed) {
          component.forEachNode((n, a) => { a.textElement.alpha = a.pixiElement.alpha = 0 })
          component.forEachEdge((e, a) => { a.pixiElement.alpha = 0 })
          seed_.tint = component.target.tint = 0xffffff
          seed = undefined
        }
      })
      this.notBouncingFuncs.push(() => {
        if (!seed && this.anet && this.anet.net) { // choose random seed using rot:
          seed = this.anet.net.nodes_[Math.floor(this.anet.net.nodes_.length * Math.random())] // todo: use nodes ordered by degree
          component = net.getComponent(this.anet.net, seed, s.componentSize) // choose 10 members connected to the seed
          window.gg = component
          seed_ = component.getNodeAttributes(seed)
          component.forEachNode((n, a) => {
            a.pixiElement.tint = a.textElement.tint = 0xffffff * Math.random()
          })
          component.forEachEdge((e, a) => {
            a.pixiElement.tint = 0xffffff * Math.random()
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
            a.pixiElement.alpha = v
          })
          component.forEachEdge((e, a, n1, n2, a1, a2) => {
            a.pixiElement.alpha = Math.min(a1.pixiElement.alpha, a2.pixiElement.alpha)
          })
        }
      })
    }
    const ticker = app.ticker.add(() => {
      if (s.lemniscate === 32 && component && component.target) {
        f1_(myCircle2, seed_.pixiElement)
        f1_(myCircle3, component.target.pixiElement)
      } else {
        myCircle2.x += (Math.random() - 0.5)
        myCircle2.y += (Math.random() - 0.5)
      }
    })
    ticker.stop()

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
