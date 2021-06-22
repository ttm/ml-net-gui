const $ = require('jquery')

const net = require('../net.js')
const transfer = require('../transfer.js')
const utils = require('../utils.js')

const u = require('../router.js').urlArgument
const { PIXI } = require('./utils.js')

module.exports.You = class {
  constructor () {
    this.mkButtons()
    this.initializeGraph()
  }

  initializeGraph () {
    const app = window.wand.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight * 0.9,
      // transparent: true
      backgroundColor: 0x000000,
      antialias: true
    })
    app.stage.sortableChildren = true
    document.body.appendChild(app.view)
    if (u('id') || u('cid')) {
      (u('id') ? transfer.fAll.mark({ 'userData.id': u('id') }) : transfer.fAll.aeterni({ comName: u('cid') })).then(r => {
        const foo = u('id') ? 'net' : 'network'
        window.rrr = r
        const anet = window.anet = r[0][foo]
        const pfm = window.pfm = net.plotFromMongo(anet, app, u('deg'))
        const dn = new net.ParticleNet2(app, pfm.net, pfm.atlas, true, true)
        pfm.dn = dn
        this.setUp()
        $('#loading').hide()
      })
    } else if (u('whats')) {
      transfer.fAll.ttm({ marker: u('whats') }).then(r => {
        window.rrr = r
        if (r.length === 0) return window.alert('data has been deleted')
        const pfm = window.pfm = net.plotWhatsFromMongo(r[0].data, r[0].creator)
        const dn = window.dn = new net.ParticleNet2(app, pfm.net, pfm.atlas, true, true)
        pfm.dn = dn
        this.setUp()
        $('#loading').hide()
      })
    }
  }

  setUp () {
    const anet = window.pfm.net
    this.sinfo = $('<span/>', { id: 'sinfo', css: { cursor: 'pointer' } }).appendTo('body').click(() => {
      if (!this.names || this.names.length === 0) return
      window.wand.modal.show(10, this.names.join(', '))
    })
    function stdNode (n) {
      anet.forEachNeighbor(n, (nn, na) => {
        na.pixiElement.tint = 0x00ffff
        clearInterval(na.textElement.iId)
        na.textElement.alpha = 0
        na.textElement.tint = 0xffffff
      })
    }
    anet.forEachNode((n, a) => {
      a.textElement.on('pointerover', () => {
        console.log('yeah, pover')
        this.sinfo.text(`degree: ${a.degree}`)
      })
      a.textElement.on('pointerout', () => {
        stdNode(n)
      })
      a.textElement.on('pointerupoutside', () => {
        stdNode(n)
        anet.forEachNeighbor(n, (nn, na) => {
          na.pixiElement.tint = 0x00ff00
        })
      })

      a.textElement.on('pointerdown', () => {
        anet.forEachNeighbor(n, (nn, na) => {
          na.pixiElement.tint = 0x00ff00
          na.textElement.tint = 0xff9999
          na.textElement.iId = setInterval(() => {
            if (Math.random() > 0.7) {
              na.textElement.alpha = 1
            } else {
              na.textElement.alpha = 0
            }
          }, 200)
        })
        console.log('clicked jow')
      })
      a.textElement.on('pointerup', () => {
        stdNode(n)
        console.log('up jow')
      })
    })
  }

  mkButtons () {
    this.mkRemoveUserBtn()
    this.mkRecSetupBtn()
    this.mkMemberSets()
    this.mkDetectComBtn()
  }

  mkRemoveUserBtn () {
    this.removedNodes = []
    utils.mkBtn('user-times', 'remove member', () => { // fixme: ensure no isolated node or group is left behind
      const n = window.pfm.net
      const uid = window.prompt('enter user string id:')
      if (!n.hasNode(uid)) return window.alert('network has no such member')
      net.removeNode(n, uid)
      const newNet = net.getLargestComponent(n)
      const toBeRemoved = []
      n.forEachNode(nn => {
        if (!newNet.includes(nn)) toBeRemoved.push(nn)
      })
      toBeRemoved.forEach(nn => net.removeNode(n, nn))
      this.removedNodes.push(uid, ...toBeRemoved)
      net.netdegree.assign(n)
    })
  }

  mkRecSetupBtn () {
    this.rec = utils.mkBtn('record-vinyl', 'record current setup', () => {
      if (!window.confirm('are you sure that you will be using this setup and want to write it?')) return
      if (window.comNames.filter(i => i === '').length > 0) return window.alert('first name all communities')
      // fixme: check if any of the comNames input are already in use
      const n = window.pfm.net
      const toBeWritten = []
      for (let i = 0; i < n.communities.count; i++) {
        const name = window.comNames[i]
        const members = []
        n.forEachNode((nd, a) => {
          if (a.community === i) {
            members.push(nd)
            a.origDegree = a.degree
          }
        })
        const network_ = net.getLargestComponent(net.getSubGraph(n, members), true)
        net.netdegree.assign(network_)
        const network = network_.toJSON()
        network.edges.forEach(n => {
          delete n.attributes.pixiElement
        })
        network.nodes.forEach(n => {
          const a = n.attributes
          delete a.pixiElement
          delete a.textElement
          delete a.community
          delete a.degreeCentrality
          delete a.x
          delete a.y
        })
        toBeWritten.push({
          // name: `${u('id')}-${i}-${name}`,
          source: u('id'),
          comName: name,
          removedNodes: this.removedNodes,
          network,
          date: new Date()
        })
      }
      for (let i = 0; i < toBeWritten.length; i++) {
        (async function () {
          const result = await transfer.fAll.waeterni(toBeWritten[i])
          console.log(result)
        })()
      }
      console.log(toBeWritten)
      console.log(toBeWritten)
      window.toBeWritten = toBeWritten
    }).hide()
  }

  mkMemberSets () {
    utils.mkBtn('dragon', 'group members', () => {
      const n = window.pfm.net
      const members = []
      n.forEachNode((n, a) => {
        members.push({
          origId: n,
          degree: a.origDegree || a.degree,
          name: a.name,
          id: a.sid || a.nid || a.name,
          url: a.sid ? `https://www.facebook.com/${a.sid}` : `https://www.facebook.com/profile.php?id=${a.nid}`
        })
      })
      window.members = members
      members.sort((a, b) => {
        if (a.degree !== b.degree) return a.degree - b.degree
        const [ai, bi] = [a.id, b.id]
        return ai.split('').reverse().join('') > bi.split('').reverse().join('') ? 1 : -1
      })
      const memberSets = window.memberSets = utils.chunkArray(members, window.prompt('Size of set:'))
      let str
      if (window.confirm('inline list?')) {
        str = memberSets.map((set, count) => `${count} (${set[0].degree}...${set[set.length - 1].degree})|||<br>` + set.map(member => `${member.name}`).join(', ')).join('<br>=====<br><br>')
      } else {
        str = memberSets.map((set, count) => count + ' |||<br>' + set.map(member => `<a target="_blank" href="${member.url}">${member.name}</a> ${member.degree}`).join('<br>')).join('<br>=====<br><br>')
      }
      window.wand.modal.show(10, str)
    })
  }

  mkDetectComBtn () {
    utils.mkBtn('users-cog', 'detect communities', () => {
      const n = window.pfm.net
      net.mkCommunities(n)
      this.cycleCom.show()
      this.rec.show()
      window.comNames = new Array(n.communities.count).fill('')
      makeCommsTable()
    })
    function makeCommsTable () {
      if (window.adiv) window.adiv.remove()
      const n = window.pfm.net
      this.sinfo.text(`${n.communities.count} communities found. Sizes: ${n.communities.sizes.all.join(', ')}.`)
      const adiv = window.adiv = $('<div/>').appendTo('body')
      const grid = utils.mkGrid(3, adiv, '60%', utils.chooseUnique(['#eeeeff', '#eeffee', '#ffeeee']))
      function addItem (text, bold) {
        if (bold) text = `<b>${text}</b>`
        return $('<span/>', { css: { border: '1px solid' } }).html(text).appendTo(grid)
      }
      addItem('index', 1)
      addItem('size', 1)
      addItem('name', 1)
      const existingComms = []
      n.communities.sizes.all.forEach((c, i) => {
        existingComms.push(i)
        addItem(i).click(() => {
          console.log(`activate com ${i} on the visualization`)
          this.showCom(i)
        })
        addItem(c).click(() => {
          const mergeIndex = window.prompt(`enter index to merge ${i}:`)
          if (existingComms.includes(parseInt(mergeIndex))) {
            mergeComms(i, mergeIndex)
          }
        })
        const me = addItem(window.comNames[i]).click(() => {
          window.comNames[i] = window.prompt(`enter name for com ${i}:`)
          me.text(window.comNames[i])
        })
      })
    }
    function mergeComms (i, j) {
      if (i === j) return window.alert('will not merge to itself!')
      // merge them:
      //   join members of both communities into one
      //   move the higher communities down:
      const [keep, change] = [Math.min(i, j), Math.max(i, j)]
      window.pfm.net.forEachNode((n, a) => {
        if (a.community === change) a.community = keep
      })
      window.pfm.net.forEachNode((n, a) => {
        if (a.community > change) a.community--
      })
      window.comNames.forEach((foo, count) => {
        if (count >= change) {
          window.comNames[count] = window.comNames[count + 1]
        }
      })
      window.pfm.net.communities.count--
      window.pfm.net.communities.sizes.all = new Array(window.pfm.net.communities.count).fill(0)
      window.pfm.net.forEachNode((n, a) => {
        window.pfm.net.communities.sizes.all[a.community]++
      })
      makeCommsTable()
    }
  }

  mkCycleComBtn () {
    let counter = 0
    let names = []
    this.cycleCom = utils.mkBtn('shapes', 'cicle through communities', () => {
      this.showCom(counter)
      counter = ++counter % window.pfm.net.communities.count
    }, '#users-cog-button').hide()
    this.showCom = index => {
      names = []
      window.pfm.net.forEachNode((n, a) => {
        let color = 0x00ffff
        if (a.community === index) {
          color = 0x0000ff
          names.push(a.name)
        }
        a.pixiElement.tint = color
      })
      this.sinfo.text(`community size: ${window.pfm.net.communities.sizes.all[index]}`)
    }
  }
}
