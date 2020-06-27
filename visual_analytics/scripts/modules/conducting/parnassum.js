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
        nodesVisible: 0,
        networksVisualized: 0,
        edgesVisible: 0,
        namesVisible: 0,
        colorChange: 0,
        hoverNode: 0
      }
    }
    this.settings = { ...defaultSettings, ...settings }
    this.settings.counter = { ...defaultSettings.counter, ...settings.counter }
    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth
    this.texts = {} // pixi elements
    this.achievements = [] // list of strings (sentences in natural language)
    // this.setLevels()
    this.setStage()
    wand.nm = netmetrics
    wand.nm2 = netdegree
    this.start(0)
  }

  start (level) {
    this.mkFeatures()
    this.mkConditions()
    this.setGradus()
    const step = this.gradus[level]
    this.currentCondition = this.conditions[step.condition].condition
    this.features[step.feature].alg()
    this.currentLevel = level
    this.counter = this.settings.counter
    this.startConditionVerifier()
  }

  startConditionVerifier () {
    this.setLevel()
    const forward = () => {
      if (this.currentLevel !== 2 && this.currentLevel < this.settings.currentLevel) {
        return true
      }
    }
    setInterval(() => {
      if (this.currentLevel < this.gradus.length) {
        this.currentCondition()
        if ((this.conditionMet && !this.conditionMetLock) || forward()) {
          console.log('verified, gradus, ad parnassum:', this.currentLevel, this.gradus.length)
          console.log('condition met')
          this.setNextLevel()
        }
      } else {
        console.log('parnassum reached')
      }
    }, 300)
  }

  setNextLevel () {
    this.conditionMetLock = true
    console.log('set next level')
    this.bumpLevel()
    if (this.currentLevel >= this.gradus.length) {
      console.log('ended, no more set new levels')
      this.conditionMetLock = true
      return
    }
    const step = this.gradus[this.currentLevel]
    this.currentCondition = this.conditions[step.condition].condition
    this.features[step.feature].alg()
    this.conditionMet = false
    this.conditionMetLock = false
  }

  setGradus () {
    this.gradus = [
      { feature: 'exhibition', condition: 'wait10s' },
      { feature: 'showHideLinks', condition: 'minClickOnNodesEdgesVisible' },
      { feature: 'loadDatata', condition: 'dummy' },
      { feature: 'visualizeNetworks', condition: 'networksVisualized' },
      { feature: 'randomColors', condition: 'colorChanges' },

      { feature: 'interactionCount', condition: 'interactMore' },
      { feature: 'nodeInfo', condition: 'hoverNodes' },
      { feature: 'nodeInfoClick', condition: 'activateAll' }
    ]
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }

  setStage () {
    const a = wand.artist.use
    wand.rect1 = a.mkRectangle({ wh: [a.width, a.height * 0.055], zIndex: 200, color: 0xffffff, alpha: 0.85 })
    wand.rect2 = a.mkRectangle({ wh: [a.width, a.height * 0.055], zIndex: 100, color: 0xbbbbbb, alpha: 1 })
    const f = this.settings.fontSize
    const p = f / 2
    this.texts.nodeId = wand.artist.use.mkTextFancy('', [this.scalex(p), this.scaley(p) * 0.1], this.scaley(f), 0x333377, 1)
    this.texts.nodeName = wand.artist.use.mkTextFancy('', [this.scalex(f / 2), this.scaley(f * 1.1)], this.scaley(f), 0x777733, 1)
    this.texts.nodeDegree = wand.artist.use.mkTextFancy('', [this.scalex(p) * 41, this.scaley(p) * 0.2], this.scaley(f), 0x666600, 1)
    this.texts.nodeDegreeCentrality = wand.artist.use.mkTextFancy('', [this.scalex(p) * 41, this.scaley(p) * 2.2], this.scaley(f), 0x555599, 1)
    this.texts.adParnassum = wand.artist.use.mkTextFancy('ad parnassum: > 1', [this.scalex(f / 2), this.scaley(f * 1.1)], this.scaley(f), 0x777733)
  }

  setLevel () {
    const f = this.settings.fontSize
    const p = f / 2
    this.texts.gradus = wand.artist.use.mkTextFancy(`gradus: ${this.settings.currentLevel}`, [this.scalex(p), this.scaley(p) * 0.1], this.scaley(f), 0x333377)

    const { feature, condition } = this.gradus[this.currentLevel]
    this.texts.achievement = wand.artist.use.mkTextFancy(`achieved: ${feature.achievement}`, [this.scalex(p) * 21, this.scaley(p) * 0.2], this.scaley(f), 0x666600)
    this.texts.tip = wand.artist.use.mkTextFancy(`tip: ${condition.tip}`, [this.scalex(p) * 21, this.scaley(p) * 2.2], this.scaley(f), 0x555599)
  }

  bumpLevel () {
    this.currentLevel++
    if (this.currentLevel >= this.gradus.length) {
      console.log('ended, no more bumping levels')
      this.conditionMetLock = true
      return
    }
    const step = this.gradus[this.currentLevel]
    const achievement = this.features[step.feature].achievement
    const tip = this.conditions[step.condition].tip
    this.texts.gradus.text = `gradus: ${this.currentLevel}`
    this.texts.achievement.text = `achieved: ${achievement}`
    const t = this.texts.achievement.tint
    this.texts.achievement.tint = t === 0x666600 ? 0x660066 : 0x666600
    this.texts.tip.text = `tip: ${tip}`
    wand.maestro.synths.speaker.play(`new feature achieved: ${achievement}`, 'en')
    wand.maestro.synths.speaker.play(`suggestion on what to do now: ${tip}`, 'en')
  }

  mkFeatures () {
    const $ = wand.$
    const self = this
    this.features = {
      exhibition: {
        achievement: 'exhibition page loaded',
        alg: () => {
          wand.extra.exibition = wand.test.testExhibition1('gradus')
          wand.currentNetwork = wand.extra.exibition.drawnNet.net
          const f = self.settings.fontSize
          self.texts.orderSize = wand.artist.use.mkTextFancy(`members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`, [self.scalex(f) * 29.5, self.scaley(f * 0.1)], self.scaley(f), 0x773377)
        }
      },
      showHideLinks: {
        achievement: 'show/hide nodes/links buttons',
        alg: () => {
          const ibtn = $('<button class="btn" id="ibtn"><i class="fa fa-bone"></i></button>').prop('title', 'show links')
          const vbtn = $('<button class="btn"><i class="fa fa-chess"></i></button>').prop('title', 'show nodes')
          ibtn.prependTo('body')
          vbtn.prependTo('body')
          ibtn.on('click', () => {
            wand.currentNetwork.forEachEdge((e, a) => {
              a.pixiElement.visible = !a.pixiElement.visible
            })
            this.counter.edgesVisible++
          })
          vbtn.on('click', () => {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.visible = !a.pixiElement.visible
            })
            this.counter.nodesVisible++
          })
        }
      },
      loadDatata: {
        achievement: 'loading networks',
        alg: () => {
          wand.transfer.mong.findAllNetworks().then(r => {
            self.allNetworks = r
            self.conditionMet = true
          })
        }
      },
      visualizeNetworks: {
        achievement: 'network menu',
        alg: () => {
          const artist = wand.artist
          const conductor = wand.conductor
          const net = wand.net
          const transfer = wand.transfer

          const names = $('<button class="btn" id="nbtn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
          const input = $('<button class="btn"><i class="fa fa-archway"></i></button>').prop('title', 'load or upload network')
          const s = $('<select/>').prop('title', 'select network')
          names.prependTo('body')
          names.on('click', () => {
            wand.currentNetwork.forEachNode((n, a) => {
              a.textElement.visible = !a.textElement.visible
            })
            this.counter.namesVisible++
          })
          input.prependTo('body')
          s.prependTo('body')
          this.allNetworks.forEach((n, i) => {
            s.append($('<option/>').val(i).html(n.name))
          })
          const uel = document.getElementById('file-input')
          uel.onchange = res => {
            const f = uel.files[0]
            f.text().then(t => {
              transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
              wand.currentNetwork = net.use.utils.loadJsonString(t)
              const drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [])
              conductor.use.showMembers(drawnNet.net, artist, true)
            })
          }
          input.on('click', () => {
            if (wand.extra.exibition) {
              delete wand.currentNetwork
              wand.extra.exibition.remove()
              delete wand.extra.exibition
            }
            if (wand.currentNetwork) {
              wand.artist.share.draw.base.app.ticker.remove(wand.magic.showMembers)
              wand.currentNetwork.forEachNode((n, a) => {
                a.pixiElement.destroy()
                a.textElement.destroy()
              })
              wand.currentNetwork.forEachEdge((n, a) => a.pixiElement.destroy())
            }
            if (s.val() === 'upload') {
              uel.click()
              return
            }
            wand.currentNetwork = net.use.utils.loadJsonString(this.allNetworks[s.val()].text)
            const drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [artist.use.width, artist.use.height * 0.9])
            netmetrics.centrality.degree.assign(wand.currentNetwork)
            netdegree.assign(wand.currentNetwork)
            const mString = metric => {
              const norm = v => {
                const i = Math.round(v)
                if (v === i) {
                  return i
                } else {
                  return v.toFixed(3)
                }
              }
              const s = netmetrics.extent(wand.currentNetwork, metric)
              return `[${norm(s[0])}, ${norm(s[1])}]`
            }
            wand.currentNetwork.degreeCentrality = mString('degreeCentrality')
            wand.currentNetwork.degree = mString('degree')
            wand.magic.showMembers = conductor.use.showMembers(drawnNet.net, artist, true)
            // wand.magic.showMembers.sayNames(0.01)
            if (this.nodeInfoActivated) {
              this.setNodeInfo()
            }
            if (this.friendsExplorerActivated) {
              this.setFriendsExporer()
            }
            this.texts.orderSize.text = `members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
            this.counter.networksVisualized++
          })
          input.click()
        }
      },
      randomColors: {
        achievement: 'randomize colors',
        alg: () => {
          const pbtn = $('<button class="btn" id="pbtn"><i class="fa fa-palette"></i></button>').prop('title', 'change colors')
          pbtn.insertAfter('#ibtn')
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
          const f = self.settings.fontSize
          self.texts.interactionCount = wand.artist.use.mkTextFancy(`interactions: ${f}`, [self.scalex(f) * 29.5, self.scaley(f * 1.1)], self.scaley(f), 0x337777)
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
      }
    }
  }

  mkConditions () {
    const self = this
    this.startedAt = performance.now()
    this.conditions = {
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
        tip: 'expore e reach members count: 3/2/XXXX',
        condition: () => {
          const cn = wand.currentNetwork
          if (cn.totalActivated === 3 && cn.totalAccessed === 2) {
            self.conditionMet = true
          }
        }
      },
      activate2Access9: {
        tip: 'expore e reach members count: 2/9/XXXX',
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
        const cn = wand.currentNetwork
        const activated = `${cn.totalActivated}/${cn.totalAccessed}/`
        this.texts.orderSize.text = `members, friendships: ${activated}${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
      })
    })
    if (!self.friendsExplorerActivated) {
      const $ = wand.$
      const fbtn = $('<button class="btn"><i class="fa fa-user-alt" id="ifr"></i></button>').prop('title', 'friends explorer')
      fbtn.insertAfter('#pbtn')
      self.fbtn = fbtn
      fbtn.on('click', () => {
        const m = wand.magic
        console.log('change friendship tool')
        if (m.friendsExplorerHoney) {
          delete m.friendsExplorer
          delete m.friendsExplorerHoney
          console.log('off')
          $('#ifr').removeClass('fa-people-arrows').addClass('fa-users')
          net.forEachNode((n, a) => {
            delete a.accessed
            delete a.activated
            a.pixiElement.scale.set(1)
            a.pixiElement.tint = 0xff0000
            a.textElement.visible = true
          })
          this.texts.orderSize.text = `members, friendships: 0/0/${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
          return
        }
        if (m.friendsExplorer) {
          m.friendsExplorerHoney = true
          console.log('on honey')
          $('#ifr').removeClass('fa-user-cog').addClass('fa-people-arrows')
          return
        }
        console.log('on explorer')
        $('#ifr').removeClass('fa-users-alt').addClass('fa-user-cog')
        net.totalActivated = 0
        net.totalAccessed = 0
        m.friendsExplorer = true
        $('#nbtn').click()
        const cn = wand.currentNetwork
        const activated = `${cn.totalActivated}/${cn.totalAccessed}/`
        this.texts.orderSize.text = `members, friendships: ${activated}${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
      })
      return fbtn
    }
  }
}

module.exports = { AdParnassum }
