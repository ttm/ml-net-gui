const e = module.exports
e.amset = {
  volume: 0,
  detune: 0,
  portamento: 0,
  harmonicity: 2.5,
  oscillator: {
    partialCount: 0,
    partials: [],
    phase: 0,
    type: 'fatsawtooth',
    count: 3,
    spread: 20
  },
  envelope: {
    attack: 0.1,
    attackCurve: 'linear',
    decay: 0.2,
    decayCurve: 'exponential',
    release: 0.3,
    releaseCurve: 'exponential',
    sustain: 0.2
  },
  modulation: {
    partialCount: 0,
    partials: [],
    phase: 0,
    type: 'square'
  },
  modulationEnvelope: {
    attack: 0.5,
    attackCurve: 'linear',
    decay: 0.01,
    decayCurve: 'exponential',
    release: 0.5,
    releaseCurve: 'exponential',
    sustain: 1
  }
}
