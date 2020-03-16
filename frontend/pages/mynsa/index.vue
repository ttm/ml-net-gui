<template>
<span>
<h1>MyNSA</h1>
<p>Widgets para: escrever alguma coisa, lista as redes que possuem a string (nome de participante ou da rede)</p>
<p>Um vértice para da rede, se clicar na rede, abre ela.</p>
<v-flex mt-1>
<div id="info">
  {{ minfo }}
</div>
<br /><br />
<div id="context">
Você tem permissão para observar as redes do Facebook da LOSD.
Clique em algum dos vértices verdes para abrir alguma delas.
</div>
<div id="dcanvas">
<v-system-bar id="toolbar" window dark>
  <v-icon class="tbtn" id='rzbtn' @contextmenu="mhandler($event)" @click="mhandler" title="increase/decrease node size with left/right click">control_camera</v-icon>
  <v-icon class="tbtn" id="ppbtn" @contextmenu="mhandler($event)" @click="mhandler($event)" title="emphasize node size proportionality to degree/number of predecessors with left/right click">insert_chart</v-icon>
  <v-icon class="tbtn" @click="restoreNodeSizes()" title="reset node proportionality">undo</v-icon>
  <v-icon class="tbtn" id='vzbtn' @contextmenu="mhandler($event)" @click="mhandler($event)" title="increase/decrease node transparency with left/right click">hdr_strong</v-icon>
  <v-icon class="tbtn" id='rtbtn' @click="mhandler($event)" @contextmenu="mhandler($event)" title="rotate nodes counterclockwise/clockwise with left/right click">rotate_left</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" id="lwtbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="increase/decrease link width with left/right click">vertical_align_center</v-icon>
  <v-icon class="tbtn" id="lvzbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="increase/decrease link transparency with left/right click">power_input</v-icon>
  <v-icon class="tbtn" id="lppbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="emphasize link transparency/width proportionality to link weight with left/right click">view_day</v-icon>
  <v-icon class="tbtn" @click="restoreLinks()" title="reset link proportionality">undo</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn ptbtn" id="infobtn" @click="setTool('info')" title="get info by clicking on specific nodes">info</v-icon>
  <v-icon class="tbtn ptbtn" id="dragbtn" @click="setTool('drag')" title="drag nodes to reposition them, drag on canvas to attain a draggable selection of nodes (click outside region to reset tool)">gesture</v-icon>
  <v-icon class="tbtn ptbtn" id="regionexplorebtn" @click="setTool('regionexplore')" title="drag on canvas to open selection of nodes into child nodes (click and drag)">explore</v-icon>
  <v-icon class="tbtn ptbtn" id="collapsebtn" @click="setTool('collapse')" title="drag on canvas to collapse nodes into parent nodes (click and drag)">settings_backup_restore</v-icon>
  <v-icon class="tbtn ptbtn" id="layoutbtn" @contextmenu="mhandler($event)" @click="mhandler($event)" title="click on canvas and drag to make layout only on the nodes inside region. Consider/ignore links to outernodes with right/left click on this tool button. Click on canvas (no drag) to perform layout on all nodes">aspect_ratio</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" id="bcbtn" @contextmenu="randomColorize($event,'bg')" @click="mhandler($event)" title="choose/randomize background color with left/right click">format_color_fill</v-icon>
  <v-icon class="tbtn" id="zmbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="zoom in/out with left/right click">zoom_in</v-icon>
  <v-icon class="tbtn" id="lrbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="pan left/right with left/right click">code</v-icon>
  <v-icon class="tbtn" id="udbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="pan down/up with left/right click">unfold_more</v-icon>
  <v-icon class="tbtn" id='rtsbtn' @click="mhandler($event)" @contextmenu="mhandler($event)" title="rotate canvas counterclockwise/clockwise with left/right click. Selecting 'drag', 'open node', 'join nodes' or 'resize open node' tools will reset canvas rotation">rotate_left</v-icon>
  <v-icon class="tbtn" @click="home()" @contextmenu="mhandler($event)" title="toogle initial and current zoom and pan with click">home</v-icon>
</v-system-bar>
<div @contextmenu="mhandler($event)" id="renderCanvas"></div>
</div>
</v-flex>
</span>
</template>

<script>
import $ from 'jquery'
import * as d3 from 'd3'
import { Chrome } from 'vue-color'
import DialogDrag from 'vue-dialog-drag'
import {VueMathjax} from 'vue-mathjax'

