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
        colorChange: 0
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
      { feature: 'nodeInfo', condition: 'hoverNodes' }
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
    const f = this.settings.fontSize
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

          const names = $('<button class="btn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
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
          const self = this
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
            self.texts.orderSize.text = `members, friendships: ${wand.currentNetwork.order}, ${wand.currentNetwork.size}`
            self.counter.networksVisualized++
          })
          input.click()
        }
      },
      randomColors: {
        achievement: 'randomize colors',
        alg: () => {
          const pbtn = $('<button class="btn"><i class="fa fa-pallete"></i></button>').prop('title', 'change colors')
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
          self.counter.hoverNode = 0
          const a = wand.artist.use
          wand.rect2 = a.mkRectangle({ wh: [a.width, a.height * 0.055], zIndex: 100, color: 0xbbbbbb, alpha: 1 })
          const f = self.settings.fontSize
          const p = f / 2
          self.texts.nodeId = wand.artist.use.mkTextFancy('', [self.scalex(p), self.scaley(p) * 0.1], self.scaley(f), 0x333377, 1)
          self.texts.nodeName = wand.artist.use.mkTextFancy('', [self.scalex(f / 2), self.scaley(f * 1.1)], self.scaley(f), 0x777733, 1)
          self.texts.nodeDegree = wand.artist.use.mkTextFancy('', [self.scalex(p) * 41, self.scaley(p) * 0.2], self.scaley(f), 0x666600, 1)
          self.texts.nodeDegreeCentrality = wand.artist.use.mkTextFancy('', [self.scalex(p) * 41, self.scaley(p) * 2.2], self.scaley(f), 0x555599, 1)
          const net = wand.currentNetwork
          net.forEachNode((n, a) => {
            a.pixiElement.on('pointerover', () => {
              console.log(n, a, 'NODE HOVERED')
              self.counter.hoverNode++
              wand.rect2.zIndex = 500
              self.texts.nodeId.text = `id: ${a.id}`
              self.texts.nodeName.text = `name: ${a.name}`
              self.texts.nodeDegree.text = `degree: ${a.degree} in ${net.degree}`
              self.texts.nodeDegreeCentrality.text = `degree centrality: ${a.degreeCentrality.toFixed(3)} in ${net.degreeCentrality}`
              self.texts.nodeId.zIndex = 600
              self.texts.nodeName.zIndex = 600
              self.texts.nodeDegree.zIndex = 600
              self.texts.nodeDegreeCentrality.zIndex = 600
              wand.extra.nnn = { n, a }
            })
            a.pixiElement.on('pointerout', () => {
              wand.rect2.zIndex = 100
              self.texts.nodeId.zIndex = 100
              self.texts.nodeName.zIndex = 100
              self.texts.nodeDegree.zIndex = 100
              self.texts.nodeDegreeCentrality.zIndex = 100
            })
          })
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
      }
    }
  }
}

module.exports = { AdParnassum }
