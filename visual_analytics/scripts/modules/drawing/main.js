const base = require('./base')
const ambience = require('./ambience')
const test = require('./test')

const use = {
  mkNode: base.use.mkNode,
  mkLink: base.use.mkLink,
  mkText: base.use.mkText,
  mkPaths: base.use.mkPaths,
  ambience: ambience.use,
  width: base.share.app.view.width,
  height: base.share.app.view.height
}

exports.use = use
exports.share = { test, base: base.share }
