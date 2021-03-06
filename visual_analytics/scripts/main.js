/* global wand */
// window.onerror = function (msg, url, lineNo, columnNo, error) {
//   var string = msg.toLowerCase()
//   var substring = 'script error'
//   if (string.indexOf(substring) > -1) {
//     window.alert('Script Error: See Browser Console for Detail')
//   } else {
//     var message = [
//       'Message: ' + msg,
//       'URL: ' + url,
//       'Line: ' + lineNo,
//       'Column: ' + columnNo,
//       'Error object: ' + JSON.stringify(error)
//     ].join(' - ')
//
//     window.alert(message)
//   }
// }
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

// if (wand.utils.mobileAndTabletCheck()) {
//   window.alert('You do not have the credentials necessary to fully access this website using a mobile ot tablet device. You may try your luck but use a regular desktop browser for a better experience.')
// }

wand.magic = {
  Gradus: wand.conductor.use.gradus.Gradus,
  AdParnassum: wand.conductor.use.parnassum.AdParnassum,
  Lycoreia: wand.conductor.use.lycoreia.Lycoreia,
  Tithorea: wand.conductor.use.tithorea.Tithorea,
  SyncParnassum: wand.conductor.use.syncParnassum.SyncParnassum,
  PIXI: wand.artist.share.draw.base.PIXI,
  app: wand.artist.share.draw.base.app,
  tint: wand.artist.use.tincture
}

window.addEventListener('message', function (event) {
  if (event.source !== window) return
  console.log('THE EVENT', event)
  if (event.source !== window || event.data.type !== 'FROM_OA_EXT') return
  console.log('THE EVENT2', event)
  window.oaReceivedMsg = event
  if (window.oaReceivedMsg.data.graph.attributes) wand.sageInfo = event.data.graph.attributes.userData
})

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
// wand.sageInfo = { name: 'Renato Fabbri', sid: 'renato.fabbri.125', nid: null, newfb: true }
// wand.sageInfo = { name: 'Cris', sid: 'cristiane.godoytargon', nid: null, newfb: true }
// wand.sageInfo = { name: 'AV', sid: 'alanvalejo', nid: null, newfb: true }

const artist = wand.artist
wand.extra.winDim = [artist.use.width, artist.use.height]

const test = wand.test

const routes = {
  'test.html': artist.share.testArtist,
  'test_basic.html': artist.share.testBasic,
  'empty.html': () => window.alert('empty page/canvas'),
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
  'audiovisualSync.html': test.testSync,
  'pat.html': test.testPattern,
  'rec.html': test.testRec,
  'rec2.html': test.testRec2,
  'recCanvas.html': test.testRecCanvas,
  'recAudio.html': test.testRecAudio,
  'recAudioAndCanvas.html': test.testRecAudioAndCanvas,
  'recAudioAndCanvas2.html': test.testRecAudioAndCanvas2,
  'diffusionLimited.html': test.testDiffusionLimited,
  'lycoreia.html': test.testLycoreia,
  '☥.html': test.testAdParnassum,
  'ankh.html': test.testAdParnassum,
  'ankh_.html': test.testSyncParnassum,
  '⚧.html': test.testLycoreia,
  'transgender.html': test.testLycoreia,
  '⚜.html': test.testTithorea,
  'lis.html': test.testTithorea,
  'tithorea.html': test.testTithorea,
  '♁⚜⚛⚧.html': () => console.log('YO JOW'),
  // '%E2%99%81%E2%9A%9C%E2%9A%9B%E2%9A%A7.html': () => console.log('YOU MAN'),
  'editor.html': test.testEditor,
  'lz.html': test.testLz,
  'donate.html': () => test.testDonate(),
  'donatePaypal.html': () => test.testDonatePaypal(),
  'donatePagseguro.html': () => test.testDonatePagseguro(),
  'donateBitcoin.html': () => test.testDonateBitcoin(),
  'contribute.html': () => test.testContribute(),
  'guidelines.html': () => test.testGuidelines(),
  'deploy.html': () => test.testDeploy(),
  'about.html': () => test.testAbout(),
  'extension.html': () => test.testExtension(),
  'faq.html': () => test.testFAQ(),
  'theory.html': () => test.testTheory(),
  'hidden.html': () => test.testHidden(),
  'manDB.html': () => test.testManDb(),
  'manGit.html': () => test.testManGit(),
  'devLocal.html': () => test.testDevLocal(),
  'sync.html': test.testSyncInfo,
  'anphy.html': test.testAnPhy,
  'meditation.html': test.testMeditation,
  'meditation2.html': test.testMeditation2,
  'meditation3.html': test.testMeditation3,
  'waa.html': test.waa,
  'waaFM.html': test.waaFM,
  'waaFM2.html': test.waaFM2,
  'metaBinaural.html': test.binauralMeta,
  'metaBinaural2.html': test.binauralMeta2,
  'data_donated.html': () => console.log('a summary of the data donated in usage, upload and scrapping')
}

const _router = new wand.router.use.Router(routes)
_router.loadCurrent()
wand._router = _router
