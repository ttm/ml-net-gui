const base = require('./base.js')
const ambience = require('./ambience.js')
const tincture = require('./tincture.js')
const utils = require('./utils.js')
const test = require('./test.js')

const use = {
  mkNode: base.use.mkNode,
  mkRectangle: utils.mkRectangle,
  mkLink: base.use.mkLink,
  mkArrow: base.use.mkArrow,
  mkText: base.use.mkText,
  mkTextFancy: base.use.mkTextFancy,
  mkTextBetter: base.use.mkTextBetter,
  mkPaths: base.use.mkPaths,
  updateLink: base.use.updateLink,
  ambience: ambience.use,
  width: base.share.app.view.width,
  height: base.share.app.view.height,
  tincture
}

exports.use = use
exports.share = { test, base: base.share }
