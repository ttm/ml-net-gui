const $ = require('jquery')

const net = require('../net.js')
const transfer = require('../transfer.js')
const utils = require('../utils.js')

const u = require('../router.js').urlArgument
const { PIXI } = require('./utils.js')

module.exports.You = class {
  constructor () {
    this.sphereColor = 0xff0000
    this.cFuncCount = 0
    this.sizingFuncCount = 0
    this.scaleCount = 0
    this.colorModeCount = 0
    this.cCriteria = this.setCCriteria()
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

  mkInfo (text, info) {
    if (info === undefined) this.sinfo.text(text)
    else this.sinfo.text(`${text}: ${info}`)
  }

  setUp () {
    const anet = window.pfm.net
    this.sinfo = $('<span/>', { id: 'sinfo', css: { cursor: 'pointer' } }).appendTo('body').click(() => {
      if (!this.names || this.names.length === 0) return
      window.wand.modal.show(10, this.names.join(', '))
    })
    function stdNode (n) {
      anet.forEachNeighbor(n, (nn, na) => {
        na.pixiElement.tint = na.pixiElement.btint
        clearInterval(na.textElement.iId)
        na.textElement.alpha = 0
        na.textElement.tint = na.textElement.btint
      })
    }
    anet.forEachNode((n, a) => {
      a.textElement.btint = a.textElement.tint
      a.pixiElement.btint = a.pixiElement.tint
      a.textElement.on('pointerover', () => {
        this.mkInfo('degree', a.degree)
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
    this.mkButtons()
  }

  mkButtons () {
    this.calcs()
    this.mkRemoveUserBtn()
    this.mkRecSetupBtn()
    this.mkMemberSets()
    this.mkDetectComBtn()
    this.mkCycleComBtn()
    this.mkColorBtn()
    this.mkColorModeBtn()
    this.mkColorCriteriaBtn()
    this.mkSizeBtn()
    this.mkEdgeColorBtn()
    this.mkNodeAlphaBtn()
    this.mkEdgeAlphaBtn()
    this.mkBackgroundBtn()
    this.mkShowMembersetBtn()
    this.mkShowMembersetColorsKeys()
    this.mkNamesAlphaBtn()
    this.setSize = 50
    $('#dragon-button').click()
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
      const memberSets = window.memberSets = utils.chunkArray(members, this.setSize || window.prompt('Size of set:'))
      let str
      if (window.confirm('inline list?')) {
        str = memberSets.map((set, count) => `-> ${count} (${set[0].degree}...${set[set.length - 1].degree}) <-<br>` + set.map(member => `${member.name}`).join(', ')).join('<br>=====<br><br>')
      } else {
        str = memberSets.map((set, count) => count + ' |||<br>' + set.map(member => `<a target="_blank" href="${member.url}">${member.name}</a> ${member.degree}`).join('<br>')).join('<br>=====<br><br>')
      }
      window.wand.modal.show(10, str)
      delete this.setSize
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
    const makeCommsTable = () => {
      if (window.adiv) window.adiv.remove()
      const n = window.pfm.net
      this.mkInfo(`${n.communities.count} communities found. Sizes: ${n.communities.sizes.all.join(', ')}.`)
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
      this.mkInfo('community size', window.pfm.net.communities.sizes.all[index])
    }
  }

  mkColorBtn () {
    utils.mkBtn('palette', 'color nodes scale', () => {
      this.cscale = this.getScale()
      window.pfm.net.forEachNode((n, a) => {
        a.pixiElement.tint = a.pixiElement.btint = this.cscale(this.cCriteria(a)).num()
      })
      // wand.app.renderer.backgroundColor = 0xc3a06
    })
  }

  mkColorModeBtn () {
    utils.mkBtn('tint', 'color nodes mode', () => {
      this.cscale = this.applyColorMode(this.cscale)
      window.pfm.net.forEachNode((n, a) => {
        a.pixiElement.tint = this.cscale(this.cCriteria(a)).num()
      })
      this.mkInfo('color mode:', `${this.colorModeCount}, ${this.colorModeCount % 5}`)
    })
  }

  mkColorCriteriaBtn () {
    utils.mkBtn('paint-roller', 'color nodes criteria', () => {
      this.cCriteria = this.setCCriteria()
      window.pfm.net.forEachNode((n, a) => {
        a.pixiElement.tint = a.pixiElement.btint = this.cscale(this.cCriteria(a)).num()
      })
      this.mkInfo('color node criteria:', `${this.cFuncCount}, ${this.cFuncCount % 3}`)
    })
  }

  setCCriteria () {
    return [
      a => a.degree / this.maxD,
      a => a.ndegree / this.maxN,
      a => a.cc / this.maxC
    ][this.cFuncCount++ % 3]
  }

  getScale () {
    const s = [
      () => utils.randScale1(),
      () => utils.randScale1(true),
      () => utils.chroma.cubehelix(),
      () => utils.randScale2(),
      () => utils.randScale2(true),
      () => utils.chroma.scale('Spectral')
    ][this.scaleCount++ % 6]()
    this.mkInfo('color scale', this.scaleCount % 6)
    return s
  }

  applyColorMode (scale) {
    window.scass = scale
    if (!('mode' in scale)) return scale
    return scale.mode([
      'rgb',
      'lab',
      'lrgb',
      'hsl',
      'lch'
    ][this.colorModeCount++ % 5])
  }

  mkSizeBtn () {
    utils.mkBtn('user-friends', 'size nodes', () => {
      const func = this.getSizingFunc()
      window.pfm.net.forEachNode((n, a) => { a.pixiElement.scale.set(func(a) / 10) })
      this.mkInfo('node size method', this.sizingFuncCount % 3)
    })
  }

  calcs () {
    net.assignCC(window.pfm.net)

    window.pfm.net.forEachNode((n, a) => {
      const nds = []
      window.pfm.net.forEachNeighbor(n, (nn, na) => nds.push(na.degree))
      a.ndegree = nds.reduce((a, b) => (a + b), 0) / nds.length
    })

    const degrees = []
    const ccs = []
    const nds = []
    window.pfm.net.forEachNode((n, a) => {
      degrees.push(a.degree)
      ccs.push(a.cc)
      nds.push(a.ndegree)
    })
    this.maxD = Math.max(...degrees)
    this.maxC = Math.max(...ccs)
    this.maxN = Math.max(...nds)
  }

  getSizingFunc () {
    return [
      a => 0.3 + 2 * a.degree / this.maxD,
      a => 0.3 + 2 * a.ndegree / this.maxN,
      a => 0.3 + 2 * a.cc / this.maxC
    ][this.sizingFuncCount++ % 3]
  }

  mkEdgeColorBtn () {
    // todo: color with respect to difference between nodes
    let methodCount = 0
    const methods = ['multiply', 'darken', 'lighten', 'screen', 'overlay', 'burn', 'dodge']
    utils.mkBtn('tint-slash', 'color edges', () => {
      const method = methods[methodCount++ % methods.length]
      window.pfm.net.forEachEdge((e, a, n1, n2, a1, a2) => {
        a.pixiElement.tint = utils.chroma.blend(a1.pixiElement.btint, a2.pixiElement.btint, method).num()
      })
      this.mkInfo('edge color method', method)
    })
  }

  mkNodeAlphaBtn () {
    let count = 0
    utils.mkBtn('braille', 'node alpha', () => {
      const alpha = (count++ % 11) / 10
      window.pfm.net.forEachNode((n, a) => {
        a.pixiElement.alpha = alpha
        this.mkInfo('node alpha', alpha.toFixed(2))
      })
    })
  }

  mkEdgeAlphaBtn () {
    let count = 0
    utils.mkBtn('unlink', 'edge alpha', () => {
      const alpha = (count++ % 11) / 10
      window.pfm.net.forEachEdge((e, a) => {
        a.pixiElement.alpha = alpha
        this.mkInfo('link alpha', alpha.toFixed(2))
      })
    })
  }

  mkBackgroundBtn () { // 7444373, 3026478.3020627154
    let counter = 0
    utils.mkBtn('fill-drip', 'background color', () => {
      let color
      if (counter++ % 2) color = utils.chroma.random()
      else color = utils.chroma.scale()(Math.random())
      window.wand.app.renderer.backgroundColor = color.num()
      this.mkInfo('background', color.rgb())
    })
  }

  mkShowMembersetBtn () {
    let counter = 0
    utils.mkBtn('signature', 'show memberset names', () => {
      if (!window.memberSets) return
      // window.pfm.net.forEachNode((n, a) => {
      //   a.textElement.alpha = 0
      // })
      if (this.mm !== undefined) {
        this.mm.forEach(m => {
          const pe = window.pfm.net.getNodeAttribute(m, 'pixiElement')
          const te = window.pfm.net.getNodeAttribute(m, 'textElement')
          te.visible = false
          // te.alpha = 0.9
          // te.scale.set(0.8)
          pe.tint = pe.backTint
          pe.alpha = pe.backAlpha
        })
      }
      this.mm = window.memberSets[counter++ % window.memberSets.length].map(m => m.origId)
      this.mm.forEach(m => {
        const pe = window.pfm.net.getNodeAttribute(m, 'pixiElement')
        const te = window.pfm.net.getNodeAttribute(m, 'textElement')
        te.tint = pe.tint
        te.visible = true
        te.alpha = 0.9
        pe.backTint = pe.tint
        pe.backAlpha = pe.alpha
        pe.tint = this.sphereColor
        pe.alpha = 0.8
        te.scale.set(0.8)
      })
      this.mkInfo('member set shown', `${counter % window.memberSets.length}/${window.memberSets.length} (size: ${window.memberSets[0].length})`)
    })
  }

  mkShowMembersetColorsKeys () {
    console.log('yeah, started')
    const rgbm = [0, 0, 0, 0, 0, 0.8]
    const calc = (i, h) => Math.floor(rgbm[i] * 0xff / 10) * h
    const mix = utils.chroma.mix
    const update = (color, up = true) => {
      const val = rgbm[color] + up
      if (color === 5) { // actually size
        rgbm[color] = val > 1.3 ? 0.3 : (val < 0.3 ? 1.3 : val)
        this.mm.forEach(m => {
          window.pfm.net.getNodeAttribute(m, 'textElement').scale.set(rgbm[color])
        })
        return this.mkInfo('name size', rgbm[color].toFixed(2))
      } else if (color >= 3) rgbm[color] = val >= 0 ? (val >= 1 ? 0 : val % 1) : 0.9
      else rgbm[color] = val >= 0 ? val % 11 : 10
      // const color_ = Math.floor(rgb[0] * 0xff / 10) * 0x010000 + rgb[1] * 0x000100 + rgb[2] * 0x000001
      const color_ = calc(0, 0x010000) + calc(1, 0x000100) + calc(2, 0x000001)
      this.mm.forEach(m => {
        const a = window.pfm.net.getNodeAttributes(m)
        a.textElement.tint = mix(mix(color_, a.pixiElement.btint, rgbm[3]), utils.chroma.random(), rgbm[4]).num()
      })
      this.mkInfo('names color', `${utils.chroma(color_).hex()} (${[rgbm[0], rgbm[1], rgbm[2], rgbm[3].toFixed(2), rgbm[4].toFixed(2)]})`)
    }
    document.onkeypress = function (e) {
      if (!window.memberSets) return
      console.log('yeah, turned on')
      e = e || window.event
      console.log(e, e.keyCode)
      switch (e.keyCode) {
        case 114: // r
          update(0)
          break
        case 82: // R
          update(0, -1)
          break
        case 103: // g
          update(1)
          break
        case 71: // G
          update(1, -1)
          break
        case 98: // b
          update(2)
          break
        case 66: // B
          update(2, -1)
          break
        case 109: // m
          update(3, 0.1)
          break
        case 77: // M
          update(3, -0.1)
          break
        case 110: // n
          update(4, 0.1)
          break
        case 78: // N
          update(4, -0.1)
          break
        case 115: // s
          update(5, 0.1)
          break
        case 83: // S
          update(5, -0.1)
          break
        case 101: // e
          spread()
          break
        case 69: // E
          spread(false)
          break
        case 99: // c
          tagHelper()
          break
        case 67: // C
          tagHelper(false)
          break
        case 97: // a
          window.pfm.net.forEachNode((n, a) => { a.textElement.tint = a.pixiElement.tint })
          this.mkInfo('node colors for names')
          break
        case 122: // z
          window.pfm.net.forEachNode((n, a) => { a.textElement.tint = 0xffffff * Math.random() })
          this.mkInfo('random colors for names (Math.random)')
          break
        case 90: // Z
          window.pfm.net.forEachNode((n, a) => { a.textElement.tint = utils.chroma.random().num() })
          this.mkInfo('random colors for names (chroma)')
          break
      }
      // if (e.keyCode === 99) ff()
      // use e.keyCode
    }
    let scounter = 0
    const spread = (real = true) => {
      if (!real) {
        return this.mm.forEach(m => {
          const a = window.pfm.net.getNodeAttributes(m)
          a.textElement.position.set(a.pixiElement.x, a.pixiElement.y)
        })
      }
      this.mm.forEach(m => {
        const te = window.pfm.net.getNodeAttribute(m, 'textElement')
        const b = te.getBounds()
        this.mm.forEach(m2 => {
          if (m === m2) return
          const te2 = window.pfm.net.getNodeAttribute(m2, 'textElement')
          const b2 = te2.getBounds()
          if (b.x > b2.x + b2.width / 2 || b2.x > b.x + b.width / 2 || b.y > b2.y + b2.height / 2 || b2.y > b.y + b.height / 2) return
          const dist = (b.y < b2.y + b2.height ? b2.y + b2.height - b.y : b.y + b.height - b2.y) / 8
          te.y -= b.y < b2.y + b2.height ? dist : -dist
          te2.y -= b.y < b2.y + b2.height ? -dist : dist
        })
      })
      this.mkInfo('spread finished', ++scounter)
    }
    let counter = 0
    const tagHelper = (next = 1) => {
      this.mm.forEach(m => {
        window.pfm.net.getNodeAttribute(m, 'textElement').alpha = 0
      })
      const m = this.mm[next === 1 ? counter++ : counter--]
      window.pfm.net.getNodeAttribute(m, 'textElement').alpha = 1
      window.pfm.net.getNodeAttribute(m, 'textElement').tint = 0xff0000
      console.log(window.pfm.net.getNodeAttribute(m, 'name'), counter - 1)
      console.log(`https://www.facebook.com/${m}`)
      console.log(`https://www.facebook.com/profile.php?id=${m}`)
      console.log(m)
      utils.copyToClipboard(m)
      this.mkInfo('tagging', `${counter} of ${this.mm.length}`)
    }
  }

  mkNamesAlphaBtn () {
    let counter = 0
    utils.mkBtn('highlighter', 'names alpha', () => {
      if (!window.memberSets) return
      const alpha = (counter++ % 11) / 10
      this.mm.forEach(m => {
        window.pfm.net.getNodeAttribute(m, 'textElement').alpha = alpha
      })
      this.mkInfo('names alpha', alpha.toFixed(2))
    })
  }
}
