const e = module.exports
const $ = require('jquery')
const monk = require('./monk')

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

e.gridDivider = (r, g, b, grid, sec, after, count) => {
  const fun = after ? 'insertAfter' : 'appendTo'
  count = count || 2
  for (let i = 0; i < count; i++) {
    $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).text('--')[fun](grid)
  }
  // if (!after) {
  //   $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
  //   return $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},${d(sec, 0)})`, color: 'rgba(0,0,0,0)', height: '3px' } }).appendTo(grid).text('--')
  // } else {
  //   $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},1)`, color: 'rgba(0,0,0,0)', height: '3px' } }).insertAfter(after).text('--')
  //   return $('<div/>', { css: { 'background-color': `rgba(${r},${g},${b},${d(sec, 0)})`, color: 'rgba(0,0,0,0)', height: '3px' } }).insertAfter(after).text('--')
  // }
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

e.inplaceShuffle = (array, inplace = true) => {
  if (!inplace) {
    array = array.slice()
  }
  // Fisher-Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

e.rotateArray = (array, forward = true) => {
  if (forward) {
    array.unshift(array.pop())
  } else {
    array.push(array.shift())
  }
}

e.permutations = {
  shuffle: e.inplaceShuffle,
  rotateForward: e.rotateArray,
  rotateBackward: a => e.rotateArray(a, false),
  reverse: a => a.reverse(),
  none: a => a
}

const groups = `
<a href="https://www.facebook.com/groups/arcturianart" target="_blank">AAA</a>,
<a href="https://www.facebook.com/groups/mentaliz" target="_blank">MMM</a>,
<a href="https://chat.whatsapp.com/BztLyvWDEgW3C1mjXZTTrP" target="_blank">WM</a>`

e.stdMsg = () => {
  if (window.wand.country === 'BR') {
    return `

<h2>Fortaleça o seu Corpo de Luz</h2>

algumas ideias:

<ul>
<li>escreva relatando como tem sido as sessões para você: elas tem te ajudado? De que forma?</li>
<li>Incentive outros membros a escreverem relatos das experiências deles.</li>
<li>Traga pessoas para vibrarem no Corpo de Luz.</li>
<li>Ajude a manter/gerir um dos grupos existentes (e.g. ${groups}).</li>
<li>Crie um novo grupo.</li>
<li>Crie Artefatos Audiovisuais para serem usados nas sessões.</li>
<li>Aproxime uma pessoa ou entidade que possa ter interesse especial na iniciativa.</li>
<li>Gere mídia sobre o Corpo de Luz (postagens, artigos jornalísticos...).</li>
<li>Divulgue sobre o grupo ou trabalho.</li>
<li>Doe ou ajude a arrecadar financeiramente (transfira para a chave PIX <b>luz</b> ou verifique <a href="?angel" target="_blank">as alternativas</a>).</li>
<li>Ore para o Corpo de Luz e para o mundo.</li>
<li>Cuide-se muito bem.</li>
<li>Sugira mudanças sobre como conduzir o Corpo de Luz.</li>
</ul>

Faça contato!<br>
Luz e Paz ~
`
  }
  return `
<h2>Strengthen your Lightbody</h2>

some ideas:

<ul>
<li>write about how the sessions have been for you: have they helped you? In what way?</li>
<li>Encourage other members to write an account of their experiences.</li>
<li>Bring people to vibrate in the body of Light.</li>
<li>Help to maintain / manage one of the existing groups (e.g. ${groups}).</li>
<li>Create a new group.</li>
<li>Create Audiovisual Artifacts to be used in the sessions.</li>
<li>Contact a person or entity that may be interested in the initiative.</li>
<li>Generate media about the body of Light (posts, journalistic articles ...).</li>
<li>Publicize a group or work.</li>
<li>Donate or help raise money financially (transfer to PIX <b>luz</b> or check <a href="luz" target="_blank">the alternatives</a>).</li>
<li>Pray for the Lightbody and the world.</li>
<li>Take very good care of yourself.</li>
<li>Suggest changes on how to conduct the Lightbody.</li>
</ul>

Make contact!<br>
Light & Peace ~

`
}

e.mkModal = content => {
  $('<div/>', {
    id: 'myModal',
    class: 'modal',
    role: 'dialog',
    css: {
      'overflow-y': 'initial !important'
    },
    show: {
      effect: 'fade',
      duration: 2000
    },
    hide: {
      effect: 'fade',
      duration: 2000
    }
  }).appendTo('body')
    .append($('<div/>', {
      class: 'modal-content',
      css: {
        background: e.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0],
        height: window.innerHeight * 0.75,
        'overflow-y': 'auto'
      }
    })
      .append($('<span/>', { class: 'close' }).html('&times;')
        .on('click', () => {
          $('#myModal').hide().css('display', 'none')
        })
      )
      .append($('<p/>', { id: 'mcontent' }))
      .append($('<p/>', { id: 'mfeedback' }))
    )
  window.onclick = function (event) {
    if (event.target === $('#myModal')[0]) {
      $('#myModal').hide().css('display', 'none')
    }
  }
  $('#mcontent').html(`
  ${content || e.stdMsg}
  <br><br><br>:::
  `)
  const descArea = $('<textarea/>', {
    maxlength: 3200,
    css: {
      'background-color': 'white',
      margin: 'auto',
      width: '50%',
      height: '10%'
    }
  }).appendTo('#mfeedback')
  $('<button/>', { css: { margin: '1%' } }).html('Send / Enviar Feedback').on('click', () => {
    window.wand.transfer.fAll.ucosta(
      { _id: window.sessionL.insertedId },
      { feedback: descArea.val() }
    ).then(r => {
      descArea.val('')
      window.alert('Thank you / Obrigado.')
    })
  }).appendTo('#mfeedback')
  return {
    show: (ms, msg) => {
      // $('#mcontent').html((msg || e.stdMsg()) + '<br><br><br>:::')
      $('#mcontent').html((msg || e.stdMsg()))
      $('#myModal').fadeIn(ms || 'slow') // show() // .css('display', 'block')
      $('#contribL').fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200)
    },
    hide: () => {
      $('#myModal').hide().css('display', 'none')
    }
  }
}

