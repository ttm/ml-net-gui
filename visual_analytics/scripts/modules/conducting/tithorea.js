/* global wand */
const { Tone } = require('../maestro/all.js').base
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

const mkBtn = (iclass, fid, title, fun, ref) => {
  const $ = wand.$
  const btn = $('<button/>', {
    class: 'btn',
    id: `${fid}-button`,
    click: () => {
      fun()
    }
  }).attr('atitle', title)
  if (!ref) {
    btn.prependTo('body')
  } else {
    btn.insertAfter(ref)
  }
  $('<i/>', { class: 'fa ' + iclass, id: `${fid}-icon` }).appendTo(
    btn
  )
}

class Tithorea {
  // andromedan and dedicated to synchronization
  constructor (settings = {}) {
    document.title = 'Andromedan tribe'
    const defaultSettings = {
      fontSize: 20,
      timeStreach: 1,
      state: {
        nodesSize: {
          current: 1
        },
        namesSize: {
          current: 1
        },
        nodesAlpha: {
          current: 0.9
        },
        namesAlpha: {
          current: 0.9
        },
        edgesAlpha: {
          current: 0.9
        },
        colors: {
          currentColors: wand.magic.tint.handPicked.black
        }
      }
    }
    this.settings = { ...defaultSettings, ...settings }
    this.settings.state = { ...defaultSettings.state, ...settings.state }
    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth
    wand.extra.exhibition = wand.test.testExhibition1('gradus')
    wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    setTimeout(() => {
      wand.extra.exhibition.remove()
      delete wand.extra.exhibition
      delete wand.currentNetwork
      // this.setDialogs()
      if (!wand.sageInfo) {
        console.log('Andromedans request for praying the invitation')
      } else {
        this.instruments = {}
        this.setPlay()
        this.setMute()
        wand.transfer.mong.findUserNetwork(wand.sageInfo.sid, wand.sageInfo.nid).then(r => {
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
          this.registerNetwork(g, 'current')
          this.drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, wand.currentNetwork, [])
          wand.drawnNet = this.drawnNet
          this.setSyncBuilder()
        })
      }
    }, 10000 * this.settings.timeStreach) // fixme: make better loading
  }

  setPlay () {
    let playing = false
    mkBtn('fa-play', 'play', 'play synchronization', () => {
      playing = !playing
      if (playing) {
        wand.maestro.base.Tone.Transport.start()
      } else {
        wand.maestro.base.Tone.Transport.stop()
        this.resetNetwork()
      }
    })
  }

  setMute () {
    let muted = false
    mkBtn('fa-volume-mute', 'mute', 'mute sounds', () => {
      Tone.Master.mute = muted = !muted
    })
  }

  setSyncBuilder () {
    // click node to add node as seed
    // and update the synchronization
    this.seeds = []
    wand.currentNetwork.forEachNode((n, a) => {
      a.pixiElement.on('pointerdown', () => {
        if (this.seeds.includes(n)) {
          this.seeds = this.seeds.filter(i => i !== n)
        } else {
          this.seeds.push(n)
          this.mkSync()
        }
        this.resetNetwork()
      })
    })
  }

  mkSync () {
    this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, this.seeds)
    this.playSync2(this.sync.progressionLinks)
  }

  playSync2 (progression) {
    const self = this // fixme: really needed?
    const net = wand.currentNetwork
    const Tone = wand.maestro.base.Tone
    // todo:
    //  change membrane to poly, play all degrees or chord in range
    const membSynth = new Tone.MembraneSynth().toMaster()
    membSynth.volume.value = 10
    const lengths = progression.map(i => i.length)
    const maxl = Math.max(...lengths)
    const minl = Math.min(...lengths)
    const d = (f, time) => Tone.Draw.schedule(f, time)
    const seq2 = new Tone.Pattern((time, nodes) => {
      // console.log('bass', time, a.degree, node)
      const nval = 20 + 60 * (nodes.length - minl) / (maxl - minl)
      membSynth.triggerAttackRelease(nval, 1, time)
      membSynth.triggerAttackRelease(nval, 1, time + Tone.Time('2n.').toSeconds())
      if (nodes.length === 0) {
        self.resetNetwork()
      } else {
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n.from)
          a.activated = true
          self.styleNode(a)
        }), time)
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n.to)
          a.seed = true
          self.styleNode(a)
        }), time + 0.5)
      }
    }, progression)
    seq2.interval = '1n'
    seq2.start()
    wand.extra.progression = progression
    wand.extra.instruments = {
      ...wand.extra.instruments,
      membSynth
    }
    wand.extra.patterns = {
      ...wand.extra.patterns,
      seq2
    }
  }

  restyleNode (attr = { }) { // set node style with input attributes
    const s = this.settings.state
    attr = {
      ...{
        scale: this.scaley(s.nodesSize.current),
        nodeTint: s.colors.currentColors.v,
        nodeAlpha: s.nodesAlpha.current,
        nameTint: s.colors.currentColors.n,
        nameAlpha: s.namesAlpha.current // * Math.random()
      },
      ...attr
    }
    const { a, colorBlocked, scale, nodeTint, nodeAlpha, nameTint, nameAlpha } = attr
    a.colorBlocked = colorBlocked
    a.pixiElement.scale.set(scale)
    a.pixiElement.tint = nodeTint
    a.pixiElement.alpha = nodeAlpha
    a.textElement.tint = nameTint
    a.textElement.alpha = nameAlpha
  }

  styleNode (a) { // apply standard styling giving node's attributes { seed, activated }
    const c = this.settings.state.colors.currentColors
    if (a.hovered || a.hoveredNeighbor) {
      const [nodeTint, nameTint] = a.hovered ? [c.hl.more2, c.hl.less2] : [c.hl.less2, c.hl.more2]
      window.aa = a
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 2.7,
        nodeTint,
        nodeAlpha: 1,
        nameTint,
        nameAlpha: 1
      })
    } else if (a.seed || a.activated) {
      const [nodeTint, nameTint] = a.seed ? [c.hl.more, c.hl.less] : [c.hl.less, c.hl.more]
      const talpha = 1 - this.state.sync.current
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 1.5,
        nodeTint,
        nodeAlpha: 1,
        nameTint,
        nameAlpha: talpha
      })
    } else {
      this.restyleNode({ a }) // default non seed or activated attribute
    }
  }

  registerNetwork (graph, avarname) {
    const g = graph
    const gg = components.connectedComponents(g)[0]
    const sg = subGraph(g, gg).copy()
    netdegree.assign(sg)
    netmetrics.centrality.degree.assign(sg)
    louvain.assign(sg)
    sg.communities = louvain.detailed(sg)
    const communitySizes = new Array(sg.communities.count).fill(0)
    sg.forEachNode((n, a) => {
      communitySizes[a.community]++
    })
    const communitySizes_ = communitySizes.filter(i => !isNaN(i))
    sg.communities.sizes = {
      all: communitySizes,
      max: Math.max(...communitySizes_),
      min: Math.min(...communitySizes_)
    }
    const subComGraphs = {}
    for (let i = 0; i < sg.communities.count; i++) {
      const nodes = []
      sg.forEachNode((n, a) => {
        if (a.community === i) {
          nodes.push(n)
        }
      })
      const cg = subGraph(sg, nodes).copy()
      if (nodes.length !== 0) {
        louvain.assign(cg)
        cg.communities = louvain.detailed(cg)
      } else {
        console.log('EMPTY COMMUNITY FOUND!!', i)
        cg.communities = { count: 0 }
      }
      const communitySizes = new Array(cg.communities.count).fill(0)
      cg.forEachNode((n, a) => {
        communitySizes[a.community]++
      })
      const communitySizes_ = communitySizes.filter(i => !isNaN(i))
      cg.communities.sizes = {
        all: communitySizes,
        max: Math.max(...communitySizes_),
        min: Math.min(...communitySizes_)
      }
      subComGraphs[i] = cg
    }
    sg.communityGraphs = subComGraphs
    wand[avarname + 'Network'] = sg
  }

  resetNetwork () {
    wand.currentNetwork.forEachNode((_, a) => {
      a.seed = a.activated = false
      this.styleNode(a)
    })
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }
}

module.exports = { Tithorea }
