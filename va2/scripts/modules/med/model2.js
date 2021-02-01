const e = module.exports

e.Med = class {
  constructor (ss) {
    for (let i = 1; i < ss.length; i++) {
      const s = ss[i]
      this[s.type](s)
    }
    this.setVisual(ss[0])
  }

  setVisual (s) {
  }

  martigli (s) {
  }

  binaural (s) {
  }

  symmetry (s) {
  }

  sample (s) {
  }

  martigliBinaural (s) {
  }
}