e.confirmExit = () => {
  window.wand.unloadFuncs.push(e => {
    e = e || window.event
    // For IE and Firefox prior to version 4
    if (e) {
      e.returnValue = 'Any string'
    }
    // For Safari
    return 'Any string'
  })
}

const reduce = dur => [Math.floor(dur / 60), Math.floor(dur % 60)]
const p = num => num < 10 ? '0' + num : num
e.secsToTime = secs => {
  secs = Math.abs(secs)
  let [minutes, seconds] = reduce(secs)
  let hours = ''
  if (minutes > 59) {
    [hours, minutes] = reduce(minutes)
    hours += ':'
  }
  return `${hours}${p(minutes)}'${p(seconds)}"`
}

e.mobileAndTabletCheck = () => {
  let check = false
  const a = navigator.userAgent || navigator.vendor || window.opera
  if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0, 4))) check = true
  if (!check) {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    return (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1)
  }
  return true
}

const d = e.defaultArg = (arg, def) => arg === undefined ? def : arg

const nomeMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
e.dataFormatada = d => {
  const data = new Date(d)
  const dia = data.getDate()
  const mes = nomeMeses[data.getMonth()]
  const ano = data.getFullYear()

  const h = data.getHours()
  const m = data.getMinutes()
  return `${h}h${m} (GMT-3, ${[dia, mes, ano].join('/')})`
}

