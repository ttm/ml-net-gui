/* global wand */
const Tone = require('tone')
Tone.Master.volume.value = -15
// window.OscillatorNode = Tone.OscillatorNode
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
      '4n'
    )
    seq.start()
    window.seq = seq
  }, '1m')
  // t.loop = true
  loop.start()
  loop1m.start()
}

// make basic pattern [2n 2n] [[undefined 4n] [undefined 8n 8n]]
// arpeggio
// loop independent and transport loop

const oneSeq = () => {
  let count = 0
  const seq = new Tone.Sequence(
    function (time, note) {
      if (count % 2 === 1) {
        membSynth2.triggerAttackRelease('d4', 0.01, time)
        if (count % 4 === 3) {
          membSynth2.triggerAttackRelease('d4', 0.01, time + 0.25)
        }
      } else {
        membSynth.triggerAttackRelease(note, 0.01, time)
      }
      console.log(time, note)
      count++
    },
    ['C1', 'Eb1', 'G1', 'Bb1'],
    '4n'
  )
  seq.start()
  window.seq = seq
}

const twoSeq = () => {
  // nice! use
  const seq = new Tone.Sequence(
    (time, note) => {
      console.log('trebble', time, note)
      membSynth.triggerAttackRelease(note, 0.01, time)
    },
    [null, 'd4', null, ['e4', 'f4']],
    '4n'
  )
  const seq2 = new Tone.Sequence(
    (time, note) => {
      console.log('bass', time, note)
      membSynth.triggerAttackRelease(note, 0.01, time)
    },
    ['C1', null, 'G1', null],
    '4n'
  )
  seq.start()
  seq2.start()
}

const syncToy = () => {
  const pixiEls = [...Array(40).keys()].map(i => {
    const node = wand.artist.use.mkNode('tri')
    node.x = 170 + 150 * (i % 4)
    node.y = 200 + 100 * Math.floor(i / 4)
    node.alpha = 1
    node.scale.set(4)
    return node
  })
  const vol = new Tone.Volume(0).toMaster()
  // vol.volume.value = -20
  const membSynth2 = new Tone.MembraneSynth().chain(vol)
  const d = (f, time) => Tone.Draw.schedule(f, time)
  const seq = new Tone.Sequence(
    (time, note) => {
      console.log('trebble', time, note)
      membSynth2.triggerAttackRelease(note, 0.01, time)
      d(() => { pixiEls[0].tint = pixiEls[0].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time)
      d(() => { pixiEls[0].tint = pixiEls[0].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time + 0.1)
    },
    [null, 'd4', null, ['e4', 'f4']],
    '4n'
  )
  const seq2 = new Tone.Sequence(
    (time, note) => {
      console.log('bass', time, note)
      membSynth.triggerAttackRelease(note, 0.01, time)
      d(() => { pixiEls[1].tint = pixiEls[1].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time)
      d(() => { pixiEls[1].tint = pixiEls[1].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time + 0.1)
    },
    ['C1', null, 'G1', null],
    '4n'
  )
  seq.start()
  seq2.start()
  return { vol, membSynth }
}

const aPattern = (opt) => {
  const pats = [
    ['C1', 'D2', 'E4'],
    ['C1', 'D2', 'E4', 'G5', 'A6'],
    ['C1', 'D2', 'E3', 'G4', 'A5', 'E5', 'G6', 'G7', 'e5'],
    ['C1', 'D2', 'E3', 'G4', 'A5', 'E5', 'G6', 'G7', 'e5', 'A5', 'E5', 'G6', 'G7', 'e5', 'A5', 'E5', 'G6']
  ]
  const plucky = new Tone.PluckSynth({ volume: 10 }).toMaster()
  const pattern = new Tone.Pattern((time, note) => {
    plucky.triggerAttackRelease(note, 0.25)
  // }, ['C1', 'D2', 'E4', 'G5', 'A6'], 'upDown')
  // }, ['C1', 'D2', 'E3', 'G4', 'A5', 'E5', 'G6', 'G7', 'e5'], 'upDown')
  }, pats[opt], 'upDown')
  pattern.interval = '8n'
  pattern.start()
  syncToy2()
  return { pattern, plucky }
}

const syncToy2 = () => {
  const pixiEls = [...Array(40).keys()].map(i => {
    const node = wand.artist.use.mkNode('tri')
    node.x = 170 + 150 * (i % 4)
    node.y = 200 + 100 * Math.floor(i / 4)
    node.alpha = 1
    node.scale.set(4)
    return node
  })
  const vol = new Tone.Volume(0).toMaster()
  // vol.volume.value = -20
  const membSynth2 = new Tone.MetalSynth({ resonance: 100, octaves: 0.01, harmonicity: 10, frequency: 500, volume: 10 }).chain(vol)
  window.ms = membSynth2
  const d = (f, time) => Tone.Draw.schedule(f, time)
  const seq = new Tone.Sequence(
    (time, note) => {
      console.log('trebble', time, note)
      membSynth2.triggerAttackRelease(0.01, time)
      d(() => { pixiEls[0].tint = pixiEls[0].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time)
      d(() => { pixiEls[0].tint = pixiEls[0].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time + 0.1)
    },
    [null, 'd4', null, ['e4', 'f4']],
    '4n'
  )
  const seq2 = new Tone.Sequence(
    (time, note) => {
      console.log('bass', time, note)
      membSynth.triggerAttackRelease(note, 0.01, time)
      d(() => { pixiEls[1].tint = pixiEls[1].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time)
      d(() => { pixiEls[1].tint = pixiEls[1].tint === 0xff0000 ? 0xfffff : 0xff0000 }, time + 0.1)
    },
    ['C1', null, 'G1', null],
    '4n'
  )
  seq.start()
  seq2.start()
  return { vol, membSynth }
}

module.exports = { Tone, Scribble, membSynth, membSynth2, kick, hat, looper, oneSeq, twoSeq, syncToy, aPattern, syncToy2 }
