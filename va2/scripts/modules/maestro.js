const d = require('./utils.js').defaultArg
const t = require('tone')

const e = module.exports

e.mkOsc = (freq, vol, pan, type, noConnect) => {
  const panner = new t.Panner(d(pan, 1))
  if (!noConnect) panner.toDestination()
  const synth = new t.Oscillator(d(freq, 200), d(type, 'sine')).connect(panner).start()
  synth.volume.value = d(vol, -200)
  synth.panner = panner
  return synth
}
