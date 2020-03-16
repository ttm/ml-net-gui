<template>
<span>
  <h1><span title="Visualization of (large) Bipartite Networks assisted by Multilevel Strategies"> BiNetVis</span>
    <nuxt-link to="/multilevel2/about">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue"></i>
    </nuxt-link>
  </h1>
<v-layout align-center justify-center row id="startstuff">
  <v-flex text-xs-center>
    <v-menu offset-y title="select or upload network" :disabled="mapping || loaded">
      <v-btn
        slot="activator"
        color="primary"
        :disabled="mapping || loaded"
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
  <div id="ninfo"></div>
  </v-flex>
</v-layout>
<v-flex mt-1>
<v-card flat dark id="bicard">
  <v-layout align-center justify-center>
    <v-flex>
      <table id='bimltab'>
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
<v-layout row ml-4>
  <v-btn
    slot="activator"
    color="green lighten-2"
    @click="renderNetwork()"
    :disabled="mapping || loaded"
    title="click to map network to canvas"
  >
    render network
  </v-btn>
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
  <v-checkbox v-model="links" label="show links" v-show="loaded"> </v-checkbox>
  <textarea id="iinfo" v-show="loaded"></textarea>
  <v-spacer></v-spacer>
  <v-spacer></v-spacer>
</v-layout>
<v-layout row>
</v-flex>
<div>
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
  <v-icon class="tbtn ptbtn" id="joinbtn" @click="setTool('join')" title="click on two open nodes to join them">border_outer</v-icon>
  <v-icon class="tbtn ptbtn" id="resizebtn" @click="setTool('resize')" title="resize open nodes (click on node and drag). Also optimizes predecessor positions to better fit open node's rectangular region. If open node is clicked, but no drag is executed, changes the corner to which the links are attached">tab_unselected</v-icon>
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
<v-flex>
<table id='ltable' v-if="loaded">
  <tr>
    <th class="lthead">level</th>
    <th class="lthead">layer 1</th>
    <th class="lthead">C</th>
    <th class="lthead">layer 2</th>
    <th class="lthead">C</th>
    <th class="lthead">links</th>
    <th class="lthead">C</th>
  </tr>
  <tr v-for="(level, index) in networks.length" :id="'trl' + index">
    <td @click="chLevel(index)" @contextmenu="mhandler($event)" :id="'tdl' + index" v-bind:class="index === curlevel ? 'highd': ''" :title="'left click to select level ' + index + ' for tools to act on. Right click to reinitialize visualization in level ' + index">{{ index }}</td>
    <td>{{ nvis_[index] ? nvis_[index][0] : 0 }} / {{networks[index].fltwo}}</td>
    <td @contextmenu="cgShape($event, index, 0)" @click="uColor(index, 0)" :id="'tcl0_' + index" title="left click to change color, right click to change shape"></td>
    <td>{{ nvis_[index] ? nvis_[index][1] : 0 }} / {{networks[index].sources.length - networks[index].fltwo}}</td>
    <td @contextmenu="cgShape($event, index, 1)" @click="uColor(index, 1)" :id="'tcl1_' + index" title="left click to change color, right click to change shape"></td>
    <td>{{ nlinks[index] ? nlinks[index] : 0 }} / {{networks[index].links.length}}</td>
    <td @contextmenu="showHideLinks($event, index)"@click="uColor(index, 2)" :id="'tcli_' + index" title="left click to change color, right click to show/hide"></td>
  </tr>
  <span :banana="tloaded = true"></span>
</table>
</v-flex>
</v-layout>
<v-footer class="pa-3">
  <v-spacer></v-spacer>
  <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
</v-footer>
<v-dialog v-model="cAllDialog" style="text-align:center" dark max-width="225px">
  <v-card>
  <div style="display:inline-block">
      <no-ssr>
      <Chrome v-model="colorAny" style="display:inline-block" :disableAlpha="true"/>
      </no-ssr>
    </div>
  </v-card>
</v-dialog>
<v-dialog v-model="cndialog" style="text-align:center" dark max-width="225px" persistent>
  <v-card>
  <div style="display:inline-block">
      <no-ssr>
      <Chrome v-model="colortonode" style="display:inline-block"/>
      </no-ssr>
    </div>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="clayer = 0; cndialog = false"
          >
            layer 1
          </v-btn>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="clayer = 1; cndialog = false"
          >
            layer 2
          </v-btn>
  </v-card>
</v-dialog>
<v-dialog v-model="cldialog" style="text-align:center" dark max-width="225px">
  <v-card>
  <div style="display:inline-block">
      <no-ssr>
      <Chrome v-model="colortolink" style="display:inline-block"/>
      </no-ssr>
  </div>
  </v-card>
</v-dialog>
<v-dialog v-model="cbdialog" style="text-align:center" dark max-width="225px">
  <v-card>
  <div style="display:inline-block">
      <no-ssr>
      <Chrome v-model="colortobg" style="display:inline-block"/>
      </no-ssr>
  </div>
  </v-card>
</v-dialog>
</span>
</template>

<script>
import $ from 'jquery'
import * as d3 from 'd3'
import { Chrome } from 'vue-color'

