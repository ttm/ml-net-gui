/* global wand */
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

e.mkFooter = () => {
  const ft = wand.$('<div/>', {
    id: 'afooter',
    css: {
      display: 'flex',
      'white-space': 'nowrap',
      'overflow-x': 'auto',
      margin: '0 auto',
      padding: '8px',
      width: '50%'
    }
  }).appendTo('body')
  const lflag = urlArgument('lang') ? `&lang=${urlArgument('lang')}` : ''
  wand.$('<a/>', {
    href: `?page=about${lflag}`,
    target: '_blank',
    css: {
      'margin-left': '1%',
      display: 'inline-block',
      float: 'left'
    }
  }).html('about <b>aeterni</b>').appendTo(ft)
  wand.$('<div/>', { class: 'notranslate', css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft).html(' / ')
  wand.$('<a/>', {
    href: `?page=donate${lflag}`,
    target: '_blank',
    css: {
      'margin-left': '1%',
      display: 'inline-block',
      float: 'left'
    }
  }).html('support this initiative').appendTo(ft)
}
