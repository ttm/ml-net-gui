/* global wand */

// each gradus has:
//    a feature it enables
//    a condition to complete, which triggers its

function Gradus (timeStreach = 1) {
  const $ = wand.$
  const s = (v) => {
    return v * this.relativeSize
  }
  const setStage = () => {
    this.athing = 'yes'
    this.currentLevel = 0
    this.relativeSize = 1
    this.fontSize = 20
    wand.artist.use.mkTextFancy('ad parnassum: > 1', [s(this.fontSize / 2), s(this.fontSize * 1.5)], s(this.fontSize), 0xffff00)
    this.setLevel()
  }
  this.setLevel = () => {
    console.log('level:', this.currentLevel)
    const p = this.fontSize / 2
    this.gradusText = wand.artist.use.mkTextFancy(`gradus: ${this.currentLevel}`, [s(p), s(p)], s(this.fontSize))
  }
  this.bumpLevel = () => {
    this.currentLevel++
    this.gradusText.text = `gradus: ${this.currentLevel}`
  }
  this.achievements = []
  this.allGradus = [
    () => {
      console.log('gradus1')
      this.achievements.push('loaded page')
      wand.extra.exibition = wand.test.testExhibition1('gradus')
      wand.currentNetwork = wand.extra.exibition.drawnNet.net
      console.log(10000 * timeStreach, timeStreach, 'timeStreach')
      setTimeout(() => {
        this.bumpLevel()
        this.allGradus[this.currentLevel]()
      }, 10000 * timeStreach)
    },
    () => {
      console.log('gradus1.1')
      const ibtn = $('<button class="btn" id="ibtn"><i class="fa fa-bone"></i></button>').prop('title', 'show links')
      const vbtn = $('<button class="btn"><i class="fa fa-chess"></i></button>').prop('title', 'show nodes')
      ibtn.prependTo('body')
      vbtn.prependTo('body')
      wand.extra.counter = {
        edgesVisible: 0,
        nodesVisible: 0
      }
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
      const condition = () => {
        setTimeout(() => {
          if (wand.extra.counter.nodesVisible >= 2 && wand.extra.counter.edgesVisible >= 2) {
            this.bumpLevel()
            this.allGradus[this.currentLevel]()
            return
          }
          condition()
        }, 300)
      }
      condition()
    },
    () => {
      console.log('gradus2')
      wand.transfer.mong.findAllNetworks().then(r => {
        this.achievements.push('loaded data')
        this.bumpLevel()
        this.allGradus[this.currentLevel](r)
      })
    },
    (r) => {
      wand.extra.counter.networksVisualized = 0
      wand.extra.counter.namesVisible = 0
      console.log('gradus3')
      const artist = wand.artist
      const conductor = wand.conductor
      const net = wand.net
      const transfer = wand.transfer
      const names = $('<button class="btn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
      const input = $('<button class="btn"><i class="fa fa-archway"></i></button>').prop('title', 'load or upload network')
      names.prependTo('body')
      input.prependTo('body')
      const s = $('<select/>')
      s.prependTo('body')
      // s.append($('<option/>').val('upload').html('upload'))
      // unlock: unlock afterwards
      r.forEach((n, i) => {
        s.append($('<option/>').val(i).html(n.name))
      })
      console.log('OIUQWE', r)
      const uel = document.getElementById('file-input')
      uel.onchange = res => {
        const f = uel.files[0]
        f.text().then(t => {
          transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
          wand.currentNetwork = net.use.utils.loadJsonString(t)
          const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
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
        if (window.wand.currentNetwork) {
          window.wand.currentNetwork.forEachNode((n, a) => {
            a.pixiElement.destroy()
            a.textElement.destroy()
          })
          window.wand.currentNetwork.forEachEdge((n, a) => a.pixiElement.destroy())
        }
        if (s.val() === 'upload') {
          uel.click()
          return
        }
        window.wand.currentNetwork = net.use.utils.loadJsonString(r[s.val()].text)
        const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
        conductor.use.showMembers(drawnNet.net, artist, true)
        window.dn = drawnNet
        window.nn = window.wand.currentNetwork
        wand.extra.counter.networksVisualized++
        if (!this.networkSelectLevelPassed) {
          console.log(wand.extra.counter.networksVisualized, wand.extra.counter.nodesVisible, wand.extra.counter.edgesVisible)
          if (
            wand.extra.counter.networksVisualized >= 3 &&
            wand.extra.counter.nodesVisible >= 5 &&
            wand.extra.counter.edgesVisible >= 5 &&
            wand.extra.counter.namesVisible >= 4
          ) {
            this.networkSelectLevelPassed = true
            this.bumpLevel()
            this.allGradus[this.currentLevel]()
          }
        }
      })
      names.on('click', () => {
        window.wand.currentNetwork.forEachNode((n, a) => {
          a.textElement.visible = !a.textElement.visible
          wand.extra.counter.namesVisible++
        })
      })
    },
    () => {
      wand.extra.counter.colorChange = 0
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
        wand.extra.counter.colorChange++
        if (wand.extra.counter.colorChange >= 5) {
          this.bumpLevel()
          this.allGradus[this.currentLevel]()
        }
      })
    },
    () => {
      console.log('last level')
    }
  ]
  setStage()
  this.allGradus[0]()
}

module.exports = { Gradus }
