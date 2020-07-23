/* global wand */
const { copyToClipboard } = require('../utils.js')
const { guards, deucalion, lycorus, corycia } = require('./sayings.js')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

const mkBtn = (iclass, fid, title, fun, ref) => {
  const $ = wand.$
  const btn = $('<button/>', {
    class: 'btn',
    id: `${fid}-button`,
    click: () => {
      fun()
    }
  }).attr('atitle', title)
  if (!ref) {
    btn.prependTo('body')
  } else {
    btn.insertAfter(ref)
  }
  $('<i/>', { class: 'fa ' + iclass, id: `${fid}-icon` }).appendTo(
    btn
  )
}

class Lycoreia {
  constructor (settings = {}) {
    // it has all the resources given by gradus
    // but only loads if person login
    // focused in starting a diffusion
    // and is tutored by Deucalion, Lycorus and nymph Corycia, and the Dorians
    // leads to Thitorea and some of the muses

    // load one button, alternates entities speaking to the visitor
    // then load the rest:
    //  network loads when selected. Button to load is info button to the tutors messages
    //  all buttons as are as is, except explorer:
    //    the balls draws the arrows, makes the succession, starts with randomized seeds or random if none selected
    //    shows tool option chosen in the tooltip
    //  networks available are derived from scrapped network (communities, members visited or found)

    // makes multilevel strategy using community detection
    // can explode supernode into nodes by clicking

    // hide & show communities and subcommunities
    //
    const defaultSettings = {
      fontSize: 20
    }
    this.settings = { ...defaultSettings, ...settings }
    const refHeight = 833
    const refWidth = 884
    this.settings.heightProportion = wand.artist.use.height / refHeight
    this.settings.widthProportion = wand.artist.use.width / refWidth
    this.copyToClipboard = copyToClipboard
    // if not logged in, only show the info button
    // if logged in, get network
    window.louvain = louvain
    this.setCommunitiesInterface()
    this.setSubComInterface()
    window.onload = () => {
      this.setDialogs()
      if (!wand.sageInfo) {
        // todo: choose networks by name input or by IP geographical proximity
        // wand.transfer.mong.findAllNetworks().then(r => {
        //   this.allNetworks = r
        //   this.conditionMet = true
        // })
        console.log('Deucalion sayings')
      } else {
        wand.transfer.mong.findUserNetwork(wand.sageInfo.sid, wand.sageInfo.nid).then(r => {
          console.log('loaded user network')
          this.allNetworks = r
          const g = wand.net.use.utils.loadJsonString(this.allNetworks[0].text)
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
          this.drawnNet = new wand.conductor.use.DrawnNet(wand.artist.use, wand.currentNetwork, [])
          wand.drawnNet = this.drawnNet
          // const gg = components.connectedComponents(g)[0]
          // const sg = subGraph(g, gg)
          // netdegree.assign(sg)
          // netmetrics.centrality.degree.assign(sg)
          // wand.currentNetwork = sg
          // wand.communities = louvain.detailed(wand.currentNetwork)
        })
      }
    }
  }

