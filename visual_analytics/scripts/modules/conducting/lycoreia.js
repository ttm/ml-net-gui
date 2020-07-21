/* global wand */
const { copyToClipboard } = require('../utils.js')
const louvain = require('graphology-communities-louvain')
const netmetrics = require('graphology-metrics')
const netdegree = require('graphology-metrics/degree')
const components = require('graphology-components')
const subGraph = require('graphology-utils/subgraph')

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
    console.log('lycorea started')
    this.copyToClipboard = copyToClipboard
    // if not logged in, only show the info button
    // if logged in, get network
    window.louvain = louvain
    this.setCommunitiesInterface()
    this.setSubComInterface()
    setTimeout(() => {
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
    }, 2000)
  }

  setCommunitiesInterface () {
    const $ = wand.$
    const self = this
    let count = 0
    $('<i/>', { class: 'fa fa-users-cog', id: 'com-icon' }).appendTo(
      $('<button/>', {
        class: 'btn',
        id: 'com-button',
        click: () => {
          count = (++count) % wand.currentNetwork.communities.count
          self.showCommunity(count)
        }
      }).attr('atitle', 'communitites').prependTo('body')
    )
  }

  setSubComInterface () {
    const $ = wand.$
    const self = this
    let count = 0
    const subComGraphs = {}
    $('<i/>', { class: 'fa fa-users', id: 'sub-icon' }).appendTo(
      $('<button/>', {
        class: 'btn',
        id: 'sub-button',
        click: () => {
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
          self.showSubCommunity(count, g)
        }
      }).attr('atitle', 'sub communitites').prependTo('body')
    )
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
}

module.exports = { Lycoreia }
