/* global wand, performance */
const { mkBtn } = require('./gui.js')
const { Tone } = require('../maestro/all.js').base
// const { gradusSyncLinks } = require('./instructions.js')
// const { copyToClipboard } = require('./utils.js')

const d = (f, time) => Tone.Draw.schedule(f, time)

class OABase {
  constructor (settings = {}) {
    wand.syncInfo = wand.syncInfo || {}
    // if (wand.syncInfo.mute) {
    // }
    // if (wand.syncInfo.muteMusic) {
    //   wand.maestro.base.Tone.Master.volume.value = -100
    // }
    const self = this
    const defaultSettings = {
      currentLevel: wand.syncInfo.clevel || 0,
      fontSize: 20,
      timeStreach: wand.syncInfo.ts || 1, // only used for when time has to pass
      counter: {
        networksVisualized: 0,
        hoverNode: 0,
        clickNode: 0
      },
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
          max: 3,
          min: 0.3,
          steps: 10,
          current: 1.3,
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
              a.pixiElement.balpha = this.current
            })
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
          }
        },
        player: {
          count: 2,
          max: 2,
          min: 0,
          steps: 3,
          current: 0,
          iconId: '#player-button',
          update: function () {
            console.log('player update')
            this.currentPlayer = this.playerAlgs[this.algs[this.current]]()
          },
          algs: ['playAll', 'playSync', 'silenceAll'],
          playerAlgs: {
            playAll: function () {
              self.rec.astart()
              const net = wand.currentNetwork
              if (!net.syncProgression) {
                net.getNodeAttribute(wand.syncInfo.msid || wand.syncInfo.mnid || wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0], 'pixiElement').emit('pointerdown')
              }
              net.syncProgression.seq.start()
              net.threeSectors.seq.counter = 0
              net.threeSectors.seq.start()
              // net.threeSectors.seq3.start()
              Tone.Transport.start()
            },
            playSync: function () {
              wand.currentNetwork.threeSectors.seq.stop()
              wand.currentNetwork.threeSectors.seq2.stop()
              wand.currentNetwork.threeSectors.seq3.stop()
            },
            silenceAll: function () {
              if (!window.oaReceivedMsg) {
                self.rec.filename = wand.syncInfo.pageMemberName + ' @ ' + wand.syncInfo.syncMemberName + ' audiovisual music #oa #ourAquarium #oAquario '
              } else {
                const udata = wand.fullNetwork.getAttribute('userData')
                self.rec.filename = `${udata.name} (${udata.sid || udata.nid}), audiovisual and social music #oa #ourAquarium #oAquario `
              }
              self.rec.filename += (new Date()).toISOString().split('.')[0]
              wand.currentNetwork.syncProgression.seq.stop()
              Tone.Transport.stop()
              setTimeout(() => {
                self.resetNetwork()
                self.rec.stop()
                // open dialog to input video URL:
              }, wand.currentNetwork.syncProgression.seq.interval * 1000)
            }
          },
          bindPlayer: function () {
            const $ = wand.$
            self.rec = wand.transfer.rec.rec()
            $('<i/>', { class: 'fa fa-music', id: 'player-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'player-button',
                click: () => {
                  self.increment('player')
                }
              }).attr('atitle', 'change player').insertAfter('#pallete-button')
            )
          }
        },
        info: {
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          update: function () {
            self.setInfoPage(this.current)
            this.rect.alpha = this.current
            this.rect.interactive = Boolean(this.current)
            this.rect.zIndex = 10 + 2000 * this.current
            this.texts.main.alpha = this.current
            this.texts.main.interactive = Boolean(this.current)
            this.texts.main.buttonMode = Boolean(this.current)
            for (const t in this.texts) {
              this.texts[t].alpha = this.current
            }
          },
          iconId: '#info-button',
          bindInfo: function () {
            const $ = wand.$
            $('<i/>', { class: 'fa fa-info', id: 'info-icon' }).appendTo(
              $('<button/>', {
                class: 'btn',
                id: 'info-button',
                click: () => {
                  self.increment('info')
                }
              }).attr('atitle', 'access info pages').insertAfter('#recorder-button')
            )
            const a = wand.artist.use
            this.rect = a.mkRectangle({
              wh: [a.width, a.height], zIndex: 1, color: 0xffaaaa, alpha: 0
            })
            const f = self.settings.fontSize
            const p = f / 2
            const x = self.scalex(p)
            const y = self.scaley(p)
            const fs = self.scaley(f)
            this.texts = []
            const mkElement = (pos, color, element, zIndex, alpha, text) => {
              this.texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
              return this.texts[element]
            }
            mkElement([1, 2.2], 0x777733, 'main', 3000, 0, 'click HERE to get browser extension.').on('click', () => {
              console.log('click and copy')
              const wandUrl = 'https://github.com/ttm/ml-net-gui/raw/master/visual_analytics/wand.zip' // fixme: use wand from preset?
              window.open(wandUrl, '_blank')
            })
            mkElement([1, 5.2], 0x337733, 'extra', 3000, 0, 'read the README to know how to install/use!')
          }
        },
        clickNode: {
          count: 0
        },
        muter: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          muted: false,
          iconId: '#muter-button',
          update: function () {
            // if (this.current) {
            //   wand.maestro.base.Tone.Master.volume.value = -100
            // } else {
            //   wand.maestro.base.Tone.Master.volume.value = 0
            // }
            Tone.Master.mute = this.muted = !this.muted
          },
          bind: function () { // todo: conform other binds with this:
            mkBtn('fa-volume-mute', 'muter', 'mute (only visual music)', () => {
              self.increment('muter')
            }, '#player-button')
          }
        },
        syncMusic: {
          // current val = min + (max - min) * (count % step), in increment(attr)
          count: 0, // interactions count
          max: 1,
          min: 0,
          steps: 2,
          current: 0,
          muted: false,
          iconId: '#sync-button',
          update: function () {
            console.log(this.current)
            self.mkSyncMusic()
            self.resetSyncMap()
            if (this.current) {
              this.mute(false)
              // self.showSync(true)
            } else {
              this.mute(true)
              // self.showSync(false)
            }
          },
          music: { instruments: [] },
          bind: function () { // todo: conform other binds with this:
            mkBtn('fa-sync', 'syncMusic', 'mute (only visual music)', () => {
              self.increment('syncMusic')
            }, '#player-button')
          },
          mute: function (play) {
            this.music.instruments.forEach(i => {
              i.mute = play
            })
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
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
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

    mkElement([1, 2.3], 0x777733, 'adParnassum')
    this.texts.adParnassum.text = 'ad parnassum: > 1'
    this.texts.adParnassum.scale.set(0.8)
    mkElement([1, 0.2], 0x333377, 'gradus')
    mkElement([21, 2.3], 0xff6600, 'achievement')
    mkElement([21, 0.23], 0xff0000, 'tip')
    mkElement([54, 2.2], 0x337777, 'interactionCount')
    mkElement([54, 0.2], 0x773377, 'orderSize')

    mkElement([1, 0.1], 0x333377, 'nodeId', 600, 0)
    mkElement([1, 2.2], 0x777733, 'nodeName', 600, 0)
    mkElement([41, 0.2], 0x666600, 'nodeDegree', 600, 0)
    mkElement([41, 2.2], 0x555599, 'nodeDegreeCentrality', 600, 0)
  }

  start () {
    this.achievements = [] // list of strings (sentences in natural language)
    this.setStage()
    this.mkFeatures()
    this.mkConditions()
    this.setGradus()
    this.startConditionVerifier()
    // const step = this.gradus[this.currentLevel]
    // this.currentCondition = this.conditions[step.condition].condition
    // this.features[step.feature].alg()
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
          $('<i/>', { class: 'fa fa-chess', id: 'member-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'member-button',
              click: () => {
                this.increment('nodesAlpha')
              }
            }).attr('atitle', 'show members').insertAfter('#info-button')
          )
          $('<i/>', { class: 'fa fa-bone', id: 'friendship-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'friendship-button',
              click: () => {
                this.increment('edgesAlpha')
              }
            }).attr('atitle', 'show friendships').insertAfter('#member-button')
          )
          this.state.edgesAlpha.update()
          this.state.nodesAlpha.update()
        }
      },
      visualizeNetworks: { // multiple features: network menu and names
        achievement: 'network menu',
        alg: () => {
          // const transfer = wand.transfer
          wand.extra.exhibition.remove()
          delete wand.extra.exhibition
          delete wand.currentNetwork

          wand.currentNetwork = wand.theNetwork
          // self.visualizeNetworkSync()
          self.resetNetwork()
          $('<i/>', { class: 'fa fa-mask', id: 'names-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'names-button',
              click: () => {
                this.increment('namesAlpha')
              }
            }).attr('atitle', 'show names').insertAfter('#friendship-button')
          )

          this.texts.gradus.on('click', () => {
            this.increment('namesSize')
          })
          this.increment('namesSize')
          this.texts.gradus.interactive = true

          this.texts.orderSize.on('click', () => {
            this.scaley(this.increment('nodesSize'))
          })
          this.texts.orderSize.interactive = true

          const s = $('<select/>', { id: 'file-select' })
            .prop('atitle', 'select network').prependTo('body')
          window.sss = s
          if (!window.oaReceivedMsg) { // load one of the networks
            ['star', '5%', '15%', '30%', '40%', '45%'].forEach((ss, i) => {
              s.append($('<option/>').val(i).html(`${wand.syncInfo.pageMemberName} - ${ss}`))
            })
            // this.allNetworks.forEach((n, i) => {
            //   s.append($('<option/>').val(i).html(n.name))
            // })
            // s.append($('<option/>').val('upload').html('upload'))
          } else { // make network from sage's network
            // const jsonGraph = JSON.parse(this.allNetworks[0].text)
            // wand.graphAttributes = jsonGraph.attributes // fixme: in graphology, it should not get lost (bug)
            wand.graphAttributes = wand.fullNetwork.getAttributes()
            const { name, sid, nid } = wand.graphAttributes.userData
            // const adate = this.allNetworks[0].lastModified ? this.allNetworks[0].lastModified : this.allNetworks[0].date
            // const ls = lastUpdated.toLocaleString()
            const id = sid || nid
            const str = `${name} (${id}) `;
            ['visited', 'full'].forEach((n, i) => {
              console.log(str + n, '<<<<<-----')
              s.append($('<option/>').val(i).html(str + n))
            })
          }
          s.on('change', aa => {
            let delay = 0
            if (this.rec) {
              delay = this.rec.state === 'recording' ? wand.currentNetwork.syncProgression.seq.interval : 0
            }
            setTimeout(() => {
              this.state.player.playerAlgs.playSync()
              if (wand.currentNetwork.syncProgression) {
                this.state.player.playerAlgs.silenceAll()
              }
              this.state.player.count = 2
              this.hideNetwork()
              wand.currentNetwork = this.nets[aa.currentTarget.value]
              // self.visualizeNetwork()
              self.resetNetwork()
              this.counter.networksVisualized++
            }, delay * 1000)
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
              .insertAfter('#names-button')
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
        achievement: 'mouse over information',
        alg: () => {
          this.setNodeInfo()
        }
      },
      nodeInfoClick: {
        achievement: 'musical explorer',
        alg: () => {
          this.bindExplorerMusic()
          this.bindThreeSectorsMusic()
          this.state.player.bindPlayer()
        }
      },
      muteButton: {
        achievement: 'mute button',
        alg: () => {
          this.state.muter.bind()
        }
      },
      videoLink: {
        achievement: 'video URL registration',
        alg: () => {
          this.infoLength = 3
          this.showMsg(3)
        }
      },
      almostSyncLinks: {
        achievement: 'nearing access to synchronization links',
        alg: () => { // dummy
        }
      },
      syncLinks: {
        achievement: 'access to syncronization links',
        alg: () => {
          this.infoLength = 4
          this.showMsg(4)
        }
      },
      almostExtensionInfo: {
        achievement: 'nearing powerful extension',
        alg: () => { // dummy
        }
      },
      extensionInfo: {
        achievement: 'access to extension',
        alg: () => { // dummy
          this.infoLength = 5
          this.showMsg(5)
        }
      },
      syncMusic: {
        achievement: 'mute button',
        alg: () => {
          this.state.syncMusic.bind()
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
          // this.state.player.bindPlayer()
        }
      },
      recorder: {
        achievement: 'video recorder',
        alg: () => {
          this.state.recorder.bindRecorder()
        }
      },
      info: {
        achievement: 'button with info, browser extension',
        alg: () => {
          this.state.info.bindInfo()
          // add button to set zindex of correct rectangle and text
          // if url to extension is visible, set it to interactive,
          // copies the url on click, messages
        }
      }
      // sync: { // todo: check if something useful steams from this:
      //   achievement: 'button to start synchronization',
      //   alg: () => {
      //     this.state.sync.bindSync()
      //   }
      // }
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
        tip: 'load 3 network sizes',
        condition: () => {
          if (
            this.counter.networksVisualized >= 3 &&
            s.nodesAlpha.count >= 5 &&
            s.edgesAlpha.count >= 5 &&
            s.namesAlpha.count >= 6
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
        tip: 'reach 50 interactions',
        condition: () => {
          wand.extra.counter = self.counter
          if (Object.keys(s).reduce((a, i) => a + s[i].count, 0) > 50) {
            self.conditionMet = true
          }
        }
      },
      hoverNodes: {
        tip: 'mouse over many nodes',
        condition: () => {
          if (this.counter.hoverNode > 20) {
            this.conditionMet = true
          }
        }
      },
      playExplorer: {
        tip: 'play music, click on the nodes',
        condition: () => {
          if (wand.state.player.count === 5) {
            this.conditionMet = true
          }
        }
      },
      playWithMute: {
        tip: 'play music with mute',
        condition: () => {
          // if (this.urlConfirmed) {
          const { muter, player } = this.state
          if (muter.current === 1 && player.current !== 2) {
            this.conditionMet = true
          }
        }
      },
      inputUrl: {
        tip: 'insert video URL',
        condition: () => {
          if (this.urlConfirmed) {
            this.conditionMet = true
          }
        }
      },
      interactMore2: {
        tip: 'interact more, click on buttons',
        condition: () => {
          if (!this.ninteractions) {
            this.ninteractions = Object.values(this.state).reduce((a, v) => a + v.count, 0)
          }
          const total = Object.values(this.state).reduce((a, v) => a + v.count, 0)
          if (total > this.ninteractions + 10) {
            delete this.ninteractions
            this.conditionMet = true
          }
        }
      },
      copyInfoPages: {
        tip: 'copy the sync links texts',
        condition: () => {
          if (this.syncLinksCopied) {
            this.conditionMet = true
          }
        }
      },
      recordSyncMusic: {
        tip: 'send link to your 4 less connected neighbors',
        condition: () => {
          if (wand.dialogSyncConfirmed) {
            this.conditionMet = true
          }
        }
      },
      loginWithExtension: {
        tip: 'install extension and login',
        condition: () => {
          if (wand.videoURLsInput) {
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
      someSecondsOnInfoPages: {
        tip: 'read/click the info pages',
        condition: () => {
          if (s.info.count > 7) {
            this.conditionMet = true
          }
        }
      },
      startASync: {
        tip: 'start a synchronization',
        condition: () => {
          if (s.sync.count > 2) {
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

  setGradus () {
    this.gradus = [
      { feature: 'dummy', condition: 'loadToStart' }, // 0
      { feature: 'exhibition', condition: 'wait10s' },
      { feature: 'showHideLinks', condition: 'minClickOnNodesEdgesVisible' },
      { feature: 'visualizeNetworks', condition: 'networksVisualized' },
      { feature: 'randomColors', condition: 'colorChanges' },
      { feature: 'interactionCount', condition: 'interactMore' }, // 5
      { feature: 'nodeInfo', condition: 'hoverNodes' },
      { feature: 'nodeInfoClick', condition: 'playExplorer' }, // put URL upload on info page TTM
      { feature: 'muteButton', condition: 'playWithMute' },
      { feature: 'videoLink', condition: 'inputUrl' },
      // interact some
      { feature: 'almostSyncLinks', condition: 'interactMore2' },
      { feature: 'syncLinks', condition: 'copyInfoPages' }, // copy the text to send. Show instructions
      // interact some
      { feature: 'almostExtensionInfo', condition: 'interactMore2' },
      { feature: 'extensionInfo', condition: 'loginWithExtension' } // gradus reached
      // when logged in with extension, if more than 100 friends scrapped, make Lycoreia available TTM
      //
      // { feature: 'syncMusic', condition: 'recordSyncMusic' }, // discarded
      // { feature: 'player', condition: 'playSome' },
      // { feature: 'games', condition: 'activate3Access2' },
      // { feature: 'games2', condition: 'activate2Access9' },
      // { feature: 'recorder', condition: 'recordSome' },
      // { feature: 'info', condition: 'someSecondsOnInfoPages' },
      // { feature: 'sync', condition: 'startASync' }
    ]
  }

  startConditionVerifier () {
    this.currentLevel = 0 // fixme
    // this.setAdditionalConditions()
    this.setNextLevel()
    const id = setInterval(() => {
      if (this.checkCondition() || this.forward()) {
        console.log('Condition met. Gradus, ad parnassum:', this.currentLevel, this.gradus.length)
        if (!this.setNextLevel()) {
          clearInterval(id)
        }
      } else if (window.oaReceivedMsg) {
        if (this.currentLevel === 13 && !this.cleanInfoLock) {
          wand.$('#info-button').click()
          this.cleanInfoLock = true
        }
      }
    }, 300)
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
    this.texts.gradus.scale.set(1.2)

    const condition = this.conditions[step.condition]
    this.currentCondition = condition.condition // this sets gradus
    this.texts.tip.text = `tip: ${condition.tip}`
    this.texts.tip.scale.set(1.2)

    const feature = this.features[step.feature]
    feature.alg() // this sets gradus
    const a = this.texts.achievement
    a.text = `achieved: ${feature.achievement}`
    // a.tint = a.tint === 0x666600 ? 0x660066 : 0x666600
    this.texts.achievement.scale.set(0.8)

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

  checkCondition () {
    if (!this.conditionMetLock) {
      this.currentCondition()
      if (this.conditionMet) {
        return true
      }
    }
    return false
  }

  forward () {
    // if (this.currentLevel !== 3 && this.currentLevel < this.settings.currentLevel) {
    if (this.currentLevel < this.settings.currentLevel) {
      return true
    }
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

  hideNetwork () {
    wand.currentNetwork.forEachNode((n, a) => {
      // a.pixiElement.alpha = a.textElement.alpha = 0
      a.pixiElement.visible = a.textElement.visible = false
      a.pixiElement.interactive = false
    })
    wand.currentNetwork.forEachEdge((n, a) => {
      a.pixiElement.alpha = 0
      a.interactive = false
    })
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
    this.bindExplorerMusic()
    this.bindThreeSectorsMusic()
    this.texts.orderSize.text = `members, friendships: ${net.order}, ${net.size}`
  }

  setNodeInfo () {
    const net = wand.currentNetwork
    if (net.hasInfo) {
      return
    }
    const tf = v => v.toFixed(3)
    net.forEachNode((n, a) => {
      const texts = [
        ['nodeId', `id: ${a.id}, x: ${tf(a.pixiElement.x)}, y: ${tf(a.pixiElement.y)}`],
        ['nodeName', `name: ${a.name}`],
        ['nodeDegree', `friends: ${a.degree} in ${net.degree_}`],
        ['nodeDegreeCentrality',
          `centrality: ${tf(a.degreeCentrality)} in ${net.degreeCentrality}`]
      ]
      a.pixiElement.on('pointerover', () => {
        console.log(n, a, 'NODE HOVERED')
        this.counter.hoverNode++
        wand.rect2.zIndex = 500
        texts.forEach(t => {
          this.texts[t[0]].text = t[1]
          this.texts[t[0]].alpha = 1
        })
        a.hovered = true
        this.styleNode(a)
        a.textElement.zIndex = 10000
        net.forEachNeighbor(n, (nn, na) => {
          na.hoveredNeighbor = true
          this.styleNode(na)
          na.textElement.zIndex = 1000
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
    net.hasInfo = true
  }

  buildSync (progression) {
    const self = this
    const net = wand.currentNetwork
    const Tone = wand.maestro.base.Tone

    const membSynth = new Tone.MembraneSynth().toMaster()
    membSynth.volume.value = 10

    const lengths = progression.map(i => i.length)
    const maxl = Math.max(...lengths)
    const minl = Math.min(...lengths)
    const ambit = (maxl - minl) || 1
    const seq = new Tone.Pattern((time, nodes) => {
      const nval = 20 + 60 * (nodes.length - minl) / ambit
      membSynth.triggerAttackRelease(nval, 1, time)
      membSynth.triggerAttackRelease(nval, 1, time + Tone.Time('2n.').toSeconds())
      if (nodes.length === 0) {
        self.resetNetwork()
      } else {
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n)
          a.activated = true
          self.styleNode(a)
        }), time)
        d(() => nodes.forEach(n => {
          const a = net.getNodeAttributes(n)
          a.seed = true
          self.styleNode(a)
        }), time + 0.5)
      }
    }, progression)
    seq.interval = '1n'
    wand.extra.progression = progression
    return { membSynth, seq }
  }

  bindExplorerMusic () {
    const net = wand.currentNetwork
    if (net.hasSyncMusic) {
      return
    }
    net.seeds = []
    net.forEachNode((n, a) => {
      a.pixiElement.on('pointerdown', () => {
        console.log('node clicked:', n, a)
        this.state.clickNode.count++
        this.resetNetwork()
        if (!net.seeds.includes(n)) {
          net.seeds.push(n)
        } else {
          const index = net.seeds.indexOf(n)
          if (index !== -1) {
            net.seeds.splice(index, 1)
          }
        }
        if (net.seeds.length === 0) {
          net.seeds = [wand.syncInfo.msid || wand.syncInfo.mnid || wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0]]
        }
        net.seeds.forEach(s => net.setNodeAttribute(s, 'seed', true))
        net.forEachNode((n, a) => { this.styleNode(a) })
        const isOn = net.syncProgression ? net.syncProgression.seq.state : false
        this.disposeSyncMusic()
        const progression = wand.net.use.diffusion.use.seededNeighbors(net, 4, net.seeds)
        net.syncProgression = this.buildSync(progression)
        console.log('STARTED::::', isOn)
        if (isOn === 'started') {
          Tone.Transport.stop()
          wand.currentNetwork.threeSectors.seq.counter = 0
          Tone.Transport.start()
          net.syncProgression.seq.start()
        }
      })
    })
    net.hasSyncMusic = true
  }

  disposeSyncMusic () {
    if (wand.currentNetwork.syncProgression === undefined) {
      return
    }
    const { seq, membSynth } = wand.currentNetwork.syncProgression
    membSynth.volume.value = -200
    setTimeout(() => {
      membSynth.dispose()
    }, seq.interval * 1000)
    seq.dispose()
    delete wand.currentNetwork.syncProgression
  }

  muteSyncMusic () {
    wand.currentNetwork.syncProgression.seq.stop()
  }

  bindThreeSectorsMusic () {
    const net = wand.currentNetwork
    if (net.hasThreeSectorsMusic) {
      return
    }
    const nodesDegrees = []
    net.forEachNode((n, a) => {
      nodesDegrees.push({ n, d: a.degree })
    })
    nodesDegrees.sort((i, j) => i.d - j.d)
    const [nhubs, nintermediary] = [0.05, 0.15].map(i => Math.round(net.order * i))
    const nperipheral = net.order - nhubs - nintermediary
    const periphery = nodesDegrees.splice(0, nperipheral)
    const intermediary = nodesDegrees.splice(0, nintermediary)
    const hubs = nodesDegrees

    const Tone = wand.maestro.base.Tone
    const b = (a, time, hl) => {
      const c = this.state.colors.currentColors
      const h = c.hl
      d(() => { a.pixiElement.tint = h[hl] }, time)
      d(() => { a.pixiElement.tint = c.v }, time + 0.2)
      d(() => {
        a.textElement.tint = h[hl]
        a.textElement.alpha = 1
        a.textElement.zIndex = 2000
      }, time)
      d(() => {
        a.textElement.alpha = 0
        a.textElement.zIndex = 1000
      }, time + 0.2)
    }

    const membSynth = new Tone.Noise('brown').toMaster()
    const metal = new Tone.MetalSynth({
      resonance: 100, octaves: 0.01, harmonicity: 10, frequency: 500, volume: -10
    }).toMaster()
    const plucky2 = new Tone.PluckSynth({ volume: 10 }).toMaster()

    const hdegrees = hubs.map(i => i.d)
    const maxhd = Math.max(...hdegrees)
    const minhd = Math.min(...hdegrees)
    const ambit = (maxhd - minhd) || 1
    const seq = new Tone.Pattern((time, node) => {
      const a = net.getNodeAttributes(node)
      membSynth.playbackRate = 0.1 + (a.degree - minhd) / ambit
      membSynth.volume.value = a.degreeCentrality
      membSynth.start()
      membSynth.stop('+8n')
      b(a, time, 'more')
      seq.counter++
      if (seq.counter % 9 === 0) {
        if (seq2.state === 'started') {
          seq2.stop()
        } else {
          seq2.start()
        }
      }
      if (seq.counter % 18 === 0) {
        if (seq3.state === 'started') {
          seq3.stop()
        } else {
          seq3.start()
        }
      }
    }, hubs.map(i => i.n), 'upDown')
    seq.counter = 0
    seq.interval = '2n'

    const inter = intermediary.map(i => i.n)
    let intercount = 0
    const seq2 = new Tone.Sequence((time, _) => {
      const node = inter[intercount++ % inter.length]
      const a = net.getNodeAttributes(node)
      metal.frequency.value = a.degree
      metal.triggerAttackRelease(0.01, time)
      b(a, time, 'more2')
    }, [null, 1, null, [null, 1]], '4n')

    const seq3 = new Tone.Pattern((time, node) => {
      const a = net.getNodeAttributes(node)
      plucky2.triggerAttackRelease(Tone.Midi(70 + 5 * a.degree).toNote(), 0.01, time)
      b(a, time, 'less2')
    }, periphery.map(i => i.n), 'upDown')
    seq3.interval = '8n'

    net.threeSectors = { seq, seq2, seq3 }
    net.hasThreeSectorsMusic = true
  }

  muteThreeSectorsMusic () {
    const { seq, seq2, seq3 } = wand.currentNetwork.threeSectors
    seq.stop()
    seq2.stop()
    seq3.stop()
  }

  mkSyncMusic () {
    const net = wand.currentNetwork
    // if (net.hasSyncMusic) return
    net.hasSyncMusic = true
    this.seeds = [wand.syncInfo.msid || wand.syncInfo.mnid || wand.utils.chooseUnique(wand.currentNetwork.nodes(), 1)[0]]
    this.sync = wand.net.use.diffusion.use.seededNeighborsLinks(wand.currentNetwork, 4, this.seeds)
    this.mkSyncNet()
    this.playSync2(this.sync.progressionLinks)
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
        wand.currentNetwork.getEdgeAttribute(n1, n2, 'pixiElement').alpha = 0
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
    const fid = 'voice-' + this.voiceCounter++
    const btn = mkBtn('fa-microphone-alt-slash', fid, 'remove voice', () => {
      // console.log('clearing voice:', progression, g, voice, seq, instrument)
      wand.$(`#${fid}-icon`).remove()
      wand.$(`#${fid}-button`).remove()
      seq2.stop()
      setTimeout(() => {
        seq2.dispose()
        membSynth.dispose()
      }, seq2.interval * 1000) // max interval having instrument events (drawing can get past duration)
      // then restyle nodes in g
      // remove names
    }, '#info-button')
    if (!window.location.href.includes('?advanced')) {
      btn.hide()
      if (this.voiceCounter > 1) {
        const fid_ = 'voice-' + (this.voiceCounter - 2)
        wand.$(`#${fid_}-button`).click()
      }
    }
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
}

module.exports = { OABase }
