const synth = require('./netscience/synth')
const diffusion = require('./netscience/diffusion')
const seeding = require('./netscience/seeding')
const meta = require('./netscience/meta')
const build = require('./netscience/build')

module.exports = { use: { synth, diffusion, seeding, meta, build } }
