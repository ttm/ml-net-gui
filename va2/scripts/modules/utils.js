const e = module.exports
const $ = require('jquery')

let count = 0
e.mkGrid = (cols, el, w, bgc, tcol) => {
  return $('<div/>', {
    class: 'mgrid',
    id: `mgrid-${count++}`,
    css: {
      display: 'grid',
      // 'grid-template-columns': Array(cols).fill('auto').join(' '),
      'grid-template-columns': Array(cols).fill(tcol || 'auto').join(' '),
      'background-color': bgc || '#21F693',
      padding: '8px',
      margin: '0 auto',
      // height: Math.floor(wand.artist.use.height * 0.065) + 'px',
      width: w || '30%',
      'border-radius': '2%'
    }
  }).appendTo(el || 'body')
}

e.gridDivider = (r, g, b, grid, sec, after) => {
  if (!after) {
    $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
    return $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},${d(sec, 0)})`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
  } else {
    $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).insertAfter(after).text('--')
    return $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},${d(sec, 0)})`, color: 'rgba(0,0,0,0)', height: '3px' } }).insertAfter(after).text('--')
  }
}

e.stdDiv = () => e.centerDiv(undefined, undefined, e.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0], 3, 2)

e.centerDiv = (width, container, color, margin, padding) => {
  return $('<div/>', {
    css: {
      'background-color': color || '#c2F6c3',
      margin: `${d(margin, 0)}% auto`,
      padding: `${d(padding, 1)}%`,
      width: d(width, '50%'),
      'border-radius': '5%'
    }
  }).appendTo(container || 'body')
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

e.vocalize = (oracao, adiv) => {
  const maestro = window.wand.maestro
  $('<button/>').html('rezar').click(() => {
    maestro.speaker.synth.cancel()
    maestro.speaker.play(oracao, 'pt')
  }).appendTo(adiv)
  $('<button/>', { css: { margin: '1%' } }).html('parar').click(() => {
    if (ut) ut.onend = undefined
    maestro.speaker.synth.cancel()
    check.prop('checked', false)
  }).appendTo(adiv)
  adiv.append('loop: ')
  let ut
  const check = $('<input/>', {
    type: 'checkbox'
  }).appendTo(adiv).change(function () {
    if (this.checked) {
      maestro.speaker.synth.cancel()
      ut = maestro.speaker.play(oracao, 'pt', true)
    } else {
      ut.onend = undefined
      maestro.speaker.synth.cancel()
    }
  })
}

const d = e.defaultArg = (arg, def) => arg === undefined ? def : arg
