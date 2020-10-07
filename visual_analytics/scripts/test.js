/* global wand, MediaRecorder, MediaStream, Blob */
const net = require('./modules/networks.js')
const artist = require('./modules/artist.js')
const conductor = require('./modules/conductor.js')
const transfer = require('./modules/transfer/main.js')
const utils = require('./modules/utils.js')
const $ = require('jquery')
const lz = require('lz-string')
require('@fortawesome/fontawesome-free/js/all.js')
// https://fontawesome.com/how-to-use/on-the-web/referencing-icons/icon-cheatsheet
// https://fontawesome.com/how-to-use/on-the-web/using-with/jquery

const testPlot = (mode = 'test') => {
  const nets = [
    () => net.use.synth.use.ladder(30),
    // () => net.use.synth.use.caveman(30), return empty:
    () => net.use.synth.use.connectedCaveman(6, 8),
    () => net.use.synth.use.erdosRenyi(100, 0.1),
    () => net.use.synth.use.clusters(100, 300, 6, 0.8),
    () => net.use.synth.use.girvanNewman(2),
    () => net.use.synth.use.karateClub(),
    () => net.use.synth.use.florentineFamilies()
  ]
  let index
  if (mode === 'test') {
    index = Math.floor(Math.random() * nets.length)
  } else {
    // const selected = [0, 1, 3, 5, 6, 7]
    // index = selected[Math.floor(Math.random() * selected.length)]
    index = 3
    console.log('SELECTED')
  }
  const net_ = nets[index]()
  console.log(`testing plot for network number: ${index}, order: ${net_.order}, size: ${net_.size}`)
  const drawnNet = new conductor.use.DrawnNet(artist.use, net_, [])
  return drawnNet
}

const testRotateLayouts = () => {
  const drawnNet = testPlot()
  conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist)
  transfer.gui.basicStats()
}

const testBlink = () => {
  const drawnNet = testPlot()
  conductor.use.blink(drawnNet.net, artist.share.draw.base.app)
}

const testExhibition1 = (mode = 'test') => {
  const drawnNet = testPlot(mode)
  const r = {
    drawnNet,
    rotatorTicker: conductor.use.rotateLayouts(
      drawnNet, artist.share.draw.base.app, artist, 600
    ),
    blinkTicker: conductor.use.blink(
      drawnNet.net, artist.share.draw.base.app
    ),
    remove: function () {
      artist.share.draw.base.app.ticker.remove(this.blinkTicker)
      artist.share.draw.base.app.ticker.remove(this.rotatorTicker)
      this.drawnNet.remove()
      delete this.drawnNet
    }
  }
  window.rr = r
  return r
}

const testDiffusion = () => {
  const drawnNet = testPlot()
  // conductor.use.rotateLayouts(drawnNet, artist.share.draw.base.app, artist) // ok
  // conductor.use.blink(drawnNet.net, artist.share.draw.base.app) // conflicts with spread by color
  // const spread = new net.use.diffusion.use.Diffusion(drawnNet.net, artist.share.draw.base.app, [], false, 'keeplist')
  const spread = new net.use.diffusion.use.Diffusion(drawnNet.net, artist.share.draw.base.app)
  spread.start()
  return spread
}

const testMultilevelDiffusion = () => {
  const drawnNet = testPlot()
  window.nnn = drawnNet
  const seeds = net.use.seeding.use.random(drawnNet.net, 5)
  // const seeds = net.use.seeding.degree(net, 'min')
  const hierarchy = new net.use.diffusion.use.MultilevelDiffusionSketch(drawnNet.net, seeds)
  window.hierarchy = hierarchy
  console.log('meta report:', hierarchy.report())
  return hierarchy
}

const testMetaNetwork = () => {
  const drawnNet = testPlot()
  window.nnn = drawnNet
  // const seeds = net.use.seeding.degree(net, 'min')
  const metaHierarchy = new net.use.meta.use.MetaNetworkCanon(drawnNet.net)
  metaHierarchy.start()
  console.log('meta report:', metaHierarchy.report())
  window.metaHierarchy = metaHierarchy
  return metaHierarchy
}

const testSparkMin = () => {
  transfer.spark.MDBPedia0.queryEndpoint(transfer.spark.MDBPedia0.q1)
  console.log('check window.res.sparqlres')
  window.res = transfer.spark.MDBPedia0
}

const testSparkLosd = () => {
  transfer.spark.losdCall(Math.floor(Math.random() * 2), (res) => console.log(res))
}

const testGetNet0 = () => {
  // just gets members names and ids, and friendships
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013')
}

const testGetNet1 = () => {
  // builds network
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013', res => console.log(net.use.build.buildFromSparql(res.members, res.friendships)))
}

const testGetNet2 = () => {
  // plots network
  // fixme: separate non-connected nodes to avoid having so much empty space
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013')
  const call = res => {
    const net_ = net.use.build.buildFromSparql(res.members, res.friendships)
    const drawn = new conductor.use.DrawnNet(artist.use, net_, [])
    window.drawn = drawn
    return drawn
  }
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013', call)
}

const testGetNet3 = () => {
  // plots network and alternate names of participants
  // fixme: emphasize neighbors if 'onclick' event
  // transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013')
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013')
  const call = res => {
    const net_ = net.use.build.buildFromSparql(res.members, res.friendships)
    const drawn = new conductor.use.DrawnNet(artist.use, net_, [])
    conductor.use.showMembers(net_, artist, Math.random() > 0.5)
    window.drawn = drawn
    return drawn
  }
  transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013', call)
}

const testMong = () => {
  console.log(transfer.mong)
  window.mong = transfer.mong
  const astring = (new Date() % 9e6).toString(36) // +- random, arbitrary string
  console.log('astring:', astring)
  transfer.mong.db.collection(transfer.mong.auth.collections.test).insertOne({ AAAA: 'XXX', astring: astring }).then(() => {
    return transfer.mong.db.collection(transfer.mong.auth.collections.test).find({ astring: astring }, { limit: 100 }).asArray()
  }).then(res => console.log('written in atlas and retrieved:', res))
}

const testMongIO = () => {
  console.log(transfer.mong)
  window.mong = transfer.mong
  const astring = (new Date() % 9e6).toString(36) // +- random, arbitrary string
  console.log('astring:', astring)
  transfer.mong.writeIfNotThereReadIfThere(astring, r => console.log(r))
  setTimeout(() => transfer.mong.writeIfNotThereReadIfThere(astring, r => console.log(r)), 3000)
}

const testMongNetIO = () => {
  window.agui = conductor.gui.setMinimal(s => {
    // window.anet = net.use.utils.loadJsonString(s)
    transfer.mong.writeIfNotThereReadIfThere(s, r => console.log(r))
  }) // start with net upload button
}

const testMongBetterNetIO = () => {
  window.agui = conductor.gui.setMinimal() // start with net upload button
  const uel = document.getElementById('file-input')
  uel.onchange = res => {
    const f = uel.files[0]
    f.text().then(t => {
      transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
      window.anet = net.use.utils.loadJsonString(t)
      const drawnNet = new conductor.use.DrawnNet(artist.use, window.anet, [])
      conductor.use.showMembers(drawnNet.net, artist, true)
    })
  }
}

