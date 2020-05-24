const base = require('./base')
const ambience = require('./ambience')
const test = require('./test')

const use = {
  mkNode: base.use.mkNode,
  mkLink: base.use.mkLink,
  mkText: base.use.mkText,
  mkPaths: base.use.mkPaths,
  ambience: ambience.use
}

exports.use = use
exports.share = { test, base: base.share }
