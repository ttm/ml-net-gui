/* global wand */
function Gradus (timeStreach = 1) {
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
      wand.extra.exibition = wand.test.testExibition1('gradus')
      console.log(10000 * timeStreach, timeStreach, 'timeStreach')
      setTimeout(() => {
        this.bumpLevel()
        this.allGradus[this.currentLevel]()
      }, 10000 * timeStreach)
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
      const $ = wand.$
      const artist = wand.artist
      const conductor = wand.conductor
      const net = wand.net
      const transfer = wand.transfer
      const names = $('<button class="btn"><i class="fa fa-mask"></i></button>').prop('title', 'show names')
      const input = $('<button class="btn"><i class="fa fa-archway"></i></button>').prop('title', 'load or upload network')
      const ibtn = $('<button class="btn"><i class="fa fa-bone"></i></button>').prop('title', 'show links')
      const vbtn = $('<button class="btn"><i class="fa fa-chess"></i></button>').prop('title', 'show nodes')
      ibtn.prependTo('body')
      vbtn.prependTo('body')
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
          window.wand.currentNetwork = net.use.utils.loadJsonString(t)
          const drawnNet = new conductor.use.DrawnNet(artist.use, window.wand.currentNetwork, [])
          conductor.use.showMembers(drawnNet.net, artist, true)
        })
      }
      input.on('click', () => {
        if (wand.extra.exibition) {
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
        if (!this.networkSelectLevelPassed) {
          this.bumpLevel()
          this.allGradus[this.currentLevel]()
          this.networkSelectLevelPassed = true
        }
      })
      names.on('click', () => {
        window.wand.currentNetwork.forEachNode((n, a) => {
          a.textElement.visible = !a.textElement.visible
        })
      })
      ibtn.on('click', () => {
        window.wand.currentNetwork.forEachEdge((e, a) => {
          a.pixiElement.visible = !a.pixiElement.visible
        })
      })
      vbtn.on('click', () => {
        window.wand.currentNetwork.forEachNode((n, a) => {
          a.pixiElement.visible = !a.pixiElement.visible
        })
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
