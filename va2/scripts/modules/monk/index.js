const $ = require('jquery')
const utils = require('../utils.js')
module.exports.prayers = require('./prayers.js')

$.ajax({
  url: 'assets/text/biblePt.txt',
  success: data => {
    module.exports.biblePt = utils.chunkArray(data.split('\n'), 3).map(e => {
      return { text: e[0], ref: e[1] }
    })
  }
})
