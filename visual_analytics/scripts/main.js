/* global wand */
window.wand = {
  artist: require('./modules/artist.js'),
  maestro: require('./modules/maestro/all.js'),
  transfer: require('./modules/transfer/main.js'),
  conductor: require('./modules/conductor.js'),
  net: require('./modules/networks.js'),
  utils: require('./modules/utils.js'),
  router: require('./modules/router.js'),
  test: require('./test.js'),
  $: require('jquery'),
  extra: {}
}

wand.magic = {
  Gradus: wand.conductor.use.gradus.Gradus,
  AdParnassum: wand.conductor.use.parnassum.AdParnassum,
  PIXI: wand.artist.share.draw.base.PIXI,
  app: wand.artist.share.draw.base.app,
  tint: wand.artist.use.tincture
}

wand.$('html').append(`
    <script>

      window.addEventListener("message", function(event) {
       // We only accept messages from ourselves
       if (event.source != window)
         return;

        if (event.data.type && (event.data.type == "FROM_CONTENT")) {
          console.log("Page script received: " + event.data.text)
          console.log("User data received: " + event.data.params)
          wand.sageInfo = event.data.params
          console.log(event.data.text) // "Something message here"
        }
      }, false)
    </script>`)

const artist = wand.artist
wand.extra.winDim = [artist.use.width, artist.use.height]

const test = wand.test

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
  'getNet1.html': test.testGetNet1,
  'getNet2.html': test.testGetNet2,
  'getNet3.html': test.testGetNet3,
  'mong.html': test.testMong,
  'mongIO.html': test.testMongIO,
  'mongNetIO.html': test.testMongNetIO,
  'mongNetIO2.html': test.testMongBetterNetIO,
  'netIO.html': test.testNetIO,
  'gui.html': test.testGUI,
  'guiMin.html': test.testNetUpload,
  'guiMin2.html': test.testNetUpload2,
  'netPage.html': test.testNetPage,
  'puxi.html': test.testPuxi,
  'h.html': test.testHtmlEls,
  'h2.html': test.testHtmlEls2,
  'gradus.html': test.testGradus,
  'adParnassum.html': test.testAdParnassum,
  'worldProperty.html': test.testWorldPropertyPage,
  'jquery.html': test.testJQueryFontsAwesome,
  'obj.html': test.testObj,
  'colors.html': test.testColors,
  'music.html': test.testMusic,
  'looper.html': test.testLooper,
  'seq.html': test.testSeq,
  'sync.html': test.testSync,
  'pat.html': test.testPattern,
  'rec.html': test.testRec,
  'rec2.html': test.testRec2,
  'recCanvas.html': test.testRecCanvas,
  'recAudio.html': test.testRecAudio,
  'recAudioAndCanvas.html': test.testRecAudioAndCanvas,
  'recAudioAndCanvas2.html': test.testRecAudioAndCanvas2,
  'diffusionLimited.html': test.testDiffusionLimited,
  'data_donated.html': () => console.log('a summary of the data donated in usage, upload and scrapping')
}

const _router = new wand.router.use.Router(routes)
_router.loadCurrent()
wand._router = _router
