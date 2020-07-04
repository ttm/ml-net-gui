const Tone = require('tone')
const Scribble = require('scribbletune')
// use https://github.com/Okazari/Rythm.js to dance using a wav file,
// check html values in note values to set synth and visualization
// also maybe: https://github.com/tonaljs/tonal
// and https://howlerjs.com/ to play soundfiles
// look for voix.js annyang.js and other speech recognition libs
// and eye tracking
// https://github.com/zya/beet.js para padrao 01010111 de onset
// abc: https://github.com/PencilCode/musical.js
// for beats: https://github.com/adamrenklint/bap
// more: https://bashooka.com/coding/web-audio-javascript-libraries/

const membSynth = new Tone.MembraneSynth().toMaster()
const membSynth2 = new Tone.MembraneSynth().toMaster()

const kick = () => membSynth.triggerAttackRelease('C2', '2n')
const hat = () => membSynth2.triggerAttackRelease('D3', '8n')

const looper = () => {
  // basic looper 4 / 4, 4 measures
  const t = Tone.Transport
  t.bpm.value = 120
  Tone.Transport.schedule(function (time) {
    console.log(time, '4n event')
  }, '4n')
  Tone.Transport.schedule(function (time) {
    // time = sample accurate time of the event
    console.log(time, '1m event')
  }, '1m')
  const loop = new Tone.Loop(function (time) {
    console.log(time, '4n loop')
  }, '4n')
  const loop1m = new Tone.Loop(function (time) {
    console.log(time, '1m loop')
    const seq = new Tone.Sequence(
      function (time, note) {
        membSynth.triggerAttackRelease(note, 0.01, time)
      },
      ['C1', 'Eb1', 'G1', 'Bb1'],
      '1m'
    )
    seq.start()
    window.seq = seq
  }, '1m')
  // t.loop = true
  loop.start()
  loop1m.start()
  t.start()
  return loop
}

module.exports = { Tone, Scribble, membSynth, membSynth2, kick, hat, looper }
