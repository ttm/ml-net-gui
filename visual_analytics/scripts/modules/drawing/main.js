let base = require('./base')
let ambience = require('./ambience')
window.drawerForTest = base
let test = require('./test')

let drawerkit = base

let use = {
  mkNode:  base.use.mkNode,
  mkLink:  base.use.mkLink,
  mkText:  base.use.mkText,
  mkPaths: base.use.mkPaths,
  ambience: ambience.use,
}

exports.use = use
exports.share = { test , base: base.share }

