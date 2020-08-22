/* global wand, alert */

const { OABase } = require('./oabase')
const { mkBtn } = require('./gui.js')
const { gradus1, gradus2, gradusRec, gradusSyncLinks, gradusVideoLink, gradusExtensionInfo } = require('./instructions.js')
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
    super(settings)

    // wand.extra.exhibition = wand.test.testExhibition1('gradus')
    // wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    wand.$('#loading').hide()

    // const now = performance.now()
    if (window.oaReceivedMsg) { // gradus for the user network, from extension:
      this.settings.timeStreach = 0.001
      this.settings.currentLevel = 13
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
      this.setRecorder()
      this.makeUserNetworks()
      this.setInfo2()
      console.log('finished initialization')
    } else { // gradus received through sync:
      wand.transfer.mong.findUserNetwork(wand.syncInfo.usid, wand.syncInfo.unid).then(r => {
        console.log('loaded user network')
        this.allNetworks = r
        console.log('timeout finished, parse json -> graphology')
        const g = wand.net.use.utils.loadJsonString(this.allNetworks[0].text)
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
        console.log('memb nets')
        this.makeMemberNetworks()
        console.log('memb mus')
        this.memberMusicSeqs = [this.makeMemberMusic(0, 0)]
        for (let i = 1; i < this.plots.length; i++) {
          this.memberMusicSeqs.push(this.makeMemberMusic(i, this.memberMusicSeqs[i - 1].dur))
        }
        this.setInfo()
        console.log('finished initialization')
      })
    }
  }

  makeMemberMusic (option = 0, adur = 0) {
    const sync = this.plots[option].sync
    const net = this.plots[option].drawnNet.net
    // use this.sync to make all nodes into visible with music
    console.log('HEY MAN')
    let allNodes = []
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
    const seq = new Tone.Pattern((time, step) => {
      if (step.length === 0) {
        net.forEachNode((n, a) => {
          a.pixiElement.alpha = 0
          a.textElement.alpha = 0
        })
        net.forEachEdge((e, a) => {
          a.pixiElement.alpha = 0
        })
        allNodes = []
        return
      }
      step.forEach((n, i) => {
        // instrument.triggerAttackRelease(Tone.Midi(info.note).toNote(), 0.01, time + i * 0.5 / step.length)
        const note = 40 + 40 * (net.getNodeAttribute(n, 'degree') - extent[0]) / ambit
        instrument.triggerAttackRelease(Tone.Midi(note).toNote(), 0.01, time + i * 2 / step.length)
        d(() => {
          net.getNodeAttribute(n, 'pixiElement').alpha = 0.7
          net.getNodeAttribute(n, 'textElement').alpha = 0.7
          d(() => {
            net.getNodeAttribute(n, 'textElement').alpha = 0
          }, time + i * 2 / step.length + seq.interval / 4)
        }, time + i * 2 / step.length)
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
        d(() => {
          net.getNodeAttribute(id, 'pixiElement').alpha = 0
          net.getNodeAttribute(id, 'textElement').alpha = 0
        }, time + t * 1.9)
      }, time)
      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0.7
        net.getNodeAttribute(id, 'textElement').alpha = 0.7
        d(() => {
          net.getNodeAttribute(id, 'pixiElement').alpha = 0
          net.getNodeAttribute(id, 'textElement').alpha = 0
        }, time + t * 2.9)
      }, time + t * 2)
      d(() => {
        net.getNodeAttribute(id, 'pixiElement').alpha = 0.7
        net.getNodeAttribute(id, 'textElement').alpha = 0.7
        d(() => {
          net.getNodeAttribute(id, 'pixiElement').alpha = 0
          net.getNodeAttribute(id, 'textElement').alpha = 0
        }, time + t * 3.9)
      }, time + t * 3)
      net.forEachEdge((e, a, n1, n2) => {
        if (allNodes.includes(n1) && allNodes.includes(n2)) {
          a.pixiElement.alpha = 0.4
        }
      })
      stepCounter++
      console.log(stepCounter, sync.progression.length)
      if (stepCounter === sync.progression.length - 1) {
        d(() => {
          membSynth.dispose()
          membSynth2.dispose()
          seq.stop()
          seq.dispose()
          net.forEachNode((n, a) => {
            a.pixiElement.visible = false
            a.pixiElement.interactive = false
            a.textElement.visible = false
          })
          net.forEachEdge((e, a) => {
            a.pixiElement.visible = false
          })
        }, time + seq.interval)
      }
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
      const drawnNet = new conductor.use.DrawnNet(artist.use, net, [artist.use.width, artist.use.height * 0.9])
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
    const { usid, unid, msid, mnid, page, syncCount } = wand.syncInfo
    wand.transfer.mong.writeVideoUrl({ vurl, usid, unid, msid, mnid, syncCount, page, date: new Date(Date.now()).toISOString(), desc })
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
        const id = wand.syncInfo.msid || wand.syncInfo.mnid
        const name = wand.currentNetwork.getNodeAttribute(id, 'name')
        rec.filename = name + ' & ' + wand.fullNetwork.getAttribute('userData').name + ', audiovisual music #oa #ourAquarium #oAquario ' + (new Date()).toISOString().split('.')[0]
        rec.stop()
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
    this.rect = a.mkRectangle({
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
    mkElement([1, 2.2], 0x777733, '1', 3000, 0, gradus1())
    mkElement([1, 2.2], 0x777733, '2', 3000, 0, gradus2())

    const ltext = mkElement([1, 2.2], 0x777733, '3', 3000, 0, gradusVideoLink)
    ltext.on('pointerdown', () => {
      let vurl = window.prompt('Upload the file you downloaded enter video URL here:', 'something as https://www.youtube... (start with https:// or http://)')
      if (vurl === null) return
      vurl = vurl.trim()
      if (/^https*:\/\//.test(vurl)) {
        this.urlConfirmed = true
        this.writeVideoUrl(vurl, 'gradus')
      }
    })
    ltext.buttonMode = true
    mkElement([1, 2.2], 0x777733, '4', 3000, 0, 'something1')
    mkElement([1, 2.2], 0x777733, '5', 3000, 0, 'something2')
    wand.theNetwork = wand.visitedNetwork
    const showMsg = i => {
      console.log(i, this.rect, texts, texts[i], 'THE SHOW GUY')
      this.rect.alpha = 1
      this.rect.zIndex = 2000
      texts[i].alpha = 1
      texts[i].interactive = true
      count = this.infoLength // Object.keys(texts).length
    }
    let count = 0
    const fun = () => {
      const tlength = this.infoLength + 1 // Object.keys(texts).length + 1
      const show = (++count % tlength) !== 0
      this.rect.alpha = Number(show)
      this.rect.zIndex = 10 + 2000 * show
      let i = 1
      for (const t in texts) {
        texts[t].alpha = Number(count % tlength === i)
        texts[t].interactive = count % tlength === i
        i++
      }
      if (!this.isInitialized) {
        this.start()
        this.rect.alpha = 0
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
    this.rect = a.mkRectangle({
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
    mkElement([1, 2.2], 0x777733, '1', 3000, 0, gradus1())
    mkElement([1, 2.2], 0x777733, '2', 3000, 0, gradus2())

    const ltext = mkElement([1, 2.2], 0x777733, '3', 3000, 0, gradusVideoLink)
    ltext.on('pointerdown', () => {
      let vurl = window.prompt('Upload the file you downloaded enter video URL here:', 'something as https://www.youtube... (start with https:// or http://)')
      if (vurl === null) return
      vurl = vurl.trim()
      if (/^https*:\/\//.test(vurl)) {
        this.urlConfirmed = true
        this.writeVideoUrl(vurl, 'gradus')
      }
    })
    ltext.buttonMode = true

    this.mkSyncLinks()
    const atext = mkElement([1, 2.2], 0x777733, '4', 3000, 0, gradusSyncLinks(this.syncLinks))
    // atext.interactive = true
    atext.buttonMode = true
    atext.on('pointerdown', () => {
      window.alert(`links with text copied to your clipboard.
      Paste on a text editor to read.`)
      this.syncLinksCopied = true
      copyToClipboard(gradusSyncLinks(this.syncLinks))
      copyToClipboard(gradusSyncLinks(this.syncLinks))
      copyToClipboard(gradusSyncLinks(this.syncLinks))
      copyToClipboard(gradusSyncLinks(this.syncLinks))
    })

    mkElement([1, 2.2], 0x777733, '5', 3000, 0, gradusExtensionInfo).on('pointerdown', () => {
      window.open('OAextension.zip', '_blank') // needs to be uploaded to instance. TTM
    }).buttonMode = true

    this.tttexts = texts

    wand.theNetwork = wand.starNetwork

    const showMsg = i => {
      console.log(i, this.rect, texts, texts[i], 'THE SHOW GUY')
      this.rect.alpha = 1
      this.rect.zIndex = 2000
      texts[i].alpha = 1
      texts[i].interactive = true
      count = this.infoLength // Object.keys(texts).length
    }

    let count = 0
    const fun = () => {
      const tlength = this.infoLength + 1 // Object.keys(texts).length + 1
      const show = (++count % tlength) !== 0
      this.rect.alpha = Number(show)
      this.rect.zIndex = 10 + 2000 * show
      let i = 1
      for (const t in texts) {
        texts[t].alpha = Number(count % tlength === i)
        texts[t].interactive = count % tlength === i
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
          d(() => {
            alert(gradusRec())
            wand.$('#info-button').show()
            wand.$('#play-button').click() // stop play and record
            showMsg(2)
            this.start()
          }, seq.dur + seq.seq.interval)
          console.log('MUSIC DURATION:', (seq.dur + seq.seq.interval * 0.3))
        }
        this.rect.alpha = 0
        this.isInitialized = true
      }
    }
    mkBtn('fa-info', 'info', 'infos / dialogs', fun)
    // wand.$('#info-button').click()
    this.infoLength = 2
    showMsg(1)
    this.showMsg = showMsg
  }

  mkSyncLinks () {
    const getNodeUrl = a => {
      const { sid, nid } = a
      return sid ? `https://www.facebook.com/${sid}` : `https://www.facebook.com/profile.php?id=${nid}`
    }
    const getNodeMusicUrl = a => {
      const ustr = wand.utils.rot(wand.syncInfo.usid || wand.syncInfo.unid)
      const ufield = wand.syncInfo.usid ? 'usid' : 'unid'
      const mstr = wand.utils.rot(a.sid || a.nid)
      const mfield = a.sid ? 'msid' : 'mnid'
      return `${window.location.origin}/oa/?page=ankh_&${ufield}=${ustr}&${mfield}=${mstr}&s=1`
    }
    const seeds = [wand.syncInfo.msid || wand.syncInfo.mnid]
    this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, seeds)
    const memberTexts = []
    this.sync.progression[1].forEach(n => {
      const a = wand.fullNetwork.getNodeAttributes(n)
      const contact = getNodeUrl(a)
      const name = a.name
      const musicUrl = getNodeMusicUrl(a)
      memberTexts.push(
        `${name}:
        -> music: ${musicUrl}
        -> known contact medium: ${contact}`
      )
    })
    this.syncLinks = memberTexts.join('\n\n')
  }

  makeUserNetworks () {
    this.nets = [wand.visitedNetwork, wand.fullNetwork]
    const { conductor, artist } = wand
    const plotNet = net => {
      const drawnNet = new conductor.use.DrawnNet(artist.use, net, [artist.use.width, artist.use.height * 0.9])
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
