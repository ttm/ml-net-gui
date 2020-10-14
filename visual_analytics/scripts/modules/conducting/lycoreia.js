/* global wand */
const { Tone } = require('../maestro/all.js').base
const { copyToClipboard, chooseUnique } = require('../utils.js')
const { mkBtn } = require('./gui.js')
const { guards, lycoreiaNew, uploadVideoText, uploadVideoPlaceholder } = require('./instructions.js')
// const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const Graph = require('graphology')
const { monload } = require('../utils.js')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

const d = (f, time) => Tone.Draw.schedule(f, time)

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
    document.title = 'Lycoreia (Our Aquarium)'
    wand.$('#favicon').attr('href', 'log3__.png')
    const $ = wand.$
    const self = this
    const defaultSettings = {
      fontSize: 20,
      state: {
        nodesSize: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 2, // interactions count
          max: 2,
          min: 0.2,
          steps: 10,
          current: 0.3,
          update: function () {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.scale.set(this.current)
            })
          }
        },
        namesSize: {
          count: 0,
          max: 1.5,
          min: 0.3,
          steps: 10,
          current: 0.5,
          update: function () {
            console.log('yeah, name sizes', this.current)
            console.log('foooooo')
            wand.currentNetwork.forEachNode((n, a) => {
              a.textElement.scale.set(this.current)
            })
          }
        },
        nodesAlpha: {
          count: 0,
          max: 1,
          min: 0,
          steps: 10,
          current: 0.5,
          iconId: '#member-button',
          update: function () {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.alpha = a.pixiElement.balpha = this.current
            })
          },
          bind: () => {
            mkBtn('fa-chess', 'member', 'show members', () => {
              this.increment('nodesAlpha')
            }, '#info-button')
          }
        },
        namesAlpha: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 10,
          current: 0.1,
          iconId: '#names-button',
          update: function (a) {
            wand.currentNetwork.forEachNode((n, a) => {
              wand.extra.showNameBlock = this.count % 2 === 1
              a.textElement.alpha = this.current
            })
          },
          bind: () => {
            mkBtn('fa-mask', 'names', 'show names', () => {
              this.increment('namesAlpha')
            }, '#friendship-button')
          }
        },
        edgesAlpha: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 10,
          current: 0.3,
          iconId: '#friendship-button',
          update: function () {
            wand.currentNetwork.forEachEdge((e, a) => {
              a.pixiElement.alpha = this.current
              a.pixiElement.balpha = this.current
            })
          },
          bind: () => {
            mkBtn('fa-bone', 'friendship', 'show friendships', () => {
              this.increment('edgesAlpha')
            }, '#member-button')
          }
        },
        colors: {
          count: 0,
          min: 0,
          max: Object.keys(wand.magic.tint.handPicked).length - 1,
          steps: Object.keys(wand.magic.tint.handPicked).length,
          palettes: Object.keys(wand.magic.tint.handPicked),
          currentColors: wand.magic.tint.randomPalette2(),
          iconId: '#pallete-button',
          update: function () {
            this.currentColors = wand.magic.tint.randomPalette2()
            const { bg, e } = this.currentColors
            wand.artist.share.draw.base.app.renderer.backgroundColor = this.count % 3 === 0 ? 0 : (this.count % 3 === 1 ? 0xffffff : Math.floor(bg))
            wand.currentNetwork.forEachEdge((i, a) => {
              a.pixiElement.tint = e
            })
            wand.currentNetwork.forEachNode((e, a) => {
              self.styleNode(a)
            })
          },
          bind: () => {
            mkBtn('fa-palette', 'pallete', 'change colors', () => {
              this.increment('colors')
            }, '#names-button').click()
          }
        },
        muter: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          muted: false,
          iconId: '#muter-button',
          update: function () {
            Tone.Master.mute = this.muted = !this.muted
          },
          bind: function () { // todo: conform other binds with this:
            mkBtn('fa-volume-mute', 'muter', 'mute (only visual music)', () => {
              self.increment('muter')
            }, '#pallete-button')
          }
        }
      }
    }
    this.settings = { ...defaultSettings, ...settings }
    this.settings.state = { ...defaultSettings.state, ...settings.state }
    wand.state = this.state = this.settings.state

    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth
    this.copyToClipboard = copyToClipboard
    wand.extra.exhibition = wand.test.testExhibition1('gradus')
    wand.currentNetwork = wand.extra.exhibition.drawnNet.net
    monload(() => {
      wand.extra.exhibition.remove()
      delete wand.extra.exhibition
      delete wand.currentNetwork
      this.setDialogs()
      // if (!wand.sageInfo) {
      if (window.oaReceivedMsg) {
        this.instruments = {}
        // this.setCommunitiesInterface()
        // this.setSubComInterface()
        // this.setPlayer()
        // this.setRecorder()
        if (wand.syncInfo.allUsers) {
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
        } else {
          this.allNetworks = [window.oaReceivedMsg.data.graph]
          const g = Graph.from(window.oaReceivedMsg.data.graph)
          this.registerNetwork(g, 'full')
          const nodesToRemove = []
          g.forEachNode((n, a) => {
            a.id = n
            if (!a.scrapped) {
              nodesToRemove.push(n)
            }
          })
          nodesToRemove.forEach(n => {
            g.dropNode(n)
          })
          this.registerNetwork(g, 'current')
          const u = wand.artist.use
          this.drawnNet = new wand.conductor.use.DrawnNet(u, wand.currentNetwork, [u.width, u.height])
          wand.drawnNet = this.drawnNet
        }
        this.setStage()
        this.setNodeInfo()
        this.resetNetwork()
        this.state.nodesAlpha.bind()
        this.state.edgesAlpha.bind()
        this.state.namesAlpha.bind()
        this.state.colors.bind()
        this.state.muter.bind()
        const d = $('<div/>', { id: 'div1' }).insertAfter('#muter-button')
        d.html('||').css('display', 'inline').css('margin', '0 1% 0 2%')
        this.setRecorder()
        this.setPlayer()
        this.setCommunitiesInterface()
        this.setSubComInterface()
        this.setNodeClick()
        const d2 = $('<div/>', { id: 'div2' }).insertAfter('#sub-button')
        d2.html('||').css('display', 'inline').css('margin', '0 2% 0 1%')
      }
    })
  }

  setDialogs () {
    // const f = this.settings.fontSize
    // const p = f / 2
    // const x = this.scalex(p)
    // const y = this.scaley(p)
    // const fs = this.scaley(f)
    this.texts = {}
    let tcount = 0
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      // this.texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      // return this.texts[element]
      this.texts[element] = wand.$('<div/>', {
        class: 'infotext',
        id: 'infotext' + tcount++,
        css: {
          width: '50%',
          margin: '3%',
          'background-color': '#DDDDDD',
          padding: '2%'
        }
      }).html(text.replace(/\n/g, '<br />')).appendTo('body').hide()
      return this.texts[element]
    }
    let count = 0
    if (window.oaReceivedMsg) {
      console.log(count, 'YEAH RCVD MSG')
      mkElement([1, 2.2], 0xffffff, 'lycoreiaNew', 3000, 0, lycoreiaNew)
      // fixme: put element to register new video:
      // atext.on('pointerdown', () => {
      //   let vurl = window.prompt(uploadVideoText, uploadVideoPlaceholder)
      //   if (vurl === null) return
      //   vurl = vurl.trim()
      //   if (/^https*:\/\//.test(vurl)) {
      //     this.writeVideoUrl(vurl, 'lycoreia')
      //   }
      // })
      // atext.buttonMode = true
      // atext.interactive = true

      // mkElement([1, 2.2], 0x777733, 'deucalion', 3000, 0, deucalion)
      // mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
      // mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
      const fun = () => {
        const tlength = Object.keys(this.texts).length + 1
        const show = (++count % tlength) !== 0
        if (show) {
          wand.$('canvas').hide()
        } else {
          wand.$('canvas').show()
        }
        // this.rect.alpha = Number(show)
        // this.rect.zIndex = 10 + 2000 * show
        let i = 1
        console.log(i, show, count, tlength, 'YEAH CLICK INFO')
        for (const t in this.texts) {
          // this.texts[t].alpha = Number(count % tlength === (i + 1))
          // this.texts[t].interactive = Boolean(count % tlength === (i + 1))
          if (count % tlength === i) {
            this.texts[t].show()
          } else {
            this.texts[t].hide()
          }
          i++
        }
      }
      mkBtn('fa-info', 'info', 'infos / dialogs', fun).click()
    } else {
      wand.$('canvas').hide()
      mkElement([1, 2.2], 0x777733, 'guards', 3000, 0, guards).show()
      // this.rect.alpha = 1
      // this.rect.zIndex = 10 + 2000
      // this.texts.guards.alpha = 1
    }
  }

  setCommunitiesInterface () {
    this.instruments.plucky = new Tone.PluckSynth({ volume: 0 }).toMaster()
    let count = 0
    mkBtn('fa-users-cog', 'com', 'highlight next community', () => {
      count = (++count) % (wand.currentNetwork.communities.count + 1)
      this.showCommunity(count)
    }, '#music-button')
    wand.$('#com-button').click()
  }

  setSubComInterface () {
    this.instruments.membrane = new Tone.MembraneSynth({ volume: -20 }).toMaster()
    let count = 0
    mkBtn('fa-users', 'sub', 'highlight next subcommunity', () => {
      const cIndex = wand.currentNetwork.communityIndex
      const g = wand.currentNetwork.communityGraphs[cIndex]
      count = (++count) % (g.communities.count + 1)
      this.showSubCommunity(count, g)
    }, '#com-button')
  }

  showSubCommunity (index, g) {
    index--
    this.visCommnunity(index, g, 0x00ff00)
    if (index !== -1) {
      this.sonifySubCommunity(index)
    }
    wand.currentNetwork.subCommunityIndex = index
  }

  showCommunity (index) {
    index--
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
    sg.setAttribute('userData', g.getAttribute('userData'))
    sg.forEachNode((n, a) => {
      a.id = n
    })
    // louvain.assign(sg)
    sg.communities = louvain.detailed(sg)
    const communitySizes = new Array(sg.communities.count).fill(0)
    for (const key in sg.communities.communities) {
      const index = sg.communities.communities[key]
      sg.setNodeAttribute(key, 'community', index)
      communitySizes[index]++
    }
    // const communitySizes_ = communitySizes.filter(i => !isNaN(i))
    sg.communities.sizes = {
      all: communitySizes,
      // max: Math.max(...communitySizes_),
      // min: Math.min(...communitySizes_)
      max: Math.max(...communitySizes),
      min: Math.min(...communitySizes)
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
        const communitySizes = new Array(cg.communities.count).fill(0)
        for (const key in cg.communities.communities) {
          const index = cg.communities.communities[key]
          cg.setNodeAttribute(key, 'community', index)
          sg.setNodeAttribute(key, 'subcommunity', index)
          communitySizes[index]++
        }
        // const communitySizes_ = communitySizes.filter(ii => !isNaN(ii))
        cg.communities.sizes = {
          all: communitySizes,
          // max: Math.max(...communitySizes_),
          // min: Math.min(...communitySizes_)
          max: Math.max(...communitySizes),
          min: Math.min(...communitySizes)
        }
      } else {
        cg.communities = { count: 0 }
      }
      subComGraphs[i] = cg
    }
    sg.communityGraphs = subComGraphs
    wand[avarname + 'Network'] = sg
    const norm = v => v === Math.round(v) ? v : v.toFixed(3)
    const mString = metric => {
      wand[avarname + 'Network'][metric + 'Extent'] = netmetrics.extent(wand[avarname + 'Network'], metric)
      const s = wand[avarname + 'Network'][metric + 'Extent'].map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand[avarname + 'Network'].degreeCentrality = mString('degreeCentrality')
    wand[avarname + 'Network'].degree_ = mString('degree')
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }

  setPlayer () {
    mkBtn('fa-music', 'music', 'make musical sequence', () => {
      const voice = {
        duration: '4n',
        community: wand.currentNetwork.communityIndex,
        subcommunity: wand.currentNetwork.subCommunityIndex
      }
      this.mkVoice(voice)
    }, '#record-button')
    this.voiceCounter = 0
  }

  mkVoice (voice) {
    // make the synth and pattern
    let instrument
    let progression
    let g
    const fid = 'voice-' + this.voiceCounter++
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
    const c = voice.subcommunity === undefined ? 0xffff00 : 0x00ffff
    const c2 = voice.subcommunity === undefined ? '#ffff00' : '#00ffff'
    const seq = new Tone.Pattern((time, info) => {
      instrument.triggerAttackRelease(Tone.Midi(info.note).toNote(), 0.01, time)
      d(() => {
        this.visCommnunity(info.ii, g, c)
        btn.css('background-color', c2)
      }, time)
      d(() => {
        btn.css('background-color', 'white')
      }, time + seq.interval / 2)
    }, progression)
    seq.interval = voice.duration
    seq.start()
    Tone.Transport.start()
    const btn = mkBtn('fa-microphone-alt-slash', fid, 'remove voice', () => {
      wand.$(`#${fid}-icon`).remove()
      wand.$(`#${fid}-button`).remove()
      seq.dispose()
      instrument.dispose()
    }, '#div2')
  }

  setRecorder () {
    const rec = wand.transfer.rec.rec()
    let count = 0
    rec.filename = wand.sageInfo.name + ' @ Lycoreia audiovisual music #oa #ourAquarium #oAquario ' + (new Date()).toISOString().split('.')[0]
    mkBtn('fa-record-vinyl', 'record', 'record performance', () => {
      if (count % 2 === 0) {
        rec.astart()
        wand.$('#record-button').css('background-color', '#ff0000')
      } else {
        rec.astop()
        wand.$('#record-button').css('background-color', '#ffffff')
      }
      count++
    }, '#div1')
  }

  mergeAllGraphs () {
    wand.mergedGraph = wand.net.use.utils.mergeGraphs(wand.allGraphs)
  }

  setNodeInfo () {
    const net = wand.currentNetwork
    if (net.hasInfo) {
      return
    }
    const tf = v => v.toFixed(3)
    net.forEachNode((n, a) => {
      const texts = [
        ['nodeId', `id: ${a.id}`],
        ['nodeName', `name: ${a.name}`],
        ['nodeDegree', `friends: ${a.degree} in ${net.degree_}`],
        ['nodeDegreeCentrality',
          `centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`]
      ]
      a.pixiElement.on('pointerover', () => {
        texts.forEach(t => {
          this.texts_[t[0]].text(t[1])
          // this.texts_[t[0]].alpha = 1
        })
        wand.$('#infodiv2').show()
        wand.$('#infodiv').hide()
        a.hovered = true
        this.styleNode(a)
        net.forEachNeighbor(n, (nn, na) => {
          na.hoveredNeighbor = true
          this.styleNode(na)
        })
      })
      a.pixiElement.on('pointerout', () => {
        // wand.rect2.zIndex = 100
        // texts.forEach(t => {
        //   this.texts_[t[0]].alpha = 0
        // })
        delete a.colorBlocked
        wand.$('#infodiv').show()
        wand.$('#infodiv2').hide()
        a.hovered = false
        this.styleNode(a)
        net.forEachNeighbor(n, (nn, na) => {
          na.hoveredNeighbor = false
          this.styleNode(na)
        })
      })
    })
    net.hasInfo = true
  }

  setStage () {
    this.texts_ = {} // pixi elements
    const f = this.settings.fontSize
    // const p = f / 2
    // const x = this.scalex(p)
    // const y = this.scaley(p)
    const fs = this.scaley(f)

    wand.$('<div/>', {
      id: 'infodiv',
      css: {
        display: 'grid',
        'grid-template-columns': 'auto auto auto',
        'background-color': '#2196F3',
        padding: '2px',
        height: Math.floor(wand.artist.use.height * 0.065) + 'px'
      }
    }).insertBefore('canvas')
    wand.$('<div/>', {
      id: 'infodiv2',
      css: {
        display: 'grid',
        'grid-template-columns': 'auto auto',
        'background-color': '#21F693',
        padding: '2px',
        height: Math.floor(wand.artist.use.height * 0.065) + 'px'
      }
    }).insertBefore('canvas').hide()
    wand.$(`<style type='text/css'>
      .grid-item {
        background-color: rgba(255, 255, 255, 0.8);
        border-right: 1px solid rgba(0, 0, 0, 0.8);
        padding: 0px;
        font-size: ${Math.floor(fs)}px;
        text-align: center;
      }
    </style>`).appendTo('head')

    const mkElement = (pos, color, element, zIndex = 300, alpha = 1) => {
      // this.texts_[element] = a.mkTextFancy('', [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      const idiv = zIndex === 300 ? '#infodiv' : '#infodiv2'
      this.texts_[element] = wand.$('<div/>', {
        class: 'grid-item'
      }).appendTo(idiv)
      return this.texts_[element]
    }

    const t1 = mkElement([1, 0.2], 0x333377, 'gradus')
    t1.on('pointerdown', () => {
      this.increment('namesSize')
    })
    mkElement([21, 0.2], 0x333377, 'tip')
    mkElement([54, 0.2], 0x773377, 'orderSize')
    mkElement([1, 2.2], 0x777733, 'adParnassum')
    this.texts_.adParnassum.html('<span class="tooltip" style="cursor: pointer; font-size: 103%;background-color: yellow; padding: 0 2%;">at Lycoreia for community detection<span class="tooltiptext" style="font-size:97%;" onclick="">register video URL</span></span>').on('pointerdown', () => {
      modal.css('display', 'block')
    })
    this.videoSource = 'lycoreia'
    const modal = wand.$('<div/>', { id: 'myModal', class: 'modal' }).appendTo('body')
    wand.$('<div/>', { class: 'modal-content' }).appendTo(
      modal
    ).html(`
    <label for="fname">${uploadVideoText}</label><br>
    <input type="text" id="vUrl" placeholder="${uploadVideoPlaceholder}" style="width:70%"><br><br>
    <button id="vSub" onclick="wand.magic.lycoreia.writeVideoUrl()">Submit</button>
    <button onclick="wand.$('#myModal').css('display', 'none')">Cancel</button>
    `)
    wand.$('#vUrl').on('keyup', function (event) {
      if (event.keyCode === 13) {
        event.preventDefault()
        document.getElementById('vSub').click()
      }
    })
    this.increment('namesSize')
    // t1.buttonMode = true
    // t1.interactive = true
    this.texts_.gradus.html(`<button class="tooltip" style="cursor: pointer; font-size: 103%;">name: ${wand.sageInfo.name}<span class="tooltiptext" style="font-size:97%;">names size</span></button>`)
    mkElement([21, 2.2], 0x666600, 'achievement')
    mkElement([54, 2.2], 0x337777, 'interactionCount')

    this.texts_.achievement.text('achieved: community detection')
    this.texts_.tip.html('<span style="background-color: lightgreen; padding: 0 2%;">&#x1F449 record music and upload video</span>')
    const net = wand.currentNetwork
    this.texts_.orderSize.html(`<button class="tooltip" style="cursor: pointer; font-size: 103%;">members, friendships: ${net.order}, ${net.size} <span class="tooltiptext" style="font-size:97%;">members size</span></button>`)
    this.texts_.orderSize.on('pointerdown', () => {
      this.increment('nodesSize')
    })
    this.increment('nodesSize')
    // this.texts_.orderSize.buttonMode = true
    // this.texts_.orderSize.interactive = true

    // setInterval(() => {
    //   const total = Object.values(this.state).reduce((a, v) => a + v.count, 0)
    //   // const total = Object.values(this.counter).reduce((a, v) => a + v, 0)
    //   this.texts_.interactionCount.text = `interactions: ${total}`
    // }, 500)
    this.texts_.interactionCount.text(`groups, subgroups: ${net.communities.count}, ${Object.values(net.communityGraphs).reduce((a, g) => { return a + g.communities.count }, 0)}`)

    mkElement([1, 2.2], 0x777733, 'nodeName', 600, 0)
    mkElement([41, 0.2], 0x666600, 'nodeDegree', 600, 0)
    mkElement([1, 0.1], 0x333377, 'nodeId', 600, 0)
    mkElement([41, 2.2], 0x555599, 'nodeDegreeCentrality', 600, 0)
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
      const talpha = 1 // - this.state.sync.current
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

  resetNetwork () {
    const net = wand.currentNetwork
    net.forEachNode((_, a) => {
      a.seed = a.activated = false
      a.pixiElement.interactive = true
      a.pixiElement.visible = a.textElement.visible = true
      this.styleNode(a)
    })
    net.forEachEdge((n, a) => {
      a.pixiElement.alpha = this.state.edgesAlpha.current
      a.pixiElement.visible = true
      a.pixiElement.interactive = true
    })
    this.setNodeInfo()
    this.texts_.orderSize.html(`<button class="tooltip" style="cursor: pointer; font-size: 103%;">members, friendships: ${net.order}, ${net.size} <span class="tooltiptext" style="font-size:97%;">members size</span></button>`)
  }

  increment (attr) {
    this.state[attr].count++
    const { count, min, max, steps, iconId, iconChange, icons } = this.state[attr]
    const ambit = max - min
    const n = count % steps
    const val = min + (n / (steps - 1)) * ambit // at least 2 steps
    this.state[attr].current = val
    this.state[attr].update()
    const e = wand.$(iconId)
    if (iconChange === 'toggle') {
      e.toggleClass(() => icons[n])
    } else if (iconChange === 'toggle-color') {
    } else if (iconId !== undefined) { // if (iconChange == 'color') {
      let color = '#00ff00'
      if (max - val > 0.01) {
        color = '#' + Math.floor(0xffffff - 0xffff * val / max).toString(16)
      }
      e.css('background-color', color)
    }
    return n
  }

  setNodeClick () {
    const net = wand.currentNetwork
    if (net.hasNodeClick) {
      return
    }
    net.seeds = []
    net.forEachNode((n, a) => {
      a.pixiElement.on('pointerdown', () => {
        console.log('node clicked:', n, a)
        this.showCommunity(a.community + 1)
        setTimeout(() => {
          wand.currentNetwork.communityIndex = a.community
          this.showSubCommunity(a.subcommunity + 1, wand.currentNetwork.communityGraphs[a.community])
        }, 500)
        // find com and subcom of the node
      })
    })
    net.hasNodeClick = true
  }

  writeVideoUrl () { // fixme: check console output in both sync and self gradus
    const { usid, unid, msid, mnid, page, syncKey } = wand.syncInfo
    const desc = this.videoSource
    let vurl = wand.$('#vUrl').val()
    console.log(vurl)
    if (vurl === null) return
    vurl = vurl.trim()
    console.log(vurl)
    if (!(/^https*:\/\//.test(vurl))) return
    this.urlConfirmed = true
    wand.$('#myModal').css('display', 'none')
    console.log(
      vurl, usid, unid, msid, mnid, syncKey, page, new Date(Date.now()).toISOString(), desc
    )
    wand.transfer.mong.writeAny({
      vurl, usid, unid, msid, mnid, syncKey, page, date: new Date(Date.now()).toISOString(), desc
    })
  }
}

module.exports = { Lycoreia }