const testNetPage = () => {
  conductor.use.pages.net(net, artist, transfer)
}

const testNetIO = () => {
  // choose a netid
  // check if it is in mongo
  // if there:
  //   get network from mongo
  //   delete it
  // if not there:
  //   get from losd
  //   then write it to mongo
  const snapid = 'facebook-legacy-AntonioAnzoategui18022013'
  transfer.mong.db.collection(transfer.mong.auth.collections.test).findOne({ snapid: snapid }).then(res => {
    if (res) {
      console.log('found!!!', res)
      window.mmong = transfer.mong.db.collection(transfer.mong.auth.collections.test)
      transfer.mong.db.collection(transfer.mong.auth.collections.test).deleteMany({ snapid: snapid })
    } else {
      transfer.spark.getNetMembersLinks('facebook-legacy-AntonioAnzoategui18022013', res => {
        const net_ = net.use.build.buildFromSparql(res.members, res.friendships)
        window.nnet_ = net_
        // fixme: use JSON.stringify(net_.export()) and zstd it to compare size, should be better.
        transfer.mong.db.collection(transfer.mong.auth.collections.test).insertOne({ AAAA: 'llll', snapid: snapid, net: net_.export() }).then(() => {
          console.log('written')
        })
      })
    }
  })
  // transfer.mong.db.collection(transfer.mong.auth.collections.test).insertOne({ AAAA: 'llll', snapid: snapid }).then(() => {
  //   transfer.mong.db.collection(transfer.mong.auth.collections.test).findOne({ snapid: snapid }).then(res => {
  //     console.log('found:', res)
  //   })
  // })
}

const testGUI = () => {
  window.agui = conductor.gui.atest()
  const statsui = conductor.gui.basicStats()
  // statsui.executing = false // to stop monitoring.
  // to start again:
  // statsui.executing = true
  // statsui.animate()
  statsui.tasks.push(() => {
    const ii = []
    for (let i = 0; i < 1000000; i++) {
      ii.push(i * 99)
    }
  })
}

const testNetUpload = () => {
  window.agui = conductor.gui.setMinimal(s => {
    window.anet = net.use.utils.loadJsonString(s)
  }) // start with net upload button
  // const uel = document.getElementById('file-input')
  // uel.onchange = res => {
  //   uel.files[0].text().then(r => console.log(r))
  // }
}

const testNetUpload2 = () => {
  window.agui = conductor.gui.setMinimal() // start with net upload button
  window.agui.self.callBack = s => {
    window.anet = net.use.utils.loadJsonString(s)
    // use window.agui's objects to parse filename, then:
    // send it to write in mongo
    const drawnNet = new conductor.use.DrawnNet(artist.use, window.anet, [])
    // conductor.use.blink(drawnNet.net, artist.share.draw.base.app)
    conductor.use.showMembers(drawnNet.net, artist, Math.random() > 0.5)
    return drawnNet
  }
  // const uel = document.getElementById('file-input')
  // window.agui.uel.onchange = res => {
  //   uel.files[0].text().then(r => console.log(r))
  // }
}

const testPuxi = () => {
  conductor.use.ui.setStage(artist.share.draw.base.app)
}

