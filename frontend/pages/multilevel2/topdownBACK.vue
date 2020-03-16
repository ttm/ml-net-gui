<template>
<span>
<v-layout align-center justify-center row fill-height>
  <v-flex text-xs-center>
    <v-menu offset-y title="select the network">
      <v-btn
        slot="activator"
        color="primary"
        dark
      >
        {{ network ? network.filename : 'Select network' }}
      </v-btn>
      <v-list>
        <v-list-tile
          v-for="(net, index) in networks_"
          :key="index"
          @click="network = net"
        >
          <v-list-tile-title color="primary">{{ net.filename }}</v-list-tile-title>
        </v-list-tile>
        <v-list-tile>
          <input type="file" @change="upload">
        </v-list-tile>
      </v-list>
    </v-menu>
    <v-menu offset-y title="select the layout">
      <v-btn
        slot="activator"
        color="primary"
        dark
      >
        {{ layout ? layout : 'Select' }}
      </v-btn>
      <v-list>
        <v-list-tile
          v-for="(lay, index) in layouts"
          :key="index"
          @click="layout = lay"
        >
          <v-list-tile-title color="primary">{{ lay }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
  </v-flex>
</v-layout>
<v-expansion-panel expand v-model="panel">
  <v-expansion-panel-content>
<v-flex mt-1>
<v-card flat dark>
  <v-layout align-center justify-center>
    <v-flex>
      <table>
      <span
        v-for="index in nlayers" :key="index"
      >
      <tr class="row2"
      >
        <td class="tcolumn">
          layer {{ index }}
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'reduction'"
            :left="true"
            v-model="bi.reduction[index - 1]"
            type="number"
            step="0.1"
            max="1"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'max levels'"
            :left="true"
            v-model="bi.max_levels[index - 1]"
            type="number"
            step="1"
            min="1"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'min vertices'"
            :left="true"
            v-model="bi.global_min_vertices[index - 1]"
            type="number"
            step="1"
            min="1"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-menu>
            <template #activator="{ on: menu }">
              <v-tooltip bottom>
                <template #activator="{ on: tooltip }">
                  <v-btn class="btn22"
                    color="primary"
                    dark
                    v-on="{ ...tooltip, ...menu }"
                  > {{ bi.matching[index - 1] }}</v-btn>
                </template>
                <span>matching method</span>
              </v-tooltip>
            </template>
            <v-list>
              <v-list-tile
                v-for="(item, index_) in bi.valid_matching"
                :key="index_"
                @click="bi.matching[index - 1] = item"
              >
                <v-list-tile-title>{{ item }}</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </td>
        <td class="tcolumn">
          <v-menu>
            <template #activator="{ on: menu }">
              <v-tooltip bottom>
                <template #activator="{ on: tooltip }">
                  <v-btn class="btn22"
                    color="primary"
                    dark
                    v-on="{ ...tooltip, ...menu }"
                  > {{ bi.similarity[index - 1].slice(0,5) }}</v-btn>
                </template>
                <span>similarity criterion: {{ bi.similarity[index -1] }}</span>
              </v-tooltip>
            </template>
            <v-list>
              <v-list-tile
                v-for="(item, index_) in bi.valid_similarity"
                :key="index_"
                @click="bi.similarity[index - 1] = item"
              >
                <v-list-tile-title>{{ item }}</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'similarity'"
            :left="true"
            v-model="bi.similarity[index - 1]"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'upper bound'"
            :left="true"
            v-model="bi.upper_bound[index - 1]"
            type="number"
            step="0.1"
            min="0"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'iterations'"
            :left="true"
            v-model="bi.itr[index - 1]"
            type="number"
            step="1"
            min="1"
          ></v-text-field>
        </td>
        <td class="tcolumn">
          <v-text-field
            :label="'tolerance'"
            :left="true"
            v-model="bi.tolerance[index - 1]"
            type="number"
            step="0.0001"
            min="0"
          ></v-text-field>
        </td>
      </tr>
      </span>
      </table>
    </v-flex>
  </v-layout>
</v-card>
</v-flex>
  </v-expansion-panel-content>
</v-expansion-panel>
<v-layout row ml-4>
  <v-btn
    slot="activator"
    color="green lighten-2"
    dark
    @click="renderNetwork()"
  >
    Render network
  </v-btn>
  <v-checkbox v-model="links" label="show links"> </v-checkbox>
  <v-text-field
    v-model="curlevelinfo"
    label="current level"
    outline
    readonly
  ></v-text-field>
</v-layout>
<v-system-bar id="toolbar" window dark>
  <v-icon class="tbtn" @click="showLevel('+')" title="focus on coarser level">unfold_less</v-icon>
  <v-icon class="tbtn" @click="showLevel('-')" title="focus less coarsed level">unfold_more</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" @click="randomColorize('n')" title="randomize node color">invert_colors</v-icon>
  <v-icon class="tbtn" @click="resizeNodes('+')" title="decrease node size">control_camera</v-icon>
  <v-icon class="tbtn" @click="resizeNodes('-')" title="increase node size">games</v-icon>
  <v-icon class="tbtn" @click="proportionalNodes('degrees')" title="make node size proportional to degree">insert_chart</v-icon>
  <v-icon class="tbtn" @click="proportionalNodes('children')" title="make node size proportional to number of children">insert_chart_outlined</v-icon>
  <v-icon class="tbtn" @click="restoreNodeSizes()" title="reinitializes node sizes">undo</v-icon>
  <v-icon class="tbtn" @click="nodeVisibility('+')" title="decrease node transparency">hdr_strong</v-icon>
  <v-icon class="tbtn" @click="nodeVisibility('-')" title="increase node transparency">hdr_weak</v-icon>
  <v-icon class="tbtn" @click="rotateNodes()" title="rotate nodes">rotate_left</v-icon>
  <v-icon class="tbtn" @click="randomColorize('l')" title="randomize link color">invert_colors_off</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" @click="linkVisibility('+')" title="decrease line transparency">drag_handle</v-icon>
  <v-icon class="tbtn" @click="linkVisibility('-')" title="increase line transparency">power_input</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn ptbtn" id="infobtn" @click="setTool('info')" title="get info on specific nodes">info</v-icon>
  <v-icon class="tbtn ptbtn" id="dragbtn" @click="setTool('drag')" title="drag nodes to reposition them">gesture</v-icon>
  <v-icon class="tbtn ptbtn" id="explorebtn" @click="setTool('explore')" title="open nodes into child nodes">explore</v-icon>
  <v-icon class="tbtn ptbtn" id="regionexplorebtn" @click="setTool('regionexplore')" title="open regions of nodes into child nodes">tab_unselected</v-icon>
  <v-icon class="tbtn ptbtn" id="joinbtn" @click="setTool('join')" title="join opened metanodes">border_outer</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" @click="zoom('+')" title="zoom in">zoom_in</v-icon>
  <v-icon class="tbtn" @click="zoom('-')" title="zoom out">zoom_out</v-icon>
  <v-icon class="tbtn" @click="pan('l')" title="pan left">chevron_left</v-icon>
  <v-icon class="tbtn" @click="pan('r')" title="pan right">chevron_right</v-icon>
  <v-icon class="tbtn" @click="pan('u')" title="pan up">expand_less</v-icon>
  <v-icon class="tbtn" @click="pan('d')" title="pan down">expand_more</v-icon>
  <v-icon class="tbtn" @click="home()" title="toogle initial and current zoom and pan">home</v-icon>
</v-system-bar>
<div id="renderCanvas"></div>
    <v-snackbar
      v-model="snackbar"
      :multi-line="true"
      :timeout="6000"
    >
      {{ snacktext }}
      <v-btn
        color="pink"
        flat
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
</span>
</template>

<script>
import $ from 'jquery'
import * as d3 from 'd3'

function moveNode () {
  if (this.dragging) {
    const newposition = this.data.getLocalPosition(this.parent)
    this.x = newposition.x
    this.y = newposition.y
    __this.nps = newposition
    let px = this.x * 2/__this.cwidth - 1
    let py = this.y * 2/__this.cheight - 1
    __this.networks[__this.curlevel].nodes[this.mdata.ID] = [px, py]
  }
}

function releaseNode () {
  if (this.dragging) {
    this.alpha *= 2
    this.dragging = false
    this.data = null
    __this.redrawLinks(this.mldata.links)
  }
}

function clickNode (event) {
  __this.mnode = this
  if (__this.tool === 'info') {
    __this.snacktext = this.mdata
    __this.snackbar = true
  } else if (__this.tool === 'explore'){
    __this.showChildren(this)
  } else if (__this.tool === 'join'){
    __this.joinMetanodes(this)
  } else if (__this.tool === 'drag'){
    this.data = event.data // because of multitouch
    this.alpha *= 0.5
    this.dragging = true
  } else {
    __this.snacktext = 'select a tool to interact with network'
    __this.snackbar = true
  }
}
export default {
  head () {
    return {
      script: [
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
      ]
    }
  },
  data () {
    return {
      links: true,
      panel: [true],
      nlayers: 2,
      curlevel: '----',
      networks_: [],
      network: '',
      bi: {
        reduction: ['0.1', '0.1'],
        max_levels: ['5', '5'],
        global_min_vertices: ['100', '100'],
        matching: ['gmb', 'gmb'],
        similarity: ['weighted_common_neighbors', 'weighted_common_neighbors'],
        upper_bound: ['0.1', '0.1'],
        itr: ['10', '10'],
        tolerance: ['0.0001', '0.0001'],
        valid_matching: ['rgmb', 'gmb', 'mlpb', 'hem', 'lem', 'rm'],
        valid_similarity: ['common_neighbors', 'weighted_common_neighbors',
        'salton', 'preferential_attachment', 'jaccard', 'weighted_jaccard',
        'adamic_adar', 'resource_allocation', 'sorensen', 'hub_promoted',
        'hub_depressed', 'leicht_holme_newman']
      },
      layouts: [
        'circular',
        'fruch',
        'kamada',
        'random',
        'shell',
        'spectral',
        'spring'
      ],
      layout: 'kamada',
      snackbar: false,
      snacktext: 'msnacktext',
      curlevelinfo: '---',
    }
  },
  mounted () {
    window.__this = this
    this.initPixi()
    // d3.select('canvas')
    //   .on('mouseenter', function () {
    //     d3.select('body').style('overflow', 'hidden')
    //   })
    //   .on('mouseout', function () {
    //     d3.select('body').style('overflow', 'scroll')
    //   })
    this.findNetworks()
  },
  methods: {
    setTool (toolname) {
      let b = document.getElementById(toolname+'btn')
      if (this.tool === toolname) {
        this.tool = ''
        b.style.backgroundColor = "gray"
      } else {
        this.tool = toolname
        this.snacktext = {
          info: 'click on nodes for info',
          drag: 'click and hold on node to drag',
          explore: 'click on nodes to show their child nodes',
          join: 'click on two open metanodes to join them',
          regionexplore: 'click and drag to open all nodes in region',
        }[toolname]
        this.snackbar = true
        Array(...document.getElementsByClassName('ptbtn')).forEach( e => { e.style.backgroundColor = 'gray' })
        b.style.backgroundColor = "black"
      }
    },
    joinMetanodes (node) {
      if (!node.mldata.isopen) {
        this.snacktext = 'please choose an opened metanode'
        this.snackbar = true
        return
      }
      if (!this.specified_metanode) {
        this.specified_metanode = node
        node.tint = 0x00FFFF
      } else {
        let n1 = this.specified_metanode
        let n2 = node
        this.n1 = n1
        this.n2 = n2
        let path1 = n1.mldata.paths[n1.mldata.paths.length - 1]
        let path2 = n2.mldata.paths[n2.mldata.paths.length - 1]
        let maxx = Math.max(
          - path1[0] + n1.x,
          - path2[0] + n2.x,
        )
        let maxy = Math.max(
          - path1[1] + n1.y,
          - path2[1] + n2.y,
        )
        let minx = Math.min(
          path1[0] + n1.x,
          path2[0] + n2.x,
        )
        let miny = Math.min(
          path1[1] + n1.y,
          path2[1] + n2.y,
        )
        let ex = (maxx - minx) / 2
        let ey = (maxy - miny) / 2
        let path = [ -ex, -ey, -ex, ey, ex, ey, ex, -ey] // meta rectangle
        let cx = (maxx + minx) / 2
        let cy = (maxy + miny) / 2

        n1.clear()
        n2.clear()
        n1.beginFill(0xFFFFFF, .1)
        n1.drawPolygon(path)
        n1.endFill()
        n1.x = cx
        n1.y = cy
        n1.mldata.paths.push(path)
        n1.tint = 0xFFFFFF
        n1.mldata.children.push(n1.mdata.children.concat(n2.mdata.children))
        this.positionChildren(n1)
        this.specified_metanode = 0
      }
    },
    showChildren (node) {
      node.clear()
      node.tint = 0xFFFFFF
      node.lineStyle(2, 0xFFFFFF, 0.7)
      node.beginFill(0xFFFFFF, .1)
      node.drawPolygon(this.pathrect)
      node.mldata.paths.push(this.pathrect)
      node.endFill()
      node.mldata.children.push(node.mdata.children)

      this.positionChildren(node)
      node.mldata.isopen = true
    },
    positionChildren(node) {
      let level = node.mdata.level - 1
      let nodes = this.nodes[level]
      let children = node.mldata.children[node.mldata.children.length - 1]
      let dx = - node.mldata.paths[node.mldata.paths.length - 1][0]
      let dy = - node.mldata.paths[node.mldata.paths.length - 1][1]

      let child_layout = this.mkLayout(children, level)
      children.forEach( (c, i) => {
        let p = child_layout[i]
        nodes[c].visible = true
        nodes[c].tint = 0x0000FF
        nodes[c].x = node.x + p[0] * dx * 0.8
        nodes[c].y = node.y + p[1] * dy * 0.8
        nodes[c].scale.set(this.nodescales[level])
      })
      this.snacktext = 'shown children ' + children + ' of level ' + level
      this.snackbar = true
    },
    mkLayout (nodes, level, type = 'spring') {
      let links = []
      nodes.forEach( n1 => {
        let neighbors = this.nodes[level][n1].mldata.neighbors
        console.log(n1, neighbors, 'each node')
        nodes.forEach( n2 => {
          console.log(n2, 'each other node')
          if (neighbors.includes(n2)) {
            links.push( [n1, n2] )
          }
        })
      })
      let turl = process.env.flaskURL + '/layoutOnDemand/'
      console.log(links, 'tlinks')
      let layout_
      $.post(
        turl,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            layout: this.layout,
            dim: 2,
            nodes: nodes,
            links: links
          })
        }
      ).done( layout => { 
        layout_ = layout
      })
      console.log('tlayout', layout_)
      this.layout = 'dummy'
      if (this.layout === 'dummy') {
        let pos = []
        nodes.forEach( n => {
          pos.push([Math.random(), Math.random()])
        })
        return pos
      }
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      this.cwidth =  0.9 * document.getElementsByTagName('canvas')[0].width
      this.cheight = 0.9 * document.getElementsByTagName('canvas')[0].height
      document.getElementById('toolbar').style.width = this.cwidth_ + 'px'
    },
    mkNode(p, level) {
      let px = (1 + p[0]) * this.cwidth/2
      let py = (1 + p[1]) * this.cheight/2
      const node = new PIXI.Graphics()
      node.lineStyle(0)
      node.beginFill(0xFFFFFF)
      node.drawPolygon(this.path)
      node.endFill()
      node.tint = 0xFF0000
      node.x = px
      node.y = py
      node.visible = this.curlevel == level
      node.interactive = true
      node.buttonMode = true
      node.alpha = 0.8
      node
        .on('pointerdown', clickNode)
        .on('pointerup', releaseNode)
        .on('pointerupoutside', releaseNode)
        .on('pointermove', moveNode)
      this.app_.stage.addChild(node)
      this.nodes[level].push(node)
      return node
    },
    mkNodes(level) {
      let net = this.networks[level]
      let ps = net.nodes
      console.log('nodes ', level)
      for (let i = 0; i < ps.length; i++) {
        let node = this.mkNode(ps[i], level)
        let neighbors = this.nodelinks[level][i]
          .map( l => net.edges[l])
          .map( l => (l[0] === i ? l[1] : l[0]))

        node.mdata = {
          children: net.children[i],
          clust: net.clust[i],
          degree: net.degrees[i],
          parent_: net.parents[i],
          level: level,
          nei: neighbors,
          ID: i
        }
        node.mldata = {
          paths: [],
          children: [],
          links: this.nodelinks[level][i],
          links_: this.nodelinks[level][i].map( l => net.edges[l]),
          source: net.sources[i],
          neighbors: neighbors
        }
      }
    },
    mkLine (p1, p2, level) {
      let line = new PIXI.Graphics()
      line.lineStyle(1, 0xFFFFFF)
      line.tint = 0xFFFF00
      line.moveTo(...p1)
      line.lineTo(...p2)
      line.visible = this.curlevel == level
      line.alpha = 0.4
      this.app_.stage.addChild(line)
      this.lines[level].push(line)
    },
    mkLines(level) {
      console.log('lines ', level)
      let links = this.networks[level].edges
      let nodes = this.networks[level].nodes
      let nl = this.nodelinks[level]
      for (let i = 0; i < links.length; i++) {
        let l = links[i]
        nl[l[0]].push(i)
        nl[l[1]].push(i)
        let p1x = (1 + nodes[l[0]][0])*this.cwidth/2
        let p1y = (1 + nodes[l[0]][1])*this.cheight/2
        let p2x = (1 + nodes[l[1]][0])*this.cwidth/2
        let p2y = (1 + nodes[l[1]][1])*this.cheight/2
        this.mkLine([p1x, p1y], [p2x, p2y], level)
        // keep track of every link the node is a participant of:
      }
    },
    upload () {
    },
    renderNetwork () {
      let turl = process.env.flaskURL + '/biMLDBtopdown/'
      $.post(
        turl,
        // {see: 'this', and: 'thisother', num: 5}
        {
          netid: this.network._id,
          bi: this.bi,
          layout: this.layout,
          dim: 2,
          method: this.method
        }
      ).done( networks => { 
        this.networks = networks
        this.curlevel = networks.length - 1
        this.mapNetworksToScreen()
      })
    },
    mapNetworksToScreen () {
      this.lines = []
      this.nodes = []
      this.nodescales = []
      this.mkPaths()
      this.nodelinks = []
      for (let i = 0; i <= this.curlevel; i++) {
        this.lines.push([])
        this.nodes.push([])
        this.nodelinks.push(
          this.networks[i].nodes.map( n => [] )
        )
        this.nodescales.push(1 - 0.9 * ((this.curlevel - i) / this.curlevel)**0.5)
        this.mkLines(i)
        this.mkNodes(i)
      }
      this.loaded = true
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
      let r = this.radius
      this.pathrect = [-r, -r, -r, r, r, r, r, -r]
    },
    redrawLinks (links_) {
      let links = this.networks[this.curlevel].edges
      let nodes = this.networks[this.curlevel].nodes
      links_.forEach( l => {
        let link = links[l]
        let p1x =  (1 + nodes[link[0]][0])*this.cwidth/2
        let p1y =  (1 + nodes[link[0]][1])*this.cheight/2
        let p2x =  (1 + nodes[link[1]][0])*this.cwidth/2
        let p2y =  (1 + nodes[link[1]][1])*this.cheight/2
        let line = this.lines[this.curlevel][l]
        line.clear()
        line.moveTo(p1x, p1y)
        line.lineTo(p2x, p2y)
      })
    },
    resizeNodes (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      this.nodes[this.curlevel].forEach( n => {
        n.scale.x += inc
        n.scale.y += inc
      })
    },
    rotateNodes () {
      this.nodes[this.curlevel].forEach( n => {
        n.rotation += 0.1
      })
    },
    nodeVisibility (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      this.nodes[this.curlevel].forEach( l => {
        l.alpha += inc
      })
    },
    linkVisibility (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      this.lines[this.curlevel].forEach( l => {
        l.alpha += inc
      })
    },
    randomColorize (item) {
      let things
      if (item === 'n')
        things = this.nodes
      else
        things = this.lines
      let rcolor = Math.floor(Math.random() * 0xFFFFFF)
      things[this.curlevel].forEach( t => {
        t.tint = rcolor
      })
    },
    restoreNodeSizes () {
      let scale = this.nodescales[this.curlevel]
      this.nodes[this.curlevel].forEach( n => {
        n.scale.set(scale)
      })
    },
    proportionalNodes (criterion) {
      let info = this.networks[this.curlevel][criterion]
      if (criterion === 'children')
        info = info.map( i => i.length )
      let imax = Math.max(...info)
      this.nodes[this.curlevel].forEach( (n, i) => {
        let factor = ( 0.3 + 0.7 * info[i] / imax )
        n.scale.x *= factor
        n.scale.y *= factor
      })
    },
    home () {
      let s = this.app_.stage
      if ( (s.scale.x === s.scale.y == 1) && (s.x === 0) && (s.y === 0) ) {
        console.log('chieck ok')
        if (this.saved_view) {
          console.log('on saved_view ok')
          // if so, set again zoom and pan as was 
          s.scale.x = s.scale.y = this.saved_view.scale
          s.x = this.saved_view.x
          s.y = this.saved_view.y
        }
      } else {
        this.saved_view = {
          x: s.x,
          y: s.y,
          scale: s.scale.x
        }
        s.scale.x = s.scale.y = 1
        s.x = s.y = 0
      }
    },
    zoom (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      this.curscale += inc
      this.app_.stage.scale.x += inc
      this.app_.stage.scale.y += inc
      this.app_.stage.x -= this.cwidth_ * inc / 2
      this.app_.stage.y -= this.cheight_ * inc / 2
    },
    pan (direction) {
      if (direction === 'l') {
        this.app_.stage.x += -0.1 * this.cwidth_ / 2
      } else if (direction === 'r') {
        this.app_.stage.x += 0.1 * this.cwidth_ / 2
      } else if (direction === 'u') {
        this.app_.stage.y += -0.1 * this.cheight_ / 2
      } else if (direction === 'd') {
        this.app_.stage.y += 0.1 * this.cheight_ / 2
      }
    },
    showLevel (level) {
      if (level === '+')
        level = this.curlevel + 1
      if (level === '-')
        level = this.curlevel - 1
      if (level === this.networks.length) {
        level--
        this.snacktext = 'coarsest level reached'
        this.snackbar = true
      }
      if (level === -1) {
        level++
        this.snacktext = 'original network reached'
        this.snackbar = true
      }
      this.nodes.forEach( (nodes_, level_) => {
        nodes_.forEach( n => {
          n.interactive = level_ === level
        })
      })
      this.curlevel = level
    },
    findNetworks () {
      this.$store.dispatch('networks/find').then(() => {
        let networks_ = this.$store.getters['networks/list']
        this.networks_ = networks_.filter(i => {
          return (i.layer === 0) && (i.filename.split('.').pop() === 'ncol')
        })
        this.network = this.networks_[0]
        this.renderNetwork()
      })
    },
  },
  watch: {
    curlevel: function(val) {
      if (this.loaded) {
        // find number of visible nodes and links
        let nvis = 0
        this.nodes[val].forEach( n => {
          nvis += n.visible
        })
        let lvis = 0
        this.lines[val].forEach( l => {
          lvis += l.visible
        })
        this.curlevelinfo = val + ', nodes: ' + nvis +'/'+ this.networks[val].nodes.length + ', links: ' + lvis +'/'+ this.networks[val].edges.length
      }
    },
  }
}
</script>

<style>
.tcolumn {
  padding-left: 5px;
}
.btn22 {
  margin: 0;
  min-width: 60px;
  max-width: 60px;
  width: 60px;
}
.tbtn {
  background-color: gray;
}
.v-system-bar--window .v-icon {
  font-size: 20px;
  margin-right: 4px;
}
</style>
