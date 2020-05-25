var net = require('./modules/networks.js')
var artist = require('./modules/artist.js')
var router = require('./modules/router.js')
var conductor = require('./modules/conductor.js')
var test = require('./test.js')
// fixme: create and import needed modules, probably migrated from ../modules/*

const routes = {
  'test.html': artist.share.testArtist,
  'test_basic.html': artist.share.testBasic,
  'empty.html': () => console.log('empty page/canvas'),
  '': () => console.log('homepage'),
  'plot.html': test.testPlot,
  'diffusion.html': test.testDiffusion,
  'rotate.html': test.testRotateLayouts,
  'blink.html': test.testBlink,
  'exibit1.html': test.testExibition1,
  'data_donated.html': () => console.log('a summary of the data donated in usage, upload and scrapping')
}

const _router = new router.use.Router(routes)
_router.loadCurrent()

window.__all = {
  _router,
  conductor,
  router,
  artist,
  net,
  test
}
