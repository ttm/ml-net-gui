<template>
<div>
  <h1 title="This is a conceptual implementation of the textual analysis of networks. One may select nodes in one set, then in the other set. Then ask to analyze. The result consists of analyses of the text in each set, and a comparison of their texts. Directions for enhancements: node selection methods (communities, sectors, etc); measurements for each set; comparison methods; data source (email lists, Wikipedia, etc); nice visualization elements for the analyses; auxiliary transformations of the visualization (node size, position, link width, etc). In this gadget, the network and texts are synthesized at random.">NetText -- minimal
    <nuxt-link to="/text/minAbout">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue"></i>
    </nuxt-link>

  </h1>
<v-system-bar id="toolbar" window dark>
  <v-icon class="tbtn" id='tgbtn' @contextmenu="mhandler($event)" @click="mhandler" title="click to toogle set 1 or 2 of nodes">change_history</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" id='inbtn' @contextmenu="mhandler($event)" @click="mhandler" title="analyze texts in the node sets">input</v-icon>
</v-system-bar>
  <div @contextmenu="mhandler($event)" id="renderCanvas"></div>
  <v-layout row id="adiv">
    <div>
      <h4>token lengths in set 1</h4>
      mean: {{an.l ? an.l[0].toFixed(3) : 'not requested'}}<br/>
      std: {{an.l ? an.l[2].toFixed(3) : 'not requested'}}
    </div>
  <v-spacer></v-spacer>
    <div>
      <h4>token lengths in set 2</h4>
      mean: {{an.l ? an.l[1].toFixed(3) : 'not requested'}}<br/>
      std: {{an.l ? an.l[3].toFixed(3) : 'not requested'}}
    </div>
  <v-spacer></v-spacer>
    <div>
      <h4>comparison btween texts</h4>
      c': {{an.c ? an.c[1].toFixed(3) : 'not requested'}}<br/>
      KS: {{an.c ? an.c[2].toFixed(3) : 'not requested'}}
    </div>
  </v-layout>
<v-footer class="pa-3">
  <v-spacer></v-spacer>
  <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
</v-footer>
</div>
</template>

<script>
import $ from 'jquery'

function clickNode (event) {
  __this.mnode = this
  if (__this.isl2) {
    if (this.tset === 2) {
      this.tint = 0x00FF00
      this.tset = 0
    } else {
      this.tint = 0x00FFFF
      this.tset = 2
    }
  } else {
    if (this.tset === 1) {
      this.tint = 0x00FF00
      this.tset = 0
    } else {
      this.tint = 0xFFFF00
      this.tset = 1
    }
  }
}

export default {
  head () {
    return {
      script: [
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' }
      ],
    }
  },
  data () {
    return {
      an: {},
    }
  },
  mounted () {
    window.__this = this
    this.nodes = []
    this.mkPaths()
    this.getNetwork()
  },
  methods: {
    mkStats () {
      // select text in set 1
      let t1 = this.nodes.reduce( (t, n) => {
        if (n.tset === 1)
          t += n.text
        return t
      }, '')
      // select text in set 2
      let t2 = this.nodes.reduce( (t, n) => {
        if (n.tset === 2)
          t += n.text
        return t
      }, '')
      // send to server for analysis
      let turl = process.env.flaskURL + '/anTexts/'
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            t1: t1,
            t2: t2,
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( an => {
        this.an = an
      })
      // when done, place cards with results
    },
    mkPaths () {
      this.radius = 10
      this.dx = Math.cos(Math.PI/6) * this.radius
      this.dy = Math.sin(Math.PI/6) * this.radius
      let p1x = 0
      let p1y = - this.radius
      let p2x = + this.dx
      let p2y = + this.dy
      let p3x = - this.dx
      let p3y = + this.dy
      this.path = [p1x, p1y, p2x, p2y, p3x, p3y]
    },
    mhandler (e) {
      e.preventDefault()
      if (e.srcElement.id === 'tgbtn') {
        let b = document.getElementById('tgbtn')
        if (this.isl2) {
          b.style.backgroundColor = "gray"
          this.isl2 = false
        } else {
          b.style.backgroundColor = "black"
          this.isl2 = true
        }
      } else if (e.srcElement.id === 'inbtn') {
        console.log('in btn!!')
        this.mkStats()
      }
    },
    getNetwork () {
      let turl = process.env.flaskURL + '/getTextNetwork/'
      $.ajax(
        turl,
        {
          type : 'POST',
          contentType : 'application/json',
        },
      ).done( net => {
        this.network = net
        this.getLayout()
      })
    },
    getLayout () {
      let turl = process.env.flaskURL + '/layoutOnDemand/'
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            layout: 'spring',
            dim: 2,
            nodes: this.network.nodes,
            links: this.network.links.map( l => [...l, 1] ),
            lonely: false
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( layout => {
        this.xxlayout = layout
        this.initPixi()
        this.mkLines()
        this.mkNodes()
      })
    },
    mkLines () {
      let links = this.network.links
      let layout = this.xxlayout
      for (let i = 0; i < links.length; i++) {
        let l = links[i]
        let p1 = this.scalePos(layout[l[0]])
        let p2 = this.scalePos(layout[l[1]])
        let line = new PIXI.Graphics()
        line.lineStyle(1, 0xFFFFFF)
        line.moveTo(...p1)
        line.lineTo(...p2)
        line.alpha = 0.4
        line.tint = 0x000000
        line.p1 = p1
        line.p2 = p2
        this.mcont.addChild(line)
      }
    },
    mkNodes () {
      let nodes = this.network.nodes
      let layout = this.xxlayout
      for (let i = 0; i < nodes.length; i++) {
        let nid = nodes[i]
        let p = this.scalePos(layout[nid])
        const node = new PIXI.Graphics()
        node.lineStyle(1, 0x000000)
        node.beginFill(0xFFFFFF)
        node.drawPolygon(this.path )
        node.endFill()
        node.tint = 0x00FF00
        node.x = p[0]
        node.y = p[1]
        node.interactive = true
        node.buttonMode = true
        node.alpha = 0.8
        node.id = nid
        node.text = this.network.texts[nid]
        node
          .on('pointerdown', clickNode)
        this.mcont.addChild(node)
        this.nodes.push(node)
      }
    },
    scalePos (p) {
      return [
        (1 + 0.9 * p[0]) * this.cwidth_ / 2,
        (1 + 0.9 * p[1]) * this.cheight_ / 2
      ]
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      document.getElementById('toolbar').style.width = (this.cwidth_ + 2) + 'px'
      document.getElementById('adiv').style.width = (this.cwidth_ + 2) + 'px'
      document.getElementById('renderCanvas').style.width = (this.cwidth_+2) + 'px'
      this.app_.renderer.backgroundColor = 0xFFFFFF
      this.mcont = new PIXI.Container();
      this.mcont.x = this.cwidth_ / 2;
      this.mcont.y = this.cheight_ / 2;
      this.mcont.pivot.x = this.cwidth_ / 2;
      this.mcont.pivot.y = this.cheight_ / 2;
      this.app_.stage.addChild(this.mcont)
      this.app_.stage.interactive = true
    },
  },
}
</script>

<style>
.tbtn {
  background-color: gray;
}
#renderCanvas {
  border: 1px solid;
}
</style>

