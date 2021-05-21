const $ = window.$ = require('jquery')
const { stdDiv, mkGrid, gridDivider, chooseUnique } = require('../scripts/modules/utils.js')
// test if popup script can:
//  1) load libs such as graphology OK
//  2) i/o mongo OK
//  3) scrape fb OK
//  4) chrome storage OK

const ad = stdDiv('80%')
$('<input/>', { value: 'fb', id: 'ofb', type: 'radio', name: 'oradio' }).appendTo(
  $('<label/>', { for: 'ofb' }).html('Facebook').appendTo(ad))
$('<input/>', { value: 'whats', id: 'owhats', type: 'radio', name: 'oradio' }).appendTo(
  $('<label/>', { for: 'owhats' }).html('Whatsapp').appendTo(ad))
$('<input/>', { value: 'tele', id: 'otele', type: 'radio', name: 'oradio' }).appendTo(
  $('<label/>', { for: 'otele' }).html('Telegram').appendTo(ad))
$('input[type=radio][name=oradio]').on('change', function () {
  const option = $(this).val()
  window.chrome.storage.sync.set({ option }, () => {
    view(option)
  })
})

const optionsLoaded = []
function view (opt) {
  if (opt === 'fb') {
    adiv.show() && adiv2.hide() && getWhats.hide() && logbut.show() && seebut.show() && adiv3.hide() && autobut.show()
    if (optionsLoaded.includes(opt)) return
    window.chrome.storage.sync.get(
      ['userDataaa', 'metaData', 'lastScrapped', 'sround'],
      ({ userDataaa, metaData, lastScrapped, sround }) => {
        if (!userDataaa || !metaData) {
          // window.alert('login a allow You to grow')
          $('<span/>').html('login to').appendTo(grid)
          $('<span/>').html('grow yourself.').appendTo(grid)
          $('<span/>').html('grow to').appendTo(grid)
          $('<span/>').html('see yourself.').appendTo(grid)
          $('<span/>').html('see to').appendTo(grid)
          $('<span/>').html('cure.').appendTo(grid)
          return
        }
        add('name', userDataaa)
        if (userDataaa.codename) add('codename', userDataaa)
        add('id', userDataaa)
        gridDivider(160, 160, 160, grid, 1)
        add('friends', metaData)
        add('friendships', metaData)
        add('scrapped', metaData)
        if (userDataaa.id) seebut.attr('disabled', false)
        if (lastScrapped !== undefined) {
          $('<span/>').html('previous scrappe:').appendTo(grid)
          $('<span/>').html(mkDate(lastScrapped)).appendTo(grid)
          $('<span/>').html('round:').appendTo(grid)
          $('<span/>').html(sround).appendTo(grid)
        }
      }
    )
  } else if (opt === 'whats') {
    adiv.hide() && adiv2.show() && getWhats.show() && logbut.hide() && seebut.hide() && adiv3.hide() && autobut.hide()
    if (optionsLoaded.includes(opt)) return
    window.chrome.storage.sync.get(
      ['whatsScrapped'],
      ({ whatsScrapped }) => {
        console.log('whatsScrapped:', whatsScrapped)
        if (whatsScrapped && whatsScrapped.length > 0) {
          $('<span/>').html('<b>id</b>').appendTo(grid2)
          $('<span/>').html('<b>when</b>').appendTo(grid2)
          $('<span/>').html('<b>group name</b>').appendTo(grid2)
          gridDivider(160, 160, 160, grid2, 1, false, 3)
          whatsScrapped.forEach(i => addWhatsItem(i))
        }
      }
    )
  } else if (opt === 'tele') {
    adiv.hide() && adiv2.hide() && getWhats.hide() && logbut.hide() && seebut.hide() && adiv3.hide() && getTele.show() && autobut.hide()
  }
  optionsLoaded.push(opt)
}

function addWhatsItem (i) {
  $('<button/>').html(i.marker).appendTo(grid2).click(() => {
    // window.chrome.tabs.create({ url: `http://aeterni.github.io?you&whats=${i.marker}` })
    window.chrome.tabs.create({ url: `http://localhost:8080?you&whats=${i.marker}` })
  })
  $('<span/>').html(mkDate(i.date)).appendTo(grid2)
  $('<span/>').html(i.groupTitle).appendTo(grid2)
}

const adiv = stdDiv('80%').html(`
<h2>Æterni Anima's <b>You</b> extension (<a href="https://youtu.be/ZQFVaB_AbAM" target="_blank">usage</a>)</h2>
`)
const grid = mkGrid(2, adiv, '100%', chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

const adiv3 = stdDiv('80%').html(`
<h2>Whatsapp</h2>
`).hide()

const adiv2 = stdDiv('80%').html(`
<h2>Whatsapp</h2>
`).hide()
$('<label/>', {
  for: 'creator'
}).html('your name: ').appendTo(adiv2).appendTo(adiv3)
$('<input/>', {
  id: 'creator'
}).appendTo(adiv2).on('change', () => {
  console.log('changed name:', $('#creator').val())
  window.chrome.storage.sync.set({ creator: $('#creator').val() })
})
const grid2 = mkGrid(3, adiv2, '100%', chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))

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
}).appendTo('body').html('See yourself (Unlock)').attr('disabled', true)

const wclose = () => setTimeout(() => window.close(), 1000)
const autobut = $('<button/>', {
  id: 'abut',
  css: {
    width: '75%',
    background: 'lightred'
  }
}).appendTo('body').html('Auto scrape each 20 min')

const getWhats = $('<button/>', {
  id: 'wbut',
  css: {
    width: '75%',
    background: 'lightred'
  }
}).appendTo('body').html('Get whats interation').hide()

const getTele = $('<button/>', {
  id: 'wbut',
  css: {
    width: '75%',
    background: 'lightblue'
  }
}).appendTo('body').html('Get telegram interation').hide()

logbut.click(() => {
  window.chrome.runtime.sendMessage({ step: 'login', background: true }, wclose)
})

seebut.click(() => {
  window.chrome.runtime.sendMessage({ step: 'see', background: true })
})

autobut.click(() => {
  window.chrome.runtime.sendMessage({ step: 'auto', background: true }, wclose)
})

getWhats.click(() => {
  if ($('#creator').val() === '') return window.alert('please input your name')
  window.chrome.storage.sync.set({ creator: $('#creator').val() }, () => {
    window.chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      window.chrome.runtime.sendMessage({ step: 'parseWhats', background: true, structs: tab }, wclose)
    })
  })
})

getTele.click(() => {
  if ($('#creator').val() === '') return window.alert('please input your name')
  window.chrome.storage.sync.set({ creator: $('#creator').val() }, () => {
    window.chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      window.chrome.runtime.sendMessage({ step: 'parseTele', background: true, structs: tab }, wclose)
    })
  })
})

function add (name, dict, attr) {
  attr = attr || name
  $('<span/>').html(name + ':').appendTo(grid)
  $('<span/>').html(dict[attr]).appendTo(grid)
}

function mkDate (adate) {
  return new Date(adate).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
  }).replace(/ /, '/').replace(/ /, '/')
}

window.chrome.storage.sync.get(
  ['option', 'creator'], ({ option, creator }) => {
    $('#creator').val(creator)
    console.log('the option:', option)
    option = option || 'fb'
    view(option)
    $('#o' + option).attr('checked', true)
  }
)

window.onunload = () => {
  window.chrome.storage.sync.set({ creator: $('#creator').val() })
}
