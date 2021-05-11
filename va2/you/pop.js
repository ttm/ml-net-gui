const $ = require('jquery')
const { stdDiv, mkGrid, gridDivider, chooseUnique } = require('../scripts/modules/utils.js')
// test if popup script can:
//  1) load libs such as graphology OK
//  2) i/o mongo OK
//  3) scrape fb OK
//  4) chrome storage OK

const adiv = stdDiv('80%').html(`
<h2>Æterni Anima's <b>You</b> extension</h2>
`)
const grid = mkGrid(2, adiv, '100%', chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

const logbut = $('<button/>', {
  id: 'lbut',
  css: {
    width: '75%',
    background: 'lightyellow'
  }
}).appendTo('body').html('Login / Grow')

const seebut = $('<button/>', {
  id: 'lbut',
  css: {
    width: '75%',
    background: 'lightgreen'
  }
}).appendTo('body').html('See yourself').attr('disabled', true)

logbut.click(() => {
  window.chrome.runtime.sendMessage({ step: 'login', background: true })
})

seebut.click(() => {
  window.chrome.runtime.sendMessage({ step: 'see', background: true })
})

function add (name, dict, attr) {
  attr = attr || name
  $('<span/>').html(name + ':').appendTo(grid)
  $('<span/>').html(dict[attr]).appendTo(grid)
}

window.chrome.storage.sync.get(
  ['userDataaa', 'metaData'],
  ({ userDataaa, metaData }) => {
    if (!userDataaa || !metaData) {
      // window.alert('login a allow You to grow')
      $('<span/>').html('login to').appendTo(grid)
      $('<span/>').html('grow yourself.').appendTo(grid)
      $('<span/>').html('grow to').appendTo(grid)
      $('<span/>').html('grow see yourself.').appendTo(grid)
      $('<span/>').html('see to').appendTo(grid)
      $('<span/>').html('cure.').appendTo(grid)
    }
    add('name', userDataaa)
    if (userDataaa.codename) add('codename', userDataaa)
    add('id', userDataaa)
    gridDivider(160, 160, 160, grid, 1)
    add('friends', metaData)
    add('friendships', metaData)
    add('scrapped', metaData)
    if (userDataaa.id) seebut.attr('disabled', false)
  }
)
