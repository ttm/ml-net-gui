const synth = require('./netscience/synth')
const diffusion = require('./netscience/diffusion')
const seeding = require('./netscience/seeding')
const meta = require('./netscience/meta')
const build = require('./netscience/build')
const utils = require('./netscience/utils.js')

module.exports = { use: { synth, diffusion, seeding, meta, build, utils } }
