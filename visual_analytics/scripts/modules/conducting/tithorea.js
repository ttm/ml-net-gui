/* global wand */
const { mkBtn } = require('./gui.js')
// const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const { guards, tithoreaNew, tithoreaNew2, defaultSyncDescription, defaultSyncDescription2, defaultSyncDescription3, defaultSyncDescription4, defaultSyncDescription5, defaultSyncDescription6, defaultSyncDescription7, defaultSyncDescription8, defaultSyncDescription9, uploadVideoText, uploadVideoPlaceholder, defaultSyncDescription10, defaultSyncDescription11, defaultSyncDescription12, defaultSyncDescription13, defaultSyncDescription14, defaultSyncDescription15 } = require('./instructions.js')
const { Tone } = require('../maestro/all.js').base
const Graph = require('graphology')
const { monload } = require('../utils.js')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

class Tithorea {
  // andromedan and dedicated to synchronization
  constructor (settings = {}) {
    document.title = 'Tithorea, Our Aquarium'
    wand.$('#favicon').attr('href', 'faviconTithorea.ico')
    const $ = wand.$
    const self = this
    const defaultSettings = {
      fontSize: 20,
      state: {
        nodesSize: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 0, // interactions count
          max: 2.5,
          min: 0.5,
          steps: 10,
          current: 0.8,
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
          current: 0.7,
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
            }, '#names-button').click().click().click()
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
              this.rec.astop()
              self.resetNetwork()
              //   Tone.Transport.stop()
            } else if (this.current === this.min) {
              wand.extra.patterns.seq2.interval = (2 ** (10 - this.current)) + 'n'
              this.rec.astart()
              Tone.Transport.start()
            } else {
              Tone.Transport.stop()
              wand.extra.patterns.seq2.stop()
              wand.extra.patterns.seq2.interval = (2 ** (10 - this.current)) + 'n'
              setTimeout(() => {
                wand.extra.patterns.seq2.start()
                Tone.Transport.start()
              }, wand.extra.patterns.seq2.interval * 1200)
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
            this.rec = wand.transfer.rec.rec()
            this.rec.filename = wand.sageInfo.name + ' @ Tithorea audiovisual music #oa #ourAquarium #oAquario ' + (new Date()).toISOString().split('.')[0]
            mkBtn('fa-play', 'player', 'play music', () => {
              self.increment('player')
            }, '#div1')
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
    monload(() => {
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
        wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height])
        wand.drawnNet = this.drawnNet

        this.setStage()
        this.state.nodesAlpha.bind()
        this.state.edgesAlpha.bind()
        this.state.namesAlpha.bind()
        this.state.colors.bind()
        this.state.muter.bind()

        const d = $('<div/>', { id: 'div1' }).insertAfter('#muter-button')
        d.html(' || ').css('display', 'inline').css('margin', '0 1% 0 2%')

        this.state.player.bind()

        this.setSyncBuilder()
        this.setSyncConsolidate()
        this.removerActive = false
        mkBtn('fa-user-times', 'remove', 'remove user', () => {
          this.removerActive = !this.removerActive
          const c = this.removerActive ? '#ff0000' : '#ffffff'
          $('#remove-button').css('background-color', c)
        }, '#player-button')
        wand.currentNetwork.getNodeAttribute(wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0], 'pixiElement').emit('pointerdown')
        this.state.desc.bind()
        this.removedNodes = []
        this.removedNodesUrl = ''
        this.resetNetwork()
        this.setNetInfo()
      }
    })
  }

  setNetInfo () {
    if (this.sync) {
      this.texts.tip.html(`<span style="background-color: lightgreen; padding: 0 2%;">&#x1F449 seed, steps: ${wand.currentNetwork.getNodeAttribute(this.theSeed, 'name')}, ${this.sync.progression.length - 1}</span>`)
      const p = this.sync.progression
      this.texts.orderSize.html(`<button class="tooltip" style="cursor: pointer; font-size: 103%;">steps volume: ${p.slice(1, p.length - 1).map(i => i.length).join(', ')}<span class="tooltiptext" style="font-size:97%;">members size</span></button>`)
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
        if (this.theSeed === n) { // open dialog with copiar URL, abrir URL, cancelar.
          // window.open(a.urlStr + this.removedNodesUrl + this.descUrl())
          // dialog yes, no, cancel
          const res = window.confirm(`You selected ${a.name} as seed. You can go back (do nothing) or create a synchronization with this seed. If you create it, you will open the URL in a new tab and copy the URL to the clipboard.\n\n The URL starts the Gradus ad Parnassum with the music of the person and shows the message in your sync description when it finishes.`)
          if (res) {
            const key = Math.random().toString(36).substring(7)

            // const url = a.urlStr + this.removedNodesUrl + this.descUrl())
            const r = wand.utils.rot
            const alang = wand.$('.goog-te-combo').val() === '' ? '' : `&lang=${wand.$('.goog-te-combo').val()}`
            const url = `${document.location.href.split('?')[0]}?page=ankh_&syncKey=${key}&mnid=${r(a.nid || '')}&msid=${r(a.sid || '')}${alang}`
            this.saveSync(key).then(_ => {
              wand.utils.copyToClipboard(url)
              wand.transfer.mong.findAny({ syncKey: key }).then(res2 => { // fixme: remove
                console.log('SYNC DATA READ BACK:', res2)
                window.open(url)
              })
            })
          }
        } else {
          if (this.removerActive) {
            this.removeMember(a)
            this.theSeed = undefined
          } else {
            this.theSeed = n
          }
          this.mkSync()
          this.resetSyncMap()
        }
      })
    })
  }

  descUrl () {
    return '&desc=' + window.encodeURIComponent(wand.magic.tithorea.descArea.val())
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
      window.alert('you do not have permisson (yet) to remove more than 4 members')
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
    const arrows = []
    if (this.arrows) {
      this.arrows.forEach(a => {
        a.destroy()
      })
    } else {
      setInterval(() => {
        if (this.arrows) {
          this.arrows.forEach(a => {
            a.tint = 0xffffff * Math.random()
          })
        }
      }, 200)
    }
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
      const interval = seq2.interval
      seq2.stop()
      console.log('yes, doing the dispose', seq2.interval)
      setTimeout(() => {
        membSynth.dispose()
        seq2.dispose()
        this.playSync2(this.sync.progressionLinks, interval)
      }, 2000) // max interval having instrument events (drawing can get past duration)
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

  playSync2 (progression, interval) {
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
        // wand.$('#pallete-button').click()
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
    seq2.interval = interval || '1n'
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
    let count = 0
    mkBtn('fa-record-vinyl', 'record', 'record performance', () => {
      let rec
      if (count % 2 === 0) {
        rec = wand.transfer.rec.rec()
        rec.astart()
        wand.$('#record-button').css('background-color', '#ff0000')
      } else {
        rec.astop()
        wand.$('#record-button').css('background-color', '#ffffff')
      }
      count++
    })
  }

  setDialogs () {
    // const f = this.settings.fontSize
    // const p = f / 2
    // const x = this.scalex(p)
    // const y = this.scaley(p)
    // const fs = this.scaley(f)
    const texts = {}
    let tcount = 0
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      // texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      // return texts[element]
      texts[element] = wand.$('<div/>', {
        class: 'infotext',
        id: 'infotext' + tcount++,
        css: {
          width: '50%',
          margin: '3%',
          'background-color': '#DDDDDD',
          padding: '2%'
        }
      }).html(text.replace(/\n/g, '<br />')).appendTo('body').hide()
      return texts[element]
    }
    if (wand.sageInfo) {
      // mkElement([1, 2.2], 0x777733, 'deucalion', 3000, 0, deucalion)
      // mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
      // mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
      mkElement([1, 2.2], 0xffffaa, 'tit1', 3000, 0, tithoreaNew)
      mkElement([1, 2.2], 0xffffaa, 'tit2', 3000, 0, tithoreaNew2)
      let count = 0
      const fun = () => {
        const tlength = Object.keys(texts).length + 1
        const show = (++count % tlength) !== 0
        if (show) {
          wand.$('canvas').hide()
        } else {
          wand.$('canvas').show()
        }
        let i = 0
        for (const t in texts) {
          if (count % tlength === (i + 1)) {
            texts[t].show()
          } else {
            texts[t].hide()
          }
          i++
        }
        // console.log(show, count, i, tlength, count % tlength)
      }
      mkBtn('fa-info', 'info', 'infos / dialogs', fun).click()
    } else {
      console.log('not sage info')
      wand.$('canvas').hide()
      mkElement([1, 2.2], 0x777733, 'guards', 3000, 0, guards.replace(/Lycoreia/g, 'Tithorea')).show()
    }
  }

  setStage () {
    this.texts = {} // pixi elements
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
        'grid-template-columns': 'auto auto auto',
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
      const idiv = zIndex === 300 ? '#infodiv' : '#infodiv2'
      this.texts[element] = wand.$('<div/>', {
        class: 'grid-item'
      }).appendTo(idiv)
      return this.texts[element]
    }

    const t1 = mkElement([1, 0.2], 0x333377, 'gradus')
    this.texts.gradus.html(`<button class="tooltip" style="cursor: pointer; font-size: 103%;">name: ${wand.sageInfo.name}<span class="tooltiptext" style="font-size:97%;">names size</span></button>`)
    t1.on('pointerdown', () => {
      this.increment('namesSize')
    })
    this.increment('namesSize')
    mkElement([21, 0.2], 0x333377, 'tip')
    const t2 = mkElement([54, 0.2], 0x773377, 'orderSize')
    mkElement([1, 2.2], 0x777733, 'adParnassum')
    this.texts.adParnassum.html('<span class="tooltip" style="cursor: pointer; font-size: 103%;background-color: yellow; padding: 0 2%;">at Tithorea for synchronization<span class="tooltiptext" style="font-size:97%;" onclick="">register video URL</span></span>').on('pointerdown', () => {
      modal.css('display', 'block')
    })
    this.videoSource = 'tithorea'
    const modal = wand.$('<div/>', { id: 'myModal', class: 'modal' }).appendTo('body')
    wand.$('<div/>', { class: 'modal-content' }).appendTo(
      modal
    ).html(`
    <label for="fname">${uploadVideoText}</label><br>
    <input type="text" id="vUrl" placeholder="${uploadVideoPlaceholder}" style="width:70%"><br><br>
    <button id="vSub" onclick="wand.magic.tithorea.writeVideoUrl()">Submit</button>
    <button onclick="wand.$('#myModal').css('display', 'none')">Cancel</button>
    `)
    wand.$('#vUrl').on('keyup', function (event) {
      if (event.keyCode === 13) {
        event.preventDefault()
        document.getElementById('vSub').click()
      }
    })

    mkElement([21, 2.2], 0x666600, 'achievement')
    this.texts.achievement.text(`friends, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`)
    t2.on('pointerdown', () => {
      this.increment('nodesSize')
    })
    this.increment('nodesSize')
    mkElement([54, 2.2], 0x337777, 'interactionCount') // todo: .text = 'yeah' // videos + syncs

    mkElement([1, 2.2], 0x777733, 'nodeName', 600, 0)
    mkElement([21, 0.2], 0x666600, 'nodeDegree', 600, 0)
    mkElement([54, 2.2], 0x555599, 'step', 600, 0)
    mkElement([1, 0.1], 0x333377, 'nodeId', 600, 0)
    mkElement([21, 2.2], 0x555599, 'nodeDegreeCentrality', 600, 0)
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
        ['nodeDegree', `friends: ${a.degree} in ${net.degree_}`],
        ['nodeDegreeCentrality',
          `centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`],
        ['step', `step: ${a.step}`]
      ]
      a.pixiElement.on('pointerover', () => {
        // console.log(n, a, 'NODE HOVERED')
        texts.forEach(t => {
          this.texts[t[0]].text(t[1])
          // this.texts[t[0]].alpha = 1
        })
        // if (a.seed || a.activated) {
        //   return
        // }
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
        padding: '100px',
        'background-color': 'rgba(200, 200, 100, 0.3)'
      }
    }).html('describe the purpose of your syncronization:').appendTo('body')

    const diag2 = $('<div/>', {
      id: 'diag2',
      css: {
        'background-color': 'white'
      }
    }).appendTo(diag)

    $('<button/>').html('close').on('click', () => {
      diag.css('display', 'none')
    }).appendTo(diag2)

    const templates = [
      defaultSyncDescription(),
      defaultSyncDescription2(),
      defaultSyncDescription3(),
      defaultSyncDescription4(),
      defaultSyncDescription5(),
      defaultSyncDescription6(),
      defaultSyncDescription7(),
      defaultSyncDescription8(),
      defaultSyncDescription9(),
      defaultSyncDescription10(),
      defaultSyncDescription11(),
      defaultSyncDescription12(),
      defaultSyncDescription13(),
      defaultSyncDescription14(),
      defaultSyncDescription15()
    ]
    let counter = 0
    $('<button/>').html('template change').on('click', () => {
      tarea.val(templates[++counter % templates.length])
    }).appendTo(diag2)

    const tarea = $('<textarea/>', {
      maxlength: 1200,
      css: {
        'background-color': 'white',
        margin: 'auto',
        width: '50%',
        height: '50%'
      }
    }).on('keydown', () => {
      dcount.html(tarea.val().length + ' / 500')
    }).html(templates[0]).appendTo(diag2)

    const dcount = $('<div/>', { id: 'diagCount' }).appendTo(diag)

    this.descDiag = diag2
    this.descDiag = diag
    this.descArea = tarea
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

  saveSync (key) {
    // write to mongoDB
    const data = {
      sageInfo: wand.sageInfo, // of the user using the page, the owner of the network
      sync: this.sync, // all of it?
      desc: wand.magic.tithorea.descArea.val(),
      removedNodes: this.removedNodes,
      syncKey: key,
      lang: wand.$('.goog-te-combo').val()
    }
    console.log('SYNC DATA TO BE WRITTEN:', data)
    return wand.transfer.mong.writeAny(data)
  }
}

module.exports = { Tithorea }
