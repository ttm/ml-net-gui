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
  // a coin which its value = total given / 10% of the donation
  constructor (settings = {}) {
    const defaultSettings = {
      currentLevel: 0,
      fontSize: 20,
      timeStreach: 1, // only used for when time has to pass
      counter: {
        networksVisualized: 0,
        nodesVisible: 0,
        nodesSize: 0,
        namesVisible: 0,
        namesSize: 0,
        edgesVisible: 0,
        colorChange: 0,
        hoverNode: 0
      }
    }
    this.settings = { ...defaultSettings, ...settings }
    this.settings.counter = { ...defaultSettings.counter, ...settings.counter }
    this.counter = this.settings.counter

    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth

    this.texts = {} // pixi elements
    this.achievements = [] // list of strings (sentences in natural language)
    // this.setLevels()
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
    const mkElement = (pos, color, element, text = '') => {
      this.texts[element] = t(text, [pos[0] * x, pos[1] * y], fs, color)
    }
    mkElement([1, 0.2], 0x333377, 'gradus')
    mkElement([21, 2.2], 0x666600, 'achievement')
    mkElement([21, 0.2], 0x333377, 'tip')
    mkElement([1, 0.1], 0x333377, 'nodeId')
    mkElement([1, 2.2], 0x777733, 'nodeName')
    mkElement([41, 0.2], 0x666600, 'nodeDegree')
    mkElement([41, 2.2], 0x555599, 'nodeDegreeCentrality')
    mkElement([1, 2.2], 0x777733, 'adParnassum', 'ad parnassum: > 1')
    mkElement([54, 2.2], 0x337777, 'interactionCount')
    mkElement([54, 0.2], 0x773377, 'orderSize')
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
    this.currentCondition = condition.condition
    const tip = condition.tip
    this.texts.tip.text = `tip: ${tip}`

    const feature = this.features[step.feature]
    feature.alg()
    const achievement = feature.achievement

    this.texts.achievement.text = `achieved: ${achievement}`

    const a = this.texts.achievement
    a.tint = a.tint === 0x666600 ? 0x660066 : 0x666600

    const textToSay = [
      `feature ${this.texts.achievement.text}`,
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
      { feature: 'dummy', condition: 'loadToStart' },
      { feature: 'exhibition', condition: 'wait10s' },
      { feature: 'showHideLinks', condition: 'minClickOnNodesEdgesVisible' },
      { feature: 'loadDatata', condition: 'dummy' },
      { feature: 'visualizeNetworks', condition: 'networksVisualized' },
      { feature: 'randomColors', condition: 'colorChanges' },
      { feature: 'interactionCount', condition: 'interactMore' },
      { feature: 'nodeInfo', condition: 'hoverNodes' },
      { feature: 'nodeInfoClick', condition: 'activateAll' },
      { feature: 'games', condition: 'activate3Access2' },
      { feature: 'games2', condition: 'activate2Access9' }
    ]
  }

  mkFeatures () {
    const $ = wand.$
    const self = this
    this.features = {
      exhibition: {
        dummy: {
          achievement: 'loading page',
          alg: () => { // do nothing
          }
        },
        achievement: 'exhibition page loaded',
        alg: () => {
          wand.extra.exhibition = wand.test.testExhibition1('gradus')
          wand.currentNetwork = wand.extra.exhibition.drawnNet.net
          // const f = self.settings.fontSize
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
                const alpha = this.increment01('edgesAlpha', $('#friendship-button'))
                wand.currentNetwork.forEachEdge((e, a) => {
                  a.pixiElement.alpha = alpha
                })
                this.counter.edgesVisible++
              }
            }).attr('atitle', 'show friendships').prependTo('body')
          )
          $('<i/>', { class: 'fa fa-chess', id: 'member-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'member-button',
              click: () => {
                const alpha = this.increment01('nodesAlpha', $('#member-button'))
                wand.currentNetwork.forEachNode((n, a) => {
                  a.pixiElement.alpha = alpha
                })
                this.counter.nodesVisible++
              }
            }).attr('atitle', 'show members').prependTo('body')
          )
        }
      },
      loadDatata: { // special feature, has to wait loading and solves condition:
        achievement: 'loading networks',
        alg: () => {
          wand.transfer.mong.findAllNetworks().then(r => {
            self.allNetworks = r
            self.conditionMet = true
          })
        }
      },
      visualizeNetworks: { // multiple features: network menu and names
        achievement: 'network menu',
        alg: () => {
          const transfer = wand.transfer
          wand.extra.exhibition.remove()
          delete wand.extra.exhibition
          delete wand.currentNetwork

          $('<i/>', { class: 'fa fa-mask', id: 'names-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'names-button',
              click: () => {
                const alpha = this.increment01('namesAlpha', $('#names-button'))
                wand.currentNetwork.forEachNode((n, a) => {
                  a.textElement.alpha = alpha
                })
                this.counter.namesVisible++
              }
            }).attr('atitle', 'show names').prependTo('body')
          )

          this.texts.gradus.on('click', () => {
            let size = this.increment01('namesSize')
            size = this.scaley(this.settings.fontSize) * (0.2 + 1.5 * size)
            wand.currentNetwork.forEachNode((n, a) => {
              a.textElement.style.fontSize = size
            })
            this.counter.namesSize++
          })
          this.texts.gradus.interactive = true
          this.registerAdditionalCondition(
            () => this.counter.namesSize > 10,
            'discovered names size change'
          )

          this.texts.orderSize.on('click', () => {
            const size = this.scaley(0.2 + 2 * this.increment01('nodesSize'))
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.scale.set(size)
            })
            this.counter.nodesSize++
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

          $('<i/>', { class: 'fa fa-archway', id: 'loadnet-icon' }).appendTo(
            $('<button/>', {
              class: 'btn',
              id: 'loadnet-button',
              click: () => {
                this.loadNetwork()
                this.counter.networksVisualized++
              }
            }).attr('atitle', 'load or upload network').prependTo('body')
          )

          const uel = $('#file-input')
          const self = this // fixme: really necessary?
          uel.change(res => {
            const f = uel.files[0]
            f.text().then(t => {
              transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
              self.visualizeNetwork(t)
            })
          })
          $('#loadnet-button').click()
        }
      },
      randomColors: {
        achievement: 'randomize colors',
        alg: () => {
          const pbtn = $('<button class="btn" id="pbtn"><i class="fa fa-palette"></i></button>').prop('title', 'change colors')
          pbtn.insertAfter('#friendship-btn')
          pbtn.on('click', () => {
            const ecolor = 0xffffff * Math.random()
            const ncolor = 0xffffff * Math.random()
            wand.currentNetwork.forEachEdge((e, a) => {
              a.pixiElement.tint = ecolor
            })
            wand.currentNetwork.forEachNode((e, a) => {
              a.pixiElement.tint = ncolor
            })
            wand.artist.share.draw.base.app.renderer.backgroundColor = 0xffffff * Math.random()
            self.counter.colorChange++
          })
        }
      },
      interactionCount: {
        achievement: 'access to interactions counter',
        alg: () => {
          // const f = self.settings.fontSize
          // self.texts.interactionCount = wand.artist.use.mkTextFancy(`interactions: ${f}`, [self.scalex(f) * 29.5, self.scaley(f * 1.1)], self.scaley(f), 0x337777) // fixme: remove
          setInterval(() => {
            let total = 0
            for (const i in self.counter) {
              total += self.counter[i]
            }
            self.texts.interactionCount.text = `interactions: ${total}`
          }, 500)
        }
      },
      nodeInfo: {
        achievement: 'hover node to get some info',
        alg: () => {
          self.setNodeInfo()
          self.nodeInfoActivated = true
        }
      },
      nodeInfoClick: {
        achievement: 'click node to explore in network',
        alg: () => {
          self.setFriendsExporer()
          self.friendsExplorerActivated = true
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
      }
    }
  }

  mkConditions () {
    const self = this
    this.startedAt = performance.now()
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
          if (self.counter.nodesVisible >= 2 && self.counter.edgesVisible >= 2) {
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
            self.counter.networksVisualized >= 3 &&
            self.counter.nodesVisible >= 5 &&
            self.counter.edgesVisible >= 5 &&
            self.counter.namesVisible >= 6
          ) {
            self.conditionMet = true
          }
        }
      },
      colorChanges: {
        tip: 'use some colors',
        condition: () => {
          if (self.counter.colorChange >= 5) {
            self.conditionMet = true
          }
        }
      },
      interactMore: {
        tip: 'click around and explore',
        condition: () => {
          wand.extra.counter = self.counter
          let total = 0
          for (const i in self.counter) {
            total += self.counter[i]
          }
          if (total > 50) {
            self.conditionMet = true
          }
        }
      },
      hoverNodes: {
        tip: 'hover nodes to see info',
        condition: () => {
          if (self.counter.hoverNode > 20) {
            self.conditionMet = true
          }
        }
      },
      activateAll: {
        tip: 'explore one network thorough',
        condition: () => {
          // keep track of total activations
          // and of activated nodes in currentNetwork
          const net = wand.currentNetwork
          const self = this
          if (net.totalActivated + net.totalAccessed >= net.order) {
            console.log('all activated or accessed, gradus achieved')
            self.conditionMet = true
          }
        }
      },
      activate3Access2: {
        tip: 'expore and reach members count: 3/2/XXXX',
        condition: () => {
          const cn = wand.currentNetwork
          if (cn.totalActivated === 3 && cn.totalAccessed === 2) {
            self.conditionMet = true
          }
        }
      },
      activate2Access9: {
        tip: 'expore and reach members count: 2/9/XXXX',
        condition: () => {
          const cn = wand.currentNetwork
          if (cn.totalActivated === 2 && cn.totalAccessed === 9) {
            self.conditionMet = true
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
      a.pixiElement.on('pointerover', () => {
        console.log(n, a, 'NODE HOVERED')
        this.counter.hoverNode++
        wand.rect2.zIndex = 500
        this.texts.nodeId.text = `id: ${a.id}`
        this.texts.nodeName.text = `name: ${a.name}`
        this.texts.nodeDegree.text = `degree: ${a.degree} in ${net.degree}`
        this.texts.nodeDegreeCentrality.text = `degree centrality: ${a.degreeCentrality.toFixed(3)} in ${net.degreeCentrality}`
        this.texts.nodeId.zIndex = 600
        this.texts.nodeName.zIndex = 600
        this.texts.nodeDegree.zIndex = 600
        this.texts.nodeDegreeCentrality.zIndex = 600
        wand.extra.nnn = { n, a }
      })
      a.pixiElement.on('pointerout', () => {
        wand.rect2.zIndex = 100
        this.texts.nodeId.zIndex = 100
        this.texts.nodeName.zIndex = 100
        this.texts.nodeDegree.zIndex = 100
        this.texts.nodeDegreeCentrality.zIndex = 100
      })
    })
  }

  setFriendsExporer () {
    const net = wand.currentNetwork
    const self = this
    net.forEachNode((n, a) => {
      a.pixiElement.on('pointerdown', () => {
        console.log('yeah clicked')
        if (!wand.magic.friendsExplorer) {
          return
        }
        if (net.totalActivated + net.totalAccessed >= net.order) {
          console.log('all activated or accessed')
          net.totalAccessed = 0
          net.totalActivated = 0
          net.forEachNode((n, a) => {
            delete a.accessed
            delete a.activated
            a.pixiElement.scale.set(1)
            a.pixiElement.tint = 0xff0000
            a.textElement.visible = false
          })
        }
        if (a.activated) {
          a.pixiElement.tint = a.lastColor
          a.pixiElement.scale.x = a.lastScale.x
          a.pixiElement.scale.y = a.lastScale.y
          net.forEachNeighbor(n, (neigh, aa) => {
            aa.pixiElement.scale.x = aa.lastScale.x
            aa.pixiElement.scale.y = aa.lastScale.y
            aa.pixiElement.tint = aa.lastColor
            aa.textElement.tint = aa.lastTextColor
            if (!wand.extra.friendsExplorerHoney) {
              delete aa.lastScale
              delete aa.lastColor
              delete aa.lastTextColor
            }
          })
          if (!wand.extra.friendsExplorerHoney) {
            delete a.activated
          }
        } else {
          net.totalActivated += 1
          a.activated = true
          a.pixiElement.scaleBlock = true
          a.textElement.visible = true
          const bg = wand.artist.share.draw.base.app.renderer.backgroundColor
          let color = 0xffffff
          if (bg >= 0xffffff / 2) {
            color = 0x000000
          }
          const meanBg = () => {
            return color * Math.random() + bg * Math.random()
          }
          a.lastColor = a.pixiElement.tint
          a.pixiElement.tint = meanBg()
          a.lastScale = {
            x: a.pixiElement.scale.x,
            y: a.pixiElement.scale.y
          }
          a.pixiElement.scale.set(3)
          net.forEachNeighbor(n, (neigh, aa) => {
            aa.pixiElement.scaleBlock = true
            aa.lastScale = {
              x: aa.pixiElement.scale.x,
              y: aa.pixiElement.scale.y
            }
            aa.lastColor = aa.pixiElement.tint
            aa.lastTextColor = aa.textElement.tint
            aa.pixiElement.scale.set(3)
            aa.pixiElement.tint = 0xffff00
            aa.textElement.visible = true
            if (!aa.accessed) {
              aa.accessed = true
              net.totalAccessed += 1
            }
            setTimeout(() => {
              aa.pixiElement.tint = color
            }, 2000)
            aa.textElement.tint = (color + bg) / 2
            aa.textElement.alpha = 1
          })
        }
        const activated = `${net.totalActivated}/${net.totalAccessed}/`
        this.texts.orderSize.text = `members, friendships: ${activated}${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
      })
    })
    const $ = wand.$
    const m = wand.magic
    if (!self.friendsExplorerActivated) {
      const fbtn = $('<button class="btn"><i class="fa fa-user-alt" id="ifr"></i></button>').prop('title', 'friends explorer')
      fbtn.insertAfter('#pbtn')
      self.fbtn = fbtn
    }
    const fbtn = self.fbtn
    fbtn.off()
    fbtn.on('click', () => {
      console.log('change friendship tool')
      if (m.friendsExplorerHoney) {
        delete m.friendsExplorer
        delete m.friendsExplorerHoney
        console.log('off')
        $('#ifr').removeClass().addClass('fa-users')
        net.totalActivated = 0
        net.totalAccessed = 0
        // $('#nbtn').click()
        net.forEachNode((n, a) => {
          delete a.accessed
          delete a.activated
          a.pixiElement.scale.set(1)
          a.pixiElement.tint = 0xff0000
          a.textElement.visible = true
        })
      } else if (m.friendsExplorer) {
        console.log('on honey')
        m.friendsExplorerHoney = true
        $('#ifr').removeClass('fa-user-cog').addClass('fa-people-arrows')
      } else {
        console.log('on explorer')
        m.friendsExplorer = true
        $('#ifr').removeClass('fa-users').addClass('fa-user-cog')
      }
      const activated = `${net.totalActivated}/${net.totalAccessed}/`
      this.texts.orderSize.text = `members, friendships: ${activated}${net.order}, ${net.size}`
    })
    fbtn.click()
    // net.totalActivated = 0
    // net.totalAccessed = 0
    // m.friendsExplorer = true
    // $('#ifr').removeClass('fa-users-alt')
    // $('#ifr').removeClass('fa-people-arrows')
    // $('#ifr').addClass('fa-user-cog')
  }

  increment01 (attr, je, amount = 0.1) {
    let n = wand.extra[attr]
    if (n === undefined) {
      n = 0.5
    }
    n += amount
    if (n > 1) {
      n = 0
    }
    wand.extra[attr] = n
    if (je !== undefined) {
      let color = '#00ff00'
      if (1 - n > 0.01) {
        color = '#' + Math.floor(0xffffff - 0xffff * n).toString(16)
      }
      je.css('background-color', color)
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
          console.log(c, this.counter.nodesSize)
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

  visualizeNetwork (string) {
    const { conductor, artist, net } = wand
    this.destroyNetwork()
    console.log('net being visualized')
    wand.currentNetwork = net.use.utils.loadJsonString(string)
    const drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
    wand.magic.showMembers = conductor.use.showMembers(drawnNet.net, artist, true)
    // wand.magic.showMembers.sayNames(0.01)
    netmetrics.centrality.degree.assign(wand.currentNetwork)
    netdegree.assign(wand.currentNetwork)
    const mString = metric => {
      const norm = v => v === Math.round(v) ? v : v.toFixed(3)
      const s = netmetrics.extent(wand.currentNetwork, metric).map(i => norm(i))
      return `[${s[0]}, ${s[1]}]`
    }
    wand.currentNetwork.degreeCentrality = mString('degreeCentrality')
    wand.currentNetwork.degree = mString('degree')
    if (this.nodeInfoActivated) {
      this.setNodeInfo()
    }
    if (this.friendsExplorerActivated) {
      this.setFriendsExporer()
      console.log('friends explorer set')
    }
    this.texts.orderSize.text = `members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
  }
}

module.exports = { AdParnassum }
