const net = require('./modules/networks.js')
const artist = require('./modules/artist.js')
const conductor = require('./modules/conductor.js')
const transfer = require('./modules/transfer/main.js')
const $ = require('jquery')

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
  transfer.gui.basicStats()
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
  const input = $('<input type="button" value="load" />')
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
    let anet
    const uel = document.getElementById('file-input')
    uel.onchange = res => {
      const f = uel.files[0]
      f.text().then(t => {
        transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
        anet = net.use.utils.loadJsonString(t)
        const drawnNet = new conductor.use.DrawnNet(artist.use, anet, [])
        conductor.use.showMembers(drawnNet.net, artist, true)
      })
    }
    input.on('click', () => {
      if (anet) {
        anet.forEachNode((n, a) => {
          a.pixiElement.destroy()
          a.textElement.destroy()
        })
        anet.forEachEdge((n, a) => a.pixiElement.destroy())
      }
      if (s.val() === 'upload') {
        uel.click()
        return
      }
      anet = net.use.utils.loadJsonString(r[s.val()].text)
      const drawnNet = new conductor.use.DrawnNet(artist.use, anet, [])
      conductor.use.showMembers(drawnNet.net, artist, true)
      window.dn = drawnNet
      window.nn = anet
    })
  })
  s.append($('<option/>').val('upload').html('upload'))
  window.s = s
}

module.exports = { testPlot, testRotateLayouts, testBlink, testExibition1, testDiffusion, testMultilevelDiffusion, testMetaNetwork, testSparkMin, testSparkLosd, testMong, testGetNet0, testGetNet1, testGetNet2, testGetNet3, testNetIO, testGUI, testNetUpload, testNetUpload2, testMongIO, testMongNetIO, testMongBetterNetIO, testNetPage, testPuxi, testHtmlEls }
