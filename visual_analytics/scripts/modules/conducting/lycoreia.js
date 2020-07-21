/* global wand */
const { copyToClipboard } = require('../utils.js')

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
        })
      }
    }, 2000)
  }
}

module.exports = { Lycoreia }
