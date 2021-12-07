const $ = require('jquery')
const chroma = require('chroma-js')

const net = require('../net.js')
const transfer = require('../transfer.js')
const u = require('../router.js').urlArgument
const utils = require('../utils.js')
const { PIXI, defaultLinkRenderer, mkIds } = require('./utils.js')

const copyToClipboard = utils.copyToClipboard

module.exports.Tithorea = class {
  constructor () {
    const app = this.app = window.wand.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight * 0.9,
      backgroundColor: 0x000000
    })
    app.stage.sortableChildren = true
    document.body.appendChild(app.view)
    if (u('id') || u('cid')) {
      (u('id') ? transfer.fAll.mark({ 'userData.id': u('id') }) : transfer.fAll.aeterni({ comName: u('cid') })).then(r => {
        this.source = 'fb'
        const foo = u('id') ? 'net' : 'network'
        const anet = r[0][foo]
        const pfm = this.pfm = net.plotFromMongo(anet, app, u('deg'))
        const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
        pfm.dn = dn
        this.setup(r)
      })
    } else if (u('whats')) {
      this.source = 'whats'
      transfer.fAll.ttm({ marker: u('whats') }).then(r => {
        if (r.length === 0) return window.alert('data has been deleted')
        const pfm = this.pfm = net.plotWhatsFromMongo(r[0].data, r[0].creator, app, u('full') !== null)
        const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
        pfm.dn = dn
        this.setup(r)
      })
    }
  }

  setup (r) {
    this.data = r
    this.net = this.pfm.net
    this.arrows = []
    this.mkNodesReact()
    this.setDesc()
    this.mkButtons()
    $('#loading').hide()
  }

  mkButtons () {
    utils.mkBtn('file-medical-alt', 'describe the sync', () => {
      $('#myModal').show()
    })
  }

  mkNodesReact () {
    this.net.forEachNode((n, a) => {
      a.textElement.on('pointerdown', () => {
        if (this.theSeed === n) return this.consolidateDiff()
        this.theSeed = n
        this.net.forEachNode((n, a) => {
          a.pixiElement.tint = 0x00ffff
        })
        a.pixiElement.tint = 0xff0000
        this.diffusion = this.seededNeighborsLinks()
        this.arrows.forEach(a => a.destroy())
        this.arrows = []
        this.net.forEachEdge((e, a) => { a.pixiElement.alpha = 0 })
        this.diffusion.progressionLinks.forEach(step => {
          step.forEach(link => {
            this.arrows.push(defaultLinkRenderer(link, this.net, this.app))
            this.net.getEdgeAttribute(link.from, link.to, 'pixiElement').alpha = 1
          })
        })
        const cs = chroma.scale(['red', 'yellow', 'green', 'cyan', 'blue', '#ff00ff']).colors(this.diffusion.progression.length, 'num')
        this.diffusion.progression.forEach((nodes, i) => {
          const c = cs[i]
          nodes.forEach(n => {
            this.net.getNodeAttribute(n, 'pixiElement').tint = c
            this.net.getNodeAttribute(n, 'pixiElement').alpha = 1
            this.net.setNodeAttribute(n, 'stepColor', c)
          })
        })
      })
    })
  }

  seededNeighborsLinks (nneighbors = 4) { // adapted from va.netscience.diffusion
    const net = this.net
    net.setNodeAttribute(this.theSeed, 'started', true)
    let seeds = [this.theSeed]
    const progression = [seeds]
    const progressionLinks = []
    while (seeds.length !== 0) {
      const newSeeds = []
      const progressionLinks_ = []
      seeds.forEach(s => {
        const candidates = []
        net.forEachNeighbor(s, (nn, na) => {
          if (!na.started) {
            candidates.push({ n: nn, d: na.degree })
          }
        })
        candidates.sort((i, j) => Math.random()).sort((i, j) => i.d - j.d).slice(0, nneighbors).forEach(c => {
          net.setNodeAttribute(c.n, 'started', true)
          newSeeds.push(c.n)
          progressionLinks_.push({ from: s, to: c.n })
        })
      })
      progression.push(newSeeds)
      progressionLinks.push(progressionLinks_)
      seeds = newSeeds
    }
    net.forEachNode((n, a) => {
      delete a.started
    })
    return { progression, progressionLinks }
  }

  consolidateDiff () {
    if (!window.confirm('all set to register a sync?')) return
    const nodes = []
    let absorb = (n, a) => nodes.push({ name: n, tel: a.tel })
    if (this.source === 'fb') absorb = (n, a) => nodes.push({ id: n, name: a.name, nid: a.nid, sid: a.sid })
    this.net.forEachNode((n, a) => absorb(n, a))
    // nodes.forEach((n, i) => { n.did = i })
    this.ids_ = mkIds(nodes, this.source)
    this.toBeWritten = {
      source: this.source,
      desc: this.descArea.val(),
      syncId: this.syncIdInput.val(),
      links: this.diffusion.progressionLinks,
      nodes
    }
    // get text to be diffused, and get an ID (e.g. love)
    $('#loading').show()
    const tbw = this.toBeWritten
    transfer.fAll.wf4b(tbw).then(r => { // todo: check if syncId is already in use
      $('#loading').hide()
      const id = tbw.links[0][0].from
      // const did = nodes.filter(i => (tbw.source === 'fb' ? i.id : i.name) === id)[0].did2
      const did = this.ids_[id]
      const link = `${window.location.origin}?${tbw.syncId}=${did}`
      window.alert(`sync created! Link to it: ${link}`)
      copyToClipboard(link)
    }).catch(e => window.alert('not written', e))
    console.log('tbw', this.toBeWritten)
  }

  setDesc () {
    const diag2 = $('<div/>', {
      id: 'diag2',
      css: {
        'background-color': 'white'
      }
    })

    const templates = [
      'daba',
      'loto'
    ]
    let counter = 0
    $('<button/>').html('template change').on('click', () => {
      this.descArea.val(templates[++counter % templates.length])
    }).appendTo(diag2)

    this.syncIdInput = $('<input/>', { placeholder: 'love' }).appendTo(diag2)
    this.descArea = $('<textarea/>', {
      maxlength: 1200,
      css: {
        'background-color': 'white',
        margin: 'auto',
        width: '50%',
        height: '50%'
      }
    }).on('keydown', () => {
      // dcount.html(this.descArea.val().length + ' / 500')
    }).html(templates[0]).appendTo(diag2)

    $('#mcontent').html('write the HTML you want to diffuse:').append(diag2)
  }
}
