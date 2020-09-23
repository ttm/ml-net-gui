/* global wand, alert */

const { OABase } = require('./oabase')
const { mkBtn } = require('./gui.js')
const { gradus1b, gradus2, gradusRec, gradusSyncLinks, gradusVideoLink, gradusExtensionInfo, uploadVideoText, uploadVideoPlaceholder, arcturians1, arcturians2, gradus1Login } = require('./instructions.js')
const { Tone } = require('../maestro/all.js').base
const { copyToClipboard } = require('./utils.js')

const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')
const Graph = require('graphology')

const d = (f, time) => Tone.Draw.schedule(f, time)

class SyncParnassum extends OABase {
  constructor (settings = {}) {
    // wand.$('#favicon').attr('href', 'faviconbr.ico')
    // wand.$('#favicon').attr('href', 'log3.png')
    // wand.$('#favicon').attr('href', 'faviconMade2.ico')
    document.title = 'Gradus (Our Aquarium)'
    wand.$('#favicon').attr('href', 'faviconMade.ico')
    wand.$('#loading').css('visibility', 'visible')
    super(settings)

    // wand.extra.exhibition = wand.test.testExhibition1('gradus')
    // wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    // wand.$('#loading').hide()

    // const now = performance.now()
    this.settings.timeStreach = 0.001 // fixme: remove, make flag...
    if (window.oaReceivedMsg) { // gradus for the user network, from extension:
      this.settings.timeStreach = 0.001
      this.settings.currentLevel = 14
      wand.maestro.synths.speaker.volume = -1 // 1 or 0 is 1, [0, 1] is ok range
      this.allNetworks = [window.oaReceivedMsg.data.graph]
      const g = Graph.from(window.oaReceivedMsg.data.graph)
      this.registerNetwork(g, 'full')
      const nodesToRemove = []
      g.forEachNode((n, a) => {
        if (!a.scrapped) {
          nodesToRemove.push(n)
        }
      })
      nodesToRemove.forEach(n => {
        g.dropNode(n)
      })
      this.registerNetwork(g, 'visited') // make the small networks derived from the person
      this.registerNetwork(g, 'current') // fixme: dont redundant?
      this.setRecorder()
      this.makeUserNetworks()
      console.log('finished initialization 2')
      this.setInfo2()
      wand.$('#loading').css('visibility', 'hidden')
    } else { // gradus received through sync:
      const { syncKey, usid, unid, syncId } = wand.syncInfo
      // const { usid, unid, syncId, syncKey, msid, mnid } = wand.syncInfo
      const act = () => {
        // if (syncId === null || ) {
        if (wand.syncInfo.syncKey) {
          console.log(' // member accessing OA is a seed (new DB encoded):')
          return wand.transfer.mong.findAny({ syncKey }).then(res2 => { // fixme: remove
            console.log('SYNC at gradus:', res2)
            wand.syncInfo.syncDescription = res2.desc
            wand.sageInfo = res2.sageInfo
            wand.syncInfo.syncRemovedNodes = res2.removedNodes
            wand.syncRes = res2 // has sync, desc, removedNodes, syncKey, sageInfo
            this.sync = res2.sync
            return wand.transfer.mong.findUserNetwork(res2.sageInfo.sid, res2.sageInfo.nid)
          })
        } else if (syncId === null) {
          console.log(' // member accessing OA is a seed (old URL encoded):')
          return wand.transfer.mong.findUserNetwork(usid, unid)
        } else {
          console.log(' // member is part of a diffusion started by a seed:')
          return wand.transfer.mong.findAny({ syncId }).then(r => {
            console.log('FOUND:', r)
            this.sync = r.sync
            wand.syncInfo.syncDescription = r.syncDescription
            return wand.transfer.mong.findUserNetwork(r.usid, r.unid)
          })
        }
      }
      act().then(r => {
        console.log('loaded user network')
        this.allNetworks = r
        const g = wand.net.use.utils.loadJsonString(this.allNetworks[0].text)
        if (wand.syncInfo.syncRemovedNodes[0] !== '') {
          wand.syncInfo.syncRemovedNodes.forEach(n => {
            g.dropNode(n)
          })
        }

        this.registerNetwork(g, 'full')
        this.mkNames()

        const nodesToRemove = []
        g.forEachNode((n, a) => {
          if (!a.scrapped) {
            nodesToRemove.push(n)
          }
        })
        nodesToRemove.forEach(n => {
          g.dropNode(n)
        })
        this.registerNetwork(g, 'current') // make the small networks derived from the person

        this.setRecorder()
        this.makeMemberNetworks()
        this.memberMusicSeqs = [this.makeMemberMusic(0, 0)]
        for (let i = 1; i < this.plots.length; i++) {
          // send var for plots length or catch value in seq iteration:
          this.memberMusicSeqs.push(this.makeMemberMusic(i, this.memberMusicSeqs[i - 1].dur))
        }
        console.log('finished initialization')
        this.setInfo()
        wand.$('#loading').css('visibility', 'hidden')
      })
    }
  }

