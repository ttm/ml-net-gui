// todo: use data visualization widgets from ui-widget-toolkit
const PUXI = require('puxi.js')

const setStage = (app) => {
  const uxStage = new PUXI.Stage({
    width: 512,
    height: 512
  })

  app.stage.addChild(uxStage)

  uxStage.addChild(new PUXI.Button({
    text: 'Hello world!'
  }))

  // const mockButton = new PUXI.Button({ text: 'Drag me!' })
  //   .setLayoutOptions(new PUXI.FastLayoutOptions({
  //     width: PUXI.LayoutOptions.WRAP_CONTENT,
  //     height: PUXI.LayoutOptions.WRAP_CONTENT,
  //     x: 0.5,
  //     y: 0.5,
  //     anchor: PUXI.FastLayoutOptions.CENTER_ANCHOR
  //   }))
  //   .setPadding(8)
  //   .setElevation(4)
  //   .makeDraggable()

  // return mockButton
}

module.exports = { use: { setStage } }
