/* global wand, performance */

const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')

// each gradus has:
//    a feature it enables
//    a condition to complete, which triggers its

class AdParnassum {
  // each gradus/level has a UI feature
  // and a use condition to pass the gradus.
  // a feature has an "achieved" sentence (string).
  // a condition has a tip to meet the condition (string).
  // the usage is accounted in clicks and time using
  // the interface and gradus achieved.
  // the registered usage is translated into bendas,
  // a coin which its value = total given / 10% of the donation.
  // this class has all gradus ad Parnassum and leads to
  // Tithorea and Lycoreia.
  constructor (settings = {}) {
    const self = this
    const defaultSettings = {
      currentLevel: 0,
      fontSize: 20,
      timeStreach: 1, // only used for when time has to pass
      counter: {
        networksVisualized: 0,
        hoverNode: 0
      },
      state: {
        nodesSize: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 7, // interactions count
          max: 2,
          min: 0.5,
          steps: 10,
          current: 1,
          // current: 7 / 10,
          update: function () {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.scale.set(this.current)
            })
          }
        },
        namesSize: {
          count: 0,
          max: 2,
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
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 10,
          current: 0.9,
          iconId: '#member-button',
          update: function () {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.alpha = this.current
            })
          }
        },
        namesAlpha: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 10,
          current: 0.9,
          iconId: '#names-button',
          update: function (a) {
            wand.currentNetwork.forEachNode((n, a) => {
              wand.extra.showNameBlock = this.count % 2 === 1
              a.textElement.alpha = this.current
            })
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
            console.log('edges alpha', this.current, 'AAAAAAAAAAAAAAAA')
            wand.currentNetwork.forEachEdge((e, a) => {
              a.pixiElement.alpha = this.current
            })
          }
        },
        colors: {
          count: 0,
          min: 0,
          max: Object.keys(wand.magic.tint.handPicked).length - 1,
          steps: Object.keys(wand.magic.tint.handPicked).length,
          palettes: Object.keys(wand.magic.tint.handPicked),
          iconId: '#pallete-button',
          update: function () {
            // this.currentColors = wand.magic.tint.handPicked[this.palettes[this.current]]
            this.currentColors = wand.magic.tint.randomPalette2()
            // this.currentColors = wand.magic.tint.basicStruct(wand.magic.tint.random())
            console.log(this.currentColors, wand.magic.tint.handPicked, this.palettes, this.current, 'TOOOOO')
            const { bg, e } = this.currentColors
            // wand.artist.share.draw.base.app.renderer.backgroundColor = Math.floor(bg)
            wand.artist.share.draw.base.app.renderer.backgroundColor = this.count % 3 === 0 ? 0 : (this.count % 3 === 1 ? 0xffffff : Math.floor(bg))
            wand.currentNetwork.forEachEdge((i, a) => {
              a.pixiElement.tint = e
            })
            wand.currentNetwork.forEachNode((e, a) => {
              self.styleNode(a)
            })
          }
        },
        explorer: {
          count: 0,
          min: 0,
          max: 2,
          steps: 3, // >= it goes to min
          iconId: '#explorer-icon',
          iconChange: 'toggle',
          icons: ['fa-user', 'fa-users', 'fa-universal-access'],
          algs: ['union', 'xor', 'spread'],
          current: 0,
          update: function () {
            if (this.icons.length !== this.algs.length) {
              throw new Error('Mismatch of icons and explorer algorithms')
            }
            this.currentExplorerAlg = this.explorerAlgs[this.algs[this.current]]
          },
          bindExplorer: function () {
            const net = wand.currentNetwork
            net.forEachNode((n, a) => {
              a.pixiElement.on('pointerdown', () => {
                a.seed = !a.seed
                self.styleNode(a)
                this.totalSeeds += a.seed ? 1 : -1
                let activated = 0
                let deactivated = 0
                if (a.seed) { // activate neighs following a pattern:
                  const res = this.currentExplorerAlg(n)
                  activated = res.activated
                  deactivated = res.deactivated
                } else { // deactivate neighs
                  deactivated = 0
                  net.forEachNeighbor(n, (nn, na) => {
                    deactivated += na.activated
                    na.activated = false
                    self.styleNode(na)
                  })
                }
                this.totalActivated += activated - deactivated
                const { totalActivated, totalSeeds } = this
                this.progression.push({ seed: a.seed, activated, deactivated, totalSeeds, totalActivated })
                const activatedStr = `${totalSeeds}/${totalActivated}/`
                self.texts.orderSize.text = `members, friendships: ${activatedStr}${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
                console.log(n, this.progression, this.current, this.algs[this.current], 'Explorer info')
              })
            })
          },
          getMemberSets: () => {
            const seeds = []
            const activated = []
            const both = []
            wand.currentNetwork.forEachNode((n, a) => {
              if (a.seed) {
                seeds.push(n)
              }
              if (a.activated) {
                activated.push(n)
              }
              if (a.seed && a.activated) {
                both.push(n)
              }
            })
            return { seeds, activated, both }
          },
          verify: () => {
            // fixme: assert instead of console.log:
            const { seeds, activated, both } = this.getMemberSets()
            console.log(`total seeds: ${this.explorer.totalSeeds} == ${seeds.length}`)
            console.log(`total activated: ${this.explorer.totalActivated} == ${activated.length}`)
            console.log(`both: ${both.length}`)
          },
          explorerAlgs: {
            union: node => {
              let activated = 0
              wand.currentNetwork.forEachNeighbor(node, (nn, na) => {
                if (!na.activated) {
                  na.activated = true
                  activated++
                  self.styleNode(na)
                }
              })
              return { activated, deactivated: 0 }
            },
            xor: node => {
              let activated = 0
              let deactivated = 0
              wand.currentNetwork.forEachNeighbor(node, (nn, na) => {
                deactivated += Boolean(na.activated)
                na.activated = !na.activated
                activated += na.activated
                self.styleNode(na)
              })
              return { activated, deactivated }
            },
            spread: node => { // dummy for now
              self.resetNetwork()
              return { activated: 0, deactivated: 0 }
            }
          },
          progression: [],
          totalSeeds: 0,
          totalActivated: 0,
          currentExplorerNumber: 0
        },
        player: {
          count: 1,
          max: 1,
          min: 0,
          steps: 2,
          current: 1,
          update: function () {
            console.log('player update')
            // this.currentPlayer = this.playerAlgs[this.algs[this.current]]()
          },
          algs: ['seeded', 'threeSectors'],
          playerAlgs: {
            seeded: function () {
              const seed = wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)
              this.seed = seed
            },
            threeSectors: function () {
              if (this.seqs) {
                this.seqs.seq.stop()
                this.seqs.seq2.stop()
                this.seqs.seq3.stop()
              }
              console.log('three sectors song')
              const net = wand.currentNetwork
              let nodesDegrees = []
              net.forEachNode((n, a) => {
                nodesDegrees.push({ n, d: a.degree })
              })
              nodesDegrees = nodesDegrees.sort((i, j) => i.d - j.d)
              const [nhubs, nintermediary] = [0.05, 0.15].map(i => Math.round(net.order * i))
              const nperipheral = net.order - nhubs - nintermediary
              const periphery = nodesDegrees.splice(0, nperipheral)
              const intermediary = nodesDegrees.splice(0, nintermediary)
              const hubs = nodesDegrees
              const Tone = wand.maestro.base.Tone

              const d = (f, time) => Tone.Draw.schedule(f, time)
              const b = (a, time, hl) => {
                const c = self.state.colors.currentColors
                const h = c.hl
                d(() => { a.pixiElement.tint = h[hl] }, time)
                d(() => { a.pixiElement.tint = c.v }, time + 0.2)
                d(() => {
                  a.textElement.tint = h[hl]
                  a.textElement.alpha = 1
                  a.textElement.zIndex = 2000
                }, time)
                d(() => {
                  // a.textElement.tint = c.n
                  a.textElement.alpha = 0
                  a.textElement.zIndex = 1000
                }, time + 1)
              }

              const membSynth = new Tone.MembraneSynth().toMaster()
              // const plucky = new Tone.PluckSynth({ volume: 10 }).toMaster()
              const metal = new Tone.MetalSynth({ resonance: 100, octaves: 0.01, harmonicity: 10, frequency: 500, volume: 10 }).toMaster()
              const plucky2 = new Tone.PluckSynth({ volume: 10 }).toMaster()

              const seq2 = new Tone.Pattern((time, node) => {
                const a = net.getNodeAttributes(node)
                console.log('bass', time, a.degree, node)
                membSynth.triggerAttackRelease(a.degree, 0.01, time)
                b(a, time, 'more')
              }, hubs.map(i => i.n), 'upDown')
              seq2.interval = '2n'

              const inter = intermediary.map(i => i.n)
              let intercount = 0
              const seq = new Tone.Sequence((time, _) => {
                const node = inter[intercount++ % inter.length]
                const a = net.getNodeAttributes(node)
                console.log('middle', time, a.degree, node)
                metal.frequency.value = 500 + a.degree
                metal.triggerAttackRelease(0.01, time)
                // plucky.triggerAttackRelease(Tone.Midi(a.degree).toNote(), 0.01, time)
                b(a, time, 'more2')
              }, [null, 1, null, [1, 1]], '4n')

              const seq3 = new Tone.Pattern((time, node) => {
                const a = net.getNodeAttributes(node)
                console.log('bass', time, a.degree, node)
                plucky2.triggerAttackRelease(Tone.Midi(70 + 5 * a.degree).toNote(), 0.01, time)
                b(a, time, 'less2')
              }, periphery.map(i => i.n), 'upDown')

              seq3.interval = '8n'
              seq2.interval = '2n'

              seq.start()
              seq2.start()
              seq3.start()

              this.seqs = { seq, seq2, seq3 }

              this.nodesDegrees = nodesDegrees
              return { periphery, intermediary }
            }
          },
          bindPlayer: function () {
            const $ = wand.$
            $('<i/>', { class: 'fa fa-music', id: 'player-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'player-button',
                click: () => {
                  wand.maestro.base.Tone.Transport.toggle()
                }
              }).attr('atitle', 'change player').insertAfter('#explorer-button')
            )
            this.playerAlgs.threeSectors()
          }
        },
        recorder: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          iconId: '#recorder-icon',
          trans: function (color) { wand.$('#recorder-button').css('background-color', color) },
          iconChange: 'toggle-color',
          update: function () {
            if (this.current % 2 === 1) {
              this.rec.astart()
              this.trans('#ff0000')
            } else {
              this.rec.stop()
              this.trans('#ffffff')
            }
          },
          bindRecorder: function () {
            this.rec = wand.transfer.rec.rec()
            const $ = wand.$
            $('<i/>', { class: 'fa fa-compact-disc', id: this.iconId }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'recorder-button',
                click: () => {
                  self.increment('recorder')
                }
              }).attr('atitle', 'start recording').insertAfter('#player-button')
            )
          }
        }
      }
    }

    this.settings = { ...defaultSettings, ...settings }
    this.settings.counter = { ...defaultSettings.counter, ...settings.counter }
    this.settings.state = { ...defaultSettings.state, ...settings.state }
    this.counter = this.settings.counter
    wand.state = this.state = this.settings.state

    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth

    this.texts = {} // pixi elements
    this.achievements = [] // list of strings (sentences in natural language)
    this.setStage()
    this.start()
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }

  start () {
    this.mkFeatures()
    this.mkConditions()
    this.setGradus()
    this.startConditionVerifier()
    // const step = this.gradus[this.currentLevel]
    // this.currentCondition = this.conditions[step.condition].condition
    // this.features[step.feature].alg()
  }

  setStage () {
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

    const t = a.mkTextFancy
    const mkElement = (pos, color, element, zIndex = 300, alpha = 1) => {
      this.texts[element] = t('', [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
    }

    mkElement([1, 2.2], 0x777733, 'adParnassum')
    this.texts.adParnassum.text = 'ad parnassum: > 1'
    mkElement([1, 0.2], 0x333377, 'gradus')
    mkElement([21, 2.2], 0x666600, 'achievement')
    mkElement([21, 0.2], 0x333377, 'tip')
    mkElement([54, 2.2], 0x337777, 'interactionCount')
    mkElement([54, 0.2], 0x773377, 'orderSize')

    mkElement([1, 0.1], 0x333377, 'nodeId', 600, 0)
    mkElement([1, 2.2], 0x777733, 'nodeName', 600, 0)
    mkElement([41, 0.2], 0x666600, 'nodeDegree', 600, 0)
    mkElement([41, 2.2], 0x555599, 'nodeDegreeCentrality', 600, 0)
  }

  startConditionVerifier () {
    this.currentLevel = 0 // fixme
    this.setAdditionalConditions()
    this.setNextLevel()
    const id = setInterval(() => {
      if (this.checkCondition() || this.forward()) {
        console.log('Condition met. Gradus, ad parnassum:', this.currentLevel, this.gradus.length)
        if (!this.setNextLevel()) {
          clearInterval(id)
        }
      }
    }, 300)
  }

  forward () {
    if (this.currentLevel !== 3 && this.currentLevel < this.settings.currentLevel) {
      return true
    }
  }

  checkCondition () {
    if (!this.conditionMetLock) {
      this.currentCondition()
      if (this.conditionMet) {
        return true
      }
    }
    return false
  }

  setNextLevel () {
    console.log('setting next level')
    this.conditionMetLock = true
    this.currentLevel++
    if (this.parnassumReached()) {
      return false
    }

    const step = this.gradus[this.currentLevel]
    this.texts.gradus.text = `gradus: ${this.currentLevel}`

    const condition = this.conditions[step.condition]
    this.currentCondition = condition.condition // this sets gradus
    this.texts.tip.text = `tip: ${condition.tip}`

    const feature = this.features[step.feature]
    feature.alg() // this sets gradus
    const a = this.texts.achievement
    a.text = `achieved: ${feature.achievement}`
    a.tint = a.tint === 0x666600 ? 0x660066 : 0x666600

    const textToSay = [
      `feature ${a.text}`,
      `what to do now? ${this.texts.tip.text}`
    ]
    textToSay.forEach(i => wand.maestro.synths.speaker.play(i, 'en'))
    this.conditionMet = false
    this.conditionMetLock = false
    return true
  }

  parnassumReached () {
    if (this.currentLevel >= this.gradus.length) {
      console.log('(((( ended, no more set new levels )))')
      console.log('parnassum reached, ending gradus loop. Gradus, ad parnassum:', this.currentLevel, this.gradus.length)
      console.log('Get in contact with renato </./> fabbri (O AT O) gmail [UU DOT UU] com to further unlock Gradus ad Parnassum.')
      return true
    }
    return false
  }

  setGradus () {
    this.gradus = [
      { feature: 'dummy', condition: 'loadToStart' }, // 0
      { feature: 'exhibition', condition: 'wait10s' },
      { feature: 'showHideLinks', condition: 'minClickOnNodesEdgesVisible' },
      { feature: 'loadDatata', condition: 'dummy' },
      { feature: 'visualizeNetworks', condition: 'networksVisualized' },
      { feature: 'randomColors', condition: 'colorChanges' }, // 5
      { feature: 'interactionCount', condition: 'interactMore' },
      { feature: 'nodeInfo', condition: 'hoverNodes' },
      { feature: 'nodeInfoClick', condition: 'activateAll' },
      { feature: 'games', condition: 'activate3Access2' },
      { feature: 'games2', condition: 'activate2Access9' }, // 10
      { feature: 'player', condition: 'playSome' },
      { feature: 'recorder', condition: 'recordSome' }
    ]
  }

  mkFeatures () {
    const $ = wand.$
    const self = this
    this.features = {
      dummy: {
        achievement: 'loading page',
        alg: () => { // do nothing
        }
      },
      exhibition: {
        achievement: 'exhibition page loaded',
        alg: () => {
          wand.extra.exhibition = wand.test.testExhibition1('gradus')
          wand.currentNetwork = wand.extra.exhibition.drawnNet.net
          self.texts.orderSize.text = `members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
        }
      },
      showHideLinks: {
        achievement: 'show/hide nodes/links buttons',
        alg: () => {
          $('<i/>', { class: 'fa fa-bone', id: 'friendship-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'friendship-button',
              click: () => {
                this.increment('edgesAlpha')
              }
            }).attr('atitle', 'show friendships').prependTo('body')
          )
          $('<i/>', { class: 'fa fa-chess', id: 'member-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'member-button',
              click: () => {
                this.increment('nodesAlpha')
              }
            }).attr('atitle', 'show members').prependTo('body')
          )
          this.state.edgesAlpha.update()
          this.state.nodesAlpha.update()
        }
      },
      loadDatata: { // special feature, has to wait loading and solves condition:
        achievement: 'loading networks',
        alg: () => {
          wand.transfer.mong.findAllNetworks().then(r => {
            this.allNetworks = r
            this.conditionMet = true
          })
        }
      },
      visualizeNetworks: { // multiple features: network menu and names
        achievement: 'network menu',
        alg: () => {
          // creates network menu, plot, names alpha buttons
          // creates names and nodes size hidden buttons and conditions
          const transfer = wand.transfer
          wand.extra.exhibition.remove()
          delete wand.extra.exhibition
          delete wand.currentNetwork

          $('<i/>', { class: 'fa fa-mask', id: 'names-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'names-button',
              click: () => {
                this.increment('namesAlpha')
              }
            }).attr('atitle', 'show names').prependTo('body')
          )

          this.texts.gradus.on('click', () => {
            this.increment('namesSize')
          })
          this.texts.gradus.interactive = true
          this.registerAdditionalCondition(
            () => this.counter.namesSize > 10,
            'discovered names size change'
          )

          this.texts.orderSize.on('click', () => {
            this.scaley(this.increment('nodesSize'))
          })
          this.texts.orderSize.interactive = true
          this.registerAdditionalCondition(
            () => this.counter.nodesSize > 10,
            'discovered node size change'
          )
          // todo: make similar events for link width

          const s = $('<select/>', { id: 'file-select' })
            .prop('atitle', 'select network').prependTo('body')
          this.allNetworks.forEach((n, i) => {
            s.append($('<option/>').val(i).html(n.name))
          })

          $('<div/>').addClass('loader').prependTo('body')
          const loader = wand.$('.loader')
          loader.hide()
          $('<i/>', { class: 'fa fa-cloud-sun', id: 'loadnet-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'loadnet-button',
              click: () => {
                if (!wand.extra.loadingNetInScreen) {
                  wand.extra.loadingNetInScreen = true
                  const { mix, bw } = { mix: 'grey', bw: 'white' }
                  const c = [mix, bw][this.counter.networksVisualized % 2]
                  // fixme: loader does not show and toggle class is with color change:
                  console.log('before loading, fixme: jquery fails to show loading cues.')
                  wand.$('#loadnet-button').css('background-color', c)
                  loader.show()
                  this.loadNetwork()
                  this.counter.networksVisualized++
                }
              }
            }).attr('atitle', 'load or upload network').prependTo('body')
          )

          const uel = $('#file-input')
          const self = this // fixme: really necessary?
          uel.change(res => {
            const f = uel.files[0]
            f.text().then(t => {
              // fixme: ensure not fetching whole network if already there
              // todo: use zstandard
              transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
              self.visualizeNetwork(t)
            })
          })
          $('#loadnet-button').click()
          $('#names-button').click()
        }
      },
      randomColors: {
        achievement: 'randomize colors',
        alg: () => {
          $('<i/>', { class: 'fa fa-palette', id: 'pallete-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'pallete-button',
              click: () => {
                this.increment('colors')
              }
            }).attr('atitle', 'change colors').css('background-color', 'gray')
              .insertAfter('#friendship-button')
          )
          $('#pallete-button').click()
        }
      },
      interactionCount: {
        achievement: 'access to interactions counter',
        alg: () => {
          setInterval(() => {
            const total = Object.values(this.state).reduce((a, v) => a + v.count, 0)
            // const total = Object.values(this.counter).reduce((a, v) => a + v, 0)
            this.texts.interactionCount.text = `interactions: ${total}`
          }, 500)
        }
      },
      nodeInfo: {
        achievement: 'hover node to get some info',
        alg: () => {
          this.setNodeInfo()
          this.nodeInfoActivated = true
        }
      },
      nodeInfoClick: {
        achievement: 'click node to explore in network',
        alg: () => {
          this.setExplorer()
          this.friendsExplorerActivated = true
        }
      },
      games: {
        achievement: 'puzzle game glance',
        alg: () => {
          console.log('dummy feature')
        }
      },
      games2: {
        achievement: 'another glance on games',
        alg: () => {
          console.log('dummy feature')
        }
      },
      player: {
        achievement: 'network player',
        alg: () => {
          this.state.player.bindPlayer()
        }
      },
      recorder: {
        achievement: 'video recorder',
        alg: () => {
          this.state.recorder.bindRecorder()
        }
      }
    }
  }

  mkConditions () {
    const self = this
    this.startedAt = performance.now()
    const s = this.state
    this.conditions = {
      loadToStart: {
        tip: 'wait to load the interface',
        condition: () => {
          return true
        }
      },
      wait10s: {
        tip: 'wait, observe the network',
        condition: () => {
          if (performance.now() - this.startedAt > 10000 * self.settings.timeStreach) {
            self.conditionMet = true
          }
        }
      },
      minClickOnNodesEdgesVisible: {
        tip: 'click on the new buttons',
        condition: () => {
          if (s.nodesAlpha.count >= 2 && s.edgesAlpha.count >= 2) {
            self.conditionMet = true
          }
        }
      },
      dummy: {
        tip: 'wait to load',
        condition: () => {
          console.log('dummy condition, probably waiting for some feaature to be loaded')
        }
      },
      networksVisualized: {
        tip: 'visualize networks, press buttons',
        condition: () => {
          if (
            this.counter.networksVisualized >= 3 &&
            s.nodesAlpha.count >= 5 &&
            s.edgesVisible.count >= 5 &&
            s.namesVisible.count >= 6
          ) {
            this.conditionMet = true
          }
        }
      },
      colorChanges: {
        tip: 'use some colors',
        condition: () => {
          if (s.colors.count >= 5) {
            this.conditionMet = true
          }
        }
      },
      interactMore: {
        tip: 'click around and explore',
        condition: () => {
          wand.extra.counter = self.counter
          if (Object.keys(s).reduce((a, i) => a + s[i].count, 0) > 50) {
            self.conditionMet = true
          }
        }
      },
      hoverNodes: {
        tip: 'hover nodes to see info',
        condition: () => {
          if (this.counter.hoverNode > 20) {
            this.conditionMet = true
          }
        }
      },
      activateAll: {
        tip: 'explore one network thorough',
        condition: () => {
          // keep track of total activations
          // and of activated nodes in currentNetwork
          const e = s.explorer
          if (e.totalActivated + e.totalAccessed >= wand.currentNetwork.order) {
            console.log('all activated or accessed, gradus achieved')
            this.conditionMet = true
          }
        }
      },
      activate3Access2: {
        tip: 'expore and reach members count: 3/2/XXXX',
        condition: () => {
          const e = s.explorer
          if (e.totalActivated === 3 && e.totalAccessed === 2) {
            this.conditionMet = true
          }
        }
      },
      activate2Access9: {
        tip: 'expore and reach members count: 2/9/XXXX',
        condition: () => {
          const e = s.explorer
          if (e.totalActivated === 2 && e.totalAccessed === 9) {
            this.conditionMet = true
          }
        }
      },
      playSome: {
        tip: 'play some music',
        condition: () => {
          const p = s.player
          if (p.count > 10) {
            this.conditionMet = true
          }
        }
      },
      recordSome: {
        tip: 'record videos, maybe upload e.g. to youtube',
        condition: () => {
          const r = s.recorder
          if (r.count > 10) {
            this.conditionMet = true
          }
        }
      },
      chooseSeed: {
        tip: 'click on node to synchronize full network',
        condition: () => {
          // click on node, activate from there on
          // count if clicked and if finished
          // if finished > x, pass
        }
      },
      synthChanges: {
        tip: 'use new synth button',
        condition: () => {
          // when button clicked, randomize synth params
          // sample audio playing random seed to synchronize
        }
      },
      useSynthInSeeds: {
        tip: 'click on nodes with 2 diferent synths',
        condition: () => {
          // you know
        }
      },
      toogleLoop: {
        tip: 'use new loop button',
        condition: () => {
          // use both random and last seed mode
        }
      },
      chooseMutipleSeeds: {
        tip: 'test new mode for two seeds button',
        condition: () => {
          // use both random and last seeds mode
          // use both with/out loop on
        }
      },
      chooseBeats: {
        tip: 'select beats in different networks',
        condition: () => {
          // choose random beat in at least three networks
          // beats wiggle low-high degree proportional to high-low frequencies
        }
      },
      manipulateSynth: {
        tip: 'use a synth for some consecutive time',
        condition: () => {
        }
      },
      recordVideo: {
        tip: 'record a video with at least 10s',
        condition: () => {
          // maybe cut when > 30s and send
        }
      },
      useLargerNetwork: {
        tip: 'select one of the large',
        condition: () => {
          // account for recording a video with and without a beat
        }
      },
      searchMembers: {
        tip: 'search for names and load nets',
        condition: () => {
        }
      },
      makeSongAboutSomeone: {
        tip: 'select a person in loop, use new sync',
        condition: () => {
          // select any person in any network
        }
      },
      uploadYourNetwork: {
        tip: 'install and run extension',
        condition: () => {
          // execute extension and result in a full network
          // or at least > 100
        }
      },
      makeSongAboutYourNetwork: {
        tip: 'record a song about your network',
        condition: () => {
          // youtube > 10s
        }
      },
      newInstruments: {
        tip: 'use new instruments',
        condition: () => {
          // track new instruments usage
        }
      },
      uploadFullNetwork: { // maybe always call this on load
        tip: 'finish loading your network',
        condition: () => {
          // execute extension and return full in last month
        }
      },
      makeFullNetworkMusic: {
        tip: 'record song > 10s video',
        condition: () => {
          // execute extension and return full in last month
        }
      },
      makeFullNetworkSilence: {
        tip: 'record song > 10s video',
        condition: () => {
          // execute extension and return full in last month
        }
      },
      makeFullNetworkVoices: {
        tip: 'record choir > 10s video',
        condition: () => {
          // record choir in own network
          // new song/audio on mode
        }
      },
      exploreSync: {
        tip: 'use synchronizer in networks',
        condition: () => {
          // select at least two networks and sync options
        }
      },
      recordSync: {
        tip: 'record one full synchronization',
        condition: () => {
          // from loading the network to
          // completing the network
          // or repeating synchronization > 10s
        }
      },
      useMultilevelSync: {
        tip: 'explore multilevel sync',
        condition: () => {
          // some time with it on and off in some networks
        }
      },
      startYourSync: {
        tip: 'set three synchronization candidates',
        condition: () => {
          // new button four states:
          // not setting, set1, set2, set3
        }
      },
      setSync: {
        tip: 'test sync button with different candidates',
        condition: () => {
          // at least once with each candidate
        }
      },
      startSync: {
        tip: 'lock sync and open songs for the synchronization',
        condition: () => {
          // hit the lock sync and generate the synchronization
          // songs and links.
        }
      },
      mutiple1: {
        tip: 'use the interface',
        condition: () => {
          // enable login with the same fb id.
          //    needs click on the extension
          // enable and track taking notes on nodes
          //    imediatelly sends to the server
          //    always loads with network
          //    node gets square or hexagonal
          //    public and related to the id of the user
          // time online: more instruments
          // sync > 50%, a minor sync
          // sync > 10%, scrapping random person
          // videos recorded:
          // clicks: info on the network, nodes, links
        }
      },
      startSecondSync: {
        tip: 'locked for you',
        condition: () => {
          // lock two syncs
        }
      },
      useTwitterStream: {
        tip: 'set hashtag to set Twitter stream',
        condition: () => {
          // set some hashtags and observe networks 10 < N < 1000
        }
      },
      recordTwitterStream: {
        tip: 'record hashtag Twitter stream',
        condition: () => {
          // > 10s
        }
      },
      useInstagramStream: {
        tip: 'set instagram stream',
        condition: () => {
          // set some hashtags and observe networks 10 < N < 1000
        }
      },
      recordInstagramStream: {
        tip: 'record instagram stream',
        condition: () => {
          // > 10s
        }
      }
    }
  }

  setNodeInfo () {
    // fixme: separate in new step and make neat, put modes:
    const net = wand.currentNetwork
    net.forEachNode((n, a) => {
      const tf = v => v.toFixed(3)
      const texts = [
        ['nodeId', `id: ${a.id}, x: ${tf(a.pixiElement.x)}, y: ${tf(a.pixiElement.y)}`],
        ['nodeName', `name: ${a.name}`],
        ['nodeDegree', `degree: ${a.degree} in ${net.degree}`],
        ['nodeDegreeCentrality',
          `degree centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`]
      ]
      a.pixiElement.on('pointerover', () => {
        console.log(n, a, 'NODE HOVERED')
        this.counter.hoverNode++
        wand.rect2.zIndex = 500
        texts.forEach(t => {
          this.texts[t[0]].text = t[1]
          this.texts[t[0]].alpha = 1
        })
        if (a.seed || a.activated) {
          return
        }
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

  setExplorer () {
    console.log('explorer set')
    const $ = wand.$
    $('<i/>', { class: 'fa fa-users', id: 'explorer-icon' }).appendTo(
      $('<button/>', {
        class: 'btn',
        id: 'explorer-button',
        click: () => {
          this.increment('explorer')
        }
      }).attr('atitle', 'change explorer').insertAfter('#pallete-button')
    )
    this.state.explorer.update()
    this.state.explorer.bindExplorer()
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

  registerAdditionalCondition (condition, achievement) {
    this.additionalConditions.push({ condition, achievement, met: false })
  }

  setAdditionalConditions () {
    this.additionalConditions = []
    setInterval(() => {
      for (let i = 0; i < this.additionalConditions.length; i++) {
        const c = this.additionalConditions[i]
        if (!c.met && c.condition()) {
          c.met = true
          wand.maestro.synths.speaker.play('hidden condition met', 'en')
          wand.maestro.synths.speaker.play(c.achievement, 'en')
        }
      }
    }, 1000)
  }

  loadNetwork () {
    console.log('load net loaded')
    const $ = wand.$
    const option = $('#file-select').val()
    if (option === 'upload') { // if upload
      $('#file-input').click()
      return
    }
    this.visualizeNetwork(this.allNetworks[option].text)
  }

  resetNetwork () {
    wand.currentNetwork.forEachNode((_, a) => {
      a.seed = a.activated = false
      this.style(a)
    })
  }

  visualizeNetwork (string) {
    const { conductor, artist, net } = wand
    this.destroyNetwork()
    wand.currentNetwork = net.use.utils.loadJsonString(string)
    wand.extra.drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
    wand.magic.showMembers = conductor.use.showMembers(wand.currentNetwork, artist, true)
    this.state.colors.update()
    wand.currentNetwork.forEachEdge((n, a) => {
      a.pixiElement.alpha = this.state.edgesAlpha.current
    })
    // wand.magic.showMembers.sayNames(0.01)
    netmetrics.centrality.degree.assign(wand.currentNetwork)
    netdegree.assign(wand.currentNetwork)
    const norm = v => v === Math.round(v) ? v : v.toFixed(3)
    const mString = metric => {
      const s = netmetrics.extent(wand.currentNetwork, metric).map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand.currentNetwork.degreeCentrality = mString('degreeCentrality')
    wand.currentNetwork.degree = mString('degree')
    if (this.nodeInfoActivated) {
      this.setNodeInfo()
    }
    if (this.friendsExplorerActivated) {
      this.state.explorer.bindExplorer()
      console.log('friends explorer set')
    }
    this.texts.orderSize.text = `members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
    // fixme: loader does not show and toggle class is with color change:
    wand.$('#loadnet-icon').toggleClass('fa-cloud-sun fa-cloud-sun-rain')
    const loader = wand.$('.loader')
    loader.hide()
    console.log('ended loading. fixme: jquery fails to show loading cues.')
    wand.extra.loadingNetInScreen = false
    this.state.namesSize.update()
    this.state.nodesSize.update()
    this.state.player.playerAlgs.threeSectors()
  }

  destroyNetwork () {
    console.log('net destroyed')
    if (wand.currentNetwork) { // destroy network:
      wand.artist.share.draw.base.app.ticker.remove(wand.magic.showMembers)
      wand.currentNetwork.forEachNode((n, a) => {
        a.pixiElement.destroy()
        if (a.textElement) {
          a.textElement.destroy()
        }
      })
      wand.currentNetwork.forEachEdge((n, a) => a.pixiElement.destroy())
    }
    delete wand.currentNetwork
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
    if (a.seed || a.activated) {
      const [nodeTint, nameTint] = a.seed ? [c.hl.more, c.hl.less] : [c.hl.less, c.hl.more]
      window.aa = a
      this.restyleNode({
        a,
        colorBlocked: true,
        scale: this.settings.state.nodesSize.current * 1.5,
        nodeTint,
        nodeAlpha: 1,
        nameTint,
        nameAlpha: 1
      })
    } else if (a.hovered || a.hoveredNeighbor) {
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
    } else {
      this.restyleNode({ a }) // default non seed or activated attribute
    }
  }
}

module.exports = { AdParnassum }
