const synth = require('./netscience/synth')
const diffusion = require('./netscience/diffusion')
const seeding = require('./netscience/seeding')

module.exports = { use: { synth, diffusion, seeding } }
