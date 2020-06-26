/* global wand */

// each gradus has:
//    a feature it enables
//    a condition to complete, which triggers its

class AdParnassum {
  constructor (settings = {}) {
    const defaultSettings = {
      currentLevel: 0,
      relativeSize: 1,
      fontSize: 20
    }
    this.settings = { ...defaultSettings, ...settings }
    this.texts = {} // pixi elements
    this.achievements = [] // list of strings (sentences in natural language)
    // this.setLevels()
    this.setStage()
    this.start(settings.currentLevel)
  }

  start (level) {
    this.mkFeatures()
    this.mkConditions()
    this.startConditionVerifier()
  }

  startConditionVerifier () {
    setTimeout(() => {
      this.currentCondition()
      if (this.conditionMet) {
        this.conditionMet = false
        this.setNextLevel()
      }
    }, 300)
  }

  setNextLevel () {
    this.bumpLevel()
  }

  setGradus () {
    this.gradus = [
      { feature: 'exhibition', condition: 'wait10s' },
      { feature: 'showHideLinks', condition: 'minClickOnNodesEdgesVisible' },
      { feature: 'dummy', condition: 'loadDatata' },
      { feature: 'visualizeNetworks', condition: 'networksVisualized' }
      // { feature: , condition: 'colorChanges' },
    ]
  }

  scale (val) {
    return this.settings.relativeSize * val
  }

  setStage () {
    const f = this.settings.fontSize
    this.texts.adParnassum = wand.artist.use.mkTextFancy('ad parnassum: > 1', [this.scale(f / 2), this.scale(f * 1.5)], this.scale(f), 0xffff00)
    this.setLevel()
  }

  setLevel () {
    const f = this.settings.fontSize
    const p = f / 2
    this.texts.gradus = wand.artist.use.mkTextFancy(`gradus: ${this.settings.currentLevel}`, [this.scale(p), this.scale(p)], this.scale(f))
  }

  bumpLevel () {
    this.currentLevel++
    this.texts.gradus.text = `gradus: ${this.currentLevel}`
  }

  mkFeatures () {
    const $ = wand.$
    this.features = {
      exhibition: () => {
        wand.extra.exibition = wand.test.testExhibition1('gradus')
        wand.currentNetwork = wand.extra.exibition.drawnNet.net
      },
      showHideLinks: () => {
        const ibtn = $('<button class="btn" id="ibtn"><i class="fa fa-bone"></i></button>').prop('title', 'show links')
        const vbtn = $('<button class="btn"><i class="fa fa-chess"></i></button>').prop('title', 'show nodes')
        ibtn.prependTo('body')
        vbtn.prependTo('body')
        ibtn.on('click', () => {
          wand.currentNetwork.forEachEdge((e, a) => {
            a.pixiElement.visible = !a.pixiElement.visible
          })
          wand.extra.counter.edgesVisible++
        })
        vbtn.on('click', () => {
          wand.currentNetwork.forEachNode((n, a) => {
            a.pixiElement.visible = !a.pixiElement.visible
          })
          wand.extra.counter.nodesVisible++
        })
      },
      dummy: () => {
        console.log('dummy condition, probably waiting for some feaature to be loaded')
      },
      visualizeNetworks: () => {
        const artist = wand.artist
        const conductor = wand.conductor
        const net = wand.net
        const transfer = wand.transfer
        const r = wand.allNetworks

        const names = $('<button class="btn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
        const input = $('<button class="btn"><i class="fa fa-archway"></i></button>').prop('title', 'load or upload network')
        const s = $('<select/>')
        names.prependTo('body')
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
            self.currentNetwork = net.use.utils.loadJsonString(t)
            const drawnNet = new conductor.use.DrawnNet(artist.use, wand.currentNetwork, [])
            conductor.use.showMembers(drawnNet.net, artist, true)
          })
        }
        input.on('click', () => {
          if (wand.extra.exibition) {
            delete wand.currentNetwork
            setTimeout(function () {
              wand.extra.exibition.remove()
              delete wand.extra.exibition
            }, 1000)
          }
          if (self.currentNetwork) {
            wand.currentNetwork.forEachNode((n, a) => {
              a.pixiElement.destroy()
              a.textElement.destroy()
            })
            wand.currentNetwork.forEachEdge((n, a) => a.pixiElement.destroy())
            delete wand.currentNetwork
          }
          if (s.val() === 'upload') {
            uel.click()
            return
          }
          window.wand.currentNetwork = net.use.utils.loadJsonString(r[s.val()].text)
          const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
          conductor.use.showMembers(drawnNet.net, artist, true)
          self.counter.networksVisualized++
        })
      }
    }
  }

  mkConditions () {
    const self = this
    this.conditions = {
      wait10s: () => {
        if (!self.timeoutset && !self.conditionMet) {
          setTimeout(() => {
            self.conditionMet = true
          }, 10000 * self.settings.timeStreach)
        }
      },
      minClickOnNodesEdgesVisible: () => {
        if (self.counter.nodesVisible >= 2 && self.counter.edgesVisible >= 2) {
          self.conditionMet = true
        }
      },
      loadDatata: () => {
        wand.transfer.mong.findAllNetworks().then(r => {
          self.allNetworks = r
          self.conditionMet = true
        })
      },
      networksVisualized: () => {
        if (
          self.counter.networksVisualized >= 3 &&
          self.counter.nodesVisible >= 5 &&
          self.counter.edgesVisible >= 5 &&
          self.counter.namesVisible >= 6
        ) {
          self.conditionMet = true
        }
      },
      colorChanges: () => {
        if (self.counter.colorChange >= 5) {
          self.conditionMet = true
        }
      }
    }
  }
}

module.exports = { AdParnassum }
