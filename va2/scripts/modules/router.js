/* global wand */
const utils = require('./utils.js')

const e = module.exports

const pn = decodeURIComponent(window.location.href)
const u = new URL(pn)

const urlArgument = e.urlArgument = (arg, rotOrFun) => {
  const a = u.searchParams.get(arg)
  if (typeof rotOrFun === 'function' && a) {
    rotOrFun()
  } else {
    // return rotOrFun ? wand.utils.rot(a) : a
    return rotOrFun ? wand.utils.rot(a) : a
  }
}

e.urlAllArguments = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const entries = urlParams.entries()
  const keys = []
  const values = []
  const dict = {}
  for (const entry of entries) {
    keys.push(entry[0])
    values.push(entry[1])
    dict[entry[0]] = entry[1]
  }
  return { keys, values, dict }
}

e.mkFooter = () => {
  function sWord () {
    const wlist = ['support', 'back', 'encourage', 'strengthen', 'assist', 'angel', 'boost']
    return utils.chooseUnique(wlist, 1)
  }
  const ft = wand.$('<div/>', {
    id: 'afooter',
    css: {
      display: 'flex',
      'white-space': 'nowrap',
      'overflow-x': 'auto',
      margin: '0 auto',
      padding: '8px',
      width: '30%'
    }
  }).appendTo('body')
  const lflag = urlArgument('lang') ? `&lang=${urlArgument('lang')}` : ''
  wand.$('<a/>', {
    href: `?about${lflag}`,
    target: '_blank',
    css: {
      'margin-left': '1%',
      display: 'inline-block',
      float: 'left'
    }
  }).html('<b>About Æterni</b>').appendTo(ft)
  wand.$('<div/>', { class: 'notranslate', css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft).html(' / ')
  wand.$('<a/>', {
    href: `?angel${lflag}`,
    target: '_blank',
    css: {
      'margin-left': '1%',
      display: 'inline-block',
      float: 'left'
    }
  }).html(`<b>${sWord()} this initiative</b>`).appendTo(ft)
  wand.$('body', {
    css: {
      'background-color': '#dddddd'
    }
  })
}
