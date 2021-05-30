const $ = require('jquery')
const chroma = require('chroma-js')
const Tone = require('tone')
const { PIXI, defaultLinkRenderer, activateLink } = require('./utils.js')

const net = require('../net.js')
const utils = require('../utils.js')
const { generateName } = require('./nameGen.js')

const { amset } = require('./instruments.js')
const d = (f, time) => Tone.Draw.schedule(f, time)

module.exports.Sync = class {
  constructor (data, heir) {
    this.data = data
    // plot stuff
    $('#loading').hide()
    const app = this.app = window.wand.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight * 0.9,
      backgroundColor: 0x000000
    })
    app.stage.sortableChildren = true
    document.body.appendChild(app.view)
    const pfm = this.pfm = net.plotSync(data, app)
    const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
    pfm.dn = dn
    this.net = pfm.net
    this.app = app
    this.heir = parseInt(heir)
    this.setup()
  }

  setup () {
    console.log('yey jowww')
    window.defaultLinkRenderer = defaultLinkRenderer
    this.setProgression()
    // this.hideAll()
    this.setMusic()
    this.setInfo() // when user gives ok on info, music starts
    // make music!
  }

  setInfo () {
    this.setDesc()
  }

  hideAll () {
    this.net.forEachNode((n, a) => { a.pixiElement.alpha = 0 })
    this.net.forEachEdge((n, a) => { a.pixiElement.alpha = 0 })
    this.arrows.forEach(a => { a.alpha = 0 })
  }

  setMusic () {
    window.activateLink = activateLink
    this.amSy = new Tone.AMSynth(amset).toDestination()
    const pe = id => this.net.getNodeAttribute(id, 'pixiElement')
    const steps = [
      { node: pe(this.heirId), note: 'c3' },
      { node: pe(this.predecessor), note: 'g3' }
    ]
    let count = 0
    this.seq = new Tone.Pattern((time, step) => {
      console.log(time, step)
      d(() => {
        step.node.tint = 0xffffff * Math.random()
        activateLink(steps[1].node, steps[0].node, this.app)
        if (++count > 1) {
          this.seq.stop()
          this.setLinks()
        }
      }, time)
      this.amSy.triggerAttackRelease(step.note, '2n')
    }, steps)
    this.seq.interval = '1n'
  }

  setProgression () {
    this.arrows = []
    this.progression = [[this.data.links[0][0].from]]
    this.data.links.forEach((step, i) => {
      const stepNodes = []
      step.forEach(link => {
        this.arrows.push(defaultLinkRenderer(link, this.net, this.app))
        if (!stepNodes.includes(link.to)) stepNodes.push(link.to)
      })
      this.progression.push(stepNodes)
    })
    const cs = chroma.scale(['red', 'yellow', 'green', 'cyan', 'blue', '#ff00ff']).colors(this.progression.length, 'num')
    this.progression.forEach((nodes, i) => {
      const c = cs[i]
      nodes.forEach(n => {
        this.net.getNodeAttribute(n, 'pixiElement').tint = c
        this.net.setNodeAttribute(n, 'stepColor', c)
      })
    })
    this.net.forEachNode((n, a) => {
      if (a.did === this.heir) this.heirId = n
    })
    this.predecessor = this.net.inNeighbors(this.heirId)[0]
    this.successors = this.net.outNeighbors(this.heirId)
  }

  setDesc () {
    const name = this.net.getNodeAttribute(this.heirId, 'name')
    $('<div/>', {
      id: 'myModal2',
      class: 'modal',
      role: 'dialog'
    }).appendTo('body')
      .append($('<div/>', {
        id: 'mcontent0',
        class: 'modal-content',
        css: { background: utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee'], 1)[0] }
      }).html(`<h2>Olá, ${name}, você é herdeiro de uma música feita para você!</h2>`)
        .append($('<p/>', { id: 'mcontent2' }))
      )
    const diag2 = $('<div/>', {
      id: 'diag2'
    })

    $('<button/>').html('Ok!').on('click', () => {
      $('#myModal2').hide(2000)
      this.seq.start(2)
      Tone.Transport.start()
    }).appendTo(diag2)

    const content = `
    <p>A música se chama <b>${generateName(name)}</b>.</p>

    Antes, uma pequena mensagem de quem muito te admira:
    <p style="background:white">${this.data.desc}</p>
    `
    $('#mcontent2').html(content).append(diag2)
    $('#myModal2').show()
  }

  setLinks () {
    $('#mcontent0').html('<h2>Aqui os links para você repassar aos seus sucessores</h2>').append($('<p/>', { id: 'mcontent2' }))
    const links = this.successors.map(i => {
      const { name, did } = this.net.getNodeAttributes(i)
      const link = `${window.location.origin}?${this.data.syncId}=${did}`
      return `<p>${name}: <a href="${link}" target="_blank">${link}</a></p>`
    }).join('')
    console.log(links)
    $('#mcontent2').html(links)
    $('#myModal2').show()
  }
}
