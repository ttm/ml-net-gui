const synth = require('./netscience/synth')
const diffusion = require('./netscience/diffusion')
const seeding = require('./netscience/seeding')
const meta = require('./netscience/meta')

module.exports = { use: { synth, diffusion, seeding, meta } }
