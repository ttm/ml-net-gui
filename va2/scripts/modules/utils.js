const e = module.exports
const $ = require('jquery')

e.mkGrid = (cols) => {
  return $('<div/>', {
    css: {
      display: 'grid',
      'grid-template-columns': Array(cols).fill('auto').join(' '),
      'background-color': '#21F693',
      padding: '8px',
      margin: '0 auto',
      // height: Math.floor(wand.artist.use.height * 0.065) + 'px',
      width: '30%'
    }
  }).appendTo('body')
}

e.defaultArg = (arg, def) => arg === undefined ? def : arg
