const $ = require('jquery')
const chroma = require('chroma-js')
const Tone = require('tone')
const dat = require('dat.gui')
const subGraph = require('graphology-utils/subgraph')

const { PIXI, defaultLinkRenderer, activateLink, rec, linkify2 } = require('./utils.js')
const { generateName } = require('./nameGen.js')
// const { amset } = require('./instruments.js')

const net = require('../net.js')
const utils = require('../utils.js')

const d = (f, time) => Tone.Draw.schedule(f, time)

// volume OK, rec OK, linkify OK, beautify, spread

module.exports.Sync = class {
  constructor (data, heir) {
    this.isMobile = utils.mobileAndTabletCheck()
    this.data = data
    // plot stuff
    $('#loading').hide()
    const app = this.app = window.wand.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight * 0.9,
      backgroundColor: 0x000000,
      antialias: true
    })
    app.stage.sortableChildren = true
    $('#canvasDiv').append(this.app.view)
    this.rec = rec()
    console.log('at rec')
    this.net_ = net.plotSync(data, app, false)
    console.log('at plot')
    this.heir = parseInt(heir)
    this.net_.forEachNode((n, a) => {
      if (a.did === this.heir) this.heirId = n
    })
    console.log('bef dists', this.heirId)
    this.net = this.setDists()
    console.log('at dists')
    // net.attrNet(this.net)
    // const pfm = this.pfm = net.plotSync(data, app)
    const pfm = this.pfm = net.attrNet(this.net, app)
    console.log('at attr')
    const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas)
    console.log('at part')
    pfm.dn = dn
    this.net = pfm.net
    this.net.forEachNode((n, a) => {
      a.pixiElement.alpha = 0
    })
    this.setup()
  }

  setup () {
    window.defaultLinkRenderer = defaultLinkRenderer
    console.log('at setup')
    this.setProgression()
    console.log('at prog')
    // this.hideAll()
    this.setMusic()
    console.log('at mus')
    this.volumeControl()
    console.log('at cont')
    this.setInfo() // when user gives ok on info, music starts
    console.log('at inf')
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
    // this.amSy = new Tone.AMSynth(amset).toDestination() // random walk it in pentatonic
    const mkSong = () => {
      Tone.Transport.bpm.value = 140
      const vol = this.vol = new Tone.Volume(-6).toDestination()
      const rev = window.rev = new Tone.Reverb().connect(vol)
      rev.wet.value = 0.9
      const msy = new Tone.MembraneSynth().connect(rev)
      const nsy = new Tone.NoiseSynth({ envelope: { attack: 0.05 } }).connect(rev)
      const isy = new Tone.MetalSynth().connect(rev)
      const isy2 = new Tone.MetalSynth().connect(rev)
      isy.volume.value = -10
      isy2.volume.value = -19
      nsy.volume.value = -13

      const pe1 = this.net.getNodeAttribute(this.heirId, 'pixiElement')
      const te1 = this.net.getNodeAttribute(this.heirId, 'textElement')
      const pe0 = this.net.getNodeAttribute(this.predecessor, 'pixiElement')
      const te0 = this.net.getNodeAttribute(this.predecessor, 'textElement')
      const zabumba = new Tone.Part((time, note) => {
        msy.triggerAttackRelease(note, '8n', time)
        // const pe = Math.random() > 0.2 ? pe1 : pe0
        const [pe, te] = note === 'C1' ? [pe1, te1] : [pe0, te0]
        if (note === 'G1') activateLink(pe0, pe1, this.app)
        d(() => { // blink current or predecessor
          pe.tint = te.tint = 0xffffff * Math.random()
          pe.alpha = 0.6
          te.alpha = 1
          pe.scale.set(10)
        }, time)
        d(() => { // blink current or predecessor
          pe.tint = pe.stdTint
          pe.alpha = 1
          te.alpha = 0
          pe.scale.set(1)
        }, time + 0.5)
      }, [[0, 'C1'], ['0:1:2', 'C1'], ['0:3', 'G1']])
      zabumba.loop = true

      const les = this.leafs.map(i => [
        this.net.getNodeAttribute(i, 'pixiElement'),
        this.net.getNodeAttribute(i, 'textElement')
      ])
      let leCount = 0
      const chocalho = new Tone.Pattern((time, note) => {
        nsy.triggerAttackRelease('2n', time)
        const [pe, te] = les[leCount++ % les.length]
        d(() => { // blink current or predecessor
          pe.tint = te.tint = 0xffffff
          te.alpha = 1
          pe.alpha = 1
          pe.scale.set(2)
        }, time)
        d(() => { // blink current or predecessor
          pe.tint = pe.stdTint
          te.alpha = 0
          pe.scale.set(1)
        }, time + 0.3)
      }, ['C4', 'G4', 'B4', 'C4'])
      chocalho.interval = '8n'

      const pes = this.successors.map(i => [
        this.net.getNodeAttribute(i, 'pixiElement'),
        this.net.getNodeAttribute(i, 'textElement')
      ])
      let peCount = 0
      const succ = new Tone.Sequence((time, note) => {
        isy.triggerAttackRelease(note, '8n', time)
        const [pe, te] = pes[peCount++ % pes.length]
        activateLink(pe1, pe, this.app, 0xff0000)
        d(() => { // blink current or predecessor
          pe.tint = te.tint = 0xffffff * Math.random()
          pe.alpha = 1
          te.alpha = 1
          pe.scale.set(3)
        }, time)
        d(() => { // blink current or predecessor
          pe.tint = pe.stdTint
          te.alpha = 0
          pe.scale.set(1)
        }, time + 0.5)
      }, [[null, 'G2'], ['C2', null], ['C3', 'E3'], [null, 'G3']], '4n')
      succ.probability = 0.4

      // const seq2 = new Tone.Sequence((time, note) => {
      //   isy2.triggerAttackRelease(note, '8n', time)
      // }, ['C8', 'G8'], '4n').start('+2')
      let reCount = 0
      const res = this.remainingNodes.map(i => [
        this.net.getNodeAttribute(i, 'pixiElement'),
        this.net.getNodeAttribute(i, 'textElement')
      ])
      const agogo = new Tone.Sequence((time, note) => {
        isy2.triggerAttackRelease(note, '8n', time)
        const [pe, te] = res[reCount++ % res.length]
        d(() => { // blink current or predecessor
          pe.tint = te.tint = 0xff00ff
          te.alpha = 1
          pe.alpha = 1
          pe.scale.set(1.3)
        }, time)
        d(() => { // blink current or predecessor
          pe.tint = pe.stdTint
          te.alpha = 0
          pe.scale.set(1)
        }, time + 0.4)
      }, ['C7', 'G7'], '4n')
      const actions = [
        t => {
          zabumba.start(t)
          Tone.Transport.schedule(t2 => {
            this.rec.astart()
          }, t)
        },
        t => succ.start(t),
        t => chocalho.start(t),
        t => zabumba.stop(t) && agogo.start(t),
        t => chocalho.stop(t),
        t => zabumba.start(t),
        t => chocalho.start(t),
        t => {
          zabumba.stop(t)
          succ.stop(t)
          chocalho.stop(t)
          agogo.stop(t)
          Tone.Transport.schedule(t2 => {
            msy.triggerAttackRelease('C2', '2n', t2)
            Tone.Transport.schedule(t3 => {
              this.setLinks()
              this.rec.astop()
            }, t2 + 0.5)
          }, t)
        }
      ]
      actions.forEach((a, i) => a('+' + (1 + 4 * i) + 'm'))
      window.all = {
        zabumba, nsy, msy, chocalho, succ, isy, agogo // , score
      }
      $('#loading').hide()
    }
    mkSong()
  }

  setProgression () {
    this.arrows = []
    this.progression = [[this.data.links[0][0].from]]
    this.data.links.forEach((step, i) => {
      const stepNodes = []
      step.forEach(link => {
        console.log('the link', link)
        if (!this.net.hasEdge(link.from, link.to)) return
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
        this.net.getNodeAttribute(n, 'pixiElement').stdTint = c
        this.net.setNodeAttribute(n, 'stepColor', c)
      })
    })
    this.net.forEachNode((n, a) => {
      if (a.did === this.heir) this.heirId = n
    })
    this.predecessor = this.net.inNeighbors(this.heirId)[0]
    if (this.predecessor === undefined) {
      this.isSeed = true
      this.predecessor = this.heirId
    }
    this.successors = this.net.outNeighbors(this.heirId)
    this.leafs = []
    this.net.forEachNode(n => {
      if (this.net.outNeighbors(n).length === 0 && !this.successors.includes(n)) this.leafs.push(n)
    })
    if (this.successors.length === 0) {
      this.isLeaf = true
      this.successors = this.leafs
    }
    const allNodes = [this.heirId, this.predecessor, ...this.successors, ...this.leafs]
    this.remainingNodes = this.net.nodes().filter(n => !allNodes.includes(n))
  }

  setDists () {
    let currentNodes = [this.heirId]
    const consideredNodes = [this.heirId]
    let newNeighs = [this.heirId]
    while (consideredNodes.length < 50 && newNeighs.length !== 0) {
      newNeighs = []
      currentNodes.forEach(n => {
        this.net_.forEachNeighbor(n, nn => {
          if (!consideredNodes.includes(nn)) {
            newNeighs.push(nn)
            consideredNodes.push(nn)
          }
        })
      })
      currentNodes = newNeighs
    }
    console.log('bef subg')
    return subGraph(this.net_, consideredNodes).copy()
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
        css: { background: '#eeffee' }
      }).html(`<h2>Olá, ${name}, você é herdeir@ de uma música feita para você!</h2>`)
        .append($('<p/>', { id: 'mcontent2' }))
      )
    const diag2 = $('<div/>', {
      id: 'diag2'
    })

    // Tone.setContext(new Tone.Context({ latencyHint: 'playback' }))
    $('<button/>').html('Ok, quero ouvir minha música agora!').on('click', () => {
      Tone.start()
      Tone.Transport.start('+0.1')
      // this.seq.start(2)
      // if (Tone.context.state === 'running') {
      setTimeout(() => {
        if (Tone.Transport.state === 'started') {
          $('#myModal2').hide(2000)
        }
      }, 500)
    }).appendTo(diag2)

    const content = `
    <p>
      A música se chama <b>${generateName(name, this.data.syncId)}</b>
      e chegou junto a uma pequena mensagem de quem muito te admira:<br><br>
    </p>

    <div style="background:#ffffee;padding:2%;border-radius:5%;margin:2%">
      <div style="font-family: Brush Script MT;font-size: x-large">
        ${linkify2(this.data.desc)}
      </div>
    </div>
    `
    $('#mcontent2').html(content).append(diag2)
    // $('#mcontent2', { css: { 'background-color': '#ffffcc' } }).html(content).append(diag2)
    $('#myModal2').show()
  }

  findSeed () {
    this.net_.forEachNode((n, a) => {
      if (this.net_.inNeighbors(n).length === 0) {
        this.seedId = n
        this.seedAttrs = a
      }
    })
  }

  setLinks () {
    let links
    if (this.isLeaf) {
      this.findSeed()
      $('#mcontent0').html('<h2>Parabéns, você é herdeiro final da sincronização!</h2>').append($('<p/>', { id: 'mcontent2' }))
      links = `
      Avise o iniciador da sincronização que você, herdeiro final, recebeu sua música e mensagem.
      O nome delæ é ${this.seedAttrs.name}.

      Você também pode querer avisar seu predecessor, ${this.net.getNodeAttribute(this.predecessor, 'name')}, que você é herdeiro final!
      `.replace(/\n/g, '<br />')
    } else {
      $('#mcontent0').html('<h2>Aqui os links para você repassar aos seus sucessores</h2>').append($('<p/>', { id: 'mcontent2' }))
      links = this.successors.map(i => {
        const { name, did } = this.net.getNodeAttributes(i)
        const link = `${window.location.origin}?${this.data.syncId}=${did}`
        return `<p>${name}: <a href="${link}" target="_blank">${link}</a></p>`
      }).join('')
    }
    $('#mcontent2').html(links)
    $('<button/>').html('download your music video').click(() => this.rec.aa.click()).appendTo('#mcontent2')
    $('#myModal2').fadeIn(4000)
  }

  volumeControl () {
    const set = { closed: false }
    set.width = window.innerWidth / 3.5
    if (this.isMobile) set.width = window.innerWidth / 2
    const gui = this.theGui = new dat.GUI(set)
    const volGui = gui.add({ volume: 50 }, 'volume', 0, 100).listen()
    volGui.onChange(val => {
      this.vol.volume.value = val - 50
    })
    if (this.isMobile) {
      $('.dg.main .close-button.close-bottom')
        .css('padding-bottom', '10px').css('padding-top', '10px')
      $('.dg .cr.number').css('height', '37px')
      $('.dg .c .slider').css('height', '37px')
      let open = true
      $('.dg.main .close-button.close-bottom').click(() => {
        if (open) {
          $('.dg .cr.number').css('height', '0px')
        } else {
          $('.dg .cr.number').css('height', '37px')
        }
        open = !open
      })
    }
    $('.dg').css('font-size', '24px')
    // $('.close-button').css('background-color', '#777777')
    $('.close-button')
      .css('background-color', 'rgba(0,0,0,0)')
      .css('border', 'solid #777777')
      .click()
    $('.dg .c input[type=text]').css('width', '15%')
    $('.dg .c .slider').css('width', '80%')
    $('.dg.main .close-button.close-bottom').click().hide()
  }
}
