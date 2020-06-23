/* global wand */
// todo: use data visualization widgets from ui-widget-toolkit
const PUXI = require('puxi.js')

const setStage = (app) => {
  const uxStage = new PUXI.Stage(app.view.width, app.view.height)

  app.stage.addChild(uxStage)

  const btn = new PUXI.Button({ text: 'Choose network' }).setBackground(0x00FFFF).setPadding(8)
  uxStage.addChild(btn)
  window.btn = btn
  // btn.on('pointerdown', (e, fn, c) => console.log(e, fn, c))
  btn.on('pointerdown', () => console.log('hey!!!'))
  btn.on('pointerdown', (e, fn, c) => console.log(e, fn, c))

  const uel = document.getElementById('file-input')
  uel.onchange = res => {
    const f = uel.files[0]
    f.text().then(t => {
      wand.transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
      window.anet = wand.net.use.utils.loadJsonString(t)
      const drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, window.anet, [])
      wand.conductor.use.showMembers(drawnNet.net, wand.artist, true)
      btn.text.text = f.name
    })
  }
  btn.on('click', () => {
    console.log('hey!!!22')
    uel.click()
  })
  console.log('puxi stage set')

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
