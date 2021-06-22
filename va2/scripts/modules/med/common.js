const e = module.exports

e.waveforms = {
  0: 'sine',
  1: 'triangle',
  2: 'square',
  3: 'sawtooth'
}

e.permfuncs = {
  0: 'shuffle',
  1: 'rotateForward',
  2: 'rotateBackward',
  3: 'reverse',
  4: 'none'
}

e.times = [
  [0, 0],
  [1, 11],
  [2, 22],
  [3, 33],
  [4, 44],
  [5, 55],
  [6, 30],
  [7, 7],
  [8, 8],
  [9, 9],
  [10, 10],
  [11, 11],
  [12, 12],
  [13, 13],
  [14, 14],
  [15, 15],
  [16, 16],
  [17, 17],
  [18, 18],
  [19, 19],
  [20, 20],
  [21, 21],
  [22, 22],
  [23, 23]
]

e.nextSync = justStr => {
  const d = new Date()
  let ii
  if (d.getHours() === 23 && d.getMinutes() > 22) ii = 0
  else {
    e.times.some((t, i) => {
      ii = i
      return t[0] >= d.getHours()
    })
    if (e.times[ii][0] === d.getHours() && e.times[ii][1] <= d.getMinutes()) ii++
  }
  if (justStr) {
    const s = i => String(i).padStart(2, '0')
    return e.times[ii].map(i => s(i)).join(':')
  }
  d.setHours(e.times[ii][0])
  d.setMinutes(e.times[ii][1])
  d.setSeconds(0)
  d.setMilliseconds(0)
  if (ii === 0) d.setHours(d.getHours() + 24)
  return d
}
