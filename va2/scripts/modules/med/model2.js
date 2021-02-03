const transfer = require('../transfer.js')
const $ = require('jquery')

const e = module.exports

e.Med = class {
  constructor (med2) {
    transfer.findAny({ 'header.med2': med2 }).then(r => {
      console.log('in model 2 !', med2, r)
      // for (let i = 1; i < ss.length; i++) {
      //   const s = ss[i]
      //   this[s.type](s)
      // }
      // this.setVisual(ss[0])
      $('#loading').hide()
    })
  }

  setVisual (s) {
  }

  martigli (s) {
  }

  binaural (s) {
  }

  symmetry (s) {
  }

  sample (s) {
  }

  martigliBinaural (s) {
  }
}
