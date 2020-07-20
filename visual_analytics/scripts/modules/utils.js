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

function chunkArray (array, chunkSize) {
  // Split in group of 3 items
  // var result = chunkArray([1,2,3,4,5,6,7,8], 3)
  var results = []
  while (array.length) {
    results.push(array.splice(0, chunkSize))
  }
  return results
}

function inplaceShuffle (array) {
  // Fisher-Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function randChunkSplit (arr, min, max, inplace = true) {
  if (!inplace) {
    arr = arr.slice()
  }
  const arrs = []
  min = min || 1
  max = max || min || 1
  let size = 1
  while (arr.length > 0) {
    size = Math.min(max, Math.floor((Math.random() * max) + min))
    arrs.push(arr.splice(0, size))
  }
  return arrs
}

const copyToClipboard = str => {
  const el = document.createElement('textarea')
  el.value = str
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

module.exports = { chooseUnique, chunkArray, inplaceShuffle, randChunkSplit, copyToClipboard }
