const PIXI = require('pixi.js')
const $ = require('jquery')

const net = require('../net.js')

module.exports.Sync = class {
  constructor (data) {
    this.data = data
    // plot stuff
    $('#loading').hide()
    const app = this.app = window.wand.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight * 0.9,
      backgroundColor: 0x000000
    })
    app.stage.sortableChildren = true
    document.body.appendChild(app.view)
    const pfm = this.pfm = net.plotSync(data, app)
    const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
    pfm.dn = dn
    this.setup()
  }

  setup () {
    console.log('yey jowww')
  }
}