function moveNode () {
  if (this.dragging) {
    const newposition = this.data.getLocalPosition(this.parent)
    this.x = newposition.x
    this.y = newposition.y
    if (__this.draggingnode) {
    }
  }
}
function releaseNode () {
  if (this.dragging) {
    this.alpha *= 2
    this.dragging = false
    this.data = null
    if (__this.tool !== 'dragregion') {
      __this.repositionChildren(this)
      __this.updateLinkPos(this)
      __this.redrawLinks(this)
    } else {
      let dx = this.x - this.oldx
      let dy = this.y - this.oldy
      this.mnodes.forEach( n => {
        if (n.xx) {
          n.xx += dx
          n.yy += dy
        } else {
          n.x += dx
          n.y += dy
        }
        __this.redrawLinks(n)
      })
    }
  } else if (__this.tool === 'resize') {
    __this.resizing = 'end'
    __this.resizeMetanode(this)
  }
}
function clickNode (event) {
  __this.mnode = this
  if (__this.tool === 'info') {
    let s
    if (!this.isopen) {
      s = JSON.stringify(__this.networks[this.level].ndata[this.id].mdata)
      s = s.slice(1, s.length - 1).replace(/"/g,'').replace(/,/g, ', ').replace('successor', 'successor id').replace(/:/g, '\: ')
    } else {
      s = JSON.stringify(this.joinData)
      s = s.slice(1, s.length - 1).replace(/"/g,'').replace(/,/g, ', ').replace('successors', 'successor ids').replace(/:/g, '\: ')
    }
    __this.iinfo.textContent += '\n' + s
    __this.iinfo.scrollTop = __this.iinfo.scrollHeight
  } else if (__this.tool === 'explore'){
    __this.showChildren(this)
  } else if (__this.tool === 'join'){
    __this.joinMetanodes(this)
  } else if (__this.tool === 'resize'){
    __this.resizing = 'start'
    __this.resizeMetanode(this)
  } else if (__this.tool === 'drag' || __this.tool === 'dragregion'){
    this.data = event.data // because of multitouch
    this.alpha *= 0.5
    this.dragging = true
    __this.draggingnode = true
    this.oldx = this.x
    this.oldy = this.y
    __this.selectednode = this
  } else {
    __this.iinfo.textContent += '\nselect a tool to interact with network'
    __this.iinfo.scrollTop = __this.iinfo.scrollHeight
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
// , "E0E0E0",
// ]

export default {
  head () {
    return {
      script: [
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
        { src: '/libs/vue-color.min.js' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' }
      ],
    }
  },
  data () {
    return {
      links: true,
      nlayers: 2,
      networks_: [],
      network: '',
      bi: {
        reduction: ['0.1', '0.1'],
        max_levels: ['5', '5'],
        global_min_vertices: ['100', '100'],
        matching: ['mlpb', 'mlpb'],
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
        'spring',
        'h-bipartite',
        'v-bipartite',
      ],
      layout: 'spring',
      curlevel: 0,
      loaded: false,
      mapping: false,
      cndialog: false,
      colortonode: '#194d33',
      clayer: 0,
      cldialog: false,
      colortolink: '#194d33',
      cbdialog: false,
      colortobg: '#194d33',
      nvis_: [],
      nlinks: [],
      tloaded: 0,
      cAllDialog: false,
      colorAny: '',
      tool: '',
    }
  },
  components: {
    Chrome,
  },
  mounted () {
    window.__this = this
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
          this.findNetworks()
      }})
    } else {
      this.initPixi()
      this.findNetworks()
    }
  },
  methods: {
    upload (e) {
      this.loading = true
      let reader = new FileReader()
      let file = e.target.files[0]
      reader.readAsText(file)
      let path = e.path || (e.composedPath && e.composedPath())
      let self = this
      reader.addEventListener('load', () => {
        this.$store.dispatch('networks/create', {
          data: reader.result,
          layer: 0,
          coarsen_method: 'none',
          uncoarsened_network: null,
          title: 'a title',
          description: 'a description',
          filename: path[0].files[0].name,
          // user: this.user._id
          user: '5c51162561e2414b1f85ac0b'
        }).then((res) => {
          this.loading = false
          this.text = 'file ' + path[0].files[0].name + 'loaded. Reload page to load more files'
          this.findNetworks()
        })
      })
    },
    zoom (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      let c1 = this.getCenter()
      this.app_.stage.scale.x += inc
      this.app_.stage.scale.y += inc
      let c2 = this.getCenter()
      this.app_.stage.x += (c2.x - c1.x) * this.app_.stage.scale.x
      this.app_.stage.y += (c2.y - c1.y) * this.app_.stage.scale.x
      // this.app_.stage.x -= this.cwidth_ * inc / 2
      // this.app_.stage.y -= this.cheight_ * inc / 2
    },
    rotateScene(direction) {
      if (this.tool && this.tool !== 'info')
        this.setTool('info')
      let inc = Math.PI/32
      if (direction !== '+')
        inc *= -1
      // this.app_.stage.x += dist * Math.cos(inc)
      // this.app_.stage.y -= dist * Math.sin(inc)
      this.mcont.rotation += inc
      this.nodes.forEach( l => {
        l.forEach( n => {
          if (n) {
            if (!n.isopen) {
              n.rotation -= inc
              // this.updateLinkPos(n)
              // this.redrawLinks(n)
            }
          }
        })
      })
      // this.app_.stage.x += (c2.x - c1.x) * this.app_.stage.scale.x
      // this.app_.stage.y += (c2.y - c1.y) * this.app_.stage.scale.x
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
    getCenter () {
      let s = this.app_.stage
      let c = {
        x: (this.cwidth_ - 2*s.x) / (2*s.scale.x),
        y: (this.cheight_ - 2*s.y) / (2*s.scale.y)
      }
      return c
    },
    home () {
      let s = this.app_.stage
      if ( (s.scale.x == 1) && (s.x === 0) && (s.y === 0) && (s.rotation === 0) ) {
        if (this.saved_view) {
          // if so, set again zoom and pan as was 
          s.scale.x = s.scale.y = this.saved_view.scale
          s.x = this.saved_view.x
          s.y = this.saved_view.y
          s.rotation = this.saved_view.rotation
        }
      } else {
        this.saved_view = {
          x: s.x,
          y: s.y,
          scale: s.scale.x,
          rotation: s.rotation
        }
        s.scale.x = s.scale.y = 1
        s.x = 0
        s.y = 0
        s.rotation = 0
      }
    },
    mkPivot () {
      let v = new PIXI.Graphics()
      let c = this.getCenter()
      v.x=c.x
      v.y=c.y
      v.beginFill(0xFF0000)
      v.drawPolygon(__this.path)
      v.endFill()
      __this.app_.stage.addChild(v)
      return v
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      this.cwidth =  0.9 * document.getElementsByTagName('canvas')[0].width
      this.cheight = 0.9 * document.getElementsByTagName('canvas')[0].height
      this.app_.renderer.backgroundColor = 0xFFFFFF
      this.mcont = new PIXI.Container();
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
      d3.select('canvas').on('mouseout', function () {
        if (__this.eregion) {
          __this.eregion.clear()
          delete __this.eregion
          delete __this.regionexplorestart
          delete __this.regionexploreend
          if (__this.tool === 'dragregion')
            __this.tool = 'drag'
        }
      })
      d3.select('canvas').on('mousedown', function () {
        if (__this.selectednode) {
          let p = d3.mouse(this)
          let b = __this.selectednode.getBounds()
          if (p[0] < b.x || p[1] < b.y || p[0] > b.x + b.width || p[1] > b.y + b.height) {
            if (__this.tool === 'dragregion') {
              __this.tool = 'drag'
              __this.taux = true
              __this.eregion.clear()
              delete __this.selectednode
              let scale = __this.app_.stage.scale.x
              let panx = __this.app_.stage.x
              let pany = __this.app_.stage.y
              __this.regionexplorestart = [
                (p[0] - panx) / scale,
                (p[1] - pany) / scale,
              ]
              return
            }
          }
        }
        if (__this.tool === 'dragregion' && __this.selectednode && !__this.selectednode.name === 'rect') {
          __this.tool = 'drag'
          __this.eregion.clear()
          delete __this.eregion
        }
        if (__this.tool === 'dragregion' && !__this.selectednode.name === 'rect') {
          // check if click is inside eregion, if not, reset 
          let p = d3.mouse(this)
          __this.regionexplorestart = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
        }
        if ( __this.tool === 'regionexplore' || (__this.tool === 'drag' && !__this.dragginnode) ) {
          let p = d3.mouse(this)
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          __this.regionexplorestart = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
          __this.eregion = new PIXI.Graphics()
          __this.eregion.name = 'rect'
          __this.eregion.buttonMode = true
          __this.app_.stage.addChild(__this.eregion)
        }
      })
      d3.select('canvas').on('mousemove', function () {
        if ((__this.tool === 'regionexplore' || __this.tool === 'drag') && __this.eregion) {
          if (__this.draggingnode && __this.selectednode.name !== 'rect') {
            __this.eregion.clear()
            delete __this.eregion
            return
          }
          let p_ = d3.mouse(this)
          let e = __this.regionexplorestart
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          let p = [(p_[0] - panx)/scale, (p_[1] - pany)/scale]
          __this.eregion.clear()
          __this.eregion.beginFill(0x0000FF, 0.3)
          __this.eregion.drawPolygon([e[0], e[1], e[0], p[1], p[0], p[1], p[0], e[1]])
          __this.eregion.endFill()
        }
      })
      d3.select('canvas').on('mouseup', function () {
        if (__this.draggingnode) {
          __this.draggingnode = false
          return
        }
        if (__this.tool === 'drag') {
          if (__this.taux) {
            delete __this.taux
            delete __this.regionexplorestart
            __this.eregion.clear()
            delete __this.eregion
            return
          }
          let p = d3.mouse(this)
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          __this.regionexploreend = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
          let r1 = __this.regionexplorestart
          let r2 = __this.regionexploreend
          if ((r1[0] === r2[0]) && (r1[1] === r2[1])) {
            delete __this.regionexplorestart
            delete __this.regionexploreend
            return
          }
          let maxx = Math.max(r1[0], r2[0])
          let maxy = Math.max(r1[1], r2[1])
          let minx = Math.min(r1[0], r2[0])
          let miny = Math.min(r1[1], r2[1])
          let c = [(maxx + minx) / 2, (maxy + miny) / 2]
          let nodes = __this.nodes[__this.curlevel]
          let nodes_ = []
          nodes.forEach( n => {
            let b_ = n.getBounds()
            let b = {
              x: (b_.x - panx) / scale,
              y: (b_.y - pany) / scale,
              width: b_.width / scale,
              height: b_.height / scale,
            }
            if ( b.x >= minx && b.x + b.width <= maxx && b.y >= miny && b.y + b.height <= maxy ) {
              nodes_.push(n)
            }
          })
          __this.eregion.clear()
          __this.eregion.x = c[0]
          __this.eregion.y = c[1]
          let dx = (maxx - minx) / 2
          let dy = (maxy - miny) / 2
          __this.eregion.beginFill(0x0000FF, 0.3)
          __this.eregion.drawPolygon([
            -dx, -dy,
            -dx, dy,
            dx, dy,
            dx, -dy
          ])
          __this.moveManyNodes(nodes_)
          __this.selectednode = __this.eregion
          __this.tool = 'dragregion'
        }
        if (__this.tool === 'regionexplore') {
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          let p = d3.mouse(this)
          __this.regionexploreend = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
          __this.eregion.clear()
          delete __this.eregion
          let r1 = __this.regionexplorestart
          let r2 = __this.regionexploreend
          let maxx = Math.max(r1[0], r2[0])
          let maxy = Math.max(r1[1], r2[1])
          let minx = Math.min(r1[0], r2[0])
          let miny = Math.min(r1[1], r2[1])
          let nodes = __this.nodes[__this.curlevel]
          let nodes_ = []
          nodes.forEach( n => {
            if (!n.interactive)
              return
            let b_ = n.getBounds()
            let b = {
              x: (b_.x - panx) / scale,
              y: (b_.y - pany) / scale,
              width: b_.width / scale,
              height: b_.height / scale,
            }
            if ( b.x >= minx && b.x + b.width <= maxx && b.y >= miny && b.y + b.height <= maxy ) {
              nodes_.push(n)
            }
          })
          // test if nodes have more then one successor
          if (nodes_.length > 0) {
            let tparent = __this.childparent[__this.curlevel][nodes_[0].id]
            let texit = false
            nodes_.forEach( n => {
              if (tparent !== __this.childparent[__this.curlevel][n.id]) {
                texit = true
                return
              }
            })
            if (texit) {
              __this.iinfo.textContent += '\nChoosing nodes in more then one successor is not allowed. Please join successors furst.'
              __this.iinfo.scrollTop = __this.iinfo.scrollHeight
              return
            }
            __this.joinManyNodes(nodes_)
          }
        }
      })
      this.app_.stage.interactive = true
    },
    moveManyNodes (nodes) {
      this.eregion
        .on('pointerdown', clickNode)
        .on('pointerup', releaseNode)
        .on('pointerupoutside', releaseNode)
        .on('pointermove', moveNode)
      this.eregion.interactive = true
      this.eregion.mnodes = nodes
    },
    findNetworks () {
      this.$store.dispatch('networks/find').then(() => {
        let networks_ = this.$store.getters['networks/list']
        this.networks_ = networks_.filter(i => {
          return (i.layer === 0) && (i.filename.split('.').pop() === 'ncol')
        })
        this.network = this.networks_[0]
        // this.renderNetwork()
      })
    },
    renderNetwork () {
      this.mapping = true
      let turl = process.env.flaskURL + '/biMLDBtopdown/'
      $.post(
        turl,
        {
          netid: this.network._id,
          bi: this.bi,
          dim: 2,
        }
      ).done( networks => { 
        this.networks = networks
        if (this.otherlayer === undefined)
          this.curlevel = networks.length - 1
        else {
          this.nodes.forEach( nn => {
            nn.forEach( n => n.clear() )
          })
          this.links_.forEach( ll => {
            Object.values(ll).forEach( l => l.clear() )
          })
          this.curlevel = this.otherlayer
        }
        this.mkAuxiliaryData()
        this.mapNetworkToScreen()
        let e = document.getElementById('iinfo')
        e.style.width = '100%'
        e.style.border = '2px solid #0000ff'
        e.style.margin = '2px'
        e.style.padding = '2px'
        e.textContent = '~ info on demand ~'
        this.iinfo = e
        $('#bimltab').find('*').attr('disabled', 'disabled').addClass('v-btn--disabled')
      })
    },
    showHideLinks(e, level) {
      e.preventDefault()
      if (this.links)
        Object.values(this.links_[level]).forEach( l => l.visible = !l.visible )
    },
    cgShape(e, level, layer) {
      e.preventDefault()
      let fltwo = this.networks[level].fltwo
      let path
      if (this.layers_alternative[level][layer]) {
        this.layers_alternative[level][layer] = 0
        path = this.path
      } else {
        this.layers_alternative[level][layer] = 1
        path = this.pathhex
      }
      this.nodes[level].forEach( n => {
        if ( ((n.id < fltwo) != layer) && (!n.isopen) ) {
          n.clear()
          n.beginFill(0xFFFFFF)
          n.drawPolygon(path)
          n.endFill()
        }
      })
    },
    colorTable () {
      for (let i = 0; i < this.networks.length; i++) {
        let cl1 = this.nodecolors[i * 2 ].toString(16)
        let cl2 = this.nodecolors[i * 2 + 1].toString(16)
        let cli = this.linkcolors[i].toString(16)
        document.getElementById('tcl0_' + i).style.backgroundColor = '#'+('0'.repeat(6-cl1.length)) + cl1
        document.getElementById('tcl1_' + i).style.backgroundColor = '#'+('0'.repeat(6-cl2.length)) + cl2
        document.getElementById('tcli_' + i).style.backgroundColor = '#'+('0'.repeat(6-cli.length)) + cli
      }
    },
    cgLineThickness (direction) {
      let inc = 1.1
      if (direction !== '+')
        inc = 1 / inc
      Object.values(this.links_[this.curlevel]).forEach( l => {
        let w = l.line.width
        l.clear()
        l.lineStyle(w * inc, 0xFFFFFF)
        let n1 = this.nodes[l.level][l.ll[0]]
        let n2 = this.nodes[l.level][l.ll[1]]
        let p1 = [n1.x, n1.y]
        let p2 = [n2.x, n2.y]
        l.moveTo(...p1)
        l.lineTo(...p2)
      })
    },
    mkAuxiliaryData () {
      this.l2hex = true
      this.mkPaths()
      if (!this.nodecolors) {
        this.nodecolors = ColourValues.map( c => parseInt(c, 16) )
        this.linkcolors = ColourValues.reverse().map( c => parseInt(c, 16) )
      }
      this.max_weights = this.networks.map( n => Math.max( ...n.links.map( l => l[2] ) ) )
      this.layers_alternative = this.networks.map( n => [0, 0] )
      this.nodescales = []
      this.ndata = []
      this.nodes = []
      this.opennodes = []
      this.childparent = [] // [level][childid] = parentid of node which 
      this.links_ = [] // for dict nid1-nid2 = link
      for (let level = 0; level <= this.curlevel; level++) {
        this.links_.push({})
        this.nodes.push([])
        this.opennodes.push({})
        this.childparent.push({})
        this.nodescales.push((1 / (this.curlevel - level + 1))**0.5)
        let links = this.networks[level].links
        let children = this.networks[level].children
        let parents = this.networks[level].parents
        let sources = this.networks[level].sources
        let nodelinks = sources.map( s => [] )
        for (let i = 0; i < links.length; i++) {
          let l = links[i]
          nodelinks[l[0]].push(i)
          nodelinks[l[1]].push(i)
        }
        let ndata = []
        for (let i = 0; i < sources.length; i++) {
          let neighbors = nodelinks[i]
            .map( l => links[l])
            .map( l => (l[0] === i ? l[1] : l[0]))
          let strength = nodelinks[i]
            .map( l => links[l])
            .map( l => l[2])
            .reduce( (a, e) => a+e, 0)
          let mdata = {
            ID: i,
            level: level,
            predecessors: children[i].length,
            successor: parents[i],
            degree: neighbors.length,
            strength: strength,
            // neighbors: neighbors,
          }
          let MLdata = {
            paths: [],
            children: [],
            ids: [],
          }
          let aux = {
            children: children[i],
            links: nodelinks[i],
          links_: nodelinks[i].map( l => links[l]),
            neighbors: neighbors,
            source: sources[i],
          }
          ndata.push({
            mdata: mdata,
            MLdata: MLdata,
            aux: aux
          })
        }
        this.networks[level].ndata = ndata
      }
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
    },
    mapNetworkToScreen () {
      let nodes = this.networks[this.curlevel].sources.map( (e,i) => i )
      let links = this.networks[this.curlevel].links
      let center = [0, 0]
      this.placeOnCanvas(nodes, links, this.curlevel, this.cwidth_, this.cheight_, center)
    },
    placeOnCanvas (nodes, links, level, width, height, center) {
      let turl = process.env.flaskURL + '/layoutOnDemand/'
      let [lonely, rest] = this.separateLonelyNodes(nodes, links)
      let nodes_ = rest
      let l0 = []
      if (this.layout.slice(2) === 'bipartite') {
        let fltwo = this.networks[level].fltwo
        nodes_.forEach( n => {
          if (fltwo > n)
            l0.push(n)
        })
      }
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            layout: this.layout,
            dim: 2,
            nodes: nodes_,
            links: links,
            first: level === this.networks.length - 1,
            lonely: Object.keys(lonely).length !== 0,
            l0: l0
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( layout => {
        this.xxlayout = layout
        let layout_ = {...lonely, ...layout}
        this.mdbug = [
          lonely, rest, nodes, layout, layout_, links, nodes_
        ]
        this.mkLines(links, level, width, height, center, layout_)
        this.mkNodes(nodes, level, width, height, center, layout_)
        if (!this.loaded)
          this.zoom('-')
        this.loaded = true
        this.updateElementsCount()
      })
    },
    updateElementsCount () {
      let nvis_ = []
      for (let i = 0; i < this.networks.length; i++) {
        let nvis
        if ((this.otherlayer !== undefined) && i > this.otherlayer) {
          nvis = [0,0]
        } else {
          let fltwo = this.networks[i].fltwo
          nvis = this.nodes[i].reduce(
            (total, n) => {
              let count = n !== undefined ? 1 : 0
              let layer = n.id >= fltwo ? 1: 0
              total[layer] += count
              return total
            }, [0, 0]
          )
        }
        nvis_.push(nvis)
      }
      this.nvis_ = nvis_

      let nlinks = []
      for (let i = 0; i < this.networks.length; i++) {
        if ((this.otherlayer !== undefined) && i > this.otherlayer) {
          nlinks.push(0)
        } else {
          nlinks.push(Object.keys(this.links_[i]).length)
        }
      }
      this.nlinks = nlinks
    },
    separateLonelyNodes (nodes, links, layout) {
      let lonely = []
      let links_ = links.map( l => [l[0], l[1]] )
      let occurent = [...new Set( [].concat(...links_) ) ]
      nodes.forEach( n => {
        if (!occurent.includes(n))
          lonely.push(n)
      })
      if (lonely.length === 0)
        return [{}, nodes]
      else {
        if (lonely.length === nodes.length)
          return [{}, nodes]
        else {
          let lonelypos
          if (lonely.length === 1) {
            lonelypos = {}
            lonelypos[lonely[0]] = [0, -1]
          } else {
            lonelypos = lonely.reduce( (map, l, i) => {
              map[l] = [
                2 * i/(lonely.length - 1) - 1,
                -1
              ]
              return map
            }, {})
          }
          let rest = nodes.filter( n => !lonely.includes(n) )
          return [lonelypos, rest]
        }
      }
    },
    mkLines (links, level, width, height, center, layout) {
      for (let i = 0; i < links.length; i++) {
        let l = links[i]
        let p1x = (1 + layout[l[0]][0])*width/2 + center[0]
        let p1y = (1 + layout[l[0]][1])*height/2 + center[1]
        let p2x = (1 + layout[l[1]][0])*width/2 + center[0]
        let p2y = (1 + layout[l[1]][1])*height/2 + center[1]
        let lid = l[0]+'-'+l[1]
        if (this.links_[level][lid]) {
          let line = this.links_[level][lid]
          line.clear()
          line.moveTo(p1x, p1y)
          line.lineTo(p2x, p2y)
        } else {
          let line = this.mkLine([p1x, p1y], [p2x, p2y], l[2], level)
          line.tweight = l[2]
          line.level = level
          line.ll = l
          this.links_[level][l[0]+'-'+l[1]] = line
        }
      }
    },
    mkLine (p1, p2, weight, level) {
      let line = new PIXI.Graphics()
      line.lineStyle(1 + (9 * weight / this.max_weights[level]) / (this.networks.length - level) , 0xFFFFFF)
      line.tint = this.linkcolors[level]
      line.moveTo(...p1)
      line.lineTo(...p2)
      line.alpha = 0.4
      line.p1 = p1
      line.p2 = p2
      this.mcont.addChild(line)
      return line
    },
    repositionChildren (node) {
      if (!node.visible)
        return
      let ndata = this.networks[node.level].ndata[node.id]
      if (ndata.MLdata.isopen) {
        let dx = node.x - node.oldx
        let dy = node.y - node.oldy
        ndata.MLdata.children[ndata.MLdata.children.length -1].forEach( c => {
          let c_ = this.nodes[node.level - 1][c]
          c_.oldx = c_.x
          c_.oldy = c_.y
          c_.x += dx
          c_.y += dy
          this.redrawLinks(c_)
          this.repositionChildren(c_)
        })
      }
    },
    mkNodes (nodes, level, width, height, center, layout) {
      let l2path = this.l2hex ? this.pathhex : this.path
      let fltwo = this.networks[level].fltwo
      for (let i = 0; i < nodes.length; i++) {
        let nid = nodes[i]
        let p = layout[nid]
        let px = (1 + p[0]) * width/2 + center[0]
        let py = (1 + p[1]) * height/2 + center[1]
        let node_ = this.nodes[level][nodes[i]]
        if (!node_) {
          const node = new PIXI.Graphics()
          let layer = fltwo <= nid ? 1 : 0
          node.layer = layer
          node.lineStyle(1, 0x000000)
          node.beginFill(0xFFFFFF)
          node.drawPolygon(this.layers_alternative[level][layer] ? l2path : this.path )
          node.endFill()
          node.tint = this.nodecolors[level * 2 + (fltwo <= nid ? 1 : 0)]
          node.x = px
          node.y = py
          node.interactive = level === this.curlevel
          node.buttonMode = true
          node.alpha = 0.8
          node
            .on('pointerdown', clickNode)
            .on('pointerup', releaseNode)
            .on('pointerupoutside', releaseNode)
            .on('pointermove', moveNode)
          node.id = nid
          node.level = level
          node.scale.x *= this.nodescales[level]
          node.scale.y *= this.nodescales[level]
          this.mcont.addChild(node)
          this.nodes[level][nodes[i]] = node
        } else {
          node_.x = px
          node_.y = py
        }
      }
    },
    setTool (toolname) {
      if (toolname !== 'info') {
        this.nodes.forEach( l => {
          l.forEach( n => {
            if (!n.isopen)
              n.rotation += this.mcont.rotation
          })
        })
        this.mcont.rotation = 0
      }
      let b = document.getElementById(toolname+'btn')
      if (this.tool === toolname) {
        this.tool = ''
        b.style.backgroundColor = "gray"
      } else {
        this.tool = toolname
        Array(...document.getElementsByClassName('ptbtn')).forEach( e => { e.style.backgroundColor = 'gray' })
        b.style.backgroundColor = "black"
      }
    },
    focusLevel (level) {
      if (level === '+')
        level = this.curlevel + 1
      if (level === '-')
        level = this.curlevel - 1
      if (level === this.networks.length) {
        level--
      }
      if (level === -1) {
        level++
      }
      this.nodes.forEach( (nodes_, level_) => {
        nodes_.forEach( n => {
          n.interactive = (level_ === level) && n.visible
        })
      })
      this.curlevel = level
    },
    randomColorize (e, item) {
      e.preventDefault()
      if (item === 'bg') {
        this.app_.renderer.backgroundColor = Math.random() * 0xFFFFFF
      }
      let things
      if (item === 'n')
        things = this.nodes[this.curlevel]
      else
        things = Object.values(this.links_[this.curlevel])
      let rcolor = Math.floor(Math.random() * 0xFFFFFF)
      if (item === 'n') {
        let c = rcolor
        let fltwo = this.networks[this.curlevel].fltwo
        if (this.clayer === 0) {
          this.nodes[this.curlevel].forEach( n => {
            if (n.id < fltwo)
              n.tint = c
          })
        } else {
          this.nodes[this.curlevel].forEach( n => {
            if (n.id >= fltwo)
              n.tint = c
          })
        }
        this.clayer = (this.clayer + 1) % 2
      } else {
        things.forEach( t => {
          t.tint = rcolor
        })
      }
    },
    resizeMetanode (node) {
      let MLdata = this.networks[node.level].ndata[node.id].MLdata
      let sx = __this.app_.stage.x
      let sy = __this.app_.stage.y
      let scale = __this.app_.stage.scale.x
      if (!MLdata.isopen)
        return
      if (this.resizing === 'start') {
        let m = __this.app_.renderer.plugins.interaction.mouse.global
        this.rpos0 = [(m.x - sx) / scale, (m.y - sy) / scale]
        this.rnode = node
        return
      }
      let m = __this.app_.renderer.plugins.interaction.mouse.global
      this.rpos1 = [(m.x - sx) / scale, (m.y - sy) / scale]
      if (this.rpos0[0] === this.rpos1[0] && this.rpos0[1] === this.rpos1[1]) {
        this.rznode = node
        node.linkpos++
        this.updateLinkPos(node)
        this.redrawLinks(node)
        return
      }
      let dx = this.rpos1[0] - this.rpos0[0] 
      let dy = this.rpos1[1] - this.rpos0[1] 
      let n = this.rnode
      let b0 = [(n.getBounds().x - sx) / scale , (n.getBounds().y - sy) / scale]
      if (this.rpos0[0] < n.x)
        dx *= -1
      if (this.rpos0[1] < n.y)
        dy *= -1
      let MLdata_ = this.networks[n.level].ndata[n.id].MLdata
      let path = MLdata_.paths[MLdata.paths.length - 1]
      let sx_ = (2*dx + path[4] - path[0]) / (path[4] - path[0])
      let sy_ = (2*dy + path[5] - path[1])/ (path[5] - path[1])
      path[4] += dx
      path[6] += dx
      path[0] -= dx
      path[2] -= dx
      path[3] += dy
      path[5] += dy
      path[1] -= dy
      path[7] -= dy
      n.clear()
      n.beginFill(0xFFFFFF, .1)
      n.drawPolygon(path)
      n.endFill()
      let b = n.getBounds()
      let b_ = {
        x: (b.x - sx) / scale, y: (b.y - sy) / scale,
        width: b.width / scale, height: b.height / scale
      }
      MLdata_.children[MLdata_.children.length - 1].forEach( c => {
        let c_ = this.nodes[n.level - 1][c]
        let ddx = (c_.x - b0[0]) * sx_
        let ddy = (c_.y - b0[1]) * sy_
        c_.x = b_.x + ddx
        c_.y = b_.y + ddy
      })
      let xx = MLdata_.children[MLdata_.children.length - 1].map( c => {
        let c_ = this.nodes[n.level - 1][c]
        return c_.x
      })
      let yy = MLdata_.children[MLdata_.children.length - 1].map( c => {
        let c_ = this.nodes[n.level - 1][c]
        return c_.y
      })
      let maxxx = Math.max(...xx)
      let minxx = Math.min(...xx)
      let maxyy = Math.max(...yy)
      let minyy = Math.min(...yy)
      MLdata_.children[MLdata_.children.length - 1].forEach( c => {
        let c_ = this.nodes[n.level - 1][c]
        c_.x = b_.x + ( (c_.x - minxx) * (b_.width*0.9) / (maxxx - minxx) ) + b_.width * 0.05
        c_.y = b_.y + ( (c_.y - minyy) * (b_.height*0.9) / (maxyy - minyy) ) + b_.height * 0.05
        this.redrawLinks(c_)
      })
      this.updateLinkPos(node)
      this.redrawLinks(node)
    },
    updateLinkPos (node) {
      let sx = __this.app_.stage.x
      let sy = __this.app_.stage.y
      let scale = __this.app_.stage.scale.x
      let b = node.getBounds()
      let b_ = {
        x: (b.x - sx) / scale, y: (b.y - sy) / scale,
        width: b.width / scale, height: b.height / scale
      }
      let lp = node.linkpos % 4
      if (lp === 0) {
        node.xx = b_.x + b_.width
        node.yy = b_.y + b_.height
      } else if (lp === 1) {
        node.xx = b_.x + b_.width
        node.yy = b_.y
      } else if (lp === 2) {
        node.xx = b_.x
        node.yy = b_.y
      } else if (lp === 3) {
        node.xx = b_.x
        node.yy = b_.y + b_.height
      }
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
      }
    },
    resizeNodes (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      this.nodescales[this.curlevel] += inc
      this.nodes[this.curlevel].forEach( n => {
        if (!n.isopen) {
          n.scale.x += inc
          n.scale.y += inc
        }
      })
    },
    proportionalNodes (criterion) {
      let info
      if (criterion === 'children')
        info = this.networks[this.curlevel].children.map( i => i.length )
      else
        info = this.networks[this.curlevel].ndata.map( i => i.mdata.degree )
      let imax = Math.max(...info)
      this.nodes[this.curlevel].forEach( (n, i) => {
        if (!n.isopen) {
          let factor = ( 0.3 + 0.7 * info[i] / imax )
          n.scale.x *= factor
          n.scale.y *= factor
        }
      })
    },
    restoreNodeSizes () {
      let scale = this.nodescales[this.curlevel]
      this.nodes[this.curlevel].forEach( n => {
        if (!n.isopen) {
          n.scale.set(scale)
        }
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
    rotateNodes (val) {
      this.nodes[this.curlevel].forEach( n => {
        if (!n.isopen)
          n.rotation -= val
      })
    },
    proportionalLinks (param) {
      let mweight = Math.max(
        ...Object.values(this.links_[this.curlevel]).map(
          l => l.tweight
        )
      )
      if (param === 'trans') {
        Object.values(this.links_[this.curlevel]).forEach( l => {
          l.alpha *= 0.1 + 0.9 * l.tweight / mweight
        })
      } else {
        Object.values(this.links_[this.curlevel]).forEach( l => {
          let w = l.line.width
          l.clear()
          l.lineStyle(w * (w / mweight)**0.3 , 0xFFFFFF)
          let n1 = this.nodes[l.level][l.ll[0]]
          let n2 = this.nodes[l.level][l.ll[1]]
          let p1 = [n1.x, n1.y]
          let p2 = [n2.x, n2.y]
          l.moveTo(...p1)
          l.lineTo(...p2)
        })
      }
    },
    restoreLinks () {
      Object.values(this.links_[this.curlevel]).forEach( l => {
        l.alpha = 0.4
        l.clear()
        l.lineStyle(1 + (9 * l.tweight / this.max_weights[l.level]), 0xFFFFFF)
        let n1 = this.nodes[l.level][l.ll[0]]
        let n2 = this.nodes[l.level][l.ll[1]]
        let p1 = [n1.x, n1.y]
        let p2 = [n2.x, n2.y]
        l.moveTo(...p1)
        l.lineTo(...p2)
      })
    },
    linkVisibility (direction) {
      let inc = 0.1
      if (direction !== '+')
        inc = -0.1
      Object.values(this.links_[this.curlevel]).forEach( l => {
        l.alpha += inc
      })
    },
    redrawLinks (node) {
      this.rdnode = node
      let links_ = this.networks[node.level].ndata[node.id].aux.links_
      let nodes = this.nodes[node.level]
      links_.forEach( (l, i) => {
        let n1 = nodes[l[0]]
        let n2 = nodes[l[1]]
        if (!n1 || !n2) {
          return
        }
        let p1x = n1.xx ? n1.xx : n1.x
        let p1y = n1.yy ? n1.yy : n1.y
        let p2x = n2.xx ? n2.xx : n2.x
        let p2y = n2.yy ? n2.yy : n2.y
        let linkid = l[0]+'-'+l[1]
        let line = this.links_[node.level][linkid]
        if (!line)
          return
        line.clear()
        line.moveTo(p1x, p1y)
        line.lineTo(p2x, p2y)
      })
      if (node.ids) {
        node.ids.forEach( id => {
          if (id !== node.id) {
            let node_ = this.nodes[node.level][id]
            node_.xx = node_.x = node.xx ? node.xx : node.x
            node_.yy = node_.y = node.yy ? node.yy : node.y
            this.redrawLinks(node_)
          }
        })
      }
    },
    showChildren (node) {
      node.clear()
      node.tint = 0xFFFFFF
      node.lineStyle(2, 0xFFFFFF, 0.7)
      node.beginFill(0xFFFFFF, .1)
      node.drawPolygon(this.pathrect)
      node.endFill()
      let MLdata = this.networks[node.level].ndata[node.id].MLdata
      MLdata.paths.push(this.pathrect)
      if (!MLdata.isopen)
        MLdata.children.push(
          this.networks[node.level].ndata[node.id].aux.children
      )
      node.rotation = 0
      this.positionChildren(node)
      MLdata.isopen = true
    },
    positionChildren(node) {
      let level = node.level - 1
      let MLdata = this.networks[node.level].ndata[node.id].MLdata
      let children = MLdata.children[MLdata.children.length - 1]
      let dx = - 0.85 * MLdata.paths[MLdata.paths.length - 1][0]
      let dy = - 0.85 * MLdata.paths[MLdata.paths.length - 1][1]
      let c = [node.x - dx, node.y - dy]

      let ndata = this.networks[level].ndata
      let links = []
      children.forEach( c1 => {
        let neighbors = ndata[c1].aux.neighbors
        children.forEach( c2 => {
          if (neighbors.includes(c2)) {
            let tlink = ndata[c1].aux.links_[neighbors.indexOf(c2)]
            links.push(tlink)
          }
        })
        this.childparent[level][c1] = node.id
      })

      this.placeOnCanvas(children, links, level, dx*2, dy*2, c)

      this.iinfo.textContent += '\nshown predecessor(s) ' + children + ' at level ' + level
      this.iinfo.scrollTop = this.iinfo.scrollHeight
    },
    joinManyNodes (nodes) {
      let sx = __this.app_.stage.x
      let sy = __this.app_.stage.y
      let scale = __this.app_.stage.scale.x
      let bounds = nodes.map( n => { 
        let b = n.getBounds() 
        return {
          x: (b.x - sx) / scale,
          y: (b.y - sy) / scale,
          width: b.width / scale,
          height: b.height / scale,
        }
      })
      let maxx = Math.max(...bounds.map( b => b.x + b.width ))
      let maxy = Math.max(...bounds.map( b => b.y + b.height ))
      let minx = Math.min(...bounds.map( b => b.x ))
      let miny = Math.min(...bounds.map( b => b.y ))
      let c = [(maxx + minx) / 2, (maxy + miny) / 2]
      let path_ = [
        minx-4 - c[0], miny-4 - c[1],
        minx-4 - c[0], maxy+4 - c[1],
        maxx+4 - c[0], maxy+4 - c[1],
        maxx+4 - c[0], miny-4 - c[1]
      ]
      this.mmc = c
      this.mmpath_ = path_
      this.mmbounds = bounds
      let tdegree = 0
      let tstrength = 0
      let tchildren = 0
      let tparents = []
      // let ids = nodes.map( n => n.id )
      let ids = []
      nodes.forEach( n => {
        if (!n.isopen) {
          let mdata = this.networks[this.curlevel].ndata[n.id].mdata
          tdegree += mdata.degree
          tstrength += mdata.strength
          tchildren += mdata.predecessors
          tparents.push(mdata.successor)
          ids.push(n.id)
        } else {
          let J = n.joinData
          tdegree += J.degree
          tstrength += J.strength
          tchildren += J.predecessors
          tparents.push(J.successors)
          ids = ids.concat(J.ids)
          delete n.joinData
        }
        n.clear()
        n.visible = false
        n.isopen = false
        n.interactive = false
        n.isjoined = true
      })
      if (this.curlevel === this.networks.length -1)
        tparents = null
      let rect = nodes[0]
      ids.sort( (a, b) => a - b )
      rect.ids = ids
      rect.joinData = {
        ids: ids,
        level: this.curlevel,
        predecessors: tchildren,
        successors: tparents,
        degree: tdegree,
        strength: tstrength,
      }
      rect.visible = true
      rect.isopen = true
      rect.interactive = true
      rect.lineStyle(2, 0xFFFFFF, 0.7)
      rect.beginFill(0xFFFFFF, .1)
      rect.drawPolygon(path_)
      rect.endFill()
      rect.scale.set(1)
      rect.x = c[0]
      rect.y = c[1]
      rect.linkpos = 0
      this.updateLinkPos(rect)
      this.redrawLinks(rect)
      this.cnode = rect
      let tid = ids.join ('-')

      this.opennodes[rect.level][tid] = rect

      // plot children:
      // get the children of all the nodes
      // check if they have links
      let children = []
      nodes.forEach( n => {
        let MLdata = this.networks[n.level].ndata[n.id].MLdata
        if (!MLdata.isopen) {
          children = children.concat( this.networks[this.curlevel].children[n.id] )
        } else
          children = children.concat( MLdata.children[MLdata.children.length - 1] )
      })
      let MLdata = this.networks[rect.level].ndata[rect.id].MLdata
      let children_ = [...new Set(children)]
      children_.sort( (a, b) => a - b )
      MLdata.children.push( children_ )
      MLdata.paths.push( path_ )
      
      rect.rotation = 0
      this.positionChildren(rect)
      MLdata.isopen = true
    },
    joinMetanodes (node) {
      let MLdata = this.networks[node.level].ndata[node.id].MLdata
      if (!MLdata.isopen) {
        this.iinfo.textContent += '\nplease choose an opened metanode'
        this.iinfo.scrollTop = this.iinfo.scrollHeight
        return
      }
      if (!this.specified_metanode) {
        this.specified_metanode = node
        this.temptint = node.tint
        node.tint = 0x00FFFF
      } else {
        let n1 = this.specified_metanode
        n1.tint = this.temptint
        let n2 = node
        let nodes = [n1, n2]
        // let nodes_ = []
        // nodes.forEach( n => {
        //   n.ids.forEach( id => {
        //     if (id !== n1.id & id !== n2.id) {
        //       let tnode = this.nodes[n1.level][id]
        //       nodes_.push(tnode)
        //     }
        //   })
        // })
        // let nodes__ = [...nodes, ...nodes_]
        // nodes__.sort( function (a, b) { return a.id - b.id } )
        // this.joinManyNodes(nodes__)
        this.joinManyNodes(nodes)
        this.specified_metanode = undefined
      }
    },
    joinMetanodes_ (node) {
      let MLdata = this.networks[node.level].ndata[node.id].MLdata
      if (!MLdata.isopen) {
        this.iinfo.textContent += '\nplease choose an opened metanode'
        this.iinfo.scrollTop = this.iinfo.scrollHeight
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
        let MLdata_ = this.networks[n1.level].ndata[n1.id].MLdata
        let path1 = MLdata_.paths[MLdata_.paths.length - 1]
        let path2 = MLdata.paths[MLdata.paths.length - 1]
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
        MLdata_.paths.push(path)
        let children1, children2
        if (!MLdata_.isopen) {
          children1 = this.networks[n1.level].ndata[n1.id].aux.children
        } else {
          children1 = MLdata_.children[MLdata_.children.length - 1]
        }
        if (!MLdata.isopen) {
          children2 = this.networks[n2.level].ndata[n2.id].aux.children
        } else {
          children2 = MLdata.children[MLdata.children.length - 1]
        }
        MLdata_.children.push(children1.concat(children2))
        this.positionChildren(n1)
        this.specified_metanode = 0
      }
    },
    chLevel (val) {
      this.curlevel = val
      this.nodes.forEach( (nodes_, level_) => {
        nodes_.forEach( n => {
          n.interactive = level_ === val
        })
      })
    },
    uColor (level, layer) {
      // get the correct color
      this.cLevel = level
      this.cLayer = layer
      let c
      if (layer < 2) {
        c = this.nodecolors[level * 2 + layer].toString(16)
      } else {
        c = this.linkcolors[level].toString(16)
      }
      c = '#' + ('0'.repeat(6 - c.length)) + c
      this.colorAny = c
      this.cAllDialog = true
    },
  },
  watch: {
    network (val) {
      let a = document.getElementById('ninfo')
      a.textContent='loading info...'
      let turl = process.env.flaskURL + '/biMLDBgetinfo/'
      $.post(
        turl,
        // {see: 'this', and: 'thisother', num: 5}
        {
          netid: this.network._id,
        }
      ).done( info => { 
        a.textContent =  '( ' + info.n1 + " nodes in first layer, " + info.n2 + " nodes in the second layer, and " + info.l + ' links )'
      })
    },
    cAllDialog (val) {
      if (!val) {
        if (!this.colorAny.hex)
          return
        let c = parseInt(this.colorAny.hex.split("#")[1], 16)
        let tid
        if (this.cLayer < 2) {
          let fltwo = this.networks[this.cLevel].fltwo
          if (this.cLayer === 0) {
            this.nodes[this.cLevel].forEach( n => {
              if (n.id < fltwo)
                n.tint = c
            })
          } else {
            this.nodes[this.cLevel].forEach( n => {
              if (n.id >= fltwo)
                n.tint = c
            })
          }
          tid = 'tcl' + this.cLayer + '_' + this.cLevel
          this.nodecolors[this.cLevel * 2 + this.cLayer] = c
        } else {
          Object.values(this.links_[this.cLevel]).forEach( l => {
              l.tint = c
          })
          tid = 'tcli' + '_' + this.cLevel
          this.linkcolors[this.cLevel] = c
        }
        document.getElementById(tid).style.backgroundColor = this.colorAny.hex
      }
    },
    tloaded (val) {
      if (val) {
        this.colorTable()
      }
    },
    cndialog (val) {
      if (!val) {
        let fltwo = this.networks[this.curlevel].fltwo
        let c = parseInt(this.colortonode.hex.split("#")[1], 16)
        if (this.clayer === 0) {
          this.nodes[this.curlevel].forEach( n => {
            if (n.id < fltwo)
              n.tint = c
          })
        } else {
          this.nodes[this.curlevel].forEach( n => {
            if (n.id >= fltwo)
              n.tint = c
          })
        }
      }
    },
    cldialog (val) {
      if (!val) {
        let c = parseInt(this.colortolink.hex.split("#")[1], 16)
        Object.values(this.links_[this.curlevel]).forEach( l => {
            l.tint = c
        })
      }
    },
    cbdialog (val) {
      if (!val) {
        if (!this.colortobg.hex)
          return
        let c = parseInt(this.colortobg.hex.split("#")[1], 16)
        this.app_.renderer.backgroundColor = c
      }
    },
    links: (val) => {
      if (val) {
        __this.links_.forEach( ll => {
          Object.values(ll).forEach( l => l.visible = true )
        })
      } else {
        __this.links_.forEach( ll => {
          Object.values(ll).forEach( l => l.visible = false )
        })
      }
    },
  },
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
#ltable {
  margin:10px;
  border-collapse: separate;
}
#ltable td {
  padding-left: 8px;
  padding-right: 4px;
  text-align: left;
}
#ltable th {
  background-color: gray;
  padding-left: 8px;
  padding-right: 4px;
  text-align: left;
}
.lthead {
}
.highd {
  background-color: orange;
}
.container {
  max-width: 1280px;
}
.mhelp {
  cursor: pointer;
}
#startstuff {
  width: 800px;
}
#bicard {
  width: 800px;
}
[id^="tcl"] {
  cursor: pointer;
}
[id^="tdl"] {
  cursor: pointer;
}
#renderCanvas {
  border: 1px solid;
}
/* vim: set ft=vue: */
</style>
