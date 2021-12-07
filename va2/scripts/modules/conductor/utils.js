/* global wand */
const e = module.exports
const PIXI = e.PIXI = require('pixi.js')
const linkify = require('linkifyjs/html')

e.nl = {
  header: name => wand.speaksPortuguese ? `Olá, ${name}, há uma música feita para você e sobre você!` : `Hi ${name}, there is a song made for you and about you!`,
  listen: () => wand.speaksPortuguese ? 'Ok, quero ouvir minha música agora!' : 'Okay, I want to hear my music now!',
  song: sname => wand.speaksPortuguese ? `A música se chama <b>${sname}</b> e chegou junto a uma pequena mensagem de quem muito te admira:` : `The song is called <b>${sname}</b> and came with a small message from someone who admires you a lot:`,
  leaf0: () => wand.speaksPortuguese ? 'Parabéns, você é sucessor final da sincronização!' : 'Congratulations, you are a ultimate successor of the sync!',
  leaf: (tseedName, pName) => wand.speaksPortuguese
    ? `
  Avise o iniciador da sincronização que você, herdeiro final, recebeu sua música e mensagem.
  O nome delæ é ${tseedName}.

  Você também pode querer avisar seu/sua predecessor(a), ${pName}, que você é herdeiro final!
  `
    : `
  Notify the sync initiator that you, ultimate heir, have received your music and message.
   His name is ${tseedName}

   You might also want to let your predecessor ${pName} know that you are the final heir!
  `,
  succLinks: () => wand.speaksPortuguese ? 'Repasse as músicas dos seus sucessores para eles mesmos e ajude nesta sincronização social:' : 'Forward your successors\' songs to themselves and help in this social synchronization:',
  finall: (rec, name) => wand.speaksPortuguese ? `clique para ${rec ? 'baixar' : 'gravar'} o clipe da sua música, ${name}.` : `click to ${rec ? 'download' : 'record'} your music video, ${name}.`

}

e.defaultLinkRenderer = (link, net, app) => { // adapted from va.drawing.base
  // first, let's compute normalized vector for our link:
  const p1 = net.getNodeAttribute(link.from, 'pixiElement')
  const p2 = net.getNodeAttribute(link.to, 'pixiElement')
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const l = Math.sqrt(dx * dx + dy * dy)

  if (l === 0) return // if length is 0 - can't render arrows

  // This is our normal vector. It describes direction of the graph
  // link, and has length == 1:
  const nx = dx / l
  const ny = dy / l

  // Now let's draw the arrow:
  const arrowLength = 13 // 26 // Length of the arrow
  const arrowWingsLength = 6 // 12 // How far arrow wings are from the link?

  // This is where arrow should end. We do `(l - NODE_WIDTH)` to
  // make sure it ends before the node UI element.
  const NODE_WIDTH = 15
  const ex = p1.x + nx * (l - NODE_WIDTH)
  const ey = p1.y + ny * (l - NODE_WIDTH)

  // Offset on the graph link, where arrow wings should be
  const sx = p1.x + nx * (l - NODE_WIDTH - arrowLength)
  const sy = p1.y + ny * (l - NODE_WIDTH - arrowLength)

  // orthogonal vector to the link vector is easy to compute:
  const topX = -ny
  const topY = nx

  // Let's draw the arrow:
  const graphics = new PIXI.Graphics()
  // graphics.lineStyle(1, 0xcccccc, 1)
  graphics.lineStyle(1, 0xcccccc, 1)

  graphics.moveTo(ex, ey)
  graphics.lineTo(sx + topX * arrowWingsLength, sy + topY * arrowWingsLength)
  graphics.moveTo(ex, ey)
  graphics.lineTo(sx - topX * arrowWingsLength, sy - topY * arrowWingsLength)
  app.stage.addChild(graphics)
  graphics.zIndex = 20000
  return graphics
}

