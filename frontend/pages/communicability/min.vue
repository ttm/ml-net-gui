<template>
<span style="width:800px">
  <h1>ComNetVis
  <nuxt-link to="/communicability/about">
    <i class="fa fa-question-circle mhelp" style="font-size:28px;color:darkblue"></i>
  </nuxt-link>
  </h1>
  network: 
<v-menu offset-y class="setstuff"
  :disabled="loaded && !dirty"
>
  <v-btn
    slot="activator"
    color="primary"
  >
    {{ network ? network.filename : 'Loading...' }}
  </v-btn>
  <v-list
    class="scroll-y"
  >
    <v-list-tile
      v-for="(net, index) in networks_"
      :key="index"
      @click="network = net"
      :disabled="loaded && !dirty"
    >
      <v-list-tile-title color="primary">{{ net.filename }}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile>
<input type="file" @change="upload">
    </v-list-tile>
  </v-list>
</v-menu>
( nodes: {{ network ? network.nnodes : '---' }}, links: {{ network ? network.nlinks : '---' }} )
<v-layout row>
<v-card flat dark style="padding:20px;width:800px;display:block;">
Communicability calculation
<v-layout row>
  <v-flex class="px-3">
  <v-slider
    v-model="temp"
    :max="10"
    :min="0"
    :label="'inverse temperature'"
    :step="0.01"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-slider>
  </v-flex>
  <v-flex shrink style="width: 50px">
  <v-text-field
    v-model="temp"
    class="mt-0 setstuff"
    hide-details
    single-line
    type="number"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
</v-layout>
<v-layout row>
  <v-flex class="px-3">
  <v-slider
    v-model="mangle"
    :max="1000"
    :min="1"
    :label="'minimum angle x 10e-6'"
    :step="1"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-slider>
  </v-flex>
  <v-flex shrink style="width: 50px">
  <v-text-field
    v-model="mangle"
    class="mt-0 setstuff"
    hide-details
    single-line
    type="number"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
</v-layout>
</v-card>
</v-layout>
<v-layout row>
<v-card flat dark :width="'800px'" abanana="'asd'" style="padding:20px;width:800px;margin-top:10px;">
  Community detection

<v-layout align-center justify-start row v-show="cdim !== network.nnodes">
  <span style="color: rgba(255, 255, 255, 0.7); font-size: 16px;">
    dimensionality reduction method:
  </span>
<v-menu offset-y class="setstuff"
  :disabled="loaded && !dirty"
>
  <v-btn
    slot="activator"
    color="primary"
  >
    {{ dimredmet }}
  </v-btn>
  <v-list
    class="scroll-y"
  >
    <v-list-tile
      v-for="(met, index) in dimredmets"
      :key="index"
      @click="dimredmet = met"
      :disabled="loaded && !dirty"
    >
      <v-list-tile-title color="primary">{{ met }}</v-list-tile-title>
    </v-list-tile>
  </v-list>
</v-menu>
  <v-flex shrink style="width: 50px" ml-3>
  <v-text-field
    v-show="wneigh.includes(dimredmet)"
    v-model="nneighbors"
    type="number"
    :label="'neighbors'"
    title="neighbors"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
</v-layout>
<v-layout row>
  <v-flex class="px-3">
  <v-slider
    v-model="cdim"
    :max="network.nnodes"
    :min="1"
    :label="'dimensions'"
    :step="1"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-slider>
  </v-flex>
  <v-flex shrink style="width: 50px">
  <v-text-field
    v-model="cdim"
    class="mt-0 setstuff"
    hide-details
    single-line
    :step="1"
    type="number"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
</v-layout>
<v-layout align-center justify-start row>
  <span style="color: rgba(255, 255, 255, 0.7); font-size: 16px;">
    clustering algorithm:
  </span>
<v-menu offset-y class="setstuff"
  :disabled="loaded && !dirty"
>
  <v-btn
    slot="activator"
    color="primary"
  >
    {{ clustmet }}
  </v-btn>
  <v-list
    class="scroll-y"
  >
    <v-list-tile
      v-for="(met, index) in clustmets"
      :key="index"
      @click="clustmet = met"
      :disabled="loaded && !dirty"
    >
      <v-list-tile-title color="primary">{{ met }}</v-list-tile-title>
    </v-list-tile>
  </v-list>