e.formatTheme = s => {
  s = s.replaceAll('_', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

e.getPhrase = () => {
  const l1 = [
    'Respiração diafragmática (pela barriga, peito parado), lenta.',
    'Postura livre mas de preferência com coluna ereta, seja deitada ou sentada ou de pé.',
    'Garanta que tenha entendido como ativar o artefato, porque usá-lo e o que esperar das sessões de MMM.'
  ]
  const l2 = [
    'Aquiete a mente.',
    'Concentre-se no tema.',
    'Mesmo durante os dias, quanto menos o pensamento estiver solto, mais energia (e recursos, vitaminas) sobra para o corpo se curar e rejuvenescer.',
    'Quanto menos os pensamentos estiverem desvairados, mais permissões e responsabilidades espirituais são concedidas a nós.'
  ]
  const l3 = [
    'Cure-se e manifeste melhoras para si, nossas famílias e mundo todo.',
    'Harmonize a respiração e o sistema nervoso.',
    'Vibre no corpo de Luz.',
    'Pratique a caridade constantemente.',
    'As sessões devem sempre ser feitar em conjuntos, mínimo de 3. A pessoa deve ir pensando no objetivo das próximas (ou atuais) 3 sessões dela.'
  ]
  const l = l1.concat(l2).concat(l3)
  console.log(l)
  return monk.verses().then(() => {
    window.bpt = monk.biblePt.map(i => `"${i.text}" (${i.ref})`)
    window.vall = window.bpt.concat(l)
    return window.vall
  })
}

e.lastWords = () => {
  // frutos e dons do espírito
  const frutos = [
    'Amor',
    'Alegria',
    'Paz',
    'Paciência',
    'Amabilidade',
    'Bondade',
    'Fidelidade',
    'Mansidão',
    'Domínio próprio'
  ]
  const dons = [
    'Fortaleza',
    'Sabedoria',
    'Entendimento',
    'Conselho',
    'Poder',
    'Conhecimento',
    'Piedade'
  ]
  const extra = [
    'Discernimento',
    'Profecia',
    'Cura',
    'Milagre',
    'Fé',
    'Conhecimento',
    'Generosidade',
    'Ânimo',
    'Dons',
    'Perdão',
    'Graça',
    'Justiça',
    'Perseverança',
    'Virtude',
    'Fraternidade'
  ]
  const all = frutos.concat(dons).concat(extra)
  return () => e.chooseUnique(all, 2).join(' e ')
}

e.basicStats = function () {
  const St = require('stats.js')
  const stats = new St()
  stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  this.tasks = [] // list of routines to execute
  this.executing = true
  this.animate = () => {
    stats.begin()
    // monitored code goes here
    for (let i = 0; i < this.tasks.length; i++) {
      this.tasks[i]()
    }
    stats.end()
    if (this.executing) {
      window.requestAnimationFrame(this.animate)
    }
  }
  this.animate()
  return this
}

e.mobileError = () => {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const string = msg.toLowerCase()
    const substring = 'script error'
    if (string.indexOf(substring) > -1) {
      window.alert('Script Error: See Browser Console for Detail')
    } else {
      const message = [
        'Message: ' + msg,
        'URL: ' + url,
        'Line: ' + lineNo,
        'Column: ' + columnNo,
        'Error object: ' + JSON.stringify(error)
      ].join(' - ')
      window.alert(message)
    }
  }
}

e.users = {
  bana: 'Fabbri',
  mariel22: 'Mariel',
  om33: 'Otávio',
  renus: 'S\'Huss'
}

e.mongoIdToRGB = mid => {
  if (typeof mid === 'object') {
    const max = 255 * 3
    const sum = (x, y) => 255 * mid.id.slice(x, y).reduce((a, i) => a + i, 0) / max
    const r = sum(0, 4)
    const g = sum(4, 8)
    const b = sum(8, 12)
    return [r, g, b]
  }
  const c = (x, y) => { // deterministic chaos:
    const slice = mid.slice(x, y)
    let num = 0
    for (let i = 0; i <= slice.length - 2; i++) {
      num += parseInt(slice.slice(i, i + 2), 16)
    }
    return (1 + Math.sin(100000 * num)) * 255 * 0.5
  }
  const r = c(0, 8)
  const g = c(8, 16)
  const b = c(16, 24)
  return [r, g, b]
}

e.mkBtn = (iclass, title, fun, ref, count, size) => {
  const fid = iclass
  const btn = $('<button/>', {
    class: 'btn tooltip',
    id: `${fid}-button${(count || '')}`,
    click: fun,
    css: {
      height: (size || 4) + '%',
      width: (size || 4) + '%',
      'margin-left': '1%',
      'border-radius': '8px',
      cursor: 'pointer'
    }
  })
  if (!ref) {
    btn.prependTo('body')
  } else {
    btn.insertAfter(ref)
  }
  $('<i/>', { class: 'fa fa-' + iclass, id: `${fid}-icon` }).appendTo(btn)
  btn.mtooltip = $('<span/>', { class: 'tooltiptext' }).text(title).appendTo(btn)
  return btn
}

e.objectIdWithTimestamp = timestamp => { // db.mycollection.find({ _id: { $gt: objectIdWithTimestamp('1980/05/25') } })
  if (typeof timestamp === 'string') timestamp = new Date(timestamp)
  /* Convert date object to hex seconds since Unix epoch */
  const hexSeconds = Math.floor(timestamp / 1000).toString(16)

  /* Create an ObjectId with that hex timestamp */
  return new window.wand.transfer.ss.BSON.ObjectId(hexSeconds + '0000000000000000')
}

e.chroma = require('chroma-js')
e.colorNames = Object.keys(e.chroma.colors)
e.randScale1 = (bezier = false) => {
  const colors = e.chooseUnique(e.colorNames, 2 + Math.floor(Math.random() * 3))
  console.log('yeah, here1', bezier)
  const s = e.chroma[bezier ? 'bezier' : 'scale'](colors)
  s.colors_ = colors
  s.bezier_ = bezier
  return s
}
e.brewerNames = Object.keys(e.chroma.brewer)
e.randScale2 = (bezier = false) => {
  const brewer = e.chooseUnique(e.brewerNames, 1)[0]
  const colors = e.chroma.brewer[brewer]
  console.log('yeah, here', bezier)
  const s = e.chroma[bezier ? 'bezier' : 'scale'](bezier ? e.chooseUnique(colors, 5) : colors)
  s.colors_ = colors
  s.bezier_ = bezier
  s.brewer_ = brewer
  return s
}

e.copyToClipboard = require('copy-to-clipboard')
