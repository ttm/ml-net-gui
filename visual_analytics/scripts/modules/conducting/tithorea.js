/* global wand */
const { mkBtn } = require('./gui.js')
const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const { Tone } = require('../maestro/all.js').base
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

class Tithorea {
  // andromedan and dedicated to synchronization
  constructor (settings = {}) {
    document.title = 'Andromedan tribe'
    const defaultSettings = {
      fontSize: 20,
      timeStreach: 1,
      state: {
        nodesSize: {
          current: 0.7
        },
        namesSize: {
          current: 1
        },
        nodesAlpha: {
          current: 0.9
        },
        namesAlpha: {
          current: 0.1
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
        this.setDialogs()
        this.setStage()
        this.instruments = {}
        this.setPlay()
        this.setMute()
        this.setRecorder()
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
          // this.drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, wand.currentNetwork, [])
          const { conductor, artist } = wand
          wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
          wand.drawnNet = this.drawnNet
          this.setNetInfo()
          this.setSyncBuilder()
        })
      }
    }, 10000 * this.settings.timeStreach) // fixme: make better loading
  }

  setNetInfo () {
    this.texts.gradus.text = `name, id: ${wand.sageInfo.name}, ${wand.sageInfo.sid || wand.sageInfo.nid}`
    this.texts.achievement.text = `friends, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
    if (this.sync) {
      this.texts.tip.text = `seeds, steps: ${this.sync.seeds.length}, ${this.sync.progression.length - 1}`
    }
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
    this.voiceCounter = 0
    wand.currentNetwork.forEachNode((n, a) => {
      a.pixiElement.on('pointerdown', () => {
        if (this.seeds.includes(n)) {
          this.seeds = this.seeds.filter(i => i !== n)
          a.seed = false
        } else {
          this.seeds.push(n)
          a.seed = true
        }
        this.mkSync()
        // this.resetNetwork()
        this.resetSyncMap()
      })
    })
  }

  resetSyncMap () {
    if (this.arrows) {
      this.arrows.forEach(a => {
        a.destroy()
      })
    }
    const arrows = []
    const { progression, progressionLinks } = this.sync
    progressionLinks.forEach(step => {
      step.forEach(link => {
        // console.log('TLINK:', link.from, link.to, 'pixiElement')
        // const l = net.getEdgeAttribute(link.from, link.to, 'pixiElement')
        // arrows.push(defaultLinkRenderer(l))
        arrows.push(wand.artist.use.defaultLinkRenderer(link))
      })
    })
    this.arrows = arrows
    const net = wand.currentNetwork
    this.seeds.forEach(n => {
      net.setNodeAttribute(n, 'seed', true)
    })
    const cs = wand.artist.use.tincture.c.scale(['red', 'yellow', 'green', 'cyan', 'blue', '#ff00ff']).colors(progression.length, 'num')
    progression.forEach((nodes, i) => {
      const c = cs[i]
      nodes.forEach(n => {
        net.getNodeAttribute(n, 'pixiElement').tint = c
        net.getNodeAttribute(n, 'pixiElement').alpha = 1
      })
    })
    this.setNetInfo()
    this.setNodeInfo()
  }

  mkSync () {
    // this.resetNetwork()
    // if (wand.extra.instruments && wand.extra.instruments.membSynth) {
    //   wand.extra.instruments.membSynth.dispose()
    //   delete wand.extra.instruments.membSynth
    // }
    // if (wand.extra.patterns && wand.extra.patterns.seq2) {
    //   wand.extra.patterns.seq2.dispose()
    //   delete wand.extra.patterns.seq2
    // }
    this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, this.seeds)
    this.setSyncInfo()
    this.playSync2(this.sync.progressionLinks)
  }

  setSyncInfo () {
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
      membSynth.triggerAttackRelease(nval, 1, time + 0.75 * seq2.interval)
      if (nodes.length === 0) {
        self.resetNetwork()
      } else {
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n.from)
          a.activated = true
          a.seed = false
          self.styleNode(a)
          d(() => {
            a.seed = true
            self.styleNode(a)
          }, time + seq2.interval / 2)
        }), time)
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n.to)
          a.seed = true
          a.activated = false
          self.styleNode(a)
          d(() => {
            a.activated = true
            self.styleNode(a)
          }, time + seq2.interval * 0.75)
        }), time + seq2.interval / 2)
      }
    }, progression)
    seq2.interval = '1n'
    seq2.start()
    wand.extra.progression = progression
    // wand.extra.instruments = {
    //   ...wand.extra.instruments,
    //   membSynth
    // }
    // wand.extra.patterns = {
    //   ...wand.extra.patterns,
    //   seq2
    // }
    const fid = 'voice-' + this.voiceCounter++
    mkBtn('fa-microphone-alt-slash', fid, 'remove voice', () => {
      // console.log('clearing voice:', progression, g, voice, seq, instrument)
      wand.$(`#${fid}-icon`).remove()
      wand.$(`#${fid}-button`).remove()
      seq2.dispose()
      membSynth.dispose()
      // then restyle nodes in g
      // remove names
    }, '#info-button')
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
      // const talpha = 1 - this.state.sync.current
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 1.5,
        nodeTint,
        nodeAlpha: 1,
        nameTint,
        nameAlpha: ((a.seed && a.activated) ? 0.2 : this.settings.state.namesAlpha)
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
    const norm = v => v === Math.round(v) ? v : v.toFixed(3)
    const mString = metric => {
      const s = netmetrics.extent(wand[avarname + 'Network'], metric).map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand[avarname + 'Network'].degreeCentrality = mString('degreeCentrality')
    wand[avarname + 'Network'].degree_ = mString('degree')
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

  setRecorder () {
    const rec = wand.transfer.rec.rec()
    let count = 0
    mkBtn('fa-record-vinyl', 'record', 'record performance', () => {
      if (count % 2 === 0) {
        rec.astart()
        wand.$('#record-button').css('background-color', '#ff0000')
      } else {
        rec.stop()
        wand.$('#record-button').css('background-color', '#ffffff')
      }
      count++
    })
  }

  setDialogs () {
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
    if (wand.sageInfo) {
      mkElement([1, 2.2], 0x777733, 'deucalion', 3000, 0, deucalion)
      mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
      mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
      const fun = () => {
        count++
        const tlength = Object.keys(texts).length + 1
        const show = (count % tlength) !== 0
        this.rect.alpha = Number(show)
        this.rect.zIndex = 10 + 2000 * show
        let i = 0
        for (const t in texts) {
          texts[t].alpha = Number(count % tlength === (i + 1))
          console.log(texts[t], Number(count % tlength === (i + 1)))
          i++
        }
        console.log(show, count, i, tlength, count % tlength)
      }
      mkBtn('fa-info', 'info', 'infos / dialogs', fun)
    } else {
      console.log('not sage info')
      mkElement([1, 2.2], 0x777733, 'guards', 3000, 0, guards)
      this.rect.alpha = 1
      this.rect.zIndex = 10 + 2000
      texts.guards.alpha = 1
    }
  }

  setStage () {
    this.texts = {} // pixi elements
    const a = wand.artist.use
    wand.rect1 = a.mkRectangle({
      wh: [a.width, a.height * 0.055], zIndex: 200, color: 0xffffff, alpha: 0.85
    })
    wand.rect2 = a.mkRectangle({
      wh: [a.width, a.height * 0.055], zIndex: 100, color: 0xbbbbbb, alpha: 1
    })

    const f = this.settings.fontSize
    const p = f / 2
    const x = this.scalex(p)
    const y = this.scaley(p)
    const fs = this.scaley(f)

    const mkElement = (pos, color, element, zIndex = 300, alpha = 1) => {
      this.texts[element] = a.mkTextFancy('', [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
    }

    mkElement([1, 2.2], 0x777733, 'adParnassum')
    this.texts.adParnassum.text = 'at Tithorea with Andromedas'
    mkElement([1, 0.2], 0x333377, 'gradus')
    mkElement([21, 2.2], 0x666600, 'achievement')
    mkElement([21, 0.2], 0x333377, 'tip')
    mkElement([54, 2.2], 0x337777, 'interactionCount')
    mkElement([54, 0.2], 0x773377, 'orderSize')

    mkElement([1, 0.1], 0x333377, 'nodeId', 600, 0)
    mkElement([1, 2.2], 0x777733, 'nodeName', 600, 0)
    mkElement([21, 0.2], 0x666600, 'nodeDegree', 600, 0)
    mkElement([21, 2.2], 0x555599, 'nodeDegreeCentrality', 600, 0)
    mkElement([54, 2.2], 0x555599, 'step', 600, 0)
  }

  setNodeInfo () {
    const net = wand.currentNetwork
    this.sync.progression.forEach((step, i) => {
      step.forEach(node => {
        net.setNodeAttribute(node, 'step', i + 1)
      })
    })
    net.forEachNode((n, a) => {
      console.log('yey', n, a)
      const tf = v => v.toFixed(3)
      const texts = [
        ['nodeId', `id: ${a.sid || a.nid}, x: ${tf(a.pixiElement.x)}, y: ${tf(a.pixiElement.y)}`],
        ['nodeName', `name: ${a.name}`],
        ['nodeDegree', `degree: ${a.degree} in ${net.degree}`],
        ['nodeDegreeCentrality',
          `degree centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`],
        ['step', `step: ${a.step}`]
      ]
      a.pixiElement.on('pointerover', () => {
        console.log(n, a, 'NODE HOVERED')
        wand.rect2.zIndex = 500
        texts.forEach(t => {
          this.texts[t[0]].text = t[1]
          this.texts[t[0]].alpha = 1
        })
        // if (a.seed || a.activated) {
        //   return
        // }
        a.hovered = true
        this.styleNode(a)
        net.forEachNeighbor(n, (nn, na) => {
          na.hoveredNeighbor = true
          this.styleNode(na)
        })
      })
      a.pixiElement.on('pointerout', () => {
        wand.rect2.zIndex = 100
        texts.forEach(t => {
          this.texts[t[0]].alpha = 0
        })
        delete a.colorBlocked
        a.hovered = false
        this.styleNode(a)
        net.forEachNeighbor(n, (nn, na) => {
          na.hoveredNeighbor = false
          this.styleNode(na)
        })
      })
    })
  }
}

module.exports = { Tithorea }