const testHtmlEls = () => {
  const names = $('<button class="btn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
  const input = $('<button class="btn"><i class="fa fa-archway"></i></button>').prop('title', 'load or upload network')
  const ibtn = $('<button class="btn"><i class="fa fa-bone"></i></button>').prop('title', 'show links')
  const vbtn = $('<button class="btn"><i class="fa fa-chess"></i></button>').prop('title', 'show nodes')
  // $('button').button({ icons: { primary: 'ui-icon-circle-plus' } }).click(function (event) {
  //   event.preventDefault()
  // }).prependTo('body')
  ibtn.prependTo('body')
  vbtn.prependTo('body')
  names.prependTo('body')
  input.prependTo('body')
  const s = $('<select/>')
  s.prependTo('body')
  // s.append($('<option/>').val('avalman').html('anoptionman'))
  // s.append($('<option/>').val('yooo').html('the other'))
  transfer.mong.findAllNetworks().then(r => {
    r.forEach((n, i) => {
      s.append($('<option/>').val(i).html(n.name))
    })
    console.log('OIUQWE', r)
    const uel = document.getElementById('file-input')
    uel.onchange = res => {
      const f = uel.files[0]
      f.text().then(t => {
        transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
        window.wand.currentNetwork = net.use.utils.loadJsonString(t)
        const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
        conductor.use.showMembers(drawnNet.net, artist, true)
      })
    }
    input.on('click', () => {
      if (window.wand.currentNetwork) {
        window.wand.currentNetwork.forEachNode((n, a) => {
          a.pixiElement.destroy()
          a.textElement.destroy()
        })
        window.wand.currentNetwork.forEachEdge((n, a) => a.pixiElement.destroy())
      }
      if (s.val() === 'upload') {
        uel.click()
        return
      }
      window.wand.currentNetwork = net.use.utils.loadJsonString(r[s.val()].text)
      const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
      conductor.use.showMembers(drawnNet.net, artist, true)
      window.dn = drawnNet
      window.nn = window.wand.currentNetwork
    })
    names.on('click', () => {
      window.wand.currentNetwork.forEachNode((n, a) => {
        a.textElement.visible = !a.textElement.visible
      })
    })
    ibtn.on('click', () => {
      window.wand.currentNetwork.forEachEdge((e, a) => {
        a.pixiElement.visible = !a.pixiElement.visible
      })
    })
    vbtn.on('click', () => {
      window.wand.currentNetwork.forEachNode((n, a) => {
        a.pixiElement.visible = !a.pixiElement.visible
      })
    })
  })
  s.append($('<option/>').val('upload').html('upload'))
}

const testHtmlEls2 = () => {
  testHtmlEls()
  // window.wand.currentNetwork.forEachNode((n, a) => {
  //   a.pixiElement.on('pointerover', () => {
  //     this.tint = 0xffff00
  //   })
  // })
}

const testWorldPropertyPage = () => {
  wand.extra.text = conductor.use.pages.worldPropertyCondition()
}

const testGradus = () => {
  // soh posso passar diretamente, o primeiro passo eh alguem falar seriamente c vc sobre o assunto e a gente conversar eu, o contato (Bruno/Aline) e ela, questao e seguranca e preservar os limites gratuitos
  // hack for testing:
  // wand.magic.state = new wand.magic.Gradus(0.1)
  wand.magic.state = new wand.magic.Gradus(1)
  // window.wand.magic.Gradus()
  // depois de subir a propria rede, se compromete aos principios da fisica antropologica, incluindo dev continuar aberto GPL FSF de qqr ideia em software q a pessoa tiver disso, parecida conteitualmente ou nao
  // licensa JPL: joy public license, hommage ao Bill Joy (Vim, etc), e concorda dom o joy dos outros
}

const testAdParnassum = () => {
  const pn = window.location.href
  const items = pn.split('?')
  let level = 0
  if (items.length > 2) {
    level = items[2]
  }
  // fixme: add URL options for muted and timestrech:
  wand.magic.adParnassum = new wand.magic.AdParnassum({ currentLevel: level, timeStreach: 0.01, counter: { colorChange: 60, hoverNode: 19 }, state: {}, muted: true })
}

const testAudio = () => {
  // wand.maestro.synths
  console.log(wand.maestro.synths)
}

const testJQueryFontsAwesome = () => {
  const fbtn = $('<button class="btn"><i class="fa fa-user-alt" id="ifr"></i></button>').prop('title', 'friends explorer')
  fbtn.prependTo('body')
  let count = 0
  fbtn.on('click', () => {
    console.log('clicked')
    $('#ifr').toggleClass(function () {
      count++
      console.log(count)
      const i = count % 3
      if (i === 0) {
        return 'fa-user'
      } else if (i === 1) {
        return 'fa-users'
      } else if (i === 2) {
        return 'fa-users-alt'
      }
    })
  })
  var bana = 'yeah'
  window.fbtn = fbtn
  const names = $('<button class="btn" id="nbtn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
  names.prependTo('body')
  window.nmnm = names
  let clickCount = 0
  const classes = ['fa-cat', 'fa-user', 'fa-users']
  const colors = ['red', 'blue', '#ffff00']
  const names2 = $('<i/>', { class: 'fa fa-cat', id: 'ibtn' }).appendTo(
    $('<button/>', {
      class: 'btn',
      id: 'nbtn2',
      title: 'show names22',
      click: () => {
        const c = clickCount
        const cc = c + 1
        console.log('yeah', c, cc, names2, classes, $('#ibtn'))
        $('#ibtn').removeClass(classes[c % 3])
          .addClass(classes[cc % 3])
          .css('color', colors[cc % 3])
        clickCount++
      }
    }).attr('mtitley', 'TITTITI').prependTo('body')
  )
  window.nmnm2 = names2
  return bana
}

const testObj = () => {
  this.aval = 33
  const a = {
    aval: 19,
    afun: () => {
      console.log(++this.aval, this)
    }
  }
  window.aa = a
  a.afun()
}

const testColors = () => {
  // https://www.npmjs.com/package/distinct-colors, returns chromajs
  // has scales and main operations on colors:
  // https://www.npmjs.com/package/chroma-js
  // https://www.npmjs.com/package/tinycolor2 has basic pallete creation and operations
  // https://www.npmjs.com/package/color-scheme also basic palletes
  // http://linkbroker.hu/stuff/kolorwheel.js/ // advanced
  // https://github.com/google/palette.js // palette generator
  // https://bashooka.com/coding/9-useful-javascript-color-libraries/ (please.js)
  // Check artist.use.tincture.
  // tested but didn't write snippets for each of these libs:
  const c = require('chroma-js')
  const t = require('tinycolor2')
  const S = require('color-scheme')
  const d = require('distinct-colors')
  const ss = new S()
  // ss.from_hex('ff0000').variation('soft')
  // ss.from_hex('000000').variation('soft')
  // ss.from_hex('ffffff').scheme('triade').variation('soft')
  // ss.from_hex('ff0000').scheme('mono')
  // ss.from_hex('ff0000').scheme('analogic')
  console.log(ss.colors())
  // 240
  const pixiEls = [...Array(40).keys()].map(i => {
    const node = artist.use.mkNode('tri')
    node.x = 170 + 150 * (i % 4)
    node.y = 200 + 100 * Math.floor(i / 4)
    node.alpha = 1
    node.scale.set(4)
    return node
  })
  // const pixiEls = colors.reduce((a, c) => {
  //   const node = artist.use.mkNode('tri', c)
  //   node.x = 20 + 150 * (i % 4)
  //   node.y = 100 + 100 * Math.floor(i / 4)
  //   a.push({ element: node, color: c })
  //   return a
  // }, [])
  const text = wand.artist.use.mkText('asd', [50, 50])
  text.scale.set(3)
  let colors
  const getColors = (scheme = 'triade', variation) => {
    // let colors = ss.from_hue(++current).scheme(scheme)
    window.cccccc = current++
    // let colors = ss.from_hue(0).scheme(scheme)
    let colors = ss.from_hex('ff0000').scheme(scheme)
    console.log('SCHEME', scheme, ', VARIATION:', variation)
    if (variation !== undefined) {
      colors = colors.variation(variation)
    }
    text.text = `scheme: ${scheme}, variation: ${variation}`
    return colors.colors().map(c => parseInt(c, 16))
  }
  const schemes = Object.keys(S.SCHEMES)
  const variations = Object.keys(S.PRESETS)
  let bg = 0
  let current = 0
  let scheme = utils.chooseUnique(schemes, 1)[0]
  let variation = utils.chooseUnique(variations, 1)[0]
  wand.magic.app.ticker.add(delta => {
    if (current % 360 === 0) {
      const bgc = (++bg) % 2 === 0 ? 0x000000 : 0xffffff
      wand.artist.share.draw.base.app.renderer.backgroundColor = bgc
    }
    if (current % (360 * 2) === 0) {
      scheme = utils.chooseUnique(schemes, 1)[0]
      variation = utils.chooseUnique(variations, 1)[0]
    }
    // colors = getColors(scheme, variation)
    colors = getColors('tetrade', variation)
    pixiEls.forEach((e, i) => {
      const c = colors[i]
      e.tint = c
    })
  })
  window.ct = { c, t, S, ss, d, pixiEls, scheme }
}

const testMusic = () => {
  const { Tone, Scribble } = wand.maestro.base
  wand.maestro.base.Tone.Transport.bpm.value = 60
  const synth = new Tone.Synth({
    oscillator: {
      type: 'pwm',
      modulationFrequency: 0.2
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.2,
      release: 0.9
    }
  }).toMaster()
  const polySynth = new Tone.PolySynth(6, Tone.Synth, {
    oscillator: {
      type: 'square'
    }
  }).toMaster()
  // set the attributes using the set interface
  polySynth.set('detune', -1200)
  // const polySynth = new Tone.PolySynth(Tone.Synth).toMaster()
  // play a middle 'C' for the duration of an 8th note
  const membSynth = new Tone.MembraneSynth().toMaster()
  const membSynth2 = new Tone.MembraneSynth().toMaster()
  $('<i/>', { class: 'fa fa-bone', id: 'friendship-icon' }).appendTo(
    $('<button/>', {
      class: 'btn',
      id: 'friendship-button',
      click: () => {
        // play a middle 'C' for the duration of an 8th note
        // synth.triggerAttackRelease('C4', '8n')
        synth.triggerAttackRelease('D3', '8n')
        setTimeout(() => {
          polySynth.set('detune', -1200)
          polySynth.triggerAttackRelease(['C4', 'E4', 'A4'], '4n')
        }, 1000)
        setTimeout(() => {
          polySynth.set('detune', 0)
          polySynth.triggerAttackRelease(['C4', 'E4', 'A4'], '4n')
        }, 2000)
        // polySynth.triggerAttackRelease(['C4', 'E4', 'G4', 'B4'], '2n')
        // synth.triggerAttackRelease('D3', '+1')
        const loop = new Tone.Loop(function (time) {
          // triggered every eighth note.
          // synth.triggerAttackRelease('D3', '8n')
          membSynth2.triggerAttackRelease('d3', '8n')
          console.log(time)
        }, '8n').start(0)
        const loop2 = new Tone.Loop(function (time) {
          // Run once per eighth note, 8n, & log the time
          console.log(time)
          // trigger synth note
          membSynth.triggerAttackRelease('C2', '2n')
        }, '2n').start(0)
        wand.maestro.base.looper()
        Tone.Transport.start()
        return { loop, loop2 }
      }
    }).attr('atitle', 'show friendships').prependTo('body')
  )
  return { Scribble }
}

const testLooper = () => {
  wand.maestro.base.looper()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testSeq = () => {
  // wand.maestro.base.oneSeq()
  wand.maestro.base.twoSeq()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testSync = () => {
  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testPattern = () => {
  window.apat = wand.maestro.base.aPattern(2)
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testRec = () => {
  // records audio and video:
  window.rrr = require('recordrtc')
  async function f () {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const recorder = new window.rrr.RecordRTCPromisesHandler(stream, {
      type: 'video'
    })
    recorder.startRecording()

    const sleep = m => new Promise((resolve, reject) => setTimeout(resolve, m))
    await sleep(3000)

    await recorder.stopRecording()
    const blob = await recorder.getBlob()
    window.rrr.invokeSaveAsDialog(blob, 'video.webm')
  }
  window.fff = f
  f()
  return f
}

const testRec2 = () => {
  // to record audio and page or canvas.
  // to record tone: https://www.youtube.com/watch?v=VHCv3waFkRo
  //   https://stackoverflow.com/questions/55686982/how-to-record-web-browser-audio-output-not-microphone-audio
  // to record canvas: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
  // canvas + audio: https://stackoverflow.com/questions/39992048/how-can-we-mix-canvas-stream-with-audio-stream-using-mediarecorder
  window.rrr = require('recordrtc')
  // wand.magic.app.view.id = 'mpixiid'
  // window.ccc = window.rrr.CanvasRecorder('mpixiid')
  //
  // async function f () {
  //   const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  //   window.ccc = new window.rrr.CanvasRecorder(stream, { disableLogs: true, useWhammyRecorder: true })
  // }
  // f()

  // async function f () {
  //   const t = wand.maestro.base.Tone
  //   const d = t.context.createMediaStreamDestination()
  //   const audioTrack = d.stream.getTracks()[0]
  //   const canvasStream = wand.magic.app.view.captureStream(30)
  //   canvasStream.addTrack(audioTrack)
  //   const recorder = new MediaRecorder(canvasStream)
  //   recorder.start()

  //   const sleep = m => new Promise((resolve, reject) => setTimeout(resolve, m))
  //   await sleep(3000)

  //   recorder.stop()
  //   window.mrec = recorder
  //   const blob = await recorder.getBlob()
  //   window.rrr.invokeSaveAsDialog(blob, 'video.webm')
  //   return recorder
  // }
  // f()

  // Optional frames per second argument.
  var canvas = document.querySelector('canvas')
  // const canvas = wand.magic.app.view.captureStream(30)
  var stream = canvas.captureStream(30)
  // const d = t.context.createMediaStreamDestination()
  // const audioTrack = d.stream.getTracks()[0]
  // stream.addTrack(audioTrack)
  var recordedChunks = []

  console.log(stream)
  var options = { mimeType: 'video/webm' }
  const mediaRecorder = new MediaRecorder(stream, options)

  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.start()

  function handleDataAvailable (event) {
    console.log('data-available')
    if (event.data.size > 0) {
      console.log('yes data')
      recordedChunks.push(event.data)
      console.log(recordedChunks)
      download()
    } else {
      console.log('no data')
      // ...
    }
  }
  function download () {
    var blob = new Blob(recordedChunks, {
      type: 'video/webm'
    })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.webm'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // demo: to download after 9sec
  setTimeout(event => {
    console.log('stopping')
    mediaRecorder.stop()
  }, 3000)
  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testRecCanvas = () => {
  var canvas = document.querySelector('canvas')
  var stream = canvas.captureStream(30)
  var recordedChunks = []

  console.log(stream)
  var options = { mimeType: 'video/webm' }
  const mediaRecorder = new MediaRecorder(stream, options)
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.start()
  function handleDataAvailable (event) {
    console.log('data-available')
    if (event.data.size > 0) {
      console.log('yes data')
      recordedChunks.push(event.data)
      console.log(recordedChunks)
      download()
    } else {
      console.log('no data')
      // ...
    }
  }
  function download () {
    var blob = new Blob(recordedChunks, {
      type: 'video/webm'
    })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.webm'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // demo: to download after 9sec
  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      setTimeout(event => {
        console.log('stopping')
        mediaRecorder.stop()
      }, 3000)
      wand.maestro.base.Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')
}

const testRecAudio = () => {
  // const audio = wand.$('<audio/>')
  const Tone = wand.maestro.base.Tone
  const synth = new Tone.Synth()
  const actx = Tone.context
  const dest = actx.createMediaStreamDestination()
  const recorder = new MediaRecorder(dest.stream)

  synth.connect(dest)
  synth.toMaster()

  const chunks = []

  const notes = 'CDEFGAB'.split('').map(n => `${n}4`)
  let note = 0

  recorder.ondataavailable = evt => chunks.push(evt.data)
  recorder.onstop = evt => {
    const blob = new Blob(chunks, { type: 'audio/ogg codecs=opus' })
    // audio.src = URL.createObjectURL(blob)
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.ogg'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      Tone.Transport.toggle()
      Tone.Transport.scheduleRepeat(time => {
        if (note === 0) recorder.start()
        if (note > notes.length) {
          synth.triggerRelease(time)
          recorder.stop()
          Tone.Transport.stop()
        } else synth.triggerAttack(notes[note], time)
        note++
      }, '4n')
    }
  }).prependTo('body').html('asd')
}

const testRecAudioAndCanvas = () => {
  // const audio = wand.$('<audio/>')
  const Tone = wand.maestro.base.Tone
  const synth = new Tone.Synth()
  const actx = Tone.context
  const dest = actx.createMediaStreamDestination()

  const canvas = document.querySelector('canvas')
  const stream = canvas.captureStream(30)
  const combined = new MediaStream([...dest.stream.getTracks(), ...stream.getTracks()])

  // const recorder = new MediaRecorder(dest.stream)
  const recorder = new MediaRecorder(combined)

  synth.connect(dest)
  synth.toMaster()

  const chunks = []

  const notes = 'CDEFGAB'.split('').map(n => `${n}4`)
  let note = 0

  recorder.ondataavailable = evt => chunks.push(evt.data)
  recorder.onstop = evt => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    // audio.src = URL.createObjectURL(blob)
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.webm'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      Tone.Transport.toggle()
      Tone.Transport.scheduleRepeat(time => {
        if (note === 0) recorder.start()
        if (note > notes.length) {
          synth.triggerRelease(time)
          recorder.stop()
          Tone.Transport.stop()
        } else synth.triggerAttack(notes[note], time)
        note++
      }, '4n')
    }
  }).prependTo('body').html('asd')
}

const testRecAudioAndCanvas2 = () => {
  const Tone = wand.maestro.base.Tone
  const actx = Tone.context
  const dest = actx.createMediaStreamDestination()
  Tone.Master.connect(dest)

  const canvas = document.querySelector('canvas')
  const stream = canvas.captureStream(30)

  const combined = new MediaStream([...dest.stream.getTracks(), ...stream.getTracks()])
  const recorder = new MediaRecorder(combined, { mimeType: 'video/webm' })

  const notes = 'CDEFGAB'.split('').map(n => `${n}4`)

  let note = 0
  const chunks = []
  recorder.ondataavailable = evt => chunks.push(evt.data)
  recorder.onstop = evt => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    // audio.src = URL.createObjectURL(blob)
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.webm'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  window.ares = wand.maestro.base.syncToy()
  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      Tone.Transport.toggle()
      Tone.Transport.scheduleRepeat(time => {
        if (note === 0) recorder.start()
        if (note++ > notes.length) {
          recorder.stop()
          Tone.Transport.stop()
        }
      }, '4n')
    }
  }).prependTo('body').html('asd')
}

const testDiffusionLimited = () => {
  // makes a progression, starting from a seed and
  // activating at most 4 neighbors with preference for smaller degrees
  const drawnNet = testPlot()
  window.dd = drawnNet
  const net = drawnNet.net
  const seeds = wand.utils.chooseUnique(net.nodes(), 4)
  const progression = wand.net.use.diffusion.use.seededNeighbors(net, 2, seeds)
  const Tone = wand.maestro.base.Tone
  const membSynth = new Tone.MembraneSynth().toMaster()
  // const metal = new Tone.MetalSynth({ resonance: 100, octaves: 0.01, harmonicity: 10, frequency: 500, volume: 10 }).toMaster()

  const d = (f, time) => Tone.Draw.schedule(f, time)
  const seq2 = new Tone.Pattern((time, nodes) => {
    // console.log('bass', time, a.degree, node)
    membSynth.triggerAttackRelease(10 + nodes.length, 0.01, time)
    if (nodes.length === 0) {
      d(() => net.forEachNode((n, a) => {
        a.pixiElement.tint = 0xff0000
      }), time)
    } else {
      d(() => nodes.forEach(n => {
        const a = net.getNodeAttributes(n)
        a.pixiElement.tint = 0xffffff
      }), time)
      d(() => nodes.forEach(n => {
        const a = net.getNodeAttributes(n)
        a.pixiElement.tint = 0xffff00
      }), time + 2)
    }
  }, progression)
  seq2.interval = '1n'
  seq2.start()

  $('<button/>', {
    class: 'btn',
    id: 'friendship-button',
    click: () => {
      Tone.Transport.toggle()
    }
  }).prependTo('body').html('asd')

  window.pp = { progression, seq2, membSynth }
}

const testNoise = () => {
}

const testLycoreia = () => {
  const pn = window.location.href
  const items = pn.split('?')
  let level = 0
  if (items.length > 2) {
    level = items[2]
  }
  console.log('items:', items)
  if (items.length > 3) {
    if (items[3] === 'bana') {
      wand.sageInfo = { name: 'Renato Fabbri', sid: 'renato.fabbri.125', nid: null }
    } else if (items[3] === 'urania') {
      console.log('starting urania dialog')
      wand.sageInfo = { sid: '__thisIsAllOfTheSagesMan__' }
    } else {
      const sid = items[3]
      console.log('yeah, got the id:', sid)
      wand.sageInfo = { name: 'XXX', sid, nid: null }
    }
  }
  wand.magic.lycoreia = new wand.magic.Lycoreia({ currentLevel: level, counter: { colorChange: 60, hoverNode: 19 }, state: {}, muted: true })
}

const testTithorea = () => {
  // http://localhost:8080/?lis.html?13?renato.fabbri.125?0.001?advanced
  // http://localhost:8080/?lis.html?13?renato.fabbri.125?0.001
  const pn = window.location.href
  const items = pn.split('?')
  let level = 0
  if (items.length > 2) {
    level = items[2]
  }
  console.log('items:', items)
  if (items.length > 3) {
    if (items[3] === 'bana') {
      wand.sageInfo = { name: 'Renato Fabbri', sid: 'renato.fabbri.125', nid: null }
    } else if (items[3] === 'urania') {
      console.log('starting urania dialog')
      wand.sageInfo = { sid: '__thisIsAllOfTheSagesMan__' }
    } else {
      const sid = items[3]
      console.log('yeah, got the id:', sid)
      wand.sageInfo = { name: 'XXX', sid, nid: null }
    }
  }
  // let timeStreach = 1
  // if (items.length > 4) {
  //   timeStreach = items[4]
  // }
  wand.magic.tithorea = new wand.magic.Tithorea({ currentLevel: level, counter: { colorChange: 60, hoverNode: 19 }, state: {}, muted: true })
}

const testSyncParnassum = () => {
  console.log(window.syncInfo)
  console.log('go Parnassum!')
  // http://localhost:8080/?page=ankh_&usid=erangb.snooev.125&mnid=1537120300&s=1&mute=1&muteMusic=1&bypassMusic=1&ts=0.001&clevel=7
  wand.magic.syncParnassum = new wand.magic.SyncParnassum()
}

const testEditor = () => {
  const names2 = $('<button/>').appendTo('body').html('asd')
  const diag = $('<div/>', {
    id: 'diag1',
    css: {
      display: 'none',
      position: 'fixed',
      width: '100%',
      height: '100%',
      overflow: 'auto',
      'z-index': 1,
      left: 0,
      top: 0,
      padding: '100px',
      background: '#6DC2E1'
    }
  }).appendTo('body')

  names2.on('click', () => {
    diag.css('display', 'block')
  })
  // $('<div/>', { css: { 'background-color': 'white', margin: 'auto' } }).html('qweasd').appendTo('#diag1')
  window.tarea = $('<textarea/>', { css: { 'background-color': 'white', margin: 'auto' } }).html('qweasd').appendTo('#diag1')
  $('<button/>').appendTo('#diag1').html('close').on('click', () => {
    diag.css('display', 'none')
  })
  return names2
}

const testLz = () => {
  window.lz = lz
  var string = 'This is my compression test.'
  console.log('Size of sample is: ' + string.length)
  var compressed = lz.compress(string)
  console.log('Size of compressed sample is: ' + compressed.length, compressed)
  string = lz.decompress(compressed)
  console.log('Sample is: ' + string)
}

const testMkSyncId = () => {
  const drawnNet = testPlot()
  const sync = wand.net.use.diffusion.use.seededNeighborsLinks(drawnNet.net, 4, [])
  console.log(sync, 'ORIGINAL SYNC')
  wand.transfer.mong.writeSync({ sync, etype: 'sync' }).then(id => {
    console.log(id, 'SYNC ID')
    wand.transfer.mong.getSync({ _id: id }).then(sync_ => {
      console.log(sync_, 'SYNC BACK')
    })
  })
}

const testDonatePaypal = () => {
  $('canvas').hide()
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Donate using Paypal</h2>

  <p>
  You may donate using Paypal by clicking on the following image:
  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
    <input type="hidden" name="cmd" value="_donations" />
    <input type="hidden" name="business" value="CWRTXTJF9C3N6" />
    <input type="hidden" name="currency_code" value="BRL" />
    <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
    <img alt="" border="0" src="https://www.paypal.com/pt_BR/i/scr/pixel.gif" width="1" height="1" />
  </form>
  </p>

  <p>
  Or using the following QR code:
  <p>
  <img src="doacao/qrPaypal.png" alt="QR Code for donating through Paypal">
  </p>
  </p>

  <p>Or ${link('go back to the donations page', 'donate')}.</p>

  <br>
  :::
  `).appendTo('body')
}

const testDonatePagseguro = () => {
  $('canvas').hide()
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Donate using Pagseguro</h2>

  <p>
  You may donate using Pagseguro by clicking on the following image:
  <!-- INICIO FORMULARIO BOTAO PAGSEGURO -->
  <form action="https://pagseguro.uol.com.br/checkout/v2/donation.html" method="post">
  <!-- NÃO EDITE OS COMANDOS DAS LINHAS ABAIXO -->
  <input type="hidden" name="currency" value="BRL" />
  <input type="hidden" name="receiverEmail" value="renato.fabbri@gmail.com" />
  <input type="hidden" name="iot" value="button" />
  <input type="image" src="https://stc.pagseguro.uol.com.br/public/img/botoes/doacoes/209x48-doar-assina.gif" name="submit" alt="Pague com PagSeguro - é rápido, grátis e seguro!" />
  </form>
  <!-- FINAL FORMULARIO BOTAO PAGSEGURO -->
  </p>

  <p>Or ${link('go back to the donations page', 'donate')}.</p>

  <br>
  :::
  `).appendTo('body')
}

