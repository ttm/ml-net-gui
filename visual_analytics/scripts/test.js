var net = require('./modules/networks.js')
var artist = require('./modules/artist.js')
var conductor = require('./modules/conductor.js')

const testPlot = () => {
  const nets = [
    () => net.use.synth.use.ladder(30),
    () => net.use.synth.use.caveman(30),
    () => net.use.synth.use.connectedCaveman(6, 8),
    () => net.use.synth.use.erdosRenyi(100, 0.1),
    () => net.use.synth.use.clusters(100, 300, 4, 0.8),
    () => net.use.synth.use.girvanNewman(4),
    () => net.use.synth.use.karateClub(),
    () => net.use.synth.use.florentineFamilies()
  ]
  const index = Math.floor(Math.random() * nets.length)
  const net_ = nets[index]()
  console.log(`testing plot for network number: ${index}, order: ${net_.order}, size: ${net_.size}`)
  const drawnNet = new conductor.use.DrawnNet(artist.use, net_, [])
  return drawnNet
}

const testRotateLayouts = () => {
  const drawnNet = testPlot()
  conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist)
}

const testBlink = () => {
  const drawnNet = testPlot()
  conductor.use.blink(drawnNet.net, artist.share.draw.base.app)
}

const testExibition1 = () => {
  const drawnNet = testPlot()
  conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist)
  conductor.use.blink(drawnNet.net, artist.share.draw.base.app)
}

const testDiffusion = () => {
  const drawnNet = testPlot()
  // conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist) // ok
  // conductor.use.blink(drawnNet.net, artist.share.draw.base.app) // conflicts with spread by color
  const spread = new net.use.diffusion.use.Diffusion(drawnNet.net, artist.share.draw.base.app, [], false, 'keeplist')
  // const spread = new net.use.diffusion.use.Diffusion(drawnNet.net, artist.share.draw.base.app)
  spread.start()
  return spread
}

module.exports = { testPlot, testRotateLayouts, testBlink, testExibition1, testDiffusion }
