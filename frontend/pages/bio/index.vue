<template>
<div>
  <v-layout>
  <v-menu offset-y title="select seed gene">
    <v-btn
      slot="activator"
      color="primary"
      v-show="!loaded"
    >
      {{ gene ? gene : 'Select gene' }}
    </v-btn>
    <v-list
      class="scroll-y"
    >
      <v-list-tile
        v-for="(gene_, index) in genes"
        :key="index"
        @click="gene = gene_"
      >
        <v-list-tile-title color="primary">{{ gene_ }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
  <v-btn
    slot="activator"
    color="green lighten-2"
    @click="renderNetwork()"
    title="click to plot seed to canvas"
    v-show="!loaded && gene"
  >
    plot genes
  </v-btn>
  <span style="width:800px">
    <v-slider
      v-model="limiar"
      thumb-label="always"
      :max="1"
      :min="0"
      :label="'correlation threshold'"
      :step="0.001"
      v-show="loaded"
    ></v-slider>
  </span>
  </v-layout>
  <v-layout row v-show="loaded">
    <div @contextmenu="mhandler($event)" id="renderCanvas"></div>
    <v-layout column>
      <div id='tools'>
      <v-icon id="zbtn" @contextmenu="mhandler2($event)" @click="mhandler2" title="zoom in/out with left/right click">zoom_out</v-icon>
      <v-icon id="abtn" @contextmenu="mhandler2($event)" @click="mhandler2" title="zoom in/out with left/right click">all_out</v-icon>
      </div>
      action info: 
      <span id='iinfo'>{{ this.curinfo }}</span>
      general info:
      <span id='geninfo'>{{ this.generalinfo }}</span>
    </v-layout>
  </v-layout>
<v-footer class="pa-3">
  <v-spacer></v-spacer>
  <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
</v-footer>
</div>
</template>

<script>
// global.fetch = require("node-fetch")
// // window.fetch = require("node-fetch")
// import * as d3 from 'd3'
// import fetch from 'node-fetch'
// global.fetch = fetch
import $ from 'jquery'
const ColourValues = [
  "FF0000", "00FF00", "0000FF", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "808080",
  "C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0",
  "400000", "004000", "000040", "404000", "400040", "004040", "404040",
  "200000", "002000", "000020", "202000", "200020", "002020", "202020",
  "600000", "006000", "000060", "606000", "600060", "006060", "606060",
  "A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0",
  "E00000", "00E000", "0000FF", "E000E0", "00E0E0"
]
function hoverNode () {
  console.log(this.gene)
  __this.genedata[this.gene].forEach( (g, i) => {
    let gene = __this.genes[i]
    if (g > __this.limiar && gene !== this.gene && __this.genenodes[gene]) {
      __this.genenodes[gene].tint = 0xFFFF00 
      __this.genenodes[gene].hover = this.gene
    }
  })
  let neigh = __this.genedata[this.gene].reduce( (total, g, i) => {
    let gene = __this.genes[i]
    if (g > __this.limiar && gene !== this.gene) {
      total[0]++
      if (__this.genenodes[gene]) {
        total[1]++
      }
    }
    return total
  }, [0, 0])
  __this.newgene = this.gene
  __this.curinfo = 'gene: ' + this.gene.replace(/0*([1-9][0-9]*)/g,"$1") + ', related to: ' + neigh[0] + ' (' + neigh[1] + ' shown)'
}
function outNode () {
  console.log(this.gene)
  __this.genedata[this.gene].forEach( (g, i) => {
    let gene = __this.genes[i]
    if (g > __this.limiar && gene !== this.gene && __this.genenodes[gene] && __this.genenodes[gene].hover === this.gene) {
      let node = __this.genenodes[gene]
      let gen = node.ogen ? node.ogen : node.generation
      node.tint = __this.nodecolors[gen]
    }
  })
}
function clickNode (e) {
  if (__this.tool === 'atool') {
    __this.placeFarther(this.generation)
    return
  }
  console.log('plot genes > x', e)
  __this.mgene = this
  let genes = []
  let curgenes = Object.keys(__this.genedata)
  __this.genedata[this.gene].forEach( (c, i) => {
    let gene = __this.genes[i]
    console.log('mcount', i)
    if (gene === undefined)
      console.log('undefined found', i)
    if (c > __this.limiar && gene !== this.gene && !curgenes.includes(gene)) {
      genes.push(gene)
    }
  })
  __this.plotGenes(genes, this.generation + 1)
  __this.mgenes = genes
  let s = JSON.stringify(genes).replace(',', ', ')
  s = s.slice(1, s.length - 1).replace(/"/g,'').replace(/,/g, ', ').replace(/0*([1-9][0-9]*)/g,"$1")
  __this.curinfo = 'showing new genes: ' + s
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
      genes: [],
      gene: '',
      limiar: 0.2,
      loaded: false,
      curinfo: '--',
      generalinfo: '',
      nodes: [],
      links: []
    }
  },
  methods: {
    placeFarther (gen) {
      let empty = 0
      this.generations.forEach( (gen, i) => {
        if (gen.length === 0)
          empty = i
      })
      let gen2
      if ((!empty) || (gen === this.generations.length - 1) || (empty < gen)) {
        console.log('did not find empty')
        this.generations.push(this.generations[gen])
        gen2 = this.generations.length - 1
      } else {
        console.log('found empty', empty)
        this.generations[empty] = this.generations[gen]
        gen2 = empty
      }
      console.log(gen, empty, gen2)
      this.generations[gen] = []
      let r = gen2 * 30
      let l = this.generations[gen2].length
      this.generations[gen2].forEach( (g, i) => {
        let a = 2*Math.PI*i/l - (Math.PI/2) * ( (gen2 + 1) % 2)
        let n = this.genenodes[g]
        n.x = r*Math.cos(a)
        n.y = r*Math.sin(a)
        this.mkLinks_(g)
        n.ogen = n.ogen ? n.ogen : n.generation
        n.generation = gen2
      })
    },
    mhandler2 (e) {
      e.preventDefault()
      if (e.srcElement.id === 'zbtn') {
        if (e.button !== 0) {
          this.app_.stage.scale.x += 0.1
          this.app_.stage.scale.y += 0.1
        } else {
          this.app_.stage.scale.x -= 0.1
          this.app_.stage.scale.y -= 0.1
        }
      } else if (e.srcElement.id === 'abtn') {
        if (this.tool === 'atool') {
          delete this.tool
          document.getElementById('abtn').style.backgroundColor = 'white'
        } else {
          this.tool = 'atool'
          document.getElementById('abtn').style.backgroundColor = 'gray'
        }
      }
    },
    renderNetwork () {
      this.nodes = []
      const node = new PIXI.Graphics()
      node.gene = this.gene
      node.generation = 0
      node.lineStyle(4, 0x888888)
      node.beginFill(0xFFFFFF)
      node.drawEllipse( 0, 0, 12, 7 )
      node.endFill()
      node.tint = this.nodecolors[0]
      node.interactive = true
      node.buttonMode = true
      node.alpha = 0.6
      this.app_.stage.addChild(node)
      node
        .on('pointerover', hoverNode )
        .on('pointerout', outNode )
        .on('pointerdown', clickNode )
      this.nodes.push(node)
      this.getGeneData(this.gene)
      this.generations[0] = [this.gene]
      this.genenodes[this.gene] = node
      this.loaded = true
    },
    plotGenes (genes, generation) {
      let genes_ = genes.filter( g => !Object.keys(this.genenodes).includes(g) )
      if (!this.generations[generation])
        this.generations[generation] = genes_
      else
        this.generations[generation] = this.generations[generation].concat(genes_)
      let r = generation * 30
      let l = this.generations[generation].length
      this.generations[generation].forEach( (g, i) => {
        let a = 2*Math.PI*i/l - (Math.PI/2) * ( (generation + 1) % 2)
        if (!this.genenodes[g]) {
          const node = new PIXI.Graphics()
          node.gene = g
          node.generation = generation
          node.lineStyle(4, 0x888888)
          node.beginFill(0xFFFFFF)
          node.drawEllipse( 0, 0, 12, 7 )
          node.x = r*Math.cos(a)
          node.y = r*Math.sin(a)
          node.endFill()
          node.tint = this.nodecolors[generation]
          node.interactive = true
          node.buttonMode = true
          node.alpha = 0.6
          node
            .on('pointerover', hoverNode )
            .on('pointerout', outNode )
            .on('pointerdown', clickNode )
          this.app_.stage.addChild(node)
          this.nodes.push(node)
          this.genenodes[g] = node
          this.getGeneData(g)
        } else {
          let n = this.genenodes[g]
          n.x = r*Math.cos(a)
          n.y = r*Math.sin(a)
        }
      })
    },
    mkLinks_ (g) {
      let cc = this.genedata[g]
      cc.forEach( (c, j) => {
        if (c > this.limiar) {
          let gg = this.genes[j]
          if (gg === g)
            return
          let lnames = Object.keys(this.links)
          if (this.genenodes[gg]) {
            let n1 = g+'-'+gg
            let n2 = gg+'-'+g
            // check if line is present
            let g1 = this.genenodes[g]
            let g2 = this.genenodes[gg]
            if (!(g1 && g2))
              return
            if (g === this.gene || gg === this.gene)
              return
            if (this.links[n1] || this.links[n2]) {
              // if it is, update x, y
              let l = this.links[n1] ? this.links[n1] : this.links[n2]
              l.clear()
              l.moveTo(g1.x, g1.y)
              l.lineTo(g2.x, g2.y)
            } else {
              // if not, make the line
              let l = new PIXI.Graphics()
              l.lineStyle(1, 0xFFFFFF)
              l.tint = 0x0000FF
              l.moveTo(g1.x, g1.y)
              l.lineTo(g2.x, g2.y)
              l.alpha = 0.4
              this.app_.stage.addChild(l)
              this.links[n1] = l
            }
          }
        }
      })
    },
    updateLinks () {
      this.genes.forEach( g => {
        if (!this.genedata[g])
          return
        else {
          this.mkLinks_(g)
        }
      })
      this.upGenInfo()
    },
    mkLinks (generation) {
      let genes = this.generations[generation]
      genes.forEach( (g, i) => {
        let cc = this.genedata[g]
        cc.forEach( (c, j) => {
          if (c > this.limiar) {
            let gg = this.genes[j]
            let lnames = Object.keys(this.links)
            if (Object.keys(this.genenodes).includes(gg)) {
              let n1 = g+'-'+gg
              let n2 = gg+'-'+g
              // check if line is present
              let g1 = this.genenodes[g]
              let g2 = this.genenodes[gg]
              if (this.links[n1] || this.links[n2]) {
                // if it is, update x, y
                let l = this.links[n1] ? this.links[n1] : this.links[n2]
                l.clear()
                l.moveTo(g1.x, g1.y)
                l.lineTo(g2.x, g2.y)
              } else {
                // if not, make the line
                let line = new PIXI.Graphics()
                line.lineStyle(1, 0xFFFFFF)
                line.tint = 0x0000FF
                l.moveTo(g1.x, g1.y)
                l.lineTo(g2.x, g2.y)
                line.alpha = 0.4
                this.app_.stage.addChild(line)
                this.links[n1] = line
              }
            }
          }
        })
      })
    },
    getGeneData (gene) {
      let turl = process.env.flaskURL + '/geneData/'
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            gene: gene
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( data => {
        data.pop() // because of error in making the correlations
        this.genedata[gene] = data
        this.updateLinks()
        if (!this.firstgenedone) {
          this.firstgenedone = true
          // this.nodes[0].emit('pointerdown')
        }
      })
    },
    getGenes () {
      let turl = process.env.flaskURL + '/genes/'
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            banana: 'for you'
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( genes => {
        this.genes = genes
        this.gene = genes[0]
      })
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      this.app_.stage.x = this.cwidth_ / 2
      this.app_.stage.y = this.cheight_ / 2
      this.cwidth =  0.9 * document.getElementsByTagName('canvas')[0].width
      this.cheight = 0.9 * document.getElementsByTagName('canvas')[0].height
      this.app_.renderer.backgroundColor = 0xFFFFFF
      this.mkCircles()
    },
    mkCircles () {
      let gs = 20
      let circles = []
      for (let i = 1; i < gs; i++) {
        let r = (gs - i) * 30
        const circle = new PIXI.Graphics()
        circle.lineStyle(3, 0x00FF00)
        circle.beginFill(0xFFFFFF)
        circle.drawCircle( 0, 0, r )
        circle.endFill()
        circle.alpha = 0.4
        this.app_.stage.addChild(circle)
        circles.push(circle)
      }
      this.circles = circles
    },
    mhandler (e) {
      e.preventDefault()
      console.log('was right click')
      this.destroyAll()
      this.mkAuxData()
      this.gene = this.newgene
      // this.firstgenedone = false
      this.renderNetwork()
      this.curinfo = 'new center gene: ' + this.gene.replace(/0*([1-9][0-9]*)/g,"$1")
    },
    destroyAll () {
      this.nodes.forEach( n => {
        n.destroy()
      })
      Object.values(this.links).forEach( l => {
        l.destroy()
      })
      delete this.nodes
      delete this.links
      delete this.genedata
      delete this.genenodes
      delete this.generations
      delete this.links
      this.mkAuxData()
    },
    mkAuxData () {
      this.genedata = {}
      this.genenodes = {}
      this.generations = []
      this.links = {}
    },
    upGenInfo () {
      let n1 =  + this.generations[1] ? this.generations[1].length : 0
      this.generalinfo = 'showing: ' + this.nodes.length + ' genes, and ' + (Object.keys(this.links).length + n1) + ' relations.' + '\n\ncentral gene: ' + this.gene.replace(/0*([1-9][0-9]*)/g,"$1")
    },
  },
  mounted () {
    window.__this = this
    this.nodecolors = ColourValues.map( c => parseInt(c, 16) )
    this.mkAuxData()
    if (typeof PIXI === 'undefined') {
      console.log('ok, pixi not found')
      let ele = document.createElement("script");
      let scriptPath = "http://" + window.location.host + "/libs/pixi5.0.2.js"
      ele.setAttribute("src",scriptPath)
      document.head.appendChild(ele)
      console.log(scriptPath)
      $.ajax({
        url: scriptPath,
        dataType: 'script',
        async: true,
        success: () => {
          this.initPixi()
          this.getGenes()
      }})
    } else {
      this.initPixi()
      this.getGenes()
    }
  },
}
</script>
<style>
  #renderCanvas {
    margin-right: 10px;
    border: 1px solid;
  }
  #iinfo {
    border: 1px solid;
    margin-bottom: 10px;
  }
  #geninfo {
    border: 1px solid;
  }
  .scroll-y {
    max-height: 400px;
    overflow: auto;
  }
</style>
