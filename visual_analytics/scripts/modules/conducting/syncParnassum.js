/* global wand, performance, alert */

const { OABase } = require('./oabase')
const { mkBtn } = require('./gui.js')
const { gradus1, gradusRec } = require('./instructions.js')
const { Tone } = require('../maestro/all.js').base
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')
const Graph = require('graphology')
window.ggg = Graph

const d = (f, time) => Tone.Draw.schedule(f, time)

class SyncParnassum extends OABase {
  constructor (settings = {}) {
    // wand.$('#favicon').attr('href', 'faviconbr.ico')
    // wand.$('#favicon').attr('href', 'log3.png')
    // wand.$('#favicon').attr('href', 'faviconMade2.ico')
    document.title = 'OA: Gradus ad Parnassum'
    wand.$('#favicon').attr('href', 'faviconMade.ico')
    super(settings)

    wand.extra.exhibition = wand.test.testExhibition1('gradus')
    wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    wand.$('#loading').hide()

    const now = performance.now()
    wand.transfer.mong.findUserNetwork(wand.syncInfo.usid, wand.syncInfo.unid).then(r => {
      let wait = performance.now() - now
      if (wait > 10000) {
        wait = 0
      } else {
        wait = (10000 - wait) * (wand.syncInfo.ts || 1)
      }
      console.log('loaded user network', wait)
      setTimeout(() => {
        this.allNetworks = r
        console.log('timeout finished, parse json -> graphology')
        const g = wand.net.use.utils.loadJsonString(this.allNetworks[0].text)
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
        this.registerNetwork(g, 'current') // make the small networks derived from the person
        this.setRecorder()
        console.log('memb nets')
        this.makeMemberNetworks()
        console.log('memb mus')
        this.seqs = [this.makeMemberMusic(0, 0)]
        for (let i = 1; i < this.plots.length; i++) {
          this.seqs.push(this.makeMemberMusic(i, this.seqs[i - 1].dur))
        }
        this.setPlay()
        this.setInfo()
        console.log('finished initialization')
        wand.extra.exhibition.remove()
      }, wait)
      // this.drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, wand.currentNetwork, [])
      // const { conductor, artist } = wand
      // wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
      // wand.drawnNet = this.drawnNet
      // make exhibition with the small nets and the member visited
      // this.setNetInfo()
      // this.setSyncBuilder()
    })
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
    }, sync.progression)
    seq.interval = '1n'
    seq.start(adur)
    const dur = seq.interval * (sync.progression.length - 1) + adur
    seq.stop(dur)
    d(() => {
      net.forEachEdge((e, a, n1, n2) => {
        a.pixiElement.alpha = 0
      })
      net.forEachNode((e, a, n1, n2) => {
        a.pixiElement.alpha = 0
        a.textElement.alpha = 0
      })
    }, dur + seq.interval * 0.1)
    // console.log('HEY MAN', seq)
    // const fun = () => {
    //   seq.start()
    //   Tone.Transport.start()
    //   // Tone.Transport.stop(seq.interval * this.sync.progression.length * 0.99)
    // }
    // mkBtn('fa-info', 'info', 'infos / dialogs', fun)
    return { dur, sync, net, seq }
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
      // console.log('FINISH RSIZE', size, lastnet)
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
      // sync.progressionLinks.forEach((step, i) => {
      //   const c = cs[i]
      //   step.forEach(link => {
      //     const a = net.getEdgeAttributes(link.from, link.to).pixiElement
      //     console.log('LINK', link, a)
      //     a.alpha = 0
      //     a.tint = c
      //   })
      // })
      net.forEachEdge((e, a) => {
        a.pixiElement.alpha = 0
      })
      return { drawnNet, sync }
    }
    this.plots = nets.map(net => plotNet(net))
  }

  setRecorder () {
    const rec = wand.transfer.rec.rec()
    let count = 0
    mkBtn('fa-record-vinyl', 'record', 'record performance', () => {
      if (count % 2 === 0) {
        rec.astart()
        wand.$('#record-button').css('background-color', '#ff0000')
      } else {
        const id = wand.syncInfo.msid || wand.syncInfo.mnid
        const name = wand.currentNetwork.getNodeAttribute(id, 'name')
        rec.filename = name + ' & ' + wand.fullNetwork.getAttribute('userData').name + ' (audiovisual music duo - Gradus ad Parnassum / OA) #oa #ourAquarium #oAquario (social network audiovisualization) ' + (new Date()).toISOString().split('.')[0]
        rec.stop()
        wand.$('#record-button').css('background-color', '#ffffff')
      }
      count++
    }).hide()
  }

  setPlay () {
    let playing = false
    mkBtn('fa-play', 'play', 'play your music', () => {
      playing = !playing
      if (playing) {
        wand.maestro.base.Tone.Transport.start()
        wand.$('#play-button').css('background-color', 'red')
        wand.$('#record-button').click()
      } else {
        wand.$('#play-button').css('background-color', 'white')
        wand.maestro.base.Tone.Transport.stop()
        wand.$('#record-button').click()
        // this.resetNetwork()
      }
    }).hide()
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
    let count = 0
    mkElement([1, 2.2], 0x777733, '1', 3000, 0, gradus1())
    // mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
    // mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
    console.log('YEAH MAN, HERE YEAH')
    wand.theNetwork = wand.starNetwork
    const fun = () => {
      count++
      const tlength = Object.keys(texts).length + 1
      const show = (count % tlength) !== 0
      this.rect.alpha = Number(show)
      this.rect.zIndex = 10 + 2000 * show
      let i = 0
      for (const t in texts) {
        texts[t].alpha = Number(count % tlength === (i + 1))
        // console.log(texts[t], Number(count % tlength === (i + 1)))
        i++
      }
      // console.log(show, count, i, tlength, count % tlength)
      if (count === 2) {
        if (wand.syncInfo.bypassMusic) {
          this.start()
        } else {
          wand.$('#info-button').hide()
          this.rect.alpha = 0
          wand.$('#play-button').click()
          const seq = this.seqs[this.seqs.length - 1]
          d(() => {
            wand.magic.syncParnassum.nets.forEach(net => {
              net.forEachNode((n, a) => {
                a.pixiElement.visible = false
                a.textElement.visible = false
              })
              net.forEachEdge((e, a) => {
                a.pixiElement.visible = false
              })
            })
            alert(gradusRec())
            wand.$('#info-button').show()
            wand.$('#play-button').click()
            this.start()
          }, seq.dur + seq.seq.interval * 0.3)
        }
      }
    }
    mkBtn('fa-info', 'info', 'infos / dialogs', fun)
    wand.$('#info-button').click()
  }
}

module.exports = { SyncParnassum }
