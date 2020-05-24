var net = require('./modules/networks.js')
var artist = require('./modules/artist.js')
var router = require('./modules/router.js')
var conductor = require('./modules/conductor.js')
// fixme: create and import needed modules, probably migrated from ../modules/*

const testPlot = () => {
  const net_ = net.use.synth.use.binomial(10, 0.2)
  console.log('testing plot')
  return new conductor.use.DrawnNet(artist.use, net_, [])
}

const routes = {
  'test.html': artist.share.testArtist,
  'test_basic.html': artist.share.testBasic,
  'empty.html': () => console.log('empty page/canvas'),
  '': () => console.log('homepage'),
  'plot.html': testPlot
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