const testDonateBitcoin = () => {
  $('canvas').hide()
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Donate using Bitcoins</h2>

  <p>Transfer any amount of bitcoins to the wallet in the address:
  <b>bc1qjw72xa6c8c924j8aj8y737q56let8envx4j0xd</b>
  </p>

  <p>
  <p>
  Or use the QR Code:
  </p>
  <img src="doacao/qrBitcoin.png" alt="QR Code for donating using the Bitcoin Wallet">
  </p>

  <p>Or ${link('go back to the donations page', 'donate')}.</p>

  <br>
  :::
  `).appendTo('body')
}

const testDonate = () => {
  const paragraphs = [
    `Please contribute to Our Aquarium (OA). You can find many suggestions for addind to OA in the ${link('contributing page', 'contribute')}.
    `,
    `
    This page is dedicated to monetary donations. Any amount may be transfered. We currently provide the following ways for you to accomplish a donation:
    `
  ].reduce((a, t) => a + `<p>${t}</p>`, '')

  const items = [
    `Donate through ${link('Paypal', 'donatePaypal')}.`,
    `Donate through ${link('Pagseguro', 'donatePagseguro')}.`,
    `Donate using ${link('Bitcoin', 'donateBitcoin')}.`,
    'Write us at <a href="mailto:sync.aquarium@gmail.com" target="_blank"> sync <ADOT> aquarium <AT> gmail <ANOTHERDOR> com</a> to transfer into an online account or donate through any other means.'
  ].reduce((a, t) => a + `<li>${t}</li>`, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Donate to Our Aquarium</h2>

  ${paragraphs}

  ${items}

<br/>
    <p>
    We want to include other e-coins, such as Ethereum, but we have not managed to get into them.
    If you wish to help us in including them, please write us.
    </p>

    <p>Please donate so <b>Our Aquarium</b> receives further developments and online instances.</p>
    <br/>
:::
    `
  ).appendTo('body')
  $('canvas').hide()
}

