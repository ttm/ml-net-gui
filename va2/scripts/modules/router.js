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
  wand.$('<div/>', { css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft).html(' / ')
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
  // wand.$('<div/>', {
  //   id: 'disqus_thread',
  //   css: {
  //     margin: '0 auto',
  //     padding: '1%',
  //     width: '50%'
  //   }
  // }).appendTo('body')
  lang(ft)
  // uncomment to enable disqus
  // todo: debug to load correct discussions in each page
  // const uargs = e.urlAllArguments()
  // if (uargs.keys[0] && uargs.keys[0][0] === '_') disqus(uargs.keys[0][0].slice(1))
}

window.disqus_config = function () {
  // this.page.url = `${window.location.origin}?_${id}`
  const url = window.location.href
  this.page.url = url
  // this.page.identifier = id
  this.page.identifier = url.includes('?') ? url.split('?')[1] : '/'
}

function disqus (id) {
  wand.$('<noscript/>').html('Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a>')
  const d = document
  const s = d.createElement('script')
  s.src = 'https://aeterni.disqus.com/embed.js'
  s.setAttribute('data-timestamp', +new Date())
  const asec = (d.head || d.body)
  asec.appendChild(s)
}
window.disqus = disqus

function lang (ft2) {
  // const ft = wand.$('<div/>', { id: 'afooter', css: { width: '100%', display: 'flex', 'white-space': 'nowrap', 'overflow-x': 'auto' } }).appendTo('body')
  // wand.$('<div/>', { class: 'notranslate', css: { display: 'inline-block', 'margin-left': '30%', float: 'left' } }).appendTo(ft).html('language:')
  wand.$('<div/>', { css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft2).html(' / lang: ')
  // wand.$('<div/>', { id: 'google_translate_element', class: 'notranslate', css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo('body').hide()
  const ft = wand.$('<div/>', {
    id: 'afooter2',
    css: {
      display: 'flex',
      // 'white-space': 'nowrap',
      // 'overflow-x': 'auto',
      // margin: '0 auto',
      // padding: '8px',
      // height: '100%',
      width: '100%'
    }
  }).appendTo(ft2)
  wand.$('<div/>', { id: 'google_translate_element' }).appendTo('body').hide()
  wand.$('<script/>', {
    type: 'text/javascript',
    src: '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  }).appendTo('body')
  // const adiv = wand.$('<div/>', { class: 'flag' }).appendTo(ft)
  wand.$('<div/>', {
    class: 'flag_link eng',
    'data-lang': 'en',
    css: {
    //   flex: '33.3%'
    }
  }).appendTo(ft)
    .append(wand.$('<img/>', {
      // src: 'assets/flags/uk.png',
      class: 'fimg',
      src: 'assets/flags/uk2.svg',
      css: {
        // display: 'inline',
        // width: '50%',
        // flex: '33.3%',
        // margin: '0 100%',
        // height: '100%'
        height: ft2.height()
      }
    }))
  wand.$('<div/>', {
    class: 'flag_link por',
    'data-lang': 'pt',
    css: {
      // flex: '33.3%'
    }
  }).appendTo(ft)
    .append(wand.$('<img/>', {
      // src: 'assets/flags/br.png',
      class: 'fimg',
      src: 'assets/flags/br2.svg',
      css: {
        // display: 'inline',
        // width: '50%',
        // margin: '0 100%',
        // height: '100%'
        height: ft2.height()
      }
    }))
  const afun = e => {
    // Array.prototype.forEach.call(iels, e => { e.style.backgroundColor = '' })
    // window.eee = e
    // e.firstChild.style.backgroundColor = '#ccc'
    Array.prototype.forEach.call(iels, e => { e.style.border = '' })
    window.eee = e
    e.firstChild.style.border = '1px solid #555'
    const lang = e.getAttribute('data-lang')
    const languageSelect = document.querySelector('select.goog-te-combo')
    languageSelect.value = lang
    languageSelect.dispatchEvent(new window.Event('change'))
  }
  const iels = document.getElementsByClassName('fimg')
  const els = document.getElementsByClassName('flag_link')
  window.elss = els
  Array.prototype.forEach.call(els, function (e) {
    e.addEventListener('click', function () {
      afun(e)
      afun(e)
    })
  })
}

e.timeArgument = () => {
  const dd = new Date()
  const d_ = e.urlArgument('s')
  if (d_) {
    const d = d_.split(':')
    dd.setHours(d[0])
    dd.setMinutes(d.length > 1 ? d[1] : 0)
    dd.setSeconds(d.length > 2 ? d[2] : 0)
  } else {
    dd.setMinutes(dd.getMinutes() + 1)
    dd.setSeconds(0)
  }
  dd.setMilliseconds(0)
  return dd
}
