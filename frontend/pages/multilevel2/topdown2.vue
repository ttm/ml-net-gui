<template>
<span>
  <h1><span title="Visualization of (large) Bipartite Networks assisted by Multilevel Strategies"> BiNetVis 2</span>
    <nuxt-link to="/multilevel2/about2">
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
    v-show="!loaded"
  >
    render network
  </v-btn>
  <v-checkbox v-model="slayout" label="start with layout" v-show="!loaded"> </v-checkbox>
  <v-checkbox v-model="ldialog" label="layout dialog" v-show="loaded"> </v-checkbox>
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
<dialog-drag id="dialog-1" title="layout options" :options="{buttonPin: false, buttonClose: false}" v-show="ldialog && loaded">
  <v-layout column>
  <v-layout row>
  <v-menu offset-y title="select the layout">
    <v-btn
      slot="activator"
      color="primary"
      dark
    >
      {{ layout ? layout.name : 'Select' }}
    </v-btn>
    </nuxt-link>
    <v-list>
      <v-list-tile
        v-for="(lay, index) in layouts"
        :key="index"
        @click="layout = lay"
        title="select the layout"
      >
        <v-list-tile-title color="primary">{{ lay.name }}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue" v-on="on">
      </i>
    </template>
    <vue-mathjax :formula="formula"></vue-mathjax>
  </v-tooltip>
      <span class="tooltiptext" id="mtt">
</span>
  <v-btn
    @click="randPos()"
    title="randomize position"
    color="green"
  >
    randomize
  </v-btn>
  <v-checkbox v-model="manhattan" label="Manhattan" title="use Manhattan distance"
  v-show="!(layout.tkey === 'vicgX' || layout.tkey === 'vicgXX')"
  > </v-checkbox>
  </v-layout>
  <v-layout row v-show="layout.tkey === 'vicgX' || layout.tkey === 'vicgXX'">
    <v-text-field
      :label="'repulsion'"
      :left="true"
      v-model="repulsion"
      type="number"
      step="0.5"
      min="0.1"
      class="laybtn"
    ></v-text-field>
    <v-text-field
      :label="'attraction'"
      :left="true"
      v-model="attraction"
      type="number"
      step="0.5"
      min="0.1"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'L'"
      :left="true"
      v-model="L"
      type="number"
      step="0.5"
      min="0.1"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'p'"
      :left="true"
      v-model="thresholdXX"
      type="number"
      step="0.1"
      min="0.01"
      class="laybtn"
      style="margin-left:5px"
      v-show="layout.tkey === 'vicgXX'"
    ></v-text-field>
  </v-layout>
  <v-layout row v-show="layout.tkey === 'fru'">
    <v-text-field
      :label="'C'"
      :left="true"
      v-model="fru_C"
      type="number"
      step="0.1"
      min="0.1"
      max="10"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
  </v-layout>
  <v-layout row v-show="layout.tkey === 'vicg1'">
    <v-text-field
      :label="'dI'"
      :left="true"
      v-model="dI"
      type="number"
      step="0.1"
      min="0.1"
      max="500"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'alpha a'"
      :left="true"
      v-model="alphaa"
      type="number"
      step="0.1"
      min="0.1"
      max="10"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'Ca'"
      :left="true"
      v-model="Ca"
      type="number"
      step="0.1"
      min="0.1"
      max="10"
      class="laybtn"
      id='mca'
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'Ca\''"
      :left="true"
      v-model="Ca2"
      type="number"
      step="0.1"
      min="0.1"
      max="20"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'alpha r'"
      :left="true"
      v-model="alphar"
      type="number"
      step="0.1"
      min="0.1"
      max="10"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'Cr'"
      :left="true"
      v-model="Cr"
      type="number"
      step="0.1"
      min="0.1"
      max="10"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
    <v-text-field
      :label="'Cr\''"
      :left="true"
      v-model="Cr2"
      type="number"
      step="0.1"
      min="0.1"
      max="20"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
  </v-layout>
  <v-layout row>
  <v-text-field
    :label="'step x 10e-3'"
    :left="true"
    v-model="fru_step"
    type="number"
    step="0.1"
    min="0.1"
    max="20"
    class="laybtn"
    style="margin-left:5px"
  ></v-text-field>
  <v-checkbox v-model="llevel" label="level"
    title="perform layout only on the active level"
  > </v-checkbox>
    <v-checkbox v-model="lweight" label="weight"
    title="consider link weights"
    class="laybtn"
    > </v-checkbox>
    <v-text-field
      :label="'weight emphasis'"
      :left="true"
      v-model="w_emph"
      type="number"
      step="0.1"
      min="0.1"
      max="20"
      class="laybtn"
      style="margin-left:5px"
    ></v-text-field>
  </v-layout>
  <v-layout row>
    <v-checkbox v-model="lprocess" label="iterate"
    class="laybtn"
    title="iterate until unchecked"
    > </v-checkbox>
    <v-btn
      @click="iterate_once = true"
      title="iterate once"
      color="green"
    >
      iterate
    </v-btn>
    <v-spacer></v-spacer>
    <v-text-field
      :label="'iterations'"
      v-model="niterations"
      type="number"
      class="laybtn2"
      style="margin-left:5px"
      outline
      readonly
    ></v-text-field>
  </v-layout>
  </v-layout>
