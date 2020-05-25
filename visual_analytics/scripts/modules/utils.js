function chooseUnique (marray, nelements) {
  // fixme: ensure this is not scrambling marray input
  let i = marray.length
  if (i === 0) { return false }
  let c = 0
  const choice = []
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1))
    const tempi = marray[i]
    const tempj = marray[j]
    choice.push(tempj)
    marray[i] = tempj
    marray[j] = tempi
    c++
    if (c === nelements) { return choice }
  }
  return choice
}

module.exports = { chooseUnique }
