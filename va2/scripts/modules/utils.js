const e = module.exports
const $ = require('jquery')

let count = 0
e.mkGrid = (cols, el, w, bgc) => {
  return $('<div/>', {
    class: 'mgrid',
    id: `mgrid-${count++}`,
    css: {
      display: 'grid',
      'grid-template-columns': Array(cols).fill('auto').join(' '),
      'background-color': bgc || '#21F693',
      padding: '8px',
      margin: '0 auto',
      // height: Math.floor(wand.artist.use.height * 0.065) + 'px',
      width: w || '30%'
    }
  }).appendTo(el || 'body')
}

e.gridDivider = (r, g, b, grid) => {
  $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
  $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},0)`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
}

e.chooseUnique = (marray, nelements) => {
  let i = marray.length
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

e.chunkArray = (array, chunkSize) => {
  const results = []
  array = array.slice()
  while (array.length) {
    results.push(array.splice(0, chunkSize))
  }
  return results
}

e.defaultArg = (arg, def) => arg === undefined ? def : arg