</dialog-drag>
</span>
</template>

<script>
import $ from 'jquery'
import * as d3 from 'd3'
import { Chrome } from 'vue-color'
import DialogDrag from 'vue-dialog-drag'
import {VueMathjax} from 'vue-mathjax'


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
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-AMS_HTML' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' },
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
        {name: 'Fruchterman-Reingold', tkey: 'fru'},
        // {name: 'Force Atlas 2', tkey: 'fa2'},
        {name: 'VICG - theoretic', tkey: 'vicg1'},
        // {name: 'VICG - optimal', tkey: 'vicg2'},
        {name: 'VICG - optimalX', tkey: 'vicgX'},
        {name: 'VICG - optimalXX', tkey: 'vicgXX'},
      ],
      // layout: {name: 'VICG - optimal', tkey: 'vicg2'},
      // layout: {name: 'VICG - theoretic', tkey: 'vicg1'},
      layout: {name: 'Fruchterman-Reingold', tkey: 'fru'},
      // layout: {name: 'VICG - optimalX', tkey: 'vicgX'},
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
      attraction: 20,
      repulsion: 10,
      lprocess: 0,
      fru_C: 0.5,
      fru_step: 5,
      lweight: false,
      Ca: 1,
      Ca2: 1,
      Cr: 1,
      Cr2: 1,
      dI: 2,
      alphaa: 2,
      alphar: 1,
      w_emph: 1,
      niterations: 0,
      thresholdXX: 0.1,
      L: 50,
      llevel: false,
      formula: '$$k = C\\sqrt{area/nodes},\\; f_a = d^2 / k, \\; f_r = -k^2 / d$$',
      ldialog: true,
      slayout: false,
      manhattan: false,
    }
  },
  components: {
    Chrome,
    DialogDrag,
    'vue-mathjax': VueMathjax,
  },
  mounted () {
    window.__this = this
    this.calcDist = this.eucDist
    this.runLayout = this.vicg1
    this.runLayout = this.fruchter
    this.runLayout = this.vicgX
    // this.layout = {name: 'VICG - optimalX', tkey: 'vicgX'}
    this.layout = {name: 'VICG', tkey: 'vicg1'}
    this.getNodes = this.getAllNodes
    let mdialog =document.getElementById('dialog-1')
    mdialog.__vue__.left = 440
    mdialog.__vue__.top = 400
    mdialog.__vue__.left = 840
    mdialog.__vue__.top = 600
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
    eucDist (d1, d2) {
      return ( d1**2 + d2**2 )**0.5
    },
    manDist (d1, d2) {
      return Math.abs(d1) + Math.abs(d2)
    },
    cfunc (e) {
      this.nev = e
    },
    bfunc (e) {
      this.mev = e
    },
    getLNodes () {
      if (this.lnodes) {
        return this.lnodes
      } else {
        return __this.nodes[__this.curlevel].reduce( (t, n) => {
          if (n && !n.isdestroyed)
            t.push(n)
          return t
        }, [])
      }
    },
    fruchter () {
      let nodes_ = this.getNodes()
      let ndata = this.networks[__this.curlevel].ndata
      let mov = nodes_.map( n => [0, 0] )
      let area = this.larea ? this.larea : this.carea
      let k = this.fru_C * (area / nodes_.length ) ** 0.5
      let k2 = k ** 2
      let step = this.fru_step / 1000
      for (let i = 0; i < nodes_.length; i++) {
        let n1 = nodes_[i]
        for (let j = i + 1; j < nodes_.length; j++) {
          let n2 = nodes_[j]
          let dx = n1.x - n2.x
          let dy = n1.y - n2.y
          let d = this.calcDist(dx, dy)
          let fr = k2 / d
          let fa = 0
          // if (neighbors.includes(n2.id)) {
          if (n1.linkedTo[n2.level][n2.id]) {
            let w = 1
            if (this.lweight) {
              w = n1.linkedTo[n2.level][n2.id]
              w = 1 + (w - 1) * this.w_emph
            }
            fa = w * d ** 2 / k
          }
          let f = fa - fr
          f = Math.abs(f) > 1000 ? 1000 * Math.sign(f) : f
          let fx = f * dx / d
          let fy = f * dy / d
          mov[i][0] -= fx * step
          mov[i][1] -= fy * step
          mov[j][0] += fx * step
          mov[j][1] += fy * step
        }
        n1.x += mov[i][0]
        n1.y += mov[i][1]
        this.redrawLinks(n1)
      }
      this.mov = mov
    },
    fa2 () {
      console.log('fa')
    },
    vicg1 () {
      let nodes_ = this.getNodes()
      let ndata = this.networks[__this.curlevel].ndata
      let mov = nodes_.map( n => [0, 0] )
      let step = this.fru_step / 1000
      let alphaa = this.alphaa
      let Ca = this.Ca
      let Ca2 = Number(this.Ca2)
      let alphar = this.alphar
      let Cr = this.Cr
      let Cr2 = Number(this.Cr2)
      let dI = this.dI
      for (let i = 0; i < nodes_.length; i++) {
        let n1 = nodes_[i]
        for (let j = i + 1; j < nodes_.length; j++) {
          let n2 = nodes_[j]
          let dx = n1.x - n2.x
          let dy = n1.y - n2.y
          let d = this.calcDist(dx, dy)
          let fr = Cr * ((dI/d) ** alphar) + Cr2
          let fa = 0
          if (n1.linkedTo[n2.level][n2.id]) {
            let w = 1
            if (this.lweight) {
              w = n1.linkedTo[n2.level][n2.id]
              w = 1 + (w - 1) * this.w_emph
            }
            fa = Ca * w * ((d/dI) ** alphaa) + Ca2
          }
          let f = fa - fr
          f = Math.abs(f) > 1000 ? 1000 * Math.sign(f) : f
          let fx = f * dx / d
          let fy = f * dy / d
          mov[i][0] -= fx * step
          mov[i][1] -= fy * step
          mov[j][0] += fx * step
          mov[j][1] += fy * step
        }
        n1.x += mov[i][0]
        n1.y += mov[i][1]
        __this.redrawLinks(n1)
      }
      this.mov = mov
      console.log('v1')
    },
    vicg2 () {
      console.log('v2')
    },
    vicgX () {
      let nodes_ = __this.nodes[__this.curlevel]
      let ndata = this.networks[__this.curlevel].ndata
      let mov = this.nodes[this.curlevel].map( n => [n.x, n.y] )
      let step = this.fru_step / 1000
      for (let i = 0; i < nodes_.length; i++) {
        let p1 = mov[i]
        let n1 = nodes_[i]
        for (let j = i + 1; j < nodes_.length; j++) {
          let p2 = mov[j]
          let n2 = nodes_[j]
          let dx = p1[0] - p2[0]
          let dy = p1[1] - p2[1]
          if (n1.linkedTo[n2.level][n2.id]) {
            let w = 1
            if (this.lweight) {
              w = n1.linkedTo[n2.level][n2.id]
              w = 1 + (w - 1) * this.w_emph
            }
            let fax = w * this.attraction * dx * step
            let fay = w * this.attraction * dy * step
            mov[i][0] -= fax
            mov[i][1] -= fay
            mov[j][0] += fax
            mov[j][1] += fay
          }
          if ( Math.abs(dx) < __this.L && Math.abs(dy) < __this.L ) {
            let r = this.repulsion
            let fx, fy
            if (Math.abs(dx) < 1) {
              fx = r * Math.sign(dx) * step
            } else {
              fx = r / dx
            }
            if (Math.abs(dy) < 1) {
              fy = r * Math.sign(dy) * step
            } else {
              fy = r / dy
            }
            mov[i][0] += fx
            mov[i][1] += fy
            mov[j][0] -= fx
            mov[j][1] -= fy
          }
        }
        n1.x = mov[i][0]
        n1.y = mov[i][1]
        this.redrawLinks(n1)
      }
      this.mov = mov
    },
    vicgXX () {
      let nodes_ = __this.nodes[__this.curlevel]
      let ndata = this.networks[__this.curlevel].ndata
      let mov = this.nodes[this.curlevel].map( n => [n.x, n.y] )
      let step = this.fru_step / 1000
      for (let i = 0; i < nodes_.length; i++) {
        if (Math.random() > this.thresholdXX)
          continue
        let p1 = mov[i]
        let n1 = nodes_[i]
        for (let j = i + 1; j < nodes_.length; j++) {
          if (Math.random() > this.thresholdXX)
            continue
          let p2 = mov[j]
          let n2 = nodes_[j]
          let dx = p1[0] - p2[0]
          let dy = p1[1] - p2[1]
          if (n1.linkedTo[n2.level][n2.id]) {
            let w = 1
            if (this.lweight) {
              w = n1.linkedTo[n2.level][n2.id]
              w = 1 + (w - 1) * this.w_emph
            }
            let fax = w * this.attraction * dx * step
            let fay = w * this.attraction * dy * step
            mov[i][0] -= fax
            mov[i][1] -= fay
            mov[j][0] += fax
            mov[j][1] += fay
          }
          if ( Math.abs(dx) < __this.L && Math.abs(dy) < __this.L ) {
            let r = this.repulsion
            let fx, fy
            if (Math.abs(dx) < 1) {
              fx = r * Math.sign(dx) * step
            } else {
              fx = r / dx
            }
            if (Math.abs(dy) < 1) {
              fy = r * Math.sign(dy) * step
            } else {
              fy = r / dy
            }
            mov[i][0] += fx
            mov[i][1] += fy
            mov[j][0] -= fx
            mov[j][1] -= fy
          }
        }
        n1.x = mov[i][0]
        n1.y = mov[i][1]
        this.redrawLinks(n1)
      }
      this.mov = mov
    },
    randPos () {
      let nodes = __this.nodes[__this.curlevel]
      let layout = nodes.map( n => [2*Math.random() -1, 2*Math.random() -1] )
      for (let i = 0; i < nodes.length ; i++) {
        let n = nodes[i]
        let l = layout[i]
        n.x = (1 + l[0]) * this.cwidth / 2
        n.y = (1 + l[1]) * this.cheight / 2
        this.redrawLinks(n)
      }
    },
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
        if (__this.tool === 'layout') {
          let p = d3.mouse(this)
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          let scale = __this.app_.stage.scale.x
          __this.lregs = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
          if (__this.lregion)
            __this.lregion.destroy()
          __this.lregion = new PIXI.Graphics()
          __this.lregion.name = 'lrect'
          __this.lregion.buttonMode = true
          __this.app_.stage.addChild(__this.lregion)
          __this.lisdrawing = true
          return
        }
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
        if ( __this.tool === 'collapse' || __this.tool === 'regionexplore' || (__this.tool === 'drag' && !__this.dragginnode) ) {
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
        if (__this.tool === 'layout') {
          if (!__this.lisdrawing)
            return
          let e = __this.lregs
          let p_ = d3.mouse(this)
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          let p = [(p_[0] - panx)/scale, (p_[1] - pany)/scale]
          __this.lregion.clear()
          __this.lregion.beginFill(0xFF0000, 0.3)
          __this.lregion.drawPolygon([e[0], e[1], e[0], p[1], p[0], p[1], p[0], e[1]])
          __this.lregion.endFill()
          return
        }
        if ((__this.tool === 'collapse' || __this.tool === 'regionexplore' || __this.tool === 'drag') && __this.eregion) {
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
        if (__this.tool === 'layout') {
          __this.lisdrawing = false
          let p = d3.mouse(this)
          let scale = __this.app_.stage.scale.x
          let panx = __this.app_.stage.x
          let pany = __this.app_.stage.y
          __this.lrege = [
            (p[0] - panx) / scale,
            (p[1] - pany) / scale,
          ]
          let r1 = __this.lregs
          let r2 = __this.lrege
          if ((r1[0] === r2[0]) && (r1[1] === r2[1])) {
            delete __this.lnodes
            delete __this.larea
            return
          }
          let maxx = Math.max(r1[0], r2[0])
          let maxy = Math.max(r1[1], r2[1])
          let minx = Math.min(r1[0], r2[0])
          let miny = Math.min(r1[1], r2[1])
          __this.larea = (maxx - minx) * (maxy - miny)
          let nodes
          if (__this.llevel) {
            nodes = __this.nodes[__this.curlevel]
          } else {
            nodes = __this.getAllNodes()
          }
          let nodes_ = []
          nodes.forEach( n => {
            if (n.isdestroyed)
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
          if (__this.considerlinks) {
            // add nodes that are linked to nodes
            let nodes__ = []
            nodes_.forEach( n1 => {
              n1.linkedTo.forEach( (nids, level) => {
                nids.forEach( (w, nid) => {
                  let n2 = __this.nodes[level][nid]
                  if (!nodes_.includes(n2) && !nodes__.includes(n2) && !n2.isdestroyed)
                    nodes__.push(n2)
                })
              })
            })
            console.log(nodes__)
            nodes_.push(...nodes__)
          }
          __this.lnodes = nodes_
          return
        }
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
            if (n.isdestroyed)
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
        if (__this.tool === 'collapse' || __this.tool === 'regionexplore') {
          if (__this.tool === 'collapse' && __this.curlevel === __this.networks.length - 1) {
            __this.eregion.clear()
            delete __this.eregion
            return
          }
          if (__this.tool === 'regionexplore' && __this.curlevel === 0) {
            __this.eregion.clear()
            delete __this.eregion
            return
          }
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
            if (!n.interactive || n.isdestroyed)
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
          // test if nodes have more than one successor
          console.log('finding nodes')
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
            if (__this.tool === 'collapse') {
              __this.collapseNodes(nodes_)
            } else if (__this.tool === 'regionexplore') {
              __this.joinManyNodes(nodes_)
            }
          }
        }
      })
      this.app_.stage.interactive = true
    },
    collapseNodes (nodes) {
      console.log('collapse them!')
      this.mnodes = nodes
      // group them by successor
      let parents_ = this.networks[nodes[0].level].parents
      let parents = nodes.map( n => parents_[n.id] )
      parents = [...new Set(parents)]
      let pgroups = parents.reduce( (g, p) => {
        g[p] = this.networks[nodes[0].level + 1].children[p].map( cid => {
          return this.nodes[nodes[0].level][cid]
        })
        return g
      }, {})
      // get average position in each group
      let gpositions = parents.reduce( (gpos, p) => {
        let nodes_ = pgroups[p]
        let pos = nodes_.reduce( (pos_, n) => {
          // destroy nodes and their links
          pos_[0] += n.x
          pos_[1] += n.y
          n.destroy()
          n.isdestroyed = true
          n.visible = false
          n.interactive = false
          this.eraseLinks(n)
          return pos_
        }, [0, 0])
        gpos[p] = [pos[0] / nodes_.length, pos[1] / nodes_.length]
        return gpos
      }, {})
      // create the successor nodes for each group, and their links
      this.mkParentNodes(parents, gpositions, nodes[0].level + 1)
      this.restoreParentLinks(parents, nodes[0].level + 1)
    },
    mkParentNodes (pids, pos, level) {
      let l2path = this.l2hex ? this.pathhex : this.path
      let fltwo = this.networks[level].fltwo
      let nodes = pids
      for (let i = 0; i < nodes.length; i++) {
        let nid = nodes[i]
        let p = pos[nid]

        let px = p[0]
        let py = p[1]
        let ndata = this.networks[level].ndata

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
        node.interactive = false
        node.buttonMode = true
        node.alpha = 0.8
        node.zIndex = 10
        node
          .on('pointerdown', clickNode)
          .on('pointerup', releaseNode)
          .on('pointerupoutside', releaseNode)
          .on('pointermove', moveNode)
        node.id = nid
        node.level = level
        node.links = []
        node.linkedTo = this.networks.map( n => [] )
        let ll = ndata[nid].aux.links_
        ll.forEach( l  => {
          let ne = l[0] === nid ? l[1] : l[0]
          let w = l[2]
          let target, tlevel
          if (this.nodes[level][ne] || nodes.includes(ne)) {
            target = ne
            tlevel = level
          } else {
            [target, tlevel] = this.findParent(ne, level)
          }
          if (typeof target === 'undefined') {
            let [targets, tlevels, ws] = this.findChildren(ne, level, nid, level)
            for (let each = 0; each < targets.length; each++) {
              target = targets[each]
              tlevel = tlevels[each]
              w = ws[each]
              if (node.linkedTo[tlevel][target]) {
                node.linkedTo[tlevel][target] += w
              } else {
                node.linkedTo[tlevel][target] = w
              }
            }
          }
          else {
            if (node.linkedTo[tlevel][target]) {
              node.linkedTo[tlevel][target] += w
            } else {
              node.linkedTo[tlevel][target] = w
            }
          }
        })
        node.scale.x *= this.nodescales[level]
        node.scale.y *= this.nodescales[level]
        this.mcont.addChild(node)
        this.nodes[level][nid] = node
      }
    },
    restoreParentLinks (pids, level) {
      this.linkChildren(pids, level)
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
            nn.forEach( n => {
              if (!n.isdestroyed) {
                n.clear() 
                n.destroy()
                n.isdestroyed = true
              }
            })
          })
          this.links_.forEach( ll => {
            Object.values(ll).forEach( l => {
              if (!l.isdestroyed) {
                l.clear() 
                l.destroy()
                l.isdestroyed = true
              }
            })
          })
          Object.values(this.links__).forEach( ll => {
            Object.values(ll).forEach( l => {
              if (!l.isdestroyed) {
                l.clear() 
                l.destroy()
                l.isdestroyed = true
              }
            })
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
      this.networks[1].children.forEach( (cs, pid) => {
        cs.forEach( cid => {
          this.networks[0].parents[cid] = pid
        })
      })
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
      this.links__ = {}
      for (let level = 0; level < this.networks.length; level++) {
        for (let level_ = level + 1; level_ < this.networks.length; level_++) {
          this.links__[level + '-' + level_] = {}
        }
      }
      for (let level = 0; level < this.networks.length; level++) {
        this.links_.push({})
        this.nodes.push([])
        this.opennodes.push({})
        this.childparent.push({})
        this.nodescales.push((1 / (this.networks.length - level))**0.5)
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
          let w = {}
          for (let ii = 0; ii < aux.links_.length; ii++) {
            let l = aux.links_[ii]
            let ind = l[0] === i ? l[1] : l[0]
            w[ind] = l[2]
          }
          aux.w = w
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
      this.placeOnCanvas0(nodes, links, this.curlevel, this.cwidth_, this.cheight_, center)
    },
    attachLinks () {
      this.nodes[this.curlevel].forEach( n1 => {
        n1.linkedTo[this.curlevel].forEach( (w, nid) => {
          let n2 = this.nodes[this.curlevel][nid]
          let lid
          if (n1.id < n2.id) {
            lid = n1.id + '-' + n2.id
          } else {
            lid = n2.id + '-' + n1.id
          }
          let link = this.links_[this.curlevel][lid]
          n2.links.push(link)
          n1.links.push(link)
        })
      })
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
    placeOnCanvas0 (nodes, links, level, width, height, center) {
      // for the initial rendering of the network
      if (!this.slayout) {
        let layout = nodes.reduce( (l, n) => {
          l[n] = [2*Math.random() -1, 2*Math.random() -1]
          return l
        }, {})
        this.plotNetwork(nodes, links, level, width, height, center, layout)
      } else {
        let turl = process.env.flaskURL + '/layoutOnDemand/'
        $.ajax(
          turl,
          {
            data: JSON.stringify({
              layout: 'spring',
              dim: 2,
              nodes: nodes,
              links: links,
              first: true,
              lonely: false,
              l0: []
            }),
            contentType : 'application/json',
            type : 'POST',
          },
        ).done( layout => {
          this.plotNetwork(nodes, links, level, width, height, center, layout)
        })
      }
    },
    plotNetwork (nodes, links, level, width, height, center, layout) {
      this.mkLines(links, level, width, height, center, layout)
      this.mkNodes0(nodes, level, width, height, center, layout)
      this.attachLinks()
      if (!this.loaded)
        this.zoom('-')
      this.loaded = true
      this.updateElementsCount()
      this.app_.ticker.add( (delta) => {
        if (!__this.lprocess && !__this.iterate_once)
          return
        if (__this.runLayout) {
          __this.runLayout()
          __this.niterations++
        }

        __this.iterate_once = false
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
          line.ll = l.concat([level])
          this.links_[level][l[0]+'-'+l[1]] = line
        }
      }
    },
    mkLine (p1, p2, weight, level) {
      let line = new PIXI.Graphics()
      let level_
      if ((typeof level === 'string') && level.includes('-'))
        level_ = level.split('-')[0]
      else
        level_ = level
      line.lineStyle(1 + (9 * weight / this.max_weights[level_]) / (this.networks.length - level_) , 0xFFFFFF)
      line.tint = this.linkcolors[level_]
      if (!line.tint)
        line.tint = 0x000000
      line.level = level
      line.moveTo(...p1)
      line.lineTo(...p2)
      line.alpha = 0.4
      line.p1 = p1
      line.p2 = p2
      this.mcont.addChild(line)
      return line
    },
    eraseLinks(node) {
      node.links.forEach( l => {
        if (!l.isdestroyed) {
          l.clear()
          l.destroy()
          l.isdestroyed = true
        }
      })
      delete node.linkedTo
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
    mkNodesC (nodes, level, width, height, center, layout) {
      let l2path = this.l2hex ? this.pathhex : this.path
      let fltwo = this.networks[level].fltwo
      for (let i = 0; i < nodes.length; i++) {
        let nid = nodes[i]
        let p = layout[nid]
        let px = (1 + p[0]) * width/2 + center[0]
        let py = (1 + p[1]) * height/2 + center[1]
        let node_ = this.nodes[level][nid]
        let ndata = this.networks[level].ndata
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
        node.zIndex = 10
        node
          .on('pointerdown', clickNode)
          .on('pointerup', releaseNode)
          .on('pointerupoutside', releaseNode)
          .on('pointermove', moveNode)
        node.id = nid
        node.level = level
        node.links = []
        node.linkedTo = this.networks.map( n => [] )
        let ll = ndata[nid].aux.links_
        ll.forEach( l  => {
          let ne = l[0] === nid ? l[1] : l[0]
          let w = l[2]
          let target, tlevel
          if ((this.nodes[level][ne] && !this.nodes[level][ne].isdestroyed) || nodes.includes(ne)) {
            target = ne
            tlevel = level
          } else {
            [target, tlevel] = this.findParent(ne, level)
          }
          if (typeof target === 'undefined') {
            let [targets, tlevels, ws] = this.findChildren(ne, level, nid, level)
            for (let each = 0; each < targets.length; each++) {
              target = targets[each]
              tlevel = tlevels[each]
              w = ws[each]
              if (node.linkedTo[tlevel][target]) {
                node.linkedTo[tlevel][target] += w
              } else {
                node.linkedTo[tlevel][target] = w
              }
            }
          } else {
            if (node.linkedTo[tlevel][target]) {
              node.linkedTo[tlevel][target] += w
            } else {
              node.linkedTo[tlevel][target] = w
            }
          }
        })
        node.scale.x *= this.nodescales[level]
        node.scale.y *= this.nodescales[level]
        this.mcont.addChild(node)
        this.nodes[level][nodes[i]] = node
      }
    },
    findChildren (cid_, level, nid, levelnid) {
      // find the all children of nid and their levels
      let cids = this.networks[level].children[cid_]
      let cids_ = []
      let levels_ = []
      let ws_ = []
      cids.forEach( cid => {
        if (this.nodes[level - 1][cid] && !this.nodes[level - 1][cid].isdestroyed) {
          let cid_ = cid
          let level_ = level - 1
          // find the weight:
          // find the child cid2 of nid which is linked to cid
          // then find the link cid-cid2 and get the weight
          let w_ = this.findW(cid, level, nid, levelnid)
          cids_.push(cid_)
          levels_.push(level_)
          ws_.push(w_)
        } else {
          let [cids__, levels__, ws__] = this.findChildren(cid, level - 1, nid, levelnid)
          cids_ = cids_.concat(cids__)
          levels_ = levels_.concat(levels__)
          ws_ = ws_concat(ws__)
        }
      })
      return [cids_, levels_, ws_]
    },
    findW (cid, level, nid, levelnid) {
      let level_ = levelnid
      let children = []
      let nids = [nid]
      while (level_ > level) {
        children = nids.map( nid_ => {
          return this.networks[level_].children[nid_]
        })
        children = children.flat(1)
        level_--
      }
      let w = 0
      children.forEach( cid_ => {
        let w_ = this.networks[level][cid_].ndata.aux.w[cid]
        if (w_) {
          w += w_
        }
      })
      return w
      // return 1
    },
    findParent (nid, level) {
      let parent_
      let level_
      let found = false
      while (!found) {
        if (level == (this.networks.length - 1)) {
          return [undefined, undefined]
        }
        let sid = this.networks[level].ndata[nid].mdata.successor
        if (this.nodes[level + 1][sid] && !this.nodes[level + 1][sid].isdestroyed) {
          parent_ = sid
          level_ = level + 1
          found = true
        } else {
          nid = sid
          level++
        }
      }
      return [parent_, level_]
    },
    mkNodes0 (nodes, level, width, height, center, layout) {
      let l2path = this.l2hex ? this.pathhex : this.path
      let fltwo = this.networks[level].fltwo
      for (let i = 0; i < nodes.length; i++) {
        let nid = nodes[i]
        let p = layout[nid]
        let px = (1 + p[0]) * width/2 + center[0]
        let py = (1 + p[1]) * height/2 + center[1]
        let node_ = this.nodes[level][nodes[i]]
        let ndata = this.networks[level].ndata
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
          node.zIndex = 10
          node
            .on('pointerdown', clickNode)
            .on('pointerup', releaseNode)
            .on('pointerupoutside', releaseNode)
            .on('pointermove', moveNode)
          node.id = nid
          node.level = level
          node.links = []
          node.linkedTo = this.networks.map( n => [] )
          let nlinks = ndata[nid].aux.links_
          for (let li = 0; li < nlinks.length; li++) {
            let l = nlinks[li]
            let ne = l[0] === nid ? l[1] : l[0]
            node.linkedTo[level][ne] = l[2]
          }
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
            if (!n.isopen && !n.isdestroyed)
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
      node.links.forEach( l => {
        if (l.isdestroyed)
          return
        let level = l.ll[3]
        let n1, n2
        if ((typeof level === 'string') && level.includes('-')) {
          let [l1, l2] = level.split('-')
          n1 = this.nodes[l1][l.ll[0]]
          n2 = this.nodes[l2][l.ll[1]]
        } else {
          n1 = this.nodes[level][l.ll[0]]
          n2 = this.nodes[level][l.ll[1]]
        }
        l.clear()
        l.moveTo(n1.x, n1.y)
        l.lineTo(n2.x, n2.y)
      })
    },
    placeOnCanvasChildren(children, dx_, dy_, c_, level) {
      let dx = - dx_
      let dy = - dy_
      let c = [c_[0] - dx, c_[1] - dy]
      let layout = children.reduce( (l, n) => {
        l[n] = [2*Math.random() -1, 2*Math.random() -1]
        return l
      }, {})
      this.mkNodesC(children, level, dx * 2, dy * 2, c, layout)

      // this.placeOnCanvas_(children, links, level, dx*2, dy*2, c)

      this.iinfo.textContent += '\nshown predecessor(s) ' + children + ' at level ' + level
      this.iinfo.scrollTop = this.iinfo.scrollHeight
    },
    joinManyNodes (nodes) {
      console.log('join many')
      let sx = this.app_.stage.x
      let sy = this.app_.stage.y
      let scale = this.app_.stage.scale.x
      let bounds = nodes.map( n => { 
        if (n.isdestroyed)
          return
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
      // let ids = nodes.map( n => n.id )
      let ids = []
      nodes.forEach( n => {
        n.visible = false
        n.isopen = false
        n.interactive = false
        this.eraseLinks(n)
        n.isdestroyed = true
      })
      // plot children:
      // get the children of all the nodes
      // check if they have links
      let children = nodes.reduce( (cs, n) => {
        return cs.concat( this.networks[this.curlevel].children[n.id] )
      }, [])
      let children_ = [...new Set(children)]
      children_.sort( (a, b) => a - b )
      
      this.placeOnCanvasChildren(children_, path_[0], path_[1], c, nodes[0].level - 1)

      this.linkChildren(children_, nodes[0].level - 1)
    },
    linkChildren (nodes, level) {
      nodes.forEach( nid => {
        let n1 = this.nodes[level][nid]
        if (n1.isdestroyed)
          return
        n1.linkedTo.forEach( (nids, level2) => {
          nids.forEach( (w, nid2) => {
            let n2 = this.nodes[level2][nid2]
            if (n2.isdestroyed)
              return
            let level_, lid, ll
            if (n1.level === n2.level) {
              level_ = level
              if (n1.id < n2.id) {
                lid = n1.id + '-' + n2.id
                ll = [n1.id, n2.id, w, n1.level]
              } else {
                lid = n2.id + '-' + n1.id
                ll = [n2.id, n1.id, w, n1.level]
              }
            } else {
              if (n1.level < n2.level) {
                level_ = n1.level + '-' + n2.level
                lid = n1.id + '-' + n2.id
                ll = [n1.id, n2.id, w, level_]
              } else {
                level_ = n2.level + '-' + n1.level
                lid = n2.id + '-' + n1.id
                ll = [n2.id, n1.id, w, level_]
              }
            }
            let line = this.mkLine([n1.x, n1.y], [n2.x, n2.y], w, level_)
            line.ll = ll
            if (n1.level === n2.level) {
              this.links_[level][lid] = line
            } else {
              this.links__[level_][lid] = line
            }
            n1.links.push(line)
            n2.links.push(line)
          })
        })
      })
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
    getAllNodes () {
      let nodes = []
      if (this.lnodes) {
        return this.lnodes
      } else {
        this.nodes.forEach( lnodes => {
          lnodes.forEach( n => {
            if (!n.isdestroyed)
              nodes.push(n)
          })
        })
        return nodes
      }
    },
  },
  watch: {
    manhattan (val) {
      if (val) {
        this.calcDist = this.manDist
      } else {
        this.calcDist = this.eucDist
      }
    },
    llevel (val) {
      if (val) {
        this.getNodes = this.getLNodes
      } else {
        this.getNodes = this.getAllNodes
      }
    },
    layout (val) {
      let k = val.tkey
      if (k === 'fru') {
        this.runLayout = this.fruchter
        this.formula = '$$d = C\\sqrt{area/nodes},\\; f_a = d^2 / k, \\; f_r = -k^2 / d$$'
      } else if (k === 'fa2') {
        this.runLayout = this.fa2
      } else if (k === 'vicg1') {
        this.runLayout = this.vicg1
        this.formula = '$$f_a = C_a . (d / d_I )^{\\alpha_a} + C_a\', \\; f_r = -C_r . (d_I / d)^{\\alpha_r} + C_r\'$$'
      } else if (k === 'vicg2') {
        this.runLayout = this.vicg2
      } else if (k === 'vicgX') {
        this.runLayout = this.vicgX
        this.formula = '$$f_{a,x} = attraction . dx, f_{a,y} = attraction . dy$$ $$|dx|,|dy| > L \\Rightarrow f_{r,x} = - repulsion / dy, f_{r,y} = - repulsion / dy$$'
      } else if (k === 'vicgXX') {
        this.runLayout = this.vicgXX
        this.formula = 'with probability p: $$f_{a,x} = attraction . dx, f_{a,y} = attraction . dy$$ $$|dx|,|dy| > L \\Rightarrow f_{r,x} = - repulsion / dy, f_{r,y} = - repulsion / dy$$'
      }
    },
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

<style src="vue-dialog-drag/dist/vue-dialog-drag.css"></style>
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
#ldiv {
  border: 2px solid;
  padding: 2px;
  margin: 2px;
  width: 100%;
}
.laybtn {
  width: 80px;
  float: left;
}
.laybtn2 {
  width: 30px;
}
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
.MathJax {
  font-size: 1.3em !important;
}
/* vim: set ft=vue: */
</style>