</v-menu>
</v-layout>
<v-layout align-center justify-start row v-show="clustmet !== 'Affinity Propagation'">
  <span style="color:rgba(255,255,255,0.7);font-size:16px;">
    number of communities:
  </span>
  <v-flex shrink style="width: 50px" ml-3>
  <v-text-field
    v-model="nc[0]"
    type="number"
    :label="'min'"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
  <v-flex class="px-3">
  <v-range-slider
    v-model="nc"
    :max="40"
    :min="1"
    :step="1"
    class="setstuff"
    :disabled="loaded && !dirty"
    @change="cgNclus"
  ></v-range-slider>
  </v-flex>
  <v-flex shrink style="width: 50px">
  <v-text-field
    v-model="nc[1]"
    type="number"
    :label="'max'"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
</v-layout>
</v-card>
</v-layout>
<v-layout row>
<v-card flat dark style="padding:20px;width:800px;margin-top:10px;margin-bottom:10px;">
  Node-link layout
<v-layout align-center justify-start row>
  <span style="color: rgba(255, 255, 255, 0.7); font-size: 16px;">
    dimensionality reduction method:
  </span>
<v-menu offset-y class="setstuff"
  :disabled="loaded && !dirty"
>
  <v-btn
    slot="activator"
    color="primary"
  >
    {{ dimredmetL }}
  </v-btn>
  <v-list
    class="scroll-y"
  >
    <v-list-tile
      v-for="(met, index) in dimredmets"
      :key="index"
      @click="dimredmetL = met"
      :disabled="loaded && !dirty"
    >
      <v-list-tile-title color="primary">{{ met }}</v-list-tile-title>
    </v-list-tile>
  </v-list>
</v-menu>
  <v-flex shrink style="width: 50px" ml-3>
  <v-text-field
    v-show="wneigh.includes(dimredmetL)"
    v-model="nneighborsL"
    type="number"
    :label="'neighbors'"
    title="neighbors"
    class="setstuff"
    :disabled="loaded && !dirty"
  ></v-text-field>
  </v-flex>
<v-spacer></v-spacer>
  <v-radio-group v-model="dimensions" :label="'dimensions of layout'"
    class="setstuff"
    :disabled="loaded && !dirty"
  >
    <v-radio :label="'2'" :value="2"></v-radio>
    <v-radio :label="'3'" :value="3"></v-radio>
  </v-radio-group>
</v-layout>
</v-card>
</v-layout>
<v-layout row ml-4>
<v-btn
  slot="activator"
  color="green lighten-2"
  dark
  @click="renderNetwork()"
  v-show="(!loaded || dirty) && network"
>
  render network
</v-btn>
</v-layout>
<div>
<v-layout row>
<v-flex>
<v-system-bar id="toolbar" window dark v-show="loaded">
  <v-spacer></v-spacer>
  <v-icon class="tbtn" id='rzbtn' @contextmenu="mhandler($event)" @click="mhandler" title="increase/decrease node size with left/right click">control_camera</v-icon>
  <v-icon class="tbtn" id="ppbtn" @contextmenu="mhandler($event)" @click="mhandler($event)" title="emphasize node size proportionality to degree">insert_chart</v-icon>
  <v-icon class="tbtn" id="rbtn" @contextmenu="mhandler($event)" @click="mhandler($event)" title="reset node size proportionality">undo</v-icon>
  <v-icon class="tbtn" id='trbtn' @contextmenu="mhandler($event)" @click="mhandler($event)" title="increase/decrease node transparency with left/right click">hdr_strong</v-icon>
  <v-icon class="tbtn" id="lvzbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="increase/decrease link transparency with left/right click">power_input</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn ptbtn" id="cbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="show/hide centroid">explore</v-icon>
  <v-icon class="tbtn ptbtn" id="sbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" :title="dimensions === 3 ? 'show/hide sphere center' : 'show circle center'">radio_button_checked</v-icon>
  <v-icon class="tbtn ptbtn" id="ssbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" :title="dimensions === 3 ? 'show/hide sphere surface' : 'show circle perimeter'">panorama_fish_eye</v-icon>
  <v-icon class="tbtn" id="hobtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="recover initial position">home</v-icon>
  <v-spacer></v-spacer>
  <v-icon class="tbtn" id="imbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="save image">camera_alt</v-icon>
  <v-icon class="tbtn" id="exbtn" @click="mhandler($event)" @contextmenu="mhandler($event)" title="download current communities">cloud_download</v-icon>
  <v-spacer></v-spacer>
