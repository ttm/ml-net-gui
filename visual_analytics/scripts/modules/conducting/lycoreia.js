/* global wand */
const { Tone } = require('../maestro/all.js').base
const { copyToClipboard, chooseUnique } = require('../utils.js')
const { mkBtn } = require('./gui.js')
const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

class Lycoreia {
  // ::: idealization:
  // it has all the resources given by gradus
  // but only loads if person login
  // focused in starting a diffusion
  // and is tutored by Deucalion, Lycorus and nymph Corycia, and the Dorians
  // leads to Thitorea and some of the muses

  // load one button, alternates entities speaking to the visitor
  // then load the rest:
  //  network loads when selected. Button to load is info button to the tutors messages
  //  all buttons as are as is, except explorer:
  //    the balls draws the arrows, makes the succession, starts with randomized seeds or random if none selected
  //    shows tool option chosen in the tooltip
  //  networks available are derived from scrapped network (communities, members visited or found)

  // makes multilevel strategy using community detection
  // can explode supernode into nodes by clicking

  // hide & show communities and subcommunities
  constructor (settings = {}) {
    document.title = 'Sirian tribe'
    const defaultSettings = {
      fontSize: 20,
      timeStreach: 1
    }
    this.settings = { ...defaultSettings, ...settings }
    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth
    this.copyToClipboard = copyToClipboard
    wand.extra.exhibition = wand.test.testExhibition1('gradus')
    wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    setTimeout(() => {
      wand.extra.exhibition.remove()
      delete wand.extra.exhibition
      delete wand.currentNetwork
      this.setDialogs()
      if (!wand.sageInfo) {
        console.log('Guards should be saying things')
      } else {
        this.instruments = {}
        this.setCommunitiesInterface()
        this.setSubComInterface()
        this.setPlayer()
        this.setMute()
        this.setRecorder()
        if (wand.sageInfo.sid === '__thisIsAllOfTheSagesMan__') {
          // get all networks, merge scrapped and register as current
          // merge everything and merge as full
          // consider stars, or donators, nor meta-social-organisms (or beings, or social bodies)
          wand.transfer.mong.findAllScrappedNetworks().then(r => {
            wand.allNetworks = r
            wand.allGraphs = r.map(anet => wand.net.use.utils.loadJsonString(anet.text))
            this.mergeAllGraphs()
            const g = wand.mergedGraph = wand.net.use.utils.mergeGraphs(wand.allGraphs)
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
          })
          return
        }
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
        })
      }
    }, 10000 * this.settings.timeStreach) // fixme: make better loading
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
    this.texts = []
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      this.texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      return this.texts[element]
    }
    let count = 0
    if (wand.sageInfo) {
      mkElement([1, 2.2], 0x777733, 'deucalion', 3000, 0, deucalion)
      mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
      mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
      const fun = () => {
        count++
        const tlength = Object.keys(this.texts).length + 1
        const show = (count % tlength) !== 0
        this.rect.alpha = Number(show)
        this.rect.zIndex = 10 + 2000 * show
        let i = 0
        for (const t in this.texts) {
          this.texts[t].alpha = Number(count % tlength === (i + 1))
          console.log(this.texts[t], Number(count % tlength === (i + 1)))
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
      this.texts.guards.alpha = 1
    }
  }

  setCommunitiesInterface () {
    this.instruments.plucky = new Tone.PluckSynth({ volume: 10 }).toMaster()
    let count = 0
    mkBtn('fa-users-cog', 'com', 'communities', () => {
      count = (++count) % (wand.currentNetwork.communities.count + 1)
      this.showCommunity(count)
    })
  }

  setSubComInterface () {
    this.instruments.membrane = new Tone.MembraneSynth({ volume: -20 }).toMaster()
    let count = 0
    mkBtn('fa-users', 'sub', 'sub communities', () => {
      const cIndex = wand.currentNetwork.communityIndex
      const g = wand.currentNetwork.communityGraphs[cIndex]
      count = (++count) % (g.communities.count + 1)
      this.showSubCommunity(count, g)
    })
  }

  showSubCommunity (index, g) {
    index--
    console.log('show subcommunity:', index)
    this.visCommnunity(index, g, 0x00ff00)
    if (index !== -1) {
      this.sonifySubCommunity(index)
    }
    wand.currentNetwork.subCommunityIndex = index
  }

  showCommunity (index) {
    index--
    console.log('show community:', index)
    this.visCommnunity(index, wand.currentNetwork, 0x0000ff)
    if (index !== -1) {
      this.sonifyCommunity(index)
    }
    wand.currentNetwork.communityIndex = index
    delete wand.currentNetwork.subCommunityIndex
  }

  visCommnunity (index, g, color) {
    if (this.nameShown) {
      this.nameShown.forEach(i => { i.alpha = 0 })
    }
    const names = []
    g.forEachNode((n, a) => {
      if (a.community === index) {
        wand.currentNetwork.getNodeAttribute(n, 'pixiElement').tint = color
        names.push(wand.currentNetwork.getNodeAttribute(n, 'textElement'))
      } else {
        wand.currentNetwork.getNodeAttribute(n, 'pixiElement').tint = g === wand.currentNetwork ? 0xff0000 : 0x0000ff
      }
    })
    if (index !== -1) {
      this.nameShown = chooseUnique(names, 3)
      this.nameShown.forEach(i => { i.alpha = 1 })
    }
  }

  sonifySubCommunity (index) {
    const g = wand.currentNetwork.communityGraphs[wand.currentNetwork.communityIndex]
    const s = g.communities.sizes
    let note
    if (s.max - s.min) {
      note = 90 + 30 * (s.all[index] - s.min) / (s.max - s.min)
    } else {
      if (s.all[index]) {
        note = 90 + 3 * s.all[index]
      } else {
        note = 90 + 30
      }
    }
    this.instruments.membrane.triggerAttackRelease(Tone.Midi(note).toNote(), 0.01)
    console.log('sonify subcom:', note, this.instruments.membrane)
  }

  sonifyCommunity (index) {
    const s = wand.currentNetwork.communities.sizes
    let note
    if (s.max - s.min) {
      note = 50 + 30 * (s.all[index] - s.min) / (s.max - s.min)
    } else {
      if (s.all[index]) {
        note = 50 + 30 * s.all[index]
      } else {
        note = 50 + 30
      }
    }
    this.instruments.plucky.triggerAttackRelease(Tone.Midi(note).toNote(), 0.01)
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
    // louvain.assign(sg)
    sg.communities = louvain.detailed(sg)
    for (const key in sg.communities.communities) {
      sg.setNodeAttribute(key, 'community', sg.communities.communities[key])
    }
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
        // louvain.assign(cg)
        cg.communities = louvain.detailed(cg)
        for (const key in cg.communities.communities) {
          cg.setNodeAttribute(key, 'community', cg.communities.communities[key])
        }
      } else {
        console.log('EMPTY COMMUNITY FOUND!!', i)
        cg.communities = { count: 0 }
      }
      const communitySizes = new Array(cg.communities.count).fill(0)
      cg.forEachNode((n, a) => {
        communitySizes[a.community]++
      })
      const communitySizes_ = communitySizes.filter(ii => !isNaN(ii))
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

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }

  setPlayer () {
    mkBtn('fa-music', 'music', 'make musical sequence', () => {
      console.log(wand.currentNetwork.subCommunityIndex, wand.currentNetwork.communityIndex)
      const voice = {
        duration: '4n',
        community: wand.currentNetwork.communityIndex,
        subcommunity: wand.currentNetwork.subCommunityIndex
      }
      this.mkVoice(voice)
    })
    this.voiceCounter = 0
  }

  mkVoice (voice) {
    // make the synth and pattern
    let instrument
    let progression
    let g
    if (voice.subcommunity !== undefined) {
      instrument = new Tone.MembraneSynth({ volume: -20 }).toMaster()
      g = wand.currentNetwork.communityGraphs[wand.currentNetwork.communityIndex]
      const s = g.communities.sizes
      progression = s.all.map((i, ii) => {
        let note
        if (s.max - s.min) {
          note = 90 + 30 * (i - s.min) / (s.max - s.min)
        } else {
          if (i) {
            note = 90 + 30 * i
          } else {
            note = 90 + 30
          }
        }
        return { note, ii }
      })
    } else {
      instrument = new Tone.PluckSynth({ volume: 10 }).toMaster()
      g = wand.currentNetwork
      const s = g.communities.sizes
      progression = s.all.map((i, ii) => {
        let note
        if (s.max - s.min) {
          note = 50 + 30 * (i - s.min) / (s.max - s.min)
        } else {
          if (i) {
            note = 50 + 30 * i
          } else {
            note = 50 + 30
          }
        }
        return { note, ii }
      })
    }
    const d = (f, time) => Tone.Draw.schedule(f, time)
    const seq = new Tone.Pattern((time, info) => {
      instrument.triggerAttackRelease(Tone.Midi(info.note).toNote(), 0.01, time)
      d(() => this.visCommnunity(info.ii, g, voice.subcommunity ? 0xffff00 : 0x00ffff), time)
    }, progression)
    seq.interval = voice.duration
    console.log('creating voice:', progression, g, voice, seq, instrument)
    seq.start()
    Tone.Transport.start()
    const fid = 'voice-' + this.voiceCounter++
    console.log('YEAH MAN, MAKING MIC', fid)
    mkBtn('fa-microphone-alt-slash', fid, 'remove voice', () => {
      console.log('clearing voice:', progression, g, voice, seq, instrument)
      wand.$(`#${fid}-icon`).remove()
      wand.$(`#${fid}-button`).remove()
      seq.dispose()
      instrument.dispose()
      // then restyle nodes in g
      // remove names
    }, '#info-button')
    console.log('finished: MAKING MIC')
  }
  //     setInterval(() => {
  //       this.showCommunity(
  //         (++count) % (wand.currentNetwork.communities.count + 1)
  //       )
  //     }, 500)
  //   })
  // }

  setMute () {
    let muted = false
    mkBtn('fa-volume-mute', 'mute', 'mute sounds', () => {
      Tone.Master.mute = muted = !muted
    })
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

  mergeAllGraphs () {
    console.log('on merge graphs jow')
    wand.mergedGraph = wand.net.use.utils.mergeGraphs(wand.allGraphs)
  }
}

module.exports = { Lycoreia }
