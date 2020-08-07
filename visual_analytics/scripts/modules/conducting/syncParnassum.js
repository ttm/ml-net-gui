/* global wand */

const { Tone } = require('../maestro/all.js').base
const { mkBtn } = require('./gui.js')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')
const Graph = require('graphology')
window.ggg = Graph

class SyncParnassum {
  constructor (settings = {}) {
    console.log('inside sync parnassum:', wand.syncInfo)
    wand.transfer.mong.findUserNetwork(wand.syncInfo.usid, wand.syncInfo.unid).then(r => {
      console.log('loaded user network')
      this.allNetworks = r
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
      this.makeMemberNetworks()
      this.makeMemberMusic()
      // this.drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, wand.currentNetwork, [])
      // const { conductor, artist } = wand
      // wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
      // wand.drawnNet = this.drawnNet
      // make exhibition with the small nets and the member visited
      // this.setNetInfo()
      // this.setSyncBuilder()
    })
  }

  makeMemberMusic () {
    // use this.sync to make all nodes into visible with music
    console.log('HEY MAN')
    let allNodes = []
    const d = (f, time) => Tone.Draw.schedule(f, time)
    const instrument = new Tone.PluckSynth({ volume: 10 }).toMaster()
    const seq = new Tone.Pattern((time, step) => {
      console.log(step)
      if (step.length === 0) {
        wand.currentNetwork.forEachNode((n, a) => {
          a.pixiElement.alpha = 0
        })
        wand.currentNetwork.forEachEdge((e, a) => {
          a.pixiElement.alpha = 0
        })
        allNodes = []
        return
      }
      step.forEach((n, i) => {
        // instrument.triggerAttackRelease(Tone.Midi(info.note).toNote(), 0.01, time + i * 0.5 / step.length)
        instrument.triggerAttackRelease(Tone.Midi(60).toNote(), 0.01, time + i * 2 / step.length)
        d(() => { wand.currentNetwork.getNodeAttribute(n, 'pixiElement').alpha = 1 }, time + i * 2 / step.length)
        allNodes.push(n)
      })
      wand.currentNetwork.forEachEdge((e, a, n1, n2) => {
        // if (wand.currentNetwork.hasEdge(n1, n2)) {
        if (allNodes.includes(n1) && allNodes.includes(n2)) {
          a.pixiElement.alpha = 1
        }
      })
    }, this.sync.progression)
    seq.interval = '1n'
    this.seq = wand.seq = seq
    console.log('HEY MAN', seq)
    const fun = () => {
      seq.start()
      Tone.Transport.start()
      // Tone.Transport.stop(seq.interval * this.sync.progression.length * 0.99)
    }
    mkBtn('fa-info', 'info', 'infos / dialogs', fun)
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
    wand[avarname + 'Network'] = sg
    const norm = v => v === Math.round(v) ? v : v.toFixed(3)
    const mString = metric => {
      const s = netmetrics.extent(wand[avarname + 'Network'], metric).map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand[avarname + 'Network'].degreeCentrality = mString('degreeCentrality')
    wand[avarname + 'Network'].degree_ = mString('degree')
  }

  makeMemberNetworks () {
    const nodes = []
    // const nodes = [wand.syncInfo.msid]
    const id = wand.syncInfo.msid || wand.syncInfo.mnid
    wand.currentNetwork.forEachNeighbor(id, (n, a) => {
      nodes.push(n)
      console.log(n, a)
    })
    const size = 70
    while (true) {
      nodes.forEach(nn => {
        wand.currentNetwork.forEachNeighbor(nn, (n, a) => {
          if (nodes.length < size && !nodes.includes(n)) {
            nodes.push(n)
            console.log(n, a)
          }
        })
      })
      if (nodes.length >= size) {
        break
      }
    }
    console.log(nodes, 'NODES')
    const sg = subGraph(wand.currentNetwork, nodes).copy()
    this.registerNetwork(sg, 'star')
    const { conductor, artist } = wand
    this.sg = sg
    wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
    // wand.currentNetwork
    wand.sync = this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 10000, [id])
    const cs = wand.artist.use.tincture.c.scale(['red', 'yellow', 'green', 'blue', '#ff00ff']).colors(wand.sync.progression.length, 'num')
    wand.sync.progression.forEach((step, i) => {
      const c = cs[i]
      step.forEach(node => {
        wand.currentNetwork.getNodeAttribute(node, 'pixiElement').tint = c
        wand.currentNetwork.getNodeAttribute(node, 'pixiElement').alpha = 0
        wand.currentNetwork.setNodeAttribute(node, 'stepColor', c)
        wand.currentNetwork.setNodeAttribute(node, 'step', i)
      })
    })
    wand.sync.progressionLinks.forEach((step, i) => {
      console.log('STEP', step)
      const c = cs[i]
      step.forEach(link => {
        wand.currentNetwork.getEdgeAttribute(link.from, link.to, 'pixiElement').alpha = 0
        wand.currentNetwork.getEdgeAttribute(link.from, link.to, 'pixiElement').alpha = 0
        wand.currentNetwork.getEdgeAttribute(link.to, link.from, 'pixiElement').tint = c
        wand.currentNetwork.getEdgeAttribute(link.to, link.from, 'pixiElement').tint = c
      })
    })
    // let count = 0
    // wand.currentNetwork.forEachEdge((e, a) => {
    //   a.pixiElement.alpha = 0
    //   a.pixiElement.tint = cs[count++]
    // })
  }
}

module.exports = { SyncParnassum }