</v-system-bar>
<canvas id="renderCanvas" touch-action="none"></canvas>
<v-layout row ml-4>
<textarea id="statsbox" v-show="loaded"></textarea>
<textarea id="statsbox2" v-show="loaded"></textarea>
</v-layout>
</v-flex>
</v-flex>
<v-flex>
<table id='ltable' v-show="loaded">
  <tr>
    <th class="lthead">Community</th>
    <th class="lthead">Show</th>
    <th class="lthead">Hue</th>
    <th class="lthead">Size</th>
    <th class="lthead">Silhouette</th>
  </tr>
  <tr v-for="(clu, index) in nclu" :id="'trc' + index">
    <td class="cltd" style="text-align:center">{{ index + 1}}</td>
    <td v-bind:class="showClass(index)" v-bind:id="'std' + index" @click="cgNClu(index)"></td>
    <td v-bind:id="'htd' + index" @click="cgColor(index)"></td>
    <td v-bind:id="'ntd' + index"></td>
    <td v-bind:id="'ftd' + index"></td>
  </tr>
  <span :banana="tloaded = true"></span>
</table>
</v-flex>
</v-layout>
</div>
<v-dialog v-model="cdialog" style="text-align:center" dark max-width="225px">
  <v-card>
  <div style="display:inline-block">
      <no-ssr>
      <Chrome v-model="colortonode" style="display:inline-block"/>
      </no-ssr>
  </div>
  </v-card>
</v-dialog>
<v-footer class="pa-3">
  <v-spacer></v-spacer>
  <div>&copy;{{ new Date().getFullYear() }} - <a href="https://iuma.unizar.es/" target="_blank">IUMA/UNIZAR</a>, <a href="http://vicg.icmc.usp.br" target="_blank">VICG-ICMC/USP</a>, FAPESP 2017/05838-3</div>
</v-footer>
</span>
</template>

<script>
import * as BABYLON from 'babylonjs'
import $ from 'jquery'
import * as d3 from 'd3'
import { Chrome } from 'vue-color'

const ColourValues = [
  "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "808080",
  "C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0",
  "400000", "004000", "000040", "404000", "400040", "004040", "404040",
  "200000", "002000", "000020", "202000", "200020", "002020", "202020",
  "600000", "006000", "000060", "606000", "600060", "006060", "606060",
  "A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0",
  "E00000", "00E000", "0000FF", "E000E0", "00E0E0"
]

var stockData = [
    {
        Symbol: "AAPL",
        Company: "Apple Inc.",
        Price: "132.54"
    },
    {
        Symbol: "INTC",
        Company: "Intel Corporation",
        Price: "33.45"
    },
    {
        Symbol: "GOOG",
        Company: "Google Inc",
        Price: "554.52"
    },
];

