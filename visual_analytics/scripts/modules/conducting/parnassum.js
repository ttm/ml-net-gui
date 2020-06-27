/* global wand, performance */

// each gradus has:
//    a feature it enables
//    a condition to complete, which triggers its

class AdParnassum {
  // each gradus/level has a UI feature
  // and a use condition to pass the gradus.
  // a feature has an "achieved" sentence (a string).
  // a condition has a string tip to meet the condition.
  // the usage is accounted in clicks and time using
  // the interface and gradus achieved.
  // the registered usage is translated into bendas,
  // a coin which its value = total given / 10% of the donation
  constructor (settings = {}) {
    const defaultSettings = {
      currentLevel: 0,
      relativeSize: 1,
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
    console.log(wand.artist.use.height, 'HEIGHT')
    if (!settings.relativeSize) {
      const refHeight = 833
      const prop = wand.artist.use.height / refHeight
      this.settings.heightProportion = prop
    }
    this.texts = {} // pixi elements
    this.achievements = [] // list of strings (sentences in natural language)
    // this.setLevels()
    this.setStage()
    this.start(settings.currentLevel)
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
    setInterval(() => {
      if (this.currentLevel < this.gradus.length) {
        this.currentCondition()
        if (this.conditionMet && !this.conditionMetLock) {
          console.log('verified', this.currentLevel, this.gradus.length)
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
      { feature: 'randomColors', condition: 'colorChanges' }
    ]
  }

  scale (val) {
    return this.settings.relativeSize * val
  }

  setStage () {
    const a = wand.artist.use
    wand.rect1 = a.mkRectangle({ wh: [a.width, a.height * 0.05], zIndex: 200, color: 0xffffff, alpha: 0.85 })
    const f = this.settings.fontSize
    this.texts.adParnassum = wand.artist.use.mkTextFancy('ad parnassum: > 1', [this.scale(f / 2), this.scale(f * 1.1)], this.scale(f), 0x777733)
  }

  setLevel () {
    const f = this.settings.fontSize
    const p = f / 2
    this.texts.gradus = wand.artist.use.mkTextFancy(`gradus: ${this.settings.currentLevel}`, [this.scale(p), this.scale(p) * 0.1], this.scale(f), 0x333377)

    const { feature, condition } = this.gradus[this.currentLevel]
    this.texts.achievement = wand.artist.use.mkTextFancy(`achieved: ${feature.achievement}`, [this.scale(p) * 25, p * 0.2], this.scale(f), 0x666600)
    this.texts.tip = wand.artist.use.mkTextFancy(`tip: ${condition.tip}`, [this.scale(p) * 25, p * 2.2], this.scale(f), 0x555599)
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
    this.texts.tip.text = `tip: ${tip}`
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
          const s = $('<select/>')
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
              console.log(wand.artist.share.draw.base.app.ticker.remove, wand.magic.showMembers, 'HEREEE')
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
            // const ShowMembers = conductor.use.showMembers
            wand.magic.showMembers = conductor.use.showMembers(drawnNet.net, artist, true)
            // wand.magic.showMembers.sayNames(0.01)
            self.counter.networksVisualized++
          })
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
      }
    }
  }
}

module.exports = { AdParnassum }