  makeMemberMusic (option = 0, adur = 0) {
    const sync = this.plots[option].sync
    const net = this.plots[option].drawnNet.net
    // use this.sync to make all nodes into visible with music
    console.log('HEY MAN')

    const instrument = new Tone.PluckSynth({ volume: 0 }).toMaster()
    const membSynth = new Tone.MembraneSynth({ volume: -10 }).toMaster()
    const membSynth2 = new Tone.MembraneSynth({ volume: 0 }).toMaster()

    const extent = net.degreeExtent
    const ambit = extent[1] - extent[0] || 1
    const pambit = sync.progression.reduce((a, i) => {
      if (i.length < a.min) {
        a.min = i.length
      }
      if (i.length > a.max) {
        a.max = i.length
      }
      return a
    }, { min: 100000, max: 0 })
    pambit.ambit = pambit.max - pambit.min || 1

    const id = wand.syncInfo.msid || wand.syncInfo.mnid
    let stepCounter = 0
    const allNodes = []
    const seq = new Tone.Pattern((time, step) => {
      if (step.length === 0) {
        // net.forEachNode((n, a) => {
        //   a.pixiElement.alpha = 0
        //   a.textElement.alpha = 0
        // })
        // net.forEachEdge((e, a) => {
        //   a.pixiElement.alpha = 0
        // })
        // allNodes = []
        console.log('stopping seq len:', sync.progression.length, sync.progression)
        seq.stop()
        seq.tfinished = true
        setTimeout(() => {
          membSynth.dispose()
          membSynth2.dispose()
          seq.dispose()
          this.hideNetwork(net)
        }, seq.interval * 1000)
        return
      }

      step.forEach((n, i) => {
        // instrument.triggerAttackRelease(Tone.Midi(info.note).toNote(), 0.01, time + i * 0.5 / step.length)
        const note = 40 + 40 * (net.getNodeAttribute(n, 'degree') - extent[0]) / ambit
        instrument.triggerAttackRelease(Tone.Midi(note).toNote(), 0.01, time + i * 2 / step.length)
        d(() => {
          net.getNodeAttribute(n, 'pixiElement').alpha = 0.7
          net.getNodeAttribute(n, 'textElement').alpha = 0.7
        }, time + i * 2 / step.length)
        d(() => {
          net.getNodeAttribute(n, 'textElement').alpha = 0
        }, time + i * 2 / step.length + seq.interval / 4)
        allNodes.push(n)
      })

      const t = seq.interval / 4
      const note = 90 - 20 * (step.length - pambit.min) / pambit.ambit

      membSynth.triggerAttackRelease(Tone.Midi(note).toNote(), 1, time)
      membSynth.triggerAttackRelease(Tone.Midi(note).toNote(), 1, time + t)
      // membSynth.triggerAttackRelease(Tone.Midi(note).toNote(), 1, time + t * 2)
      membSynth.triggerAttackRelease(Tone.Midi(note).toNote(), 1, time + t * 3)

      membSynth2.triggerAttackRelease(Tone.Midi(30).toNote(), 1, time)
      // membSynth2.triggerAttackRelease(Tone.Midi(30).toNote(), 1, time + t)
      membSynth2.triggerAttackRelease(Tone.Midi(30).toNote(), 1, time + t * 2)
      membSynth2.triggerAttackRelease(Tone.Midi(30).toNote(), 1, time + t * 3)

      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0.7
        net.getNodeAttribute(id, 'textElement').alpha = 0.7
      }, time)
      d(() => {
        net.forEachEdge((e, a, n1, n2) => {
          if (allNodes.includes(n1) && allNodes.includes(n2)) {
            a.pixiElement.alpha = 0.4
          }
        })
      }, time)
      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0
        net.getNodeAttribute(id, 'textElement').alpha = 0
      }, time + t * 1.9)

      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0.7
        net.getNodeAttribute(id, 'textElement').alpha = 0.7
      }, time + t * 2)

      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0
        net.getNodeAttribute(id, 'textElement').alpha = 0
      }, time + t * 2.9)

      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0.7
        net.getNodeAttribute(id, 'textElement').alpha = 0.7
      }, time + t * 3)
      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0
        net.getNodeAttribute(id, 'textElement').alpha = 0
      }, time + t * 3.9)

      stepCounter++
      console.log(stepCounter, sync.progression.length)
      // if (stepCounter === sync.progression.length) {
      //   seq.stop()
      //   console.log('stoping seq len:', sync.progression.length, sync.progression)
      //   setTimeout(() => {
      //     seq.tfinished = true
      //     membSynth.dispose()
      //     membSynth2.dispose()
      //     seq.dispose()
      //     this.hideNetwork(net)
      //     // net.forEachNode((n, a) => {
      //     //   a.pixiElement.visible = false
      //     //   a.pixiElement.interactive = false
      //     //   a.textElement.visible = false
      //     // })
      //     // net.forEachEdge((e, a) => {
      //     //   a.pixiElement.visible = false
      //     // })
      //   }, (time + seq.interval) * 1000)
      // }
    }, sync.progression)
    seq.interval = '1n'
    seq.start(adur)
    const dur = seq.interval * (sync.progression.length - 1) + adur
    return { dur, sync, net, seq, membSynth, membSynth2 }
  }

  registerNetwork (graph, avarname) {
    const g = graph
    const gg = components.connectedComponents(g)
    let gg_ = []
    for (let i = 0; i < gg.length; i++) {
      if (gg[i].length > gg_.length) {
        gg_ = gg[i]
      }
    }
    const sg = subGraph(g, gg_).copy()
    netdegree.assign(sg)
    netmetrics.centrality.degree.assign(sg)
    sg.setAttribute('userData', g.getAttribute('userData'))
    sg.forEachNode((n, a) => {
      a.id = n
    })
    wand[avarname + 'Network'] = sg
    const norm = v => v === Math.round(v) ? v : v.toFixed(3)
    const mString = metric => {
      wand[avarname + 'Network'][metric + 'Extent'] = netmetrics.extent(wand[avarname + 'Network'], metric)
      const s = wand[avarname + 'Network'][metric + 'Extent'].map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand[avarname + 'Network'].degreeCentrality = mString('degreeCentrality')
    wand[avarname + 'Network'].degree_ = mString('degree')
    return wand[avarname + 'Network']
  }

  makeMemberNetworks () {
    // const nodes = [wand.syncInfo.msid]
    const id = wand.syncInfo.msid || wand.syncInfo.mnid
    const nodes = [id]
    wand.currentNetwork.forEachNeighbor(id, (n, a) => {
      nodes.push(n)
    })
    const sg = subGraph(wand.currentNetwork, nodes).copy()
    this.registerNetwork(sg, 'star')

    const rsize = (size, lastnet) => {
      const nodes = lastnet ? lastnet.nodes() : [id]
      let lastnodes = nodes.slice()
      while (true) {
        const nodesSize = nodes.length
        lastnodes.forEach(nn => {
          wand.currentNetwork.forEachNeighbor(nn, n => {
            if (nodes.length < size && !nodes.includes(n)) {
              nodes.push(n)
            }
          })
        })
        if (nodes.length >= size || nodes.length === nodesSize) {
          break
        }
        lastnodes = nodes.slice()
      }
      const sg2 = subGraph(wand.currentNetwork, nodes).copy()
      return this.registerNetwork(sg2, 'r' + size)
    }

    const max = wand.currentNetwork.order > 500 ? 500 : wand.currentNetwork.order
    const sizes = [0.1, 0.3, 0.6, 0.8, 1].map(prop => Math.floor(max * prop))
    const nets = [wand.starNetwork]
    nets.push(rsize(sizes[0], undefined))
    for (let i = 1; i < sizes.length; i++) {
      nets.push(rsize(sizes[i], nets[i]))
    }
    this.nets = nets

    const { conductor, artist } = wand
    const plotNet = net => {
      const drawnNet = new conductor.use.DrawnNet(artist.use, net, [artist.use.width, artist.use.height])
      const sync = wand.net.use.diffusion.use.seededNeighborsLinks(net, 10000, [id])

      const cs = wand.artist.use.tincture.c.scale(['red', 'yellow', 'green', 'blue', '#ff00ff']).colors(sync.progression.length, 'num')
      sync.progression.forEach((step, i) => {
        const c = cs[i]
        step.forEach(node => {
          net.getNodeAttribute(node, 'pixiElement').tint = c
          net.getNodeAttribute(node, 'textElement').tint = c
          net.getNodeAttribute(node, 'textElement').scale.set(0.5)
          net.getNodeAttribute(node, 'pixiElement').alpha = 0
          net.setNodeAttribute(node, 'stepColor', c)
          net.setNodeAttribute(node, 'step', i)
        })
      })
      net.forEachEdge((e, a) => {
        a.pixiElement.alpha = 0
      })
      return { drawnNet, sync }
    }
    this.plots = nets.map(net => plotNet(net))
  }

  writeVideoUrl (vurl, desc) {
    this.urlConfirmed = true
    const { usid, unid, msid, mnid, page, syncCount } = wand.syncInfo
    wand.transfer.mong.writeAny({
      vurl, usid, unid, msid, mnid, syncCount, page, date: new Date(Date.now()).toISOString(), desc
    })
  }

  setRecorder () {
    const rec = wand.transfer.rec.rec()
    let count = 0
    this.videoUrls = []
    mkBtn('fa-record-vinyl', 'record', 'record performance', () => {
      if (count % 2 === 0) {
        rec.astart()
        wand.$('#record-button').css('background-color', '#ff0000')
      } else {
        // const id = wand.syncInfo.msid || wand.syncInfo.mnid
        // const name = wand.currentNetwork.getNodeAttribute(id, 'name')
        rec.filename = `${wand.musicNameInstr}` + ', audiovisual music #oa #ourAquarium #oAquario ' + (new Date()).toISOString().split('.')[0]
        rec.astop()
        wand.$('#record-button').css('background-color', '#ffffff')
      }
      count++
    }).hide()
    this.recorder = rec
  }

  setPlay () {
    let playing = false
    mkBtn('fa-play', 'play', 'play your music', () => {
      playing = !playing
      console.log('hidden play pressed')
      if (playing) {
        wand.maestro.base.Tone.Transport.start()
        wand.$('#play-button').css('background-color', 'red')
        wand.$('#record-button').click() // start recording
      } else {
        wand.$('#play-button').css('background-color', 'white')
        wand.maestro.base.Tone.Transport.stop()
        wand.$('#record-button').click() // stop recording
        // this.resetNetwork()
      }
    }).hide()
  }

  mkNames () {
    wand.syncInfo.pageMemberName = wand.fullNetwork.getNodeAttribute(wand.syncInfo.msid || wand.syncInfo.mnid, 'name')
    wand.syncInfo.syncMemberName = wand.fullNetwork.getAttribute('userData').name
  }

  setInfo2 () {
    const a = wand.artist.use
    this.rectInfo = a.mkRectangle({
      // wh: [a.width, a.height], zIndex: 1, color: 0xffaaaa, alpha: 0
      wh: [a.width, a.height], zIndex: 1, color: 0x9c9c9c, alpha: 0
    })
    const f = this.settings.fontSize
    const p = f / 2
    const x = this.scalex(p)
    const y = this.scaley(p)
    const fs = this.scaley(f)
    const texts = {}
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      return texts[element]
    }
    const ltext0 = mkElement([1, 2.2], 0x777733, '1', 3000, 0, gradus1Login())
    ltext0.on('pointerdown', () => {
      window.open('?page=guidelines')
    })
    ltext0.buttonMode = true

    let g2 = gradus2()
    const url = g2.match(/\bhttps?:\/\/\S+/gi)
    if (url !== null) {
      g2 = g2.replace(url[0], 'click HERE.')
    }
    const g2_ = mkElement([1, 2.2], 0x777733, '2', 3000, 0, g2).on('pointerdown', () => {
      if (url !== null) {
        window.open(url[0], '_blank')
      }
    })
    g2_.buttonMode = true
    g2_.interactive = true

    const ltext = mkElement([1, 2.2], 0x777733, '3', 3000, 0, gradusVideoLink)
    ltext.on('pointerdown', () => {
      let vurl = window.prompt(uploadVideoText, uploadVideoPlaceholder)
      if (vurl === null) return
      vurl = vurl.trim()
      if (/^https*:\/\//.test(vurl)) {
        this.writeVideoUrl(vurl, 'gradusSelf')
      }
    })
    ltext.buttonMode = true

    mkElement([1, 2.2], 0x777733, '4', 3000, 0, arcturians1())
    const anphy = mkElement([1, 2.2], 0x777733, '5', 3000, 0, arcturians2())
    anphy.on('pointerdown', () => {
      window.open('https://doi.org/10.5281/zenodo.438960', '_blank')
    })
    anphy.buttonMode = true
    wand.theNetwork = wand.visitedNetwork
    const showMsg = i => {
      console.log(i, this.rectInfo, texts, texts[i], 'THE SHOW GUY')
      this.rectInfo.alpha = 1
      this.rectInfo.zIndex = 2000
      texts[i].alpha = 1
      texts[i].interactive = true
      const colors = i % 2 ? [0xffffff, 0x000000] : [0x000000, 0xffffff]
      this.rectInfo.tint = colors[0]
      texts[i].tint = colors[1]
      count = this.infoLength // Object.keys(texts).length
    }
    let count = 0
    const fun = () => {
      const tlength = this.infoLength + 1 // Object.keys(texts).length + 1
      const show = (++count % tlength) !== 0
      this.rectInfo.alpha = Number(show)
      this.rectInfo.zIndex = 10 + 2000 * show
      const colors = count % 2 ? [0xffffff, 0x000000] : [0x000000, 0xffffff]
      if (show) {
        // this.rectInfo.tint = 0xffffff * Math.random() / 2 + 0x777777
        this.rectInfo.tint = colors[0]
      }
      let i = 1
      for (const t in texts) {
        texts[t].alpha = Number(count % tlength === i)
        texts[t].interactive = count % tlength === i
        texts[t].tint = colors[1]
        i++
      }
      if (!this.isInitialized) {
        this.start()
        this.rectInfo.alpha = 0
        this.isInitialized = true
      }
    }
    mkBtn('fa-info', 'info', 'infos / dialogs', fun)
    // wand.$('#info-button').click()
    this.infoLength = 2
    showMsg(1)
    this.showMsg = showMsg
  }

  setInfo () {
    const a = wand.artist.use
    this.rectInfo = a.mkRectangle({
      // wh: [a.width, a.height], zIndex: 1, color: 0xffaaaa, alpha: 0
      wh: [a.width, a.height], zIndex: 1, color: 0x9c9c9c, alpha: 0
    })
    // const f = this.settings.fontSize
    // const p = f / 2
    // const x = this.scalex(p)
    // const y = this.scaley(p)
    // const fs = this.scaley(f)
    const texts = {}
    console.log('hey man, yeah here <<<<<<<=================')
    let tcount = 0
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      // texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      // return texts[element]
      texts[element] = wand.$('<div/>', {
        class: 'infotext',
        id: 'infotext' + tcount++,
        css: {
          width: '50%',
          margin: '10%',
          'background-color': '#DDDDDD',
          padding: '2%'
        }
      }).html(text.replaceAll('\n', '<br />')).appendTo('body').hide()
      return texts[element]
    }
    mkElement([1, 2.2], 0x777733, '1', 3000, 0, gradus1b())
    // ltext0.on('pointerdown', () => {
    //   window.open('?page=guidelines')
    // })
    // ltext0.buttonMode = true

    let g2 = gradus2()
    const url = g2.match(/\bhttps?:\/\/\S+/gi) // fixme: only works if link at last.
    if (url !== null) {
      g2 = g2.replace(url[0], 'click HERE.')
    }
    const g2_ = mkElement([1, 2.2], 0x777733, '2', 3000, 0, g2).on('pointerdown', () => {
      if (url !== null) {
        window.open(url[0], '_blank')
      }
    })
    g2_.buttonMode = true
    g2_.interactive = true

    const ltext = mkElement([1, 2.2], 0x777733, '3', 3000, 0, gradusVideoLink)
    ltext.on('pointerdown', () => {
      let vurl = window.prompt(uploadVideoText, uploadVideoPlaceholder)
      if (vurl === null) return
      vurl = vurl.trim()
      if (/^https*:\/\//.test(vurl)) {
        this.writeVideoUrl(vurl, 'gradus')
      }
    })
    ltext.buttonMode = true

    // this.mkSyncLinks()
    this.mkSyncLinks_().then(r => {
      const atext = mkElement([1, 2.2], 0x777733, '4', 3000, 0, gradusSyncLinks(this.syncNames))
      // atext.interactive = true
      atext.on('pointerdown', () => {
        if (this.syncLinks !== '') {
          copyToClipboard(this.syncLinks)
          copyToClipboard(this.syncLinks)
          copyToClipboard(this.syncLinks)
          copyToClipboard(this.syncLinks)
          window.alert(`links to music pieces and known contacts copied to your clipboard.
          ~~~ --> Paste on a text editor to read! <-- ~~~`)
          this.syncLinksCopied = true
        } else {
          window.open('?page=contribute')
        }
      })
      atext.buttonMode = true

      mkElement([1, 2.2], 0x777733, '5', 3000, 0, gradusExtensionInfo).on('pointerdown', () => {
        window.open('you.zip', '_blank') // needs to be uploaded to instance. TTM
      }).buttonMode = true

      this.tttexts = texts

      wand.theNetwork = wand.starNetwork

      const showMsg = i => {
        console.log(i, this.rectInfo, texts, texts[i], 'THE SHOW GUY')
        // this.rectInfo.alpha = 1
        // this.rectInfo.zIndex = 2000
        // texts[i].alpha = 1
        // texts[i].interactive = true
        // const colors = i % 2 ? [0xffffff, 0x000000] : [0x000000, 0xffffff]
        // this.rectInfo.tint = colors[0]
        // texts[i].tint = colors[1]
        wand.$('canvas').hide()
        texts[i].show()
        count = this.infoLength // Object.keys(texts).length
      }

      let count = 0
      const fun = () => {
        const tlength = this.infoLength + 1 // Object.keys(texts).length + 1
        const show = (++count % tlength) !== 0
        // const colors = wand.magic.tint.randomPalette2()
        this.rectInfo.alpha = Number(show)
        this.rectInfo.zIndex = 10 + 2000 * show
        const colors = count % 2 ? [0xffffff, 0x000000] : [0x000000, 0xffffff]
        if (show) {
          // this.rectInfo.tint = colors.bg
          this.rectInfo.tint = colors[0]
          wand.$('canvas').hide()
        } else {
          wand.$('canvas').show()
        }
        let i = 1
        for (const t in texts) {
          // texts[t].alpha = Number(count % tlength === i)
          // texts[t].interactive = count % tlength === i
          // texts[t].tint = colors[1]
          if (count % tlength === i) {
            texts[t].show()
          } else {
            texts[t].hide()
          }
          i++
        }
        if (!this.isInitialized) {
          if (wand.syncInfo.bypassMusic) {
            this.memberMusicSeqs.forEach(s => {
              s.seq.dispose()
              s.membSynth.dispose()
              s.membSynth2.dispose()
            })
            this.start()
          } else {
            this.setPlay()
            wand.$('#info-button').hide()
            wand.$('#play-button').click() // start play and record
            const seq = this.memberMusicSeqs[this.memberMusicSeqs.length - 1]
            // d(() => { // periodically check condition given by last
            //   alert(gradusRec())
            //   wand.$('#info-button').show()
            //   wand.$('#play-button').click() // stop play and record
            //   showMsg(2)
            //   this.start()
            // }, seq.dur + seq.seq.interval)
            const inter = setInterval(() => {
              console.log('trying tfinished', (window.performance.now() / 1000).toFixed(2))
              if (seq.seq.tfinished) {
                console.log('found tfinished')
                clearInterval(inter)
                alert(gradusRec())
                wand.$('#info-button').show()
                wand.$('#play-button').click() // stop play and record
                showMsg(2)
                this.start()
              }
            }, 1000)
            console.log('MUSIC DURATION:', (seq.dur + seq.seq.interval * 0.3))
          }
          this.rectInfo.alpha = 0
          this.isInitialized = true
        }
      }
      mkBtn('fa-info', 'info', 'infos / dialogs', fun)
      // wand.$('#info-button').click()
      this.infoLength = 2
      showMsg(1)
      this.showMsg = showMsg
    })
  }

  mkSyncLinks_ () {
    if (wand.syncInfo.syncKey) { // dont make diffusion, already has it:
      this.mkSyncLinks2(wand.syncInfo.syncId)
      return (async function () {})()
    } else if (wand.syncInfo.syncId) { // dont make diffusion, already has it:
      this.mkSyncLinks(wand.syncInfo.syncId)
      return (async function () {})()
    } else {
      console.log(' // make diffusion, seed loaded the page')
      const { msid, mnid, usid, unid, syncDescription } = wand.syncInfo
      const seeds = [msid || mnid]
      const sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, seeds)
      const syncId = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10)
      return wand.transfer.mong.writeAny({ sync, syncId, usid, unid, syncDescription }).then(r => {
        this.sync = sync
        this.mkSyncLinks(syncId)
      })
    }
  }

  mkSyncLinks2 (syncId) {
    const getNodeUrl = a => {
      const { sid, nid } = a
      return sid ? `https://www.facebook.com/${sid}` : `https://www.facebook.com/profile.php?id=${nid}`
    }
    const getNodeMusicUrl = a => {
      // const mstr = wand.utils.rot(a.sid || a.nid)
      // const mfield = a.sid ? 'msid' : 'mnid'
      // return `${window.location.origin}/?page=ankh_&${mfield}=${mstr}&syncId=${syncId}`
      const r = wand.utils.rot
      return `${document.location.href.split('?')[0]}?page=ankh_&syncKey=${wand.syncInfo.syncKey}&mnid=${r(a.nid || '')}&msid=${r(a.sid || '')}&lang=${wand.router.use.urlArgument('lang')}`
    }
    // from here on for both cases:
    const memberTexts = []
    const names = []
    let found = false
    const id = wand.syncInfo.msid || wand.syncInfo.mnid
    let linkCount = 0
    let links
    while (!found && linkCount < this.sync.progressionLinks.length - 1) {
      links = this.sync.progressionLinks[linkCount++]
      links.forEach(l => {
        if (l.from === id) {
          found = true
        }
      })
    }
    if (found) {
      links.forEach(l => {
        if (l.from === id) {
          const n = l.to
          const a = wand.fullNetwork.getNodeAttributes(n)
          const contact = getNodeUrl(a)
          const name = a.name
          const musicUrl = getNodeMusicUrl(a)
          memberTexts.push(
            `${name}:
            -> music: ${musicUrl}
            -> known contact medium: ${contact}`
          )
          names.push(name)
        }
      })
      this.syncLinks = memberTexts.join('\n\n')
      this.syncNames = wand.utils.inplaceShuffle(names).join(', ')
    } else {
      this.syncLinks = ''
      this.syncNames = ''
    }
    // this.sync.progression[1].forEach(n => {
    //   const a = wand.fullNetwork.getNodeAttributes(n)
    //   const contact = getNodeUrl(a)
    //   const name = a.name
    //   const musicUrl = getNodeMusicUrl(a)
    //   memberTexts.push(
    //     `${name}:
    //     -> music: ${musicUrl}
    //     -> known contact medium: ${contact}`
    //   )
    //   names.push(name)
    // })
  }

  mkSyncLinks (syncId) {
    const getNodeUrl = a => {
      const { sid, nid } = a
      return sid ? `https://www.facebook.com/${sid}` : `https://www.facebook.com/profile.php?id=${nid}`
    }
    const getNodeMusicUrl = a => {
      const mstr = wand.utils.rot(a.sid || a.nid)
      const mfield = a.sid ? 'msid' : 'mnid'
      // return `${window.location.origin}/?page=ankh_&${mfield}=${mstr}&syncId=${syncId}`
      return `${document.location.href.split('?')[0]}?page=ankh_&${mfield}=${mstr}&syncId=${syncId}`
    }
    // from here on for both cases:
    const memberTexts = []
    const names = []
    let found = false
    const id = wand.syncInfo.msid || wand.syncInfo.mnid
    let linkCount = -1
    while (!found) {
      const links = this.sync.progressionLinks[++linkCount]
      links.forEach(l => {
        if (l.from === id) {
          found = true
        }
      })
    }
    this.sync.progressionLinks[linkCount].forEach(l => {
      if (l.from === id) {
        const n = l.to
        const a = wand.fullNetwork.getNodeAttributes(n)
        const contact = getNodeUrl(a)
        const name = a.name
        const musicUrl = getNodeMusicUrl(a)
        memberTexts.push(
          `${name}:
          -> music: ${musicUrl}
          -> known contact medium: ${contact}`
        )
        names.push(name)
      }
    })
    // this.sync.progression[1].forEach(n => {
    //   const a = wand.fullNetwork.getNodeAttributes(n)
    //   const contact = getNodeUrl(a)
    //   const name = a.name
    //   const musicUrl = getNodeMusicUrl(a)
    //   memberTexts.push(
    //     `${name}:
    //     -> music: ${musicUrl}
    //     -> known contact medium: ${contact}`
    //   )
    //   names.push(name)
    // })
    this.syncLinks = memberTexts.join('\n\n')
    this.syncNames = wand.utils.inplaceShuffle(names).join(', ')
  }

  makeUserNetworks () {
    this.nets = [wand.visitedNetwork, wand.fullNetwork]
    const { conductor, artist } = wand
    const plotNet = net => {
      const drawnNet = new conductor.use.DrawnNet(artist.use, net, [artist.use.width, artist.use.height])
      // const sync = wand.net.use.diffusion.use.seededNeighborsLinks(net, 10000, [id])

      // const cs = wand.artist.use.tincture.c.scale(['red', 'yellow', 'green', 'blue', '#ff00ff']).colors(sync.progression.length, 'num')
      // sync.progression.forEach((step, i) => {
      //   const c = cs[i]
      //   step.forEach(node => {
      //     net.getNodeAttribute(node, 'pixiElement').tint = c
      //     net.getNodeAttribute(node, 'textElement').tint = c
      //     net.getNodeAttribute(node, 'textElement').scale.set(0.5)
      //     net.getNodeAttribute(node, 'pixiElement').alpha = 0
      //     net.setNodeAttribute(node, 'stepColor', c)
      //     net.setNodeAttribute(node, 'step', i)
      //   })
      // })
      net.forEachEdge((e, a) => {
        a.pixiElement.alpha = 0
      })
      net.forEachNode((e, a) => {
        a.pixiElement.alpha = 0
        a.textElement.alpha = 0
      })
      return { drawnNet, sync: undefined }
    }
    this.plots = this.nets.map(net => plotNet(net))
  }
}

module.exports = { SyncParnassum }