const testDeploy = () => {
  $('canvas').hide()
  const paragraphs = [
    `This is a hidden page. Please don't share it if you are not explicitly authorized by Roceiro Bolchevique to do so.
    In doubt, get in tough with who sent you this link or the first OA-related URL.`,
    `To deploy the OA platform, you need to create the online database,
    obtain the OA code for the and make the HTML+JavaScript page available somewhere.`,
    `You use already existing credentials. For simplicity, consider you have none.
    You create a new Gmail account, with it, you create a Mongo Atlas account (for the database) and a Github account (for the static HTML page).
    That is all you need but you may manage to use other services,
    </a target="_blank" href="https://github.com/ripienaar/free-for-dev">such as these</a>.`
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')
  const items = [
    '<a href="?page=manDB">Configure the MongoDB database.</a>',
    '<a href="?page=manGit">Make the OA HTML page and extension available.</a>'
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>deploying OA</h2>

  ${paragraphs}

  With both Github and Atlas accounts, you need to:
  <ol>
  ${items}
  </ol>

  :::
  `).appendTo('body')
}

const testManDb = () => {
  $('canvas').hide()
  const paragraphs = [
    'This page is the first step in the OA Deploying Manual, please do not share.', // deploy.html
    'All OA pages, and also the browser extension, use the database setting described in this page.',
    'Please take the time to make +- daily backups after you start using the instance, as described in the end of this page.'
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const items = [
    'Login to mongo atlas, create cluster.',
    'Go to collections, create your own data. Any database name, any collection name.',
    'Go to Realm tab (next to the Atlas tab)',
    'Add the collection, set R/W.',
    'Set anon access on users -> Providers',
    'Change url (e.g. from local from your github.io page). Of course, keep local localhost if developing locally.'
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>deploying new OA instance: starting database</h2>


  ${paragraphs}
  <br>

  Example ways in which you may assist:
  <ol>${items}</ol>

  :::

  `).appendTo('body')
}

const testDevLocal = () => {
  $('canvas').hide()
  const paragraphs = [
    'This is an OA fundamental page, please do not share.', // base for OA Deploying Manual (path deploy.html)
    'Here are the instructions to have a fully working OA platform in your local machine.',
    `There are two main reasons to run OA locally:
    1) software development; 2) deploy OA.`
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const items = [
    `Clone the <a href="https://github.com/ttm/ml-net-gui/" target="_blank">the ml-net-gui repository</a>
    and execute "make va-install va-e-dev" at the repository root`,
    'You should be able to access this and other OA pages at localhost which do not rely on the database',
    `To have a complete running instance of OA,
    you need to <a href="?page=manDB">configure the database with localhost</a> as the
    URL and then start a local server.`,
    'Install the extension you created in step 1). Should be in visual_analytics/OAextension/',
    'Click on Login / Advance / Update / Download to populate the instance.', // fixme: don't ask to send to renato.fabbri when download
    `You have started a local Aquarium instance. Please notify us through:
    <a href='mailto:sync.aquarium@gmail.com' target='_blank'> sync <ADOT> aquarium <AT> gmail <ANOTHERDOR> com</a><br/>
    `
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Starting Our Aquarium locally</h2>


  ${paragraphs}
  <br>

  To start the local server:
  <ol>${items}</ol>


  <p>The "make va-e-dev" command starts the server and keeps track of
  changes to Javascript files inside visual_analytics/,
  you only need to reload the page on the browser (or hit the extension button again).</p>
  <p>The 
  :::

  `).appendTo('body')
}

const testManGit = () => {
  $('canvas').hide()
  const paragraphs = [
    'This page is the second step in the <a href="?page=deploy">OA Deploying Manual</a>',
    `Here, you bootstrap your OA instance. Basically, you need to make the HTML available,
    install the version of the YOU extension and then visualize your own network to synchronize.`,
    'In this working example, we are using Github pages.'
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const items = [
    '<a href="?page=devLocal">Make OA available localy</a>, you will need the two files it generates',
    'Fork <a href="https://github.com/markturian/ouraquarium" target="_blank">this repository</a> or create a new repository with the same index.html and favicons.',
    'Go to repository settings tab on Github. Scroll down to the GitHub pages section and enable it.',
    'Replace the main_ok.js file in the repository created with the visual_analytics/scripts/main_ok.js file obtained in step 1).',
    'Execute "cd ml-net-gui && make va-eOA-zip" to create the visual_analytics/you.zip file. Copy it to the repository created.',
    'Commit and push. It may take some minutes to be accessible in github.io.',
    'When it is finished, click on the "tithorea" button on the You extension, describe a syncronization and choose seeds.',
    `You have bootstrapped an Aquarium instance. Please notify us through:
    <a href='mailto:sync.aquarium@gmail.com' target='_blank'> sync <ADOT> aquarium <AT> gmail <ANOTHERDOR> com</a><br/>
    `
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>deploying new OA instance: sharing the HTML</h2>


  ${paragraphs}

  Example ways in which you may assist:
  <ul>${items}</ul>

  :::

  `).appendTo('body')
}

const testGuidelines = () => {
  $('canvas').hide()
  const paragraphs = [
    `Our Aquarium, O Aquario, or OA, enables social synchronization and art.

    Components are unlocked with usage: gadgets, techniques, audiovisual instruments, new webpages.
    `,
    `You start at "Gradus ad Parnassum", where you unlock most basic functionality step-by-step,
    and make audiovisual music with your social self.
    `,
    `Such page finishes when you reach Mount Parnassus, and receive "You", a browser extension
    so that you can visualize your networks more throughly.
    `,
    `The You extension also enables access to other pages, locations in the Parnassus: Lycoreia and Tithorea.
    `,
    `With them, you can inspect communities and subcommunities, perform synchronizations in your own networks,
    and make audiovisual music. Further audiovisual instruments for social and self synchronization, analysis and
    annotation are unraveled with your usage.`,
    `Read the texts that are presented to you carefully.
    OA is easy to use if you have consideration for the information provided to you.
    `,
    `Consider contributing to OA with feedback, ideas, management of this or new OA instances,
    development of the software and scientific framework, donations.
    `,
    `<a href='?page=contribute' target='_blank'>Contribute</a>
    `
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const text = `
  <h2>Usage Guidelines</h2>

  ${paragraphs}

  :::

  `

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(text).appendTo('body')
}

const testContribute = () => {
  $('canvas').hide()
  const paragraphs = [`
    Please contribute to the <b>Our Aquarium platform</b> (OA) with texts, ideas, opinions,
    any other feedback. Partnerships and donations are also encouraged.
    You might know someone or an institution which would be interested in
    developing, maintaining, using or sponsoring this software or social undertake.
    `,
    `
    This framework is in constant change and any help is greatly appreciated.
    Please get in contact through:
    <a href='mailto:sync.aquarium@gmail.com' target='_blank'> sync <ADOT> aquarium <AT> gmail <ANOTHERDOR> com</a><br/>
    `,
    `
    We provide the Fundamental Cycle, through which the time someone invests in attending any need or requirement may be rewarded.<br/>
    It currently operates through synchronizations. One of which consists in sharing these pages with the musical elements.
    These musical pieces are a medium to share the synchronization description as expressed with a short text and an external link.
    `,
    `
    `
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const todos = [
    'Find software developers to implement new functionalities and solve issues.',
    'Provide means for donations through Bitcoin, Aetherium, Paypal, etc.',
    'Find sponsors and donators.',
    'Hiring: please send proposals to the email above.',
    'Write journalistic, academic, artistic texts about Our Aquarium.',
    'Help writing/enhancing the texts found in the platform',
    'Help to desing new interfaces or enhance current tools.',
    'Find partners to think and maintain OA.',
    'Make videos, make synchronizations, use OA.',
    `Provide help for others to use OA (for example, in the 
    <a href="https://webchat.freenode.net/#ouraquarium" target="_blank">OA chat and help channel</a>)`,
    'Take part writing the software underlying the OA platform (pages, extensions).',
    'Improve the scientific framework.',
    'Write academic articles alone or in partnership with the OA community.',
    'Start a new instance of the OA platform.',
    `Write documentation about OA. The continuous development has entailed shallow documentation.
    Any writen or recorded piece will probably be referenced in the documentation if sent to the email above.`
  ].reduce((a, t) => a + `<li>${t}</li>`, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Supporting Our Aquarium</h2>

  ${paragraphs}

  Example ways in which you may assist:
  <ul>${todos}</ul>

  <p>Of course, we also receive donations for example through Paypal or through Bitcoins. Please visit our ${link('donations page', 'donate')}.</p>

  <br>

  :::

  `).appendTo('body')
}

const link = (text, path) => {
  const ua = wand.router.use.urlArgument
  const lflag = ua('lang') ? `&lang=${ua('lang')}` : ''
  return `<a href="?page=${path + lflag}">${text}</a>`
}

const testAbout = () => {
  $('canvas').hide()
  const paragraphs = [
  `
  Our Aquarium (OA) is a platform for harnessing your social self (or social organism) through analyses, audiovisual creation, and gamification.
  `,
  `
  There are fundamental aspects about OA which you may wish to know more about:`
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const items = [
    `The ${link('You extension', 'extension')} for your browser: the first gateway you should use to reach your social self.`,
    `${link('Usage guidelines', 'guidelines')}: learn basics about the OA and using it.`,
    `${link('Contributing to Our Aquarium', 'contribute')}.`,
    `${link('Frequently Asked Questions', 'faq')} about OA.`,
    `${link('Conceptual remarks', 'theory')} on what OA is and consequences.`,
    `${link('Hidden pages / features', 'hidden')}.`
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>About Our Aquarium</h2>

  ${paragraphs}

  <ul>${items}</ul>

  <br>
  :::
  `).appendTo('body')
}

const testExtension = () => {
  $('canvas').hide()
  const paragraphs = [
  `
  Installing and using the <b>You</b> extension is the first step towards fully acquiring your social
  networks in OA. Then, you will be able to better know yourself through your social self.
  `
  ].reduce((a, t) => a + `<p>${t}</p>`, '')

  const items = [
    'Download the file <a href="you.zip" target="_blank">you.zip</a> and unpack it.',
    'In the <b>Google Chrome</b> browser, go to "extensions (in the upper-right corner) -> manage extensions."',
    'Enable developer mode (in the extensions panel you reached in step 2.',
    'Click on the "Load unpacked" button (in the extension panel). Select the folder you unpacked in step 1 (where you have the README.md file and the "scripts" folder").'
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  const items2 = [
    'Click on the badge of the You extension. It is also on the upper-right corner. You may need to pin the You extension in the extensions menu (also in the upper-right corner).',
    'Click on the pink button to retrieve some of your data. You should have Facebook logged in. Other social networks are enabled after you examine your friendship network (unfortunatelly, they are currently only available on Facebook).',
    'Your browser will open your profile page to verify your identity, will then load your friends page and scroll down to have all your friends, and then will visit the mutual friends page of each friend. This process will probably take only a few minutes, wait for it to finish.',
    'After you retrieved your friends and at least some of your mutual friends, click on the You extension badge again. You should see your name, id, number of friends, number of friends visited (for mutual friends), and friendships found.',
    'Click on any of the yellow buttons: "Gradus", "Lycoreia", or "Tithorea". They are specific pages for you to analyze and make audiovisual art with your social self and are only reacheable through the You browser extension. We suggest you use each of them at least a few times.',
    'Click again in the pink button from time to time. Wait about 1h before clicking again on the pink button. Facebook limits the access to specific features in a short timespan.'
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>The <b>You extension</b></h2>

  ${paragraphs}

  To install it, you should:
  <ol>${items}</ol>

  To use it, you should:
  <ol>${items2}</ol>

  :::

  `).appendTo('body')
}

const testFAQ = () => {
  $('canvas').hide()
  const qa = [
    [
      'What are the platforms I can use within OA?',
      'Facebook, Instagram, Twitter, WhatsApp, Telegram.'
    ],
    [
      'How can I start analyzing and make art with an specific platform, for example: Instagram?',
      `Install and use the ${link('You extension', 'extension')}.`
    ],
    [
      'Why do we start with Facebook?',
      'One of the core objectives of OA is to enable self-knowledge, and for such, the friendship network is more powerful then interaction networks. The friendship network is only available in Facebook.'
    ],
    [
      'I have a suggestion for OA to include a feature or a social network platform or to simplify or modify something. How should I proceed?',
      `Visit the ${link('contribute', 'contribute')} page. There, you will find and email to which messages should be sent.`
    ],
    [
      'What are all the pages and features in OA?',
      `You should read the ${link('about', 'about')} page and pages linked therein. Further pages and features are unraveled with usage.`
    ]
  ].reduce((a, q) => a + `<p><b>${q[0]}</b><br>${q[1]}</p>`, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Frequently Asked Questions (FAQ)</h2>

  ${qa}

  <br>
  :::
  `).appendTo('body')
}

const testTheory = () => {
  $('canvas').hide()
  const theoryItems = [
    `${link('Synchronization', 'sync')}: diffusion of information that changes the network functionality.`,
    `Ethics, privacy in the ${link('anthropological physics', 'anphy')}.`
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Theoretical / Conceptual considerations</h2>

  <ul>${theoryItems}</ul>

  <br>
  :::
  `).appendTo('body')
}

const testHidden = () => {
  $('canvas').hide()
  const paragraphs = [
    'OA is designed as a progressive journey to uncover your social self to yourself.',
    'By making art, analyses, synchronizations, installing extensions, accessing pages, you enable new pages and features.',
    'Therefore, many of the pages /features are hidden for a newcomer:'
  ].reduce((a, t) => { return a + `<p>${t}</p>` }, '')

  const items = [
    'Features in the Gradus ad Parnassum are only enabled for the person after s/he hears the musical piece dedicated to her/him and follows the instructions.',
    'Oracles, interfaces dedicated to divination.',
    'Meditation pages with cycles for breathing, sonic do-in, binaural beats and many other features.',
    `Utensils for accessing and gathering data from social networking platforms such as Instagram, Twitter, WhatsApp, Telegram, emails, etc. You should start with the ${link('You extension', 'extension')}.`,
    'Gadgets to make audiovisual art or probe the capabilities of your system',
    'Manuals to install and deply new instances of the OA platform.',
    `Advanced interfaces for designing ${link('synchronizations', 'sync')}.`,
    'Advanced interfaces to analyze your social networks or the network resulting from all the data donated to OA or one against the other.'
  ].reduce((a, t) => { return a + `<li>${t}</li>` }, '')

  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Hidden pages and features</h2>

  ${paragraphs}

  <ul>${items}</ul>

  <br>
  :::
  `).appendTo('body')
}

const testSyncInfo = () => {
  $('canvas').hide()
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Social Synchronization</h2>
${`You can understand your interaction with your networks as exploration:
  -> with analyzis; or with
  -> midia generation / absorption,

or as synergy:
  -> by diffusion; or by
  -> syncronization.

Synchronization meaning a process in which you have an expected (or idealized) result, such as maturing a concept or framework, building a community, getting a project done, having an event happen.

A diffusion is most often a synchronization: you want feedback messages, you want to create derivatives.
A synchronization most often involves a fund, a monetary crowdsourcing (crowdfunding).
A synchronization often involves an information crowdsourcing, for example to mature an idea, to find partners or sponsors, to understand how a proposal is accepted.

The diffusion of goods may be essentially a diffusion (e.g. selling a product),
although it most often is a synchronization (e.g. when envisioned a community of buyers, art, or research).

Hope you synchronize yourself with Our Aquarium audiovisual music,
it is available as a social and individual panaceia.
  `.replaceAll('\n', '<br />')}
  <br>
  :::
  `).appendTo('body')
}

const linkify = require('linkifyjs/html')
const linkify2 = link => linkify(`<span class="notranslate">${link}<span>`)

const testAnPhy = () => {
  $('canvas').hide()
  $('<div/>', {
    css: {
      width: '50%',
      margin: '2% 10%',
      background: '#6DC2E1',
      padding: '2%',
      border: 'solid green 5px'
    }
  }).html(`
  <h2>Anthropological Physics</h2>
${`You can see, play, interact and govern your social structures because they are yourself.
In fact writing diaries is an ethnographic technique, and the diary may be used
as the anthropologist finds suitable.

Our Aquarium complies to free culture, software, midia, data, and transparency (self, civil society) guidelines.

Know more:
  `.replaceAll('\n', '<br />')}
${linkify2('https://doi.org/10.5281/zenodo.438960')}

  <br>
  <br>
  :::
  `).appendTo('body')
}

module.exports = { testPlot, testRotateLayouts, testBlink, testExhibition1, testDiffusion, testMultilevelDiffusion, testMetaNetwork, testSparkMin, testSparkLosd, testMong, testGetNet0, testGetNet1, testGetNet2, testGetNet3, testNetIO, testGUI, testNetUpload, testNetUpload2, testMongIO, testMongNetIO, testMongBetterNetIO, testNetPage, testPuxi, testHtmlEls, testHtmlEls2, testGradus, testAdParnassum, testWorldPropertyPage, testAudio, testJQueryFontsAwesome, testObj, testColors, testMusic, testLooper, testSeq, testSync, testPattern, testRec, testRec2, testRecCanvas, testRecAudio, testRecAudioAndCanvas, testRecAudioAndCanvas2, testDiffusionLimited, testNoise, testLycoreia, testTithorea, testSyncParnassum, testEditor, testLz, testMkSyncId, testDonate, testGuidelines, testManDb, testManGit, testContribute, testDevLocal, testDeploy, testAbout, testExtension, testFAQ, testTheory, testHidden, testDonatePaypal, testDonatePagseguro, testDonateBitcoin, testSyncInfo, testAnPhy }
