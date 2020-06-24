/* global wand */
const net = require('./modules/networks.js')
const artist = require('./modules/artist.js')
const conductor = require('./modules/conductor.js')
const transfer = require('./modules/transfer/main.js')
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

const testExibition1 = (mode = 'test') => {
  const drawnNet = testPlot(mode)
  const r = {
    drawnNet,
    rotatorTicker: conductor.use.rotateLayouts(
      drawnNet, artist.share.draw.base.app, artist, 900
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

const testGradus = () => {
  // soh posso passar diretamente, o primeiro passo eh alguem falar seriamente c vc sobre o assunto e a gente conversar eu, o contato (Bruno/Aline) e ela, questao e seguranca e preservar os limites gratuitos
  // hack for testing:
  wand.magic.state = new wand.magic.Gradus(0.1)
  // window.wand.magic.Gradus()
  // depois de subir a propria rede, se compromete aos principios da fisica antropologica, incluindo dev continuar aberto GPL FSF de qqr ideia em software q a pessoa tiver disso, parecida conteitualmente ou nao
  // licensa JPL: joy public license, hommage ao Bill Joy (Vim, etc), e concorda dom o joy dos outros
}

module.exports = { testPlot, testRotateLayouts, testBlink, testExibition1, testDiffusion, testMultilevelDiffusion, testMetaNetwork, testSparkMin, testSparkLosd, testMong, testGetNet0, testGetNet1, testGetNet2, testGetNet3, testNetIO, testGUI, testNetUpload, testNetUpload2, testMongIO, testMongNetIO, testMongBetterNetIO, testNetPage, testPuxi, testHtmlEls, testHtmlEls2, testGradus }
