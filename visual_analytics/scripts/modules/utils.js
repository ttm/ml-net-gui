function chooseUnique (marray, nelements) {
  let i = marray.length
  if (nelements >= i) {
    console.log(`chooseUnique received nelements ${nelements}, and array with length ${i}. Returning scrambled array`)
  }
  marray = [...marray]
  if (i === 0) { return false }
  let c = 0
  const choice = []
  while (i) {
    const j = Math.floor(Math.random() * i)
    const tempi = marray[--i]
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

function rot13Fast (str) {
  return str.split('').map(x => rot13Fast.lookup[x] || x).join('')
}
rot13Fast.input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
rot13Fast.output = 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'.split('')
rot13Fast.lookup = rot13Fast.input.reduce((m, k, i) => Object.assign(m, { [k]: rot13Fast.output[i] }), {})

function rot (str) {
  if (!str) {
    return
  }
  return str.split('').map(x => rot.lookup[x] || x).join('')
}
rot.input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')
rot.output = 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm5678901234'.split('')
rot.lookup = rot13Fast.input.reduce((m, k, i) => Object.assign(m, { [k]: rot13Fast.output[i] }), {})

module.exports = { chooseUnique, chunkArray, inplaceShuffle, randChunkSplit, copyToClipboard, rot13Fast, rot }