function mkLink (p1, p2, color, app) {
  const graphics = new PIXI.Graphics()
  // graphics.lineStyle(1, 0xcccccc, 1)
  graphics.lineStyle(3, color, 1)

  graphics.moveTo(p1.x, p1.y)
  graphics.lineTo(p2.x, p2.y)
  app.stage.addChild(graphics)
  return graphics
}

function mklink (i, c1, c2, dx, dy, app, color) {
  const p = i / 10
  const x = c1[0] * (1 - p) + c2[0] * p
  const y = c1[1] * (1 - p) + c2[1] * p
  const p1 = { x: x + dx, y: y + dy }
  const p2 = { x: x - dx, y: y - dy }
  const link = mkLink(p1, p2, color || 0x00ff00, app)
  setTimeout(() => { link.destroy() }, 100 * i)
}

e.activateLink = (p1, p2, app, color) => {
  const c1 = [p1.x, p1.y]
  const c2 = [p2.x, p2.y]
  const slope = (c1[1] - c2[1]) / (c1[0] - c2[0])
  const orthSlope = -1 / slope
  const size = 5
  const dx = size / Math.sqrt(1 + orthSlope ** 2)
  const dy = orthSlope * dx
  for (let i = 0; i < 10; i++) {
    setTimeout(() => { mklink(i, c1, c2, dx, dy, app, color) }, 100 * i)
  }
}

e.xmur3 = str => {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = h << 13 | h >>> 19
  }
  return function () {
    h = Math.imul(h ^ h >>> 16, 2246822507)
    h = Math.imul(h ^ h >>> 13, 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

e.mulberry32 = a => {
  return function () {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

e.seededRand = str => {
  const seed = e.xmur3(str)
  return e.mulberry32(seed())
}

e.rec = () => {
  const actx = window.Tone.context
  const dest = actx.createMediaStreamDestination()
  window.Tone.Master.connect(dest)

  const canvas = window.wand.app.view // document.querySelector('canvas')
  const stream = canvas.captureStream(30)

  const combined = new window.MediaStream([...dest.stream.getTracks(), ...stream.getTracks()])
  let recorder = {}
  if (window.MediaRecorder !== undefined) {
    recorder = new window.MediaRecorder(combined, { mimeType: 'video/webm' })
  }

  let chunks = []
  recorder.ondataavailable = evt => { chunks.push(evt.data) }
  recorder.onstop = function () {
    const blob = new window.Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = (this.filename || 'test') + '.webm'
    // a.click()
    recorder.aa = a
    // window.URL.revokeObjectURL(url)
  }
  recorder.astart = function () {
    if (recorder.state === 'inactive') {
      chunks = []
      this.start()
    }
  }
  recorder.astop = function () {
    if (recorder.state === 'recording') {
      this.stop()
    } else {
      window.alert('Use a media recording capable browser (such as Firefox or Chrome), or enable media recording (for example if using Safari), to download the audiovisual performance')
    }
  }
  return recorder // use start(), stop() (which will trigger download)
}

e.linkify2 = link => linkify(`<span class="notranslate">${link}<span>`)

e.mkIds = (nodes, source) => {
  const ids = []
  const ids_ = {}
  const names = nodes.map(n => {
    return {
      name: n.name,
      id: source === 'fb' ? n.id : n.name
    }
  })
  names.sort((a, b) => { // todo: find alternative to Whats/Telegram
    if (a.name > b.name) return -1
    if (a.name < b.name) return 1
    if (a.id > b.id) return -1
    if (a.id < b.id) return 1
    return 0
  })
  for (let ii = 0; ii < nodes.length; ii++) {
    const n = names[ii]
    const parts = n.name.split(' ')
    let i = 0
    let made = false
    let did2 = parts[0]
    do {
      if (!ids.includes(did2)) {
        ids.push(did2)
        ids_[n.id] = did2
        made = true
      } else {
        if (parts.length >= ++i) {
          did2 = did2 + '.' + parts[i]
        } else {
          did2 = did2 + '.' + ids.reduce((a, e) => a + (e === did2), 0)
        }
      }
    } while (!made)
  }
  return ids_
}
