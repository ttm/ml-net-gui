var net = require('./modules/networks.js')
var artist = require('./modules/artist.js')
var router = require('./modules/router.js')
var conductor = require('./modules/conductor.js')
// fixme: create and import needed modules, probably migrated from ../modules/*

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
  conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist)
}

const routes = {
  'test.html': artist.share.testArtist,
  'test_basic.html': artist.share.testBasic,
  'empty.html': () => console.log('empty page/canvas'),
  '': () => console.log('homepage'),
  'plot.html': testPlot,
  'data_donated.html': () => console.log('a summary of the data donated in usage, upload and scrapping')
}

const _router = new router.use.Router(routes)
_router.loadCurrent()

window.__all = {
  _router,
  conductor,
  router,
  artist,
  net
}