function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data == null || !data.length) {
        return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function(item) {
        ctr = 0;
        keys.forEach(function(key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

function downloadCSV(args) {
    var data, filename, link;

    var csv = convertArrayOfObjectsToCSV({
        // data: stockData
        data: args.data
    });
    if (csv == null) return;

    filename = args.filename || 'communities.csv';

    if (!csv.match(/^data:text\/csv/i)) {
        // csv = 'data:text;charset=utf-8,' + csv;
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.id = 'bananaid'
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link)
}

const drnames = {
  'PCA': 'PCA',
  'UMAP': 'UMAP',
  't-SNE': 'TSNE',
  'LocallyLinearEmbedding': 'LLE',
  'ISOMAP': 'ISOMAP',
  'MDS': 'MDS'
}

const cmnames = {
  'k-means': 'KM',
  'Hierarchical (Ward)': 'AG',
  'Spectral': 'SP',
  'Affinity Propagation': 'AF'
}

export default {
  head () {
    return {
      script: [
        { src: '/libs/math5.10.3.js' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css' }
      ],
    }
  },
  data () {
    return {
      networks: ['dolphins', 'zackar'],
      networks_: [],
      network: '',
      draw_net: false,
      temp: 1,
      mangle: 10,
      dimensions: 3,
      inits: 3,
      iters: 100,
      nsize:1,
      diameter: 0.03,
      dimredtype: 'MDS',
      lrate: 12,
      perplexity: 5,
      minIters: 1,
      scentroid: false,
      ssphere: false,
      sspheres: false,
      nclu: 6,
      ncluin: 2,
      nc: [2, 6],
      lopacity: 0.4,
      loaded: false,
      nclusters: 1,
      curclust: 0,
      cdialog: false,
      colortonode: '',
      dirty: true,
      cdmethod: 'an',
      cddim: 'nd',
      cdim: 3,
      dimredmets: [
        'PCA',
        // 'UMAP',
        't-SNE',
        'LocallyLinearEmbedding',
        'ISOMAP',
        'MDS'
      ],
      wneigh: [
        'ISOMAP',
        'LocallyLinearEmbedding',
        'UMAP',
      ],
      dimredmet: 'PCA',
      dimredmetL: 'PCA',
      clustmets: [
        'k-means',
        'Hierarchical (Ward)',
        'Spectral',
        // 'Affinity Propagation',
      ],
      clustmet: 'k-means',
      nneighbors: 5,
      nneighborsL: 5,
    }
  },
  watch: {
    cdialog (val) {
      if (!val) {
        if (!this.colortonode.hex)
          return
        let c = this.colortonode.hex.slice(1)
        if (!c)
          return
        let r = parseInt(c.slice(0, 2), 16) / 255
        let g = parseInt(c.slice(2, 4), 16) / 255
        let b = parseInt(c.slice(4), 16) / 255
        this.materials[this.cindex].diffuseColor.r = r
        this.materials[this.cindex].diffuseColor.g = g
        this.materials[this.cindex].diffuseColor.b = b
        let tid = 'htd' + this.cindex
        document.getElementById(tid).style.backgroundColor = this.colortonode.hex
        this.colors[this.cindex] = [r, g, b]
      }
    },
    dimredtype: function (val) {
      if (val === 't-SNE') {
        this.minIters = 250
      } else {
        this.minIters = 1
      }
    },
    scentroid: function (val) {
      if (!this.network_data)
        return
      if (val)
        this.csphere.isVisible = true
      else
        this.csphere.isVisible = false
    },
    ssphere: function (val) {
      if (!this.network_data)
        return
      if (val)
        this.sspherec.isVisible = true
      else
        this.sspherec.isVisible = false
    },
    sspheres: function (val) {
      if (!this.network_data)
        return
      if (val)
        this.ssurface.isVisible = true
      else
        this.ssurface.isVisible = false
    },
  },
  methods: {
    cgNclus () {
      this.ncluin = this.nc[0]
      this.nclu = this.nc[1]
    },
    showClass (i) {
      let c = i === this.nclusters - 1 ? 'highd': ''
      if (i <= this.ncluin - 2)
        c = 'blockd'
      return c
    },
    mhandler (e) {
      e.preventDefault()
      if (e.srcElement.id === 'rzbtn') {
        if (e.button === 0)
          this.updateSize(0.1)
        else
          this.updateSize(-0.1)
      } else if (e.srcElement.id === 'cbtn') {
        this.scentroid = !this.scentroid
      } else if (e.srcElement.id === 'sbtn') {
        this.ssphere = !this.ssphere
      } else if (e.srcElement.id === 'ssbtn') {
        this.sspheres = !this.sspheres
      } else if (e.srcElement.id === 'ppbtn') {
        this.ppNodes()
      } else if (e.srcElement.id === 'rbtn') {
        this.rNodes()
      } else if (e.srcElement.id === 'trbtn') {
        if (e.button === 0)
          this.transNodes(-0.1)
        else
          this.transNodes(0.1)
      } else if (e.srcElement.id === 'lvzbtn') {
        if (e.button === 0)
          this.transLinks(-0.1)
        else
          this.transLinks(0.1)
      } else if (e.srcElement.id === 'hobtn') {
        this.getHome()
      } else if (e.srcElement.id === 'imbtn') {
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.camera,{precision:1})
      } else if (e.srcElement.id === 'exbtn') {
        // export tab or excel
        let clust = this.network_data.clusts[this.nclusters - this.ncluin]
        let data = []
        let ncom = Math.max(...clust) + 1
        for (let com = 0; com < ncom; com++) {
          let c = clust.reduce((a, e, i) => {
            if (e === com)
              a += ' ' + i
            return a;
          }, '')
          data.push({
            Community: com + 1,
            Nodes: c
          })
        }
        this.adata = data
        this.bdata = stockData
        downloadCSV({data: data})
      }
    },
    rNodes () {
      this.spheres.forEach( s => {
        s.scaling.x = 1
        s.scaling.y = 1
        s.scaling.z = 1
      })
    },
    transLinks (inc) {
      let t = this.lines[0].alpha
      if ( Math.abs(t) < 0.01 && inc < 0)
        return
      if (Math.abs(t - 1) < 0.01 && inc > 0)
        return
      this.lines.forEach( l => {
        l.alpha += inc
      })
    },
    transNodes (inc) {
      let t = this.materials[0].alpha
      if ( Math.abs(t) < 0.01 && inc < 0)
        return
      if (Math.abs(t - 1) < 0.01 && inc > 0)
        return
      this.materials.forEach( m => {
        m.alpha += inc
      })
    },
    ppNodes () {
      this.spheres.forEach( s => {
        s.scaling.x *= 0.2 + 1.3 * (s.degree + 3) / (this.maxdegree + 3)
        s.scaling.y *= 0.2 + 1.3 * (s.degree + 3) / (this.maxdegree + 3)
        s.scaling.z *= 0.2 + 1.3 * (s.degree + 3) / (this.maxdegree + 3)
      })
    },
    cgLineTrans () {
       this.lines.forEach( l => l.alpha = this.lopacity )
    },
    findNetworks () {
      this.$store.dispatch('networks/find').then(() => {
        let networks_ = this.$store.getters['networks/list']
        this.networks_ = networks_.filter(i => {
          return (i.layer === 0) && (i.filename.split('.').pop() === 'txt')
        })
        this.network = this.networks_[0]
      })
    },
    findNetworks_ () {
      $.post(
        process.env.flaskURL + '/communicabilityNets/',
        {}
      ).done( nets => {
        // nets[0].{filename, _id, nnodes, nlinks}
        this.networks_ = nets
        this.network = this.networks_[0]
      })
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
          this.findNetworks_()
        })
      })
    },
    cgNClu (index) {
      if (index <= this.ncluin - 2)
        return
      this.nclusters = index + 1; 
      for (let i = 0; i < this.network_data.nodes.length; i++) {
        let s = this.spheres[i]
        s.material = this.materials[
          this.network_data.clusts[this.nclusters - this.ncluin][i]
        ]
      }
      let c = this.network_data.clusts[this.nclusters - this.ncluin]
      for (let i = 0; i < this.nclu; i++) {
        let content
        if (i > index) {
          content = '---'
        } else {
          let count = c.reduce( (total, ii) => {
            total += ii === i ? 1 : 0
            return total
          }, 0)
          content = count
        }
        let el = document.getElementById('ntd' + i)
        el.textContent = content
      }
    },
    renderNetwork () {
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/communicability2/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            netid: this.network._id,
            temp: this.temp,
            mangle: this.mangle,

            dimredmet: drnames[this.dimredmet],
            cdim: this.cdim,
            nclu: this.nclu,
            ncluin: this.ncluin,
            nneighbors: this.nneighbors,
            clustmet: cmnames[this.clustmet],

            dim: this.dimensions,
            dimredmetL: drnames[this.dimredmetL],
            nneighborsL: this.nneighborsL,
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( network => { 
        if (this.draw_net) {
          console.log('destroy stuff here')
        }
        this.draw_net = true
        this.network_data = network
        let ev = network.ev
        this.nclusters = this.ncluin + ev.indexOf(Math.max(...ev))
        this.plotData()
      })
    },
    plotData () {
      if (!this.babylon_initialized) {
        this.initBabylon()
        this.mkMaterials()
      }
      let spheres = []
      let lines = []
      let nodes = this.network_data.nodes
      let links = this.network_data.links
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        if (node.length == 2)
          node.push(0)
        let sphere = BABYLON.MeshBuilder.CreateSphere('sphere' + i, {diameter: 0.03 + this.diameter, updatable: 1}, this.scene)
        sphere.position = new BABYLON.Vector3(node[0], node[1], node[2])
        sphere.material = this.materials[this.network_data.clusts[this.nclusters - this.ncluin][i]]
        sphere.degree = 0
        sphere.mid = i
        spheres.push(sphere)
      }
      for (let i = 0; i < links.length; i++) {
        spheres[links[i][0]].degree++
        spheres[links[i][1]].degree++
        let pos1 = nodes[links[i][0]]
        let pos2 = nodes[links[i][1]]
        let pos1_ = new BABYLON.Vector3(pos1[0], pos1[1], pos1[2])
        let pos2_ = new BABYLON.Vector3(pos2[0], pos2[1], pos2[2])
        var line = BABYLON.MeshBuilder.CreateLines('line' + i, {points: [pos1_, pos2_], updatable: 1}, this.scene)
        line.color = BABYLON.Color3.Black()
        line.alpha = this.lopacity
        lines.push(line)
      }
      this.spheres = spheres
      this.lines = lines
      this.mkCentroid()
      this.mkBestSphere()
      this.loaded = true
      this.cgNClu(this.nclusters - 1)
      this.maxdegree = Math.max(...spheres.map(s => s.degree))
    },
    mkCentroid () {
      let c = this.network_data.nodes.reduce( (c, i) => c = [c[0]+i[0], c[1]+i[1], c[2]+i[2]], [0,0,0])
      let dists = this.network_data.nodes.map( n => ( (n[0] - c[0])**2 + (n[1] - c[1])**2 + (n[2] - c[2])**2 )**0.5 )
      let mean = math.mean(dists)
      let std = math.std(dists)
      this.centroid = [
        c, dists,
        mean, std
      ]
      let sphere = BABYLON.MeshBuilder.CreateSphere('centroid', {diameter: 0.03 + this.diameter, updatable: 1}, this.scene)
      sphere.position = new BABYLON.Vector3(...c)
      sphere.isVisible = false
      let material = new BABYLON.StandardMaterial("mMaterial", this.scene)
      material.diffuseColor = new BABYLON.Color3(1, 0, 0)
      sphere.material = material
      this.csphere = sphere
    },
    mkBestSphere () {
      let sphere = BABYLON.MeshBuilder.CreateSphere('bspherec', {diameter: 0.03 + this.diameter, updatable: 1}, this.scene)
      sphere.position = new BABYLON.Vector3(...this.network_data.sdata.c)
      sphere.isVisible = false
      let material = new BABYLON.StandardMaterial("mMaterial2", this.scene)
      material.diffuseColor = new BABYLON.Color3(0, 1, 0)
      sphere.material = material
      this.sspherec = sphere
      this.mkBestSphereSurface()
    },
    mkBestSphereSurface () {
      let sphere
      if (this.dimensions === 3)
        sphere = BABYLON.MeshBuilder.CreateSphere('bsurface', {diameter: this.network_data.sdata.r*2, updatable: 1}, this.scene)
      else {
        sphere = BABYLON.MeshBuilder.CreateTorus('bsurface', {diameter: this.network_data.sdata.r*2, updatable: 1, thickness: 0.05}, this.scene)
        let axis = new BABYLON.Vector3(1, 1, 1);
        let angle = 1.35 * Math.PI / 2;
        let quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
        sphere.rotationQuaternion = quaternion;
      }
      sphere.position = new BABYLON.Vector3(...this.network_data.sdata.c)
      sphere.isVisible = false
      let material = new BABYLON.StandardMaterial("mMaterial3", this.scene)
      material.diffuseColor = new BABYLON.Color3(0, 0, 1)
      material.alpha = 0.3
      sphere.material = material
      this.ssurface = sphere
      this.placeStats()
    },
    placeStats () {
      let a = document.getElementById('statsbox')
      a.style.width = '40%'
      a.style.height = '100px'
      // a.innerHTML = JSON.stringify(this.network_data.sdata)
      let s = this.network_data.sdata
      if (this.dimentions === 3) {
        a.innerHTML = '~~ best sphere stats ~~'
      } else {
        a.innerHTML = '~~ best circle stats ~~'
      }
      a.innerHTML += '\ncenter: ' + s.c.reduce( (st, i) => st += i.toFixed(3) + ', ', '' )
      a.innerHTML += '\nradius: ' + s.r.toFixed(3)
      a.innerHTML += '\ndistance mean: ' + s.mean.toFixed(3)
      a.innerHTML += '\ndistance std: ' + s.std.toFixed(3)

      a = document.getElementById('statsbox2')
      a.style.width = '40%'
      a.style.height = '100px'
      a.innerHTML += '~~ centroid stats ~~'
      let c = this.centroid
      a.innerHTML += '\nposition: ' + c[0].reduce( (st, i) => st += i.toFixed(3) + ', ', '' )
      a.innerHTML += '\ndistance mean: ' + c[2].toFixed(3)
      a.innerHTML += '\ndistance std: ' + c[3].toFixed(3)
      let d = (
          (c[0][0] - s.c[0])**2
        + (c[0][1] - s.c[1])**2
        + (c[0][1] - s.c[1])**2
      ) ** 0.5
      a.innerHTML += '\ndistance to best sphere centre: ' + d.toFixed(3)
    },
    cgColor (index) {
      this.cindex = index
      this.cdialog = true
      let r = (this.colors[index][0]*255).toString(16)
      r = (r.length == 1 ? '0' : '') + r
      let g = (this.colors[index][1]*255).toString(16)
      g = (g.length == 1 ? '0' : '') + g
      let b = (this.colors[index][2]*255).toString(16)
      b = (b.length == 1 ? '0' : '') + b
      let h = '#' + r + g + b
      console.log(h, 'tcolor')
      this.colortonode = h
    },
    initBabylon () {
      this.canvas = document.getElementById('renderCanvas') // Get the canvas element
      this.engine = new BABYLON.Engine(this.canvas, true) // Generate the BABYLON 3D engine

      this.scene = new BABYLON.Scene(this.engine)
      this.scene.clearColor = BABYLON.Color3.White();
      var camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this.scene)
      camera.attachControl(this.canvas, false)
      camera.wheelPrecision = 100
      this.ipos = [camera.beta, camera.alpha, camera.radius]
      this.camera = camera
      new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene)
      let selff = this
      this.engine.runRenderLoop(function () {
        selff.scene.render()
      })
      window.addEventListener('resize', function () {
        selff.engine.resize()
      })
    },
    getHome () {
      let position0 = new BABYLON.Vector3(0,0,0)
      this.camera.setTarget(position0)
      this.camera.beta = this.ipos[0]
      this.camera.alpha = this.ipos[1]
      this.camera.radius = this.ipos[2]
    },
    mkMaterials () {
      let materials = []
      for (let i = 0; i < this.nclu; i++) {
        let material = new BABYLON.StandardMaterial("cMaterial"+i, this.scene)
        material.diffuseColor = new BABYLON.Color3(...this.colors[i])
        // ok
        materials.push(material)
        let cel = document.getElementById('htd' + i)
        cel.style.backgroundColor = '#' + ColourValues[i]
        let cel2 = document.getElementById('ftd' + i)
        if (i >= (this.ncluin - 1)) {
          if (this.ncluin === 1 && i === 0)
            cel2.textContent = '---'
          else
            cel2.textContent = this.network_data.ev[i - this.ncluin + 1].toFixed(3)
        } else {
          cel2.textContent = '---'
        }
      }
      this.materials = materials
    },
    parseColor(c) {
      let r = parseInt(c.slice(0, 2), 16) / 255
      let g = parseInt(c.slice(2, 4), 16) / 255
      let b = parseInt(c.slice(4), 16) / 255
      return [r, g, b]
    },
    updateSize (val) {
      this.spheres.forEach(e => {
        e.scaling.x *= 1 + val
        e.scaling.y *= 1 + val
        e.scaling.z *= 1 + val
      })
    }
  },
  components: {
    Chrome,
  },
  mounted () {
    window.__this = this
    window.__self = this
    this.colors = ColourValues.map(c => this.parseColor(c))
    this.prev_size = 1
    // d3.select('canvas')
    //   .on('mouseenter', function () {
    //     d3.select('body').style('overflow', 'hidden')
    //   })
    //   .on('mouseout', function () {
    //     d3.select('body').style('overflow', 'scroll')
    //   })
    this.findNetworks_()
  }
}
</script>
<style>
#renderCanvas {
  /* width: 100%; */
  /* height: 100%; */
  width:  800px;
  height: 401px;
  touch-action: none;
  border: 1px solid;
}
html, body {
  overflow: scroll;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
.v-messages {
  min-height: 0px;
}
#toolbar {
  width: 800px;
}
.cltd {
  text-align: center;
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
.highd {
  background-color: orange;
}
.highd2 {
  background-color: red;
}
.blockd {
  background-color: black;
}
#statsbox2 {
  margin-left: 20px;
  border: 1px solid;
}
#statsbox {
  border: 1px solid;
}
.scroll-y {
  max-height: 300px;
  overflow: auto;
}
h1 {
  margin-bottom: 10px;
}
.hopt {
  margin-left: 30px;
}
.boxradio {
  border: 1px solid;
}
</style>