function clickNode (event) {
  this.dragging = true
  __this.mnode = this
  // alert('ow my', this.name, this.socialprotocol, this.uri)
  console.log('ow my', this.name, this.socialprotocol, this.uri)
  __this.writeName(this, 'click')
  if (!this.miscaled) {
    this.scale.x = 3
    this.scale.y = 3
    this.mtint = this.tint
    this.tint = 0xFFFF00
    this.miscaled = 1
  } else {
    this.scale.x = 1
    this.scale.y = 1
    this.tint = this.mtint
    this.miscaled = 0
  }
  if (!this.clickcount) {
    this.clickcount = 0
  }
  this.clickcount++
  if (this.clickcount >= 4) {
    console.log('open')
    window.tthis = __this
    // window.location.href = "aux/fb--" + this.name;
    __this.$router.push('/mynsa/aux/fb--' + this.name)
  }
}
function releaseNode () {
  if (this.dragging) {
    this.dragging = false
  }
}
function moveNode () {
  if (this.dragging) {
  }
}
const ColourValues = [
  "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "808080",
  "C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0",
  "400000", "004000", "000040", "404000", "400040", "004040", "404040",
  "200000", "002000", "000020", "202000", "200020", "002020", "202020",
  "600000", "006000", "000060", "606000", "600060", "006060", "606060",
  "A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0",
  "E00000", "00E000", "0000FF", "E000E0", "00E0E0"
]
export default {
  head () {
    return {
      script: [
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
        { src: '/libs/vue-color.min.js' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-AMS_HTML' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' },
      ],
    }
  },
  data () {
    return {
      minfo: '',
    }
  },
  methods: {
    writeName (node, type='auto') {
      let atext
      let fill = 0xff1010
      if (node.name) {
        atext = node.name
      } else {
        atext = node.socialprotocol
      }
      if (type !== 'auto') {
        if (node.hasname) {
          node.mtext.destroy()
          delete node.hasname
          delete node.text
        }
        fill = 0x0000000
      }
      let text = new PIXI.Text(atext,{fontFamily : 'Arial', fontSize: 15, fill : fill, align : 'center'})
      text.x = node.x
      text.y = node.y
      node.hasname = true
      node.mtext = text
      this.mcont.addChild(text)
      if (type !== 'auto') {
        this.mtexts2.push(text)
      } else {
        this.mtexts.push(text)
      }
    },
    getNames () {
      // choose a random snapshot
      console.log('rname try')
      let rsnap = this.snaps[Math.floor(Math.random() * this.snaps.length)]
      let ruri = rsnap[1]
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsaParticipants/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            muri: ruri
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( data => { 
        console.log('rname ok')
        this.rnames = data
      })
    },
    getSnapshots () {
      this.requestTime = performance.now()
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsa/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            name_: ['all', 'snaps']
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( data => { 
        this.serverlog = data
        this.alldata = data.all.more_
        this.snaps = data.all.more_
        this.sprotocols_ = data.all.more_.reduce( (t, i) => {
          t[i[1]] = i[0]
          return t
        }, {})
        this.fbnames = data.all.more__
        this.fbnames_ = data.all.more__.reduce( (t, i) => {
          t[i[1]] = i[0]
          return t
        }, {})
        let a = this.alldata

        this.dataTime = performance.now()
        this.$store.dispatch('mynsa/patch', [this.mset._id, {
          mdatat: this.dataTime / 1000,
        }])
        this.mInfo()
        this.mVMap()
      })
    },
    mInfo () {
      this.infoTime = performance.now()
      // get n of each type of snapshots
      let snames = [...new Set(this.snaps.map(i => i[0]))]
      let snames_ = snames.reduce( (t, i) => {
        t[i] = 0
        return t
      }, {})
      this.snaps.forEach( i => {
        snames_[i[0]]++
      })
      this.snames = [snames, snames_]
      this.minfo = snames.map( i => {
        return i + ': ' + snames_[i]
      }).join(', ')

      this.$store.dispatch('mynsa/patch', [this.mset._id, {
        minfot: this.infoTime / 1000,
      }])
    },
    mkNodes () {
      // console.log(this.snaps)
      this.nodes = []
      let r = 5 // radius
      this.radius = r
      this.dx = Math.cos(Math.PI/6) * this.radius
      this.dy = Math.sin(Math.PI/6) * this.radius
      let p1x = 0
      let p1y = - this.radius
      let p2x = + this.dx
      let p2y = + this.dy
      let p3x = - this.dx
      let p3y = + this.dy
      let an = Math.PI/3
      let s = Math.sin(an)
      let c = Math.cos(an)
      this.pathhex = [
        r, 0,
        r*c, -r*s,
        -r*c, -r*s,
        -r, 0,
        -r*c, r*s,
        r*c, r*s
      ]
      this.path = [p1x, p1y, p2x, p2y, p3x, p3y]
      this.pathrect = [-r, -r, -r, r, r, r, r, -r]
      for (let i = 0; i < this.snaps.length; i++) {
        let ii = this.snames[0].indexOf(this.snaps[i][0])
        // console.log(i, this.snaps[i], 'snaps')
        const node = new PIXI.Graphics()
        node.lineStyle(1, 0x000000)
        node.beginFill(0xFFFFFF)
        // node.drawPolygon( [-10, -10, 10, -10, 10, 10, -10, 10] )
        node.drawPolygon( this.path )
        // node.drawPolygon( this.pathrect )
        // node.drawPolygon( this.pathhex )
        node.endFill()
        // node.tint = 0x00FF00
        node.tint = parseInt(ColourValues[this.snames[0].indexOf(this.snaps[i][0])], 16)
        node.interactive = true
        node.buttonMode = true
        node.alpha = 0.8
        node
          .on('pointerdown', clickNode)
          .on('pointerup', releaseNode)
          .on('pointerupoutside', releaseNode)
          .on('pointermove', moveNode)
        node.mid = i
        node.uri = this.snaps[i][1]
        node.socialprotocol = this.sprotocols_[node.uri]
        node.name = this.fbnames_[node.uri]
        if (node.socialprotocol === 'Facebook') {
          node.x = 4 * (Math.random() - 0.5) + this.cwidth * (1 + Math.sin(2 * Math.PI * node.mid / this.snaps.length )) / 4 + this.cwidth * (0.05  + 0.25)
          node.y = 4 * (Math.random() - 0.5) + this.cheight * (1 + Math.cos(2 * Math.PI * node.mid / this.snaps.length )) / 4 + this.cheight * (0.05 + 0.25)
          console.log(node.x, node.y)
        } else {
          // node.x = 100 + i * ii * 5
          // node.y = 100 + 2 * i + ii**2
          node.x = 4 * (Math.random() - 0.5) + this.cwidth * (1 + Math.sin(2 * Math.PI * node.mid / this.snaps.length )) / 8 + this.cwidth * (0.05  + 0.37)
          node.y = 4 * (Math.random() - 0.5) + this.cheight * (1 + Math.cos(2 * Math.PI * node.mid / this.snaps.length )) / 8 + this.cheight * (0.05 + 0.37)
          console.log(node.x, node.y)
        }
        this.mcont.addChild(node)
        this.nodes.push(node)
      }
    },
    mVMap () {
      this.mvmapTime = performance.now()
      this.mkNodes()
      this.$store.dispatch('mynsa/patch', [this.mset._id, {
        mvmapt: this.mvmapTime / 1000,
        mmount: true,
      }])
    },
    startState () {
      this.startTime = performance.now()
      // before sending to the server for calculations
      // timestamp is given by the server
      this.$store.dispatch('mynsa/create', {
        mcreatedt: this.mcreatedt,
        mstartt: this.startTime / 1000,
        mtype: 'allnodes',
        mmount: false,
      }).then( res => {
        this.mset = res
        this.getSnapshots()
      })
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      document.getElementById('renderCanvas').width = this.cwidth_ + 'px'
      this.carea = this.cwidth_ * this.cheight_
      this.cwidth =  0.9 * document.getElementsByTagName('canvas')[0].width
      this.cheight = 0.9 * document.getElementsByTagName('canvas')[0].height
      this.app_.renderer.backgroundColor = 0xFFFFFF
      this.mcont = new PIXI.Container();
      this.mcont.sortableChildren = true
      this.mcont.x = this.cwidth_ / 2;
      this.mcont.y = this.cheight_ / 2;
      this.mcont.pivot.x = this.cwidth_ / 2;
      this.mcont.pivot.y = this.cheight_ / 2;
      this.app_.stage.addChild(this.mcont)
      document.getElementById('toolbar').style.width = (this.cwidth_ + 2) + 'px'
      let c1 = this.getCenter()
      this.dist = ( c1.x ** 2 + c1.y ** 2 ) ** 0.5
      this.beta = Math.acos(c1.x/this.dist)
      let x2 = Math.cos(this.beta + 0.1) * this.dist
      let y2 = Math.sin(this.beta + 0.1) * this.dist
      this.dddx = (x2 - c1.x)
      this.dddy = (y2 - c1.y)
      d3.select('canvas').on('pointerout', function () {
          let p = d3.mouse(this)
      })
      d3.select('canvas').on('pointerdown', function () {
      })
      d3.select('canvas').on('pointermove', function () {
      })
      d3.select('canvas').on('pointerup', function () {
      })
      this.app_.stage.interactive = true
      this.mtexts = []
      this.mtexts2 = []
      this.period = 0.001
      this.ellapsed = 0
      this.foo = 0
      this.mnow = performance.now()
      this.app_.ticker.add( (delta) => {
        // console.log(delta, (performance.now() - this.foo)/10)
        let tdif = (performance.now() - this.mnow)
        if ( tdif > 5000) {
          console.log(tdif)
          this.mnow = performance.now()
          if (this.snaps) {
            console.log('snap')
            this.getNames()
          }
        }
        this.foo = performance.now()
        this.ellapsed += delta
        // console.log(delta, this.ellapsed, this.period, 'not')
        // console.log(delta)
        if (this.nodes) {
          let node = this.nodes[Math.floor(delta * 200) % this.nodes.length]
          node.x += 4 * (Math.random() - 0.5)
          node.y += 4 * (Math.random() - 0.5)
          if (node.socialprotocol === 'Facebook') {
            if (this.mtexts.length < 20) {
              if (this.ellapsed > this.period) {
                this.writeName(node)

                // console.log(this.ellapsed, this.period, 'YES', node.name)
                this.ellapsed = - (this.ellapsed - this.period)
              }
            } else {
              // this.mtext.destroy()
              // delete this.mtext
              let ind = Math.floor(Math.random()*this.mtexts.length)
              let text = this.mtexts[ind]
              text.destroy()
              this.mtexts.splice(ind, 1);
            }
          }
        }
      })
    },
    mhandler (e) {
      e.preventDefault()
      if (e.srcElement.id === 'rzbtn') {
        if (e.button === 0)
          this.resizeNodes('+')
        else
          this.resizeNodes('-')
      } else if (e.srcElement.id === 'vzbtn') {
        if (e.button === 0)
          this.nodeVisibility('-')
        else
          this.nodeVisibility('+')
      } else if (e.srcElement.id === 'rtbtn') {
        if (e.button === 0)
          this.rotateNodes(0.1)
        else
          this.rotateNodes(-0.1)
      } else if (e.srcElement.id === 'ppbtn') {
        if (e.button === 0)
          this.proportionalNodes('degree')
        else
          this.proportionalNodes('children')
      } else if (e.srcElement.id === 'lvzbtn') {
        if (e.button === 0)
          this.linkVisibility('-')
        else
          this.linkVisibility('+')
      } else if (e.srcElement.id === 'zmbtn') {
        if (e.button === 0)
          this.zoom('+')
        else
          this.zoom('-')
      } else if (e.srcElement.id === 'lppbtn') {
        if (e.button === 0)
          this.proportionalLinks('trans')
        else
          this.proportionalLinks('thick')
      } else if (e.srcElement.id === 'ncbtn') {
        this.cndialog = true
      } else if (e.srcElement.id === 'lcbtn') {
        this.cldialog = true
      } else if (e.srcElement.id === 'bcbtn') {
        let c = this.app_.renderer.backgroundColor.toString(16).split('.')[0]
        c = '#' + ('0'.repeat(6 - c.length)) + c
        this.colortobg = c
        this.cbdialog = true
      } else if (e.srcElement.id === 'lrbtn') {
        if (e.button === 0)
          this.pan('l')
        else
          this.pan('r')
      } else if (e.srcElement.id === 'udbtn') {
        if (e.button === 0)
          this.pan('d')
        else
          this.pan('u')
      } else if (e.srcElement.id === 'rtsbtn') {
        if (e.button === 0)
          this.rotateScene('-')
        else
          this.rotateScene('+')
      } else if (e.srcElement.id === 'lwtbtn') {
        if (e.button === 0)
          this.cgLineThickness('+')
        else
          this.cgLineThickness('-')
      } else if (e.srcElement.id.slice(0, 3) === 'tdl') {
        let level = Number(e.srcElement.id.slice(3))
        this.otherlayer = level
        this.renderNetwork()
      } else if (e.srcElement.id === 'layoutbtn') {
        if (e.button === 0) {
          if (this.considerlinks === true && this.tool === 'layout')
            this.considerlinks = false
          else {
            this.considerlinks = false
            this.setTool('layout')
          }
        } else {
          if (this.considerlinks === false && this.tool === 'layout')
            this.considerlinks = true
          else {
            this.considerlinks = true
            this.setTool('layout')
          }
        }
      }
    },
    getCenter () {
      let s = this.app_.stage
      let c = {
        x: (this.cwidth_ - 2*s.x) / (2*s.scale.x),
        y: (this.cheight_ - 2*s.y) / (2*s.scale.y)
      }
      return c
    },
  },
  mounted () {
    window.__this = this
    if (typeof PIXI === 'undefined') {
      // console.log('ok, pixi not found')
      let ele = document.createElement("script");
      let scriptPath = "http://" + window.location.host + "/libs/pixi5.0.2.js"
      ele.setAttribute("src",scriptPath)
      document.head.appendChild(ele)
      // console.log(scriptPath)
      $.ajax({
        url: scriptPath,
        dataType: 'script',
        async: true,
        success: () => {
          this.initPixi()
          this.startState()
      }})
    } else {
      this.initPixi()
      this.startState()
    }
  },
}
</script>

<style>
#renderCanvas {
  border: 1px solid;
}
</style>