  setDialogs () {
    const a = wand.artist.use
    this.rect = a.mkRectangle({
      // wh: [a.width, a.height], zIndex: 1, color: 0xffaaaa, alpha: 0
      wh: [a.width, a.height], zIndex: 1, color: 0x9c9c9c, alpha: 0
    })
    const f = this.settings.fontSize
    const p = f / 2
    const x = this.scalex(p)
    const y = this.scaley(p)
    const fs = this.scaley(f)
    this.texts = []
    const mkElement = (pos, color, element, zIndex, alpha, text) => {
      this.texts[element] = a.mkTextFancy(text, [pos[0] * x, pos[1] * y], fs, color, zIndex, alpha)
      return this.texts[element]
    }
    // mkElement([1, 2.2], 0x777733, 'main', 3000, 0, 'click HERE to copy URL to browser extension.').on('click', () => {
    //   console.log('click and copy')
    //   copyToClipboard('https://github.com/ttm/ml-net-gui/raw/master/visual_analytics/wand.zip')
    // })
    let count = 0
    if (wand.sageInfo) {
      mkElement([1, 2.2], 0x777733, 'deucalion', 3000, 0, deucalion)
      // mkElement([1, 5.2], 0x337733, 'extra', 3000, 0, 'read the README to know how to install/use!')
      mkElement([1, 5.2], 0x337733, 'lycorus', 3000, 0, lycorus())
      mkElement([1, 5.2], 0x337733, 'corycia', 3000, 0, corycia())
      const fun = () => {
        count++
        const tlength = Object.keys(this.texts).length + 1
        const show = (count % tlength) !== 0
        this.rect.alpha = Number(show)
        // this.rect.interactive = Boolean(this.current)
        this.rect.zIndex = 10 + 2000 * show
        // this.texts.main.alpha = this.current
        // this.texts.main.interactive = Boolean(this.current)
        // this.texts.main.buttonMode = Boolean(this.current)
        let i = 0
        for (const t in this.texts) {
          this.texts[t].alpha = Number(count % tlength === (i + 1))
          console.log(this.texts[t], Number(count % tlength === (i + 1)))
          i++
        }
        console.log(show, count, i, tlength, count % tlength)
      }
      mkBtn('fa-info', 'info', 'infos / dialogs', fun, '#com-button')
    } else {
      console.log('not sage info')
      mkElement([1, 2.2], 0x777733, 'guards', 3000, 0, guards)
      this.rect.alpha = 1
      // this.rect.interactive = Boolean(this.current)
      this.rect.zIndex = 10 + 2000
      this.texts.guards.alpha = 1
    }
  }

  setCommunitiesInterface () {
    // const $ = wand.$
    let count = 0
    const fun = () => {
      count = (++count) % wand.currentNetwork.communities.count
      this.showCommunity(count)
    }
    mkBtn('fa-users-cog', 'com', 'communities', fun)
  }

  setSubComInterface () {
    let count = 0
    const subComGraphs = {}
    const fun = () => {
      const cIndex = wand.currentNetwork.communityIndex
      let g
      if (cIndex in subComGraphs) {
        g = subComGraphs[cIndex]
      } else {
        const nodes = []
        wand.currentNetwork.forEachNode((n, a) => {
          if (a.community === cIndex) {
            nodes.push(n)
          }
        })
        g = subGraph(wand.currentNetwork, nodes).copy()
        louvain.assign(g)
        g.communities = louvain.detailed(g)
        subComGraphs[cIndex] = g
      }
      count = (++count) % g.communities.count
      this.showSubCommunity(count, g)
    }
    mkBtn('fa-users', 'sub', 'sub communities', fun)
  }

  showSubCommunity (index, g) {
    g.forEachNode((n, a) => {
      const pe = wand.currentNetwork.getNodeAttribute(n, 'pixiElement')
      if (a.community === index) {
        pe.tint = 0x00ff00
      } else {
        pe.tint = 0x0000ff
      }
    })
    wand.currentNetwork.subCommunityIndex = index
  }

  showCommunity (index) {
    console.log('show community:', index)
    wand.currentNetwork.forEachNode((n, a) => {
      if (a.community === index) {
        a.pixiElement.tint = 0x0000ff
      } else {
        a.pixiElement.tint = 0xff0000
      }
    })
    wand.currentNetwork.communityIndex = index
  }

  registerNetwork (graph, avarname) {
    const g = graph
    const gg = components.connectedComponents(g)[0]
    const sg = subGraph(g, gg).copy()
    netdegree.assign(sg)
    netmetrics.centrality.degree.assign(sg)
    louvain.assign(sg)
    sg.communities = louvain.detailed(sg)
    wand[avarname + 'Network'] = sg
    // wand[avarname + 'NetworkCommunities'] = louvain.detailed(sg)
  }

  scaley (val) {
    return this.settings.heightProportion * val
  }

  scalex (val) {
    return this.settings.widthProportion * val
  }
}

module.exports = { Lycoreia }
