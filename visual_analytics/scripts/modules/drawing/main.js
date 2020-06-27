const base = require('./base')
const ambience = require('./ambience')
const utils = require('./utils.js')
const test = require('./test')

const use = {
  mkNode: base.use.mkNode,
  mkRectangle: utils.mkRectangle,
  mkLink: base.use.mkLink,
  mkText: base.use.mkText,
  mkTextFancy: base.use.mkTextFancy,
  mkTextBetter: base.use.mkTextBetter,
  mkPaths: base.use.mkPaths,
  updateLink: base.use.updateLink,
  ambience: ambience.use,
  width: base.share.app.view.width,
  height: base.share.app.view.height
}

exports.use = use
exports.share = { test, base: base.share }
