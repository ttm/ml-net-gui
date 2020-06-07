const net = require('./modules/networks.js')
const artist = require('./modules/artist.js')
const router = require('./modules/router.js')
const conductor = require('./modules/conductor.js')
const transfer = require('./modules/transfer/main.js')
const test = require('./test.js')
// fixme: create and import needed modules, probably migrated from ../modules/*

const routes = {
  'test.html': artist.share.testArtist,
  'test_basic.html': artist.share.testBasic,
  'empty.html': () => console.log('empty page/canvas'),
  '': () => console.log('homepage'),
  'plot.html': test.testPlot,
  'diffusion.html': test.testDiffusion,
  'multilevelDiffusion.html': test.testMultilevelDiffusion,
  // fixme: add MultilevelDiffusionSketch or migrate it to netscience/meta.js
  'metaNetwork.html': test.testMetaNetwork,
  'rotate.html': test.testRotateLayouts,
  'blink.html': test.testBlink,
  'exhibit1.html': test.testExibition1,
  'sparkmin.html': test.testSparkMin,
  'losd.html': test.testSparkLosd,
  'getNet.html': test.testGetNet0,
  'mong.html': test.testMong,
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
  transfer,
  test
}
