/* global wand */
const { mkBtn } = require('./gui.js')
const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const { Tone } = require('../maestro/all.js').base
const Graph = require('graphology')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

class Tithorea {
  // andromedan and dedicated to synchronization
  constructor (settings = {}) {
    document.title = 'Tithorea (Our Aquarium)'
    const $ = wand.$
    const self = this
    const defaultSettings = {
      fontSize: 20,
      timeStreach: 0.001,
      state: {
        nodesSize: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 7, // interactions count
          max: 2,
          min: 0.5,
          steps: 10,
          current: 1,
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
          current: 1,
          update: function () {
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
          current: 0.9,
          iconId: '#member-button',
          update: function () {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.alpha = a.pixiElement.balpha = this.current
            })
          },
          bind: () => {
            $('<i/>', { class: 'fa fa-chess', id: 'member-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'member-button',
                click: () => {
                  this.increment('nodesAlpha')
                }
              }).attr('atitle', 'show members').insertAfter('#info-button')
            )
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
            $('<i/>', { class: 'fa fa-mask', id: 'names-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'names-button',
                click: () => {
                  this.increment('namesAlpha')
                }
              }).attr('atitle', 'show names').insertAfter('#friendship-button')
            )
          }
        },
        edgesAlpha: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 10,
          current: 0.9,
          iconId: '#friendship-button',
          update: function () {
            const sn = self.snet
            wand.currentNetwork.forEachEdge((e, a, n1, n2) => {
              if (!(sn.hasEdge(n1, n2) || sn.hasEdge(n2, n1))) {
                a.pixiElement.alpha = this.current
                a.pixiElement.balpha = this.current
              }
            })
          },
          bind: () => {
            $('<i/>', { class: 'fa fa-bone', id: 'friendship-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'friendship-button',
                click: () => {
                  this.increment('edgesAlpha')
                }
              }).attr('atitle', 'show friendships').insertAfter('#member-button')
            )
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
            $('<i/>', { class: 'fa fa-palette', id: 'pallete-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'pallete-button',
                click: () => {
                  this.increment('colors')
                }
              }).attr('atitle', 'change colors').css('background-color', 'gray')
                .insertAfter('#names-button')
            )
            $('#pallete-button').click()
          }
        },
        muter: {
          count: 0,
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
        },
        player: {
          count: 0,
          max: 11,
          min: 0,
          steps: 12,
          current: 0,
          iconId: '#player-button',
          update: function () {
            console.log(this.current, 'PLAYER')
            if (this.current === this.max) {
              Tone.Transport.stop()
              this.rec.stop()
              self.resetNetwork()
              //   Tone.Transport.stop()
            } else if (this.current === this.min) {
              this.rec.astart()
              Tone.Transport.start()
            } else {
              Tone.Transport.stop()
              setTimeout(() => {
                wand.extra.patterns.seq2.interval = (2 ** (10 - this.current)) + 'n'
                Tone.Transport.start()
              }, wand.extra.patterns.seq2.interval * 1000)
            }
            // if (this.current) {
            //   Tone.Transport.start()
            // } else {
            //   Tone.Transport.stop()
            //   this.rec.stop()
            //   self.resetNetwork()
            // }
          },
          bind: function () {
            const $ = wand.$
            this.rec = wand.transfer.rec.rec()
            $('<i/>', { class: 'fa fa-play', id: 'player-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'player-button',
                click: () => {
                  self.increment('player')
                }
              }).attr('atitle', 'change player').insertAfter('#div1')
            )
            this.count = this.current = this.max
          }
        },
        desc: {
          count: 0,
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          muted: false,
          iconId: '#desc-button',
          update: function () {
            if (this.current) {
              self.descDiag.css('display', 'block')
            } else {
              self.descDiag.css('display', 'none')
            }
          },
          bind: function () {
            console.log('b in')
            self.setDesc()
            mkBtn('fa-file-medical-alt', 'desc', 'syncronization description', () => {
              self.increment('desc')
            }, '#remove-button')
            console.log('b out')
          }
        }
      }
    }
    this.settings = { ...defaultSettings, ...settings }
    this.settings.state = { ...defaultSettings.state, ...settings.state }
    this.state = this.settings.state
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
      this.setDialogs()
      if (window.oaReceivedMsg) {
        this.instruments = {}
        this.allNetworks = [window.oaReceivedMsg.data.graph]
        const g = Graph.from(window.oaReceivedMsg.data.graph)
        // const g = wand.net.use.utils.loadJsonString(this.allNetworks[0].text)
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

        this.setStage()
        this.state.nodesAlpha.bind()
        this.state.edgesAlpha.bind()
        this.state.namesAlpha.bind()
        this.state.colors.bind()
        this.state.muter.bind()

        const d = $('<div/>', { id: 'div1' }).insertAfter('#muter-button')
        d.html(' || ').css('display', 'inline')

        this.state.player.bind()

        this.setNetInfo()
        this.setSyncBuilder()
        this.setSyncConsolidate()
        this.removerActive = false
        mkBtn('fa-user-times', 'remove', 'remove users', () => {
          this.removerActive = !this.removerActive
          const c = this.removerActive ? '#ff0000' : '#ffffff'
          $('#remove-button').css('background-color', c)
        }, '#player-button')
        wand.currentNetwork.getNodeAttribute(wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0], 'pixiElement').emit('pointerdown')
        this.state.desc.bind()
        this.removedNodes = []
        this.removedNodesUrl = ''
        this.resetNetwork()
      }
    }, 10000 * this.settings.timeStreach) // fixme: make better loading
  }

  setNetInfo () {
    this.texts.gradus.text = `name: ${wand.sageInfo.name}`
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
        if (this.removerActive) {
          this.removeMember(a)
        } else if (this.theSeed === n) {
          window.open(a.urlStr + this.removedNodesUrl)
        } else {
          this.theSeed = n
        }
        this.mkSync()
        this.resetSyncMap()
      })
    })
  }

  removeMember (a) {
    // net.forEachNeighbor(a.id, (nn, na) => {
    //   const ea = net.getEdgeAttributes(a.id, nn)
    //   if (ea) ea.pixiElement.destroy()
    //   // const ea2 = net.getEdgeAttributes(nn, a.id)
    //   // if (ea2) ea2.pixiElement.destroy()
    //   a.pixiElement.destroy()
    //   a.textElement.destroy()
    // })
    // if (this.arrows) {
    //   this.arrows.forEach(a => {
    //     a.destroy()
    //   })
    // }
    if (this.removedNodes.length >= 4) {
      window.alert('you (still) do not have permisson to remove more than 4 members')
      return
    }
    const net = wand.currentNetwork
    net.forEachEdge(a.id, (e, a) => {
      a.pixiElement.alpha = 0
    })
    net.dropNode(a.id)
    this.removedNodes.push(a.id)
    a.pixiElement.interactive = false
    a.pixiElement.alpha = 0
    a.textElement.alpha = 0
    this.updateComponent()
    this.updateRemovedNodesUrl()
  }

  updateRemovedNodesUrl () {
    this.removedNodesUrl = '&rmv=' + this.removedNodes.map(i => wand.utils.rot(i)).join(',')
  }

  updateComponent () {
    const g = wand.currentNetwork
    const gg = components.connectedComponents(g)
    let gg_ = []
    for (let i = 0; i < gg.length; i++) {
      if (gg[i].length > gg_.length) {
        gg_ = gg[i]
      }
    }
    const nodesToRemove = []
    g.forEachNode((n, a) => {
      if (!gg_.includes(n)) {
        g.forEachEdge(n, (e, a) => {
          a.pixiElement.alpha = 0
        })
        a.pixiElement.interactive = false
        a.pixiElement.alpha = 0
        a.textElement.alpha = 0
        nodesToRemove.push(n)
      }
    })
    nodesToRemove.forEach(n => g.dropNode(n))
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
        net.setNodeAttribute(n, 'stepColor', c)
      })
    })
    this.setNetInfo()
    this.setNodeInfo()
  }

  mkSync () {
    if (!wand.currentNetwork.hasNode(this.theSeed)) {
      this.theSeed = wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0]
    }
    this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, [this.theSeed])
    this.mkSyncNet()
    this.setSyncInfo()
    if (wand.extra.syncMusic) {
      const { seq2, membSynth } = wand.extra.syncMusic
      setTimeout(() => {
        seq2.dispose()
        membSynth.dispose()
        this.playSync2(this.sync.progressionLinks)
      }, seq2.interval * 1000) // max interval having instrument events (drawing can get past duration)
    } else {
      this.playSync2(this.sync.progressionLinks)
    }
  }

  mkSyncNet () {
    const net = new wand.net.use.build.graphology.DirectedGraph()
    this.sync.progression.forEach(step => {
      step.forEach((node, i) => {
        net.addNode(node)
        net.setNodeAttribute(node, 'step', i + 1)
      })
    })
    this.sync.progressionLinks.forEach(step => {
      step.forEach(link => {
        net.addDirectedEdge(link.from, link.to)
      })
    })
    if (this.snet) {
      this.snet.forEachEdge((e, a, n1, n2) => {
        const net2 = wand.currentNetwork
        if (net2.hasNode(n1) && net2.hasNode(n2)) {
          wand.currentNetwork.getEdgeAttribute(n1, n2, 'pixiElement').alpha = 0
        }
      })
    }
    this.snet = net
    wand.snet = net
    this.drawSyncNet()
  }

  drawSyncNet () {
    // only keep links of the original network which are in the snet
    // const snetu = this.snet.
    if (!this.edgesErased) {
      wand.currentNetwork.forEachEdge((e, a) => {
        a.pixiElement.alpha = 0
      })
      this.edgesErased = true
    }
    this.snet.forEachEdge((e, a, n1, n2) => {
      wand.currentNetwork.getEdgeAttribute(n1, n2, 'pixiElement').alpha = 1
    })
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
        wand.$('#pallete-button').click()
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
    setTimeout(() => {
      seq2.start()
    }, seq2.interval * 1000)
    wand.extra.progression = progression
    wand.extra.instruments = {
      ...wand.extra.instruments,
      membSynth
    }
    wand.extra.patterns = {
      ...wand.extra.patterns,
      seq2
    }
    wand.extra.syncMusic = {
      seq2,
      membSynth
    }
    // const fid = 'voice-' + this.voiceCounter++
    // mkBtn('fa-microphone-alt-slash', fid, 'remove voice', () => {
    //   // console.log('clearing voice:', progression, g, voice, seq, instrument)
    //   wand.$(`#${fid}-icon`).remove()
    //   wand.$(`#${fid}-button`).remove()
    //   seq2.stop()
    //   setTimeout(() => {
    //     seq2.dispose()
    //     membSynth.dispose()
    //   }, seq2.interval * 1000) // max interval having instrument events (drawing can get past duration)
    //   // then restyle nodes in g
    //   // remove names
    // }, '#info-button')
    // if (this.voiceCounter > 1) {
    //   const fid_ = 'voice-' + (this.voiceCounter - 2)
    //   wand.$(`#${fid_}-button`).click()
    // }
    // if (!window.location.href.includes('?advanced')) {
    //   btn.hide()
    //   if (this.voiceCounter > 1) {
    //     const fid_ = 'voice-' + (this.voiceCounter - 2)
    //     wand.$(`#${fid_}-button`).click()
    //   }
    // }
  }

  restyleNode (attr = { }) { // set node style with input attributes
    const s = this.settings.state
    attr = {
      ...{
        scale: this.scaley(s.nodesSize.current),
        nodeTint: attr.a.stepColor || s.colors.currentColors.v,
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
    a.textElement.scale.set(this.settings.state.namesSize.current)
  }

  styleNode (a) { // apply standard styling giving node's attributes { seed, activated }
    const c = this.settings.state.colors.currentColors
    if (a.hovered || a.hoveredNeighbor) {
      const [nodeTint, nameTint] = a.hovered ? [c.hl.more, c.hl.less] : [c.hl.less, c.hl.more]
      window.aa = a
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 2.7,
        nodeTint: a.stepColor || nodeTint,
        nodeAlpha: 1,
        nameTint: nameTint,
        nameAlpha: 1
      })
    } else if (a.seed || a.activated) {
      const [nodeTint, nameTint] = a.seed ? [c.hl.more, c.hl.less] : [c.hl.less, c.hl.more]
      // const talpha = 1 - this.state.sync.current
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 1.5,
        nodeTint: a.stepColor || nodeTint,
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
    sg.communities = louvain.detailed(sg)
    const communitySizes = new Array(sg.communities.count).fill(0)
    for (const key in sg.communities.communities) {
      const index = sg.communities.communities[key]
      sg.setNodeAttribute(key, 'community', index)
      communitySizes[index]++
    }
    sg.communities.sizes = {
      all: communitySizes,
      max: Math.max(...communitySizes),
      min: Math.min(...communitySizes)
    }
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
  }

  //   const norm = v => v === Math.round(v) ? v : v.toFixed(3)
  //   const mString = metric => {
  //     const s = netmetrics.extent(wand.currentNetwork, metric).map(i => norm(i))
  //     return `[${s[0]}, ${s[1]}]`
  //   }
  //   wand.currentNetwork.degreeCentrality = mString('degreeCentrality')
  //   wand.currentNetwork.degree = mString('degree')
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
          // console.log(texts[t], Number(count % tlength === (i + 1)))
          i++
        }
        // console.log(show, count, i, tlength, count % tlength)
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
      // console.log('yey', n, a)
      const tf = v => v.toFixed(3)
      const texts = [
        ['nodeId', `id: ${a.sid || a.nid}`],
        ['nodeName', `name: ${a.name}`],
        ['nodeDegree', `degree: ${a.degree} in ${net.degree_}`],
        ['nodeDegreeCentrality',
          `degree centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`],
        ['step', `step: ${a.step}`]
      ]
      a.pixiElement.on('pointerover', () => {
        // console.log(n, a, 'NODE HOVERED')
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

  setSyncConsolidate () {
    const ustr = wand.utils.rot(wand.sageInfo.sid || wand.sageInfo.nid)
    const ufield = wand.sageInfo.sid ? 'usid' : 'unid'
    wand.currentNetwork.forEachNode((n, a) => {
      const mstr = wand.utils.rot(a.sid || a.nid)
      const mfield = a.sid ? 'msid' : 'mnid'
      a.urlStr = `?page=ankh_&${ufield}=${ustr}&${mfield}=${mstr}`
    })
  }

  increment (attr) {
    this.state[attr].count++
    const { count, min, max, steps, iconId, iconChange, icons } = this.state[attr]
    const ambit = max - min
    const n = count % steps
    const val = min + (n / (steps - 1)) * ambit // at least 2 steps
    console.log('incremented:', max, min, ambit, steps, val)
    this.state[attr].current = val
    this.state[attr].update()
    const e = wand.$(iconId)
    if (iconChange === 'toggle') {
      console.log(n, icons, icons[n], 'IOIOI')
      e.toggleClass(() => icons[n])
      console.log(max, val, 'CLICKED', attr)
    } else if (iconChange === 'toggle-color') {
      console.log(max, val, 'CLICKED', attr)
    } else if (iconId !== undefined) { // if (iconChange == 'color') {
      let color = '#00ff00'
      console.log(max, val, 'CLICKED', attr)
      if (max - val > 0.01) {
        color = '#' + Math.floor(0xffffff - 0xffff * val / max).toString(16)
      }
      e.css('background-color', color)
    }
    return n
  }

  setDesc () {
    const $ = wand.$
    const diag = $('<div/>', {
      id: 'diag1',
      css: {
        display: 'none',
        position: 'fixed',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        'z-index': 1,
        left: 0,
        top: 0,
        padding: '100px'
      }
    }).html('describe the purpose of your syncronization:').appendTo('body')
    const tarea = $('<textarea/>', {
      maxlength: 20,
      css: {
        'background-color': 'white',
        margin: 'auto',
        width: '50%',
        height: '50%'
      }
    }).html('qweasd').appendTo(diag)
    $('<button/>').appendTo(diag).html('close').on('click', () => {
      diag.css('display', 'none')
    })
    $('<button/>').appendTo(diag).html('template change').on('click', () => {
      tarea.val('YAYAYYA')
    })
    this.descDiag = diag
    this.descArea = tarea
  }
}

module.exports = { Tithorea }
