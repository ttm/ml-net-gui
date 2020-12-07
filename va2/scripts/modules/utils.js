const e = module.exports
const $ = require('jquery')

e.mkGrid = (cols, el, w, bgc) => {
  return $('<div/>', {
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

e.defaultArg = (arg, def) => arg === undefined ? def : arg
