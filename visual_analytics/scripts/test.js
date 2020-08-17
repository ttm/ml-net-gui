/* global wand, MediaRecorder, MediaStream, Blob */
const net = require('./modules/networks.js')
const artist = require('./modules/artist.js')
const conductor = require('./modules/conductor.js')
const transfer = require('./modules/transfer/main.js')
const utils = require('./modules/utils.js')
const $ = require('jquery')
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

const testLycoreia = () => { // http://localhost:8080/?lycoreia.html?11?bana?0.001?adalberto.ferroz
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
  let timeStreach = 1
  if (items.length > 4) {
    timeStreach = items[4]
  }
  wand.magic.lycoreia = new wand.magic.Lycoreia({ currentLevel: level, timeStreach, counter: { colorChange: 60, hoverNode: 19 }, state: {}, muted: true })
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
  let timeStreach = 1
  if (items.length > 4) {
    timeStreach = items[4]
  }
  wand.magic.tithorea = new wand.magic.Tithorea({ currentLevel: level, timeStreach, counter: { colorChange: 60, hoverNode: 19 }, state: {}, muted: true })
}

const testSyncParnassum = () => {
  console.log(window.syncInfo)
  console.log('go Parnassum!')
  // http://localhost:8080/?page=ankh_&usid=erangb.snooev.125&mnid=1537120300&s=1&mute=1&muteMusic=1&bypassMusic=1&ts=0.001&clevel=7
  wand.magic.syncParnassum = new wand.magic.SyncParnassum()
}

module.exports = { testPlot, testRotateLayouts, testBlink, testExhibition1, testDiffusion, testMultilevelDiffusion, testMetaNetwork, testSparkMin, testSparkLosd, testMong, testGetNet0, testGetNet1, testGetNet2, testGetNet3, testNetIO, testGUI, testNetUpload, testNetUpload2, testMongIO, testMongNetIO, testMongBetterNetIO, testNetPage, testPuxi, testHtmlEls, testHtmlEls2, testGradus, testAdParnassum, testWorldPropertyPage, testAudio, testJQueryFontsAwesome, testObj, testColors, testMusic, testLooper, testSeq, testSync, testPattern, testRec, testRec2, testRecCanvas, testRecAudio, testRecAudioAndCanvas, testRecAudioAndCanvas2, testDiffusionLimited, testNoise, testLycoreia, testTithorea, testSyncParnassum }
