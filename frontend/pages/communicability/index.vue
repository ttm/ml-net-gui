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
<div style="width: 100%; overflow: hidden;">
    <div style="width: 70%; float: left;">
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
</div>
  <div style="text-align:center; margin-left: 10px;">
  <div>
    <h3 style="text-aligin:center;">execution time</h3>
      <v-checkbox
      v-model="checkbox"
      :label="'detect browser'"
      title="detect browser (and computer) to start gathering running time for your case. Will only show statistics for your browser/machine."
      style="text-align:center; margin-left: 72%;"
    ></v-checkbox>
  </div>
  <div id="timebox2" style="text-align: center; overflow-y: auto; border:1px solid; width: 25%; height: 500px; margin-left: 72%;">
  </div>
    <p
      v-for="index in 100"
      :key="index"
      @click="clickPar(index - 1)"
      class="timepar"
      v-show="showpar[index - 1]"
      v-bind:id="'idt' + (index - 1)"
    >
    </p>
  </div>
  </div>
</div>
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

function resolve(path, obj=self, separator='.') {
    var properties = Array.isArray(path) ? path : path.split(separator)
    return properties.reduce((prev, curr) => prev && prev[curr], obj)
}

export default {
  head () {
    return {
      script: [
        { src: '/libs/math5.10.3.js' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/fingerprintjs2/2.1.0/fingerprint2.min.js' },
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
      showpar: new Array(100).fill(true),
      checkbox: false,
    }
  },
  computed: {
    allset () {
      return this.mkTimeString()
    },
  },
  watch: {
    checkbox (val) {
      if (val) {
        this.mkFP()
      } else {
        if (this.cc__)
          delete this.cc__
      }
    },
    allset (val) {
      let a = document.getElementById('timebox') // TTM timebox2 adaptation
      a.innerHTML = val
    },
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
    mkFP () {
      Fingerprint2.get(function (components) {
        __this.fingerprint = components
        __this.fp = __this.fingerprint.filter(
          i => ['canvas', 'fonts', 'userAgent'].includes(i.key)
        )
        __this.fp_ = __this.fp.reduce( (total, item) => {
          total[item.key] = item.value
          return total
        }, {})
        let c = __this.fp_.canvas
        let cc = c[0] + c[1] + __this.fp_.fonts + __this.fp_.userAgent
        __this.c__ = c
        __this.cc__ = cc
        let a = __this.cc__.slice(0, 50)
        let b = __this.cc__.slice(__this.cc__.length - 50)
        alert('fingerprint detected. Filtering for user/browser/machine statistics is under development' + a + ' ... ' + b)
      })
    },
    getParams (mreturn) {
      let temp = []
      let mangle = []
      let dimredmet = []
      let cdim = []
      let clustmet = []
      let nc = []
      let dimredmetL = []
      let dimensions = []
      let filename = []
      for (let i = 0; i < mreturn.length; i++) {
        let item = mreturn[i]
        temp.push(item.temp)
        mangle.push(item.mangle)
        dimredmet.push(item.dimredmet)
        cdim.push(item.cdim)
        clustmet.push(item.clustmet)
        nc.push(item.nc[0] + '-' + item.nc[1])
        dimredmetL.push(item.dimredmetL)
        dimensions.push(item.dimensions)
        filename.push(item.filename)
      }
      let mstr = ''
      mstr += '\ntemp: ' + temp.join(', ')
      mstr += '\nangle x10e-6: ' + mangle.join(', ')
      mstr += '\ndimred method: ' + dimredmet.join(', ')
      mstr += '\ndim: ' + cdim.join(', ')
      mstr += '\nclust method: ' + clustmet.join(', ')
      mstr += '\nncom: ' + nc.join(', ')
      mstr += '\ndimred method: ' + dimredmetL.join(', ')
      mstr += '\ndim: ' + dimensions.join(', ')
      mstr += '\nfilenames: ' + filename.join(', ')
      return mstr
    },
    clickPar (index) {
      console.log(index)
    },
    meanStd (prop, setn, inc = true) {
      let mdata
      if (setn === 0) {
        mdata = this.usages2.data
      } else if (setn === 1) {
        mdata = this.usages.data
      } else if (setn === 2) {
        mdata = this.usages3_
      } else {
        throw 'set of runs not recognized'
      }
      let ds = mdata.map( d => resolve(prop, d) )
      let ds_ = ds.filter( d => d !== undefined )
      let mds = '-'
      let sds = '-'
      if (ds_.length) {
        mds = math.mean(ds_).toFixed(2)
        sds = math.std(ds_).toFixed(2)
      }
      let msds = mds + ' / ' + sds
      let nincomplete = ds.length - ds_.length
      if (inc) {
        return [msds, nincomplete]
      } else {
        return msds + ', (-' + nincomplete + ')'
      }
    },
    mkTimeString () {
      if (!this.network)
        return
      let mstr = "~ settings ~"
      mstr += '\nnetwork: ' + this.network.filename + ' (' + this.network.nnodes + ', ' + this.network.nlinks + ')'
      mstr += '\ntemp: ' + this.temp + '\nangle x10e-6: ' + this.mangle
      mstr += '\ndimred method / dim: ' + this.dimredmet + ' / ' + this.cdim
      mstr += '\nclust method / ncom: ' + this.clustmet + ' / ' + this.nc[0] + '-' + this.nc[1]
      mstr += '\ndimred method / dim: ' + this.dimredmetL + ' / ' + this.dimensions

      let query = {
        nnodes: {
          $gt: this.network.nnodes / 1.2,
          $lt: this.network.nnodes * 1.2
        },
      }
      if (this.mset) {
        query._id = {
          $ne: this.mset._id
        }
      }
      query.file = {
        $ne: this.network._id,
      }
      this.$store.dispatch('usage/find', { query: query }).then( (res) => {
        this.usages = res
        let [msdursB, nincomplete] = this.meanStd('totaldur', 1)
        this.nincomplete = nincomplete

        let query2 = {
          file: this.network._id,
        }
        this.$store.dispatch('usage/find', { query: query2 }).then( (res2) => {
          console.log(res2)
          this.usages2 = res2
          let [msdurs2B, nincomplete2] = this.meanStd('totaldur', 0)
          this.infostrs = [
            'the settings in the interface',
            this.getParams(this.usages2.data),
          ]
          this.nincomplete2 = nincomplete2

          mstr += "\n\n~~ same network ~~"
          if (this.usages2.data.length === 0 ) {
            mstr += '\nruns: *NOT FOUND*'
            mstr += '\n::: total mean / std: ' + msdurs2B
          } else {
            mstr += '\nruns: ' + this.usages2.data.length
            mstr += '\nincompletes ~ net size: ' + this.nincomplete2
            if (this.nincomplete2) {
              mstr += ' (*FOUND*)'
            }
            mstr += '\n::: total mean / std: ' + msdurs2B
            mstr += '\n: plot: ' + this.meanStd('plotduration', 0, false)
            mstr += '\n: communication: ' + this.meanStd('cliserduration', 0, false)
            mstr += '\n: server: '
            let hasserver = this.usages2.data.map( d => d.serverdurations )
            let index
            let hasserver_ = hasserver.filter( (d, i) => {
              if (d !== undefined) {
                index = i
              }
              return d !== undefined 
            })
            if (hasserver_.length) {
              for (let task in this.usages2.data[index].serverdurations) {
                 mstr += '\n' + task + ': ' + this.meanStd('serverdurations.' + task, 0, false)
              //   total += this.network_data.durations[task]
              }
            }
          }

          mstr += "\n\n~~ networks of similar size ~~"
          this.infostrs.push(this.getParams(this.usages.data))
          if (this.usages.data.length === 0 ) {
            mstr += '\nruns: *NOT FOUND*'
            mstr += '\n:::total mean / std: ' + msdursB
          } else {
            mstr += '\nruns: ' + this.usages.data.length
            mstr += '\nincompletes ~ net size: ' + this.nincomplete
            if (this.nincomplete) {
              mstr += ' (*FOUND*)'
            }
            mstr += '\n:::total mean / std: ' + msdursB
            mstr += '\n: plot: ' + this.meanStd('plotduration', 1, false)
            mstr += '\n: communication: ' + this.meanStd('cliserduration', 1, false)
            mstr += '\n: server: '
            for (let task in this.usages.data[0].serverdurations) {
               mstr += '\n' + task + ': ' + this.meanStd('serverdurations.' + task, 1, false)
            //   total += this.network_data.durations[task]
            }
          }

          if (this.usages.data.length + this.usages2.data.length === 0 ) {
            this.$store.dispatch('usage/find').then( () => {
              this.usages3 =  this.$store.getters['usage/list']
              this.infostrs.push(this.getParams(this.usages3))
              this.infostrs.push('found from rendering the network on your screen')
              // this.usages3 = res3
              // filter as possible
              this.snetsizes = this.usages3.map( u => u.nnodes )
              this.snetsizes_ = [...new Set(this.snetsizes)]
              this.snetsizes_.sort( (a, b) => b - a )
              let tstr = 'sizes: '
              let tstr_ = ''
              let somereturn = false
              for (let i = 0; i < this.snetsizes_.length; i++) {
                let nextsize = this.snetsizes_[i]
                this.allnets = this.usages3.filter( u => u.nnodes === nextsize )
                this.allnets_ = this.allnets.filter( u => u.subtotaldur !== undefined )
                if (this.allnets_.length === 0) {
                  // it did not return from server
                  tstr += nextsize + ' no return, '
                } else {
                  tstr += nextsize + ' return, '
                  if (!somereturn) {
                    console.log(somereturn, nextsize)
                    if (nextsize < this.network.nnodes) {
                      somereturn = true
                      console.log('YES')
                      this.usages3_ = this.allnets_ // aqui selecao
                      let [msdurs3, nincomplete3] = this.meanStd('totaldur', 2)
                      this.nincomplete3 = nincomplete3
                      tstr_ += '\n~ largest network after selected net ~'
                      tstr_ += '\nnnodes: ' + nextsize
                      if (this.usages3.length === 0 ) {
                        tstr_ += '\nruns: *NOT FOUND*'
                        tstr_ += '\n::: total mean / std: ' + msdurs3
                      } else {
                        tstr_ += '\nruns: ' + this.usages3.length
                        tstr_ += '\nincompletes ~ net size: ' + this.nincomplete3
                        if (this.nincomplete3) {
                          tstr_ += ' (*FOUND*)'
                        }
                        tstr_ += '\n:::total mean / std: ' + msdurs3
                        tstr_ += '\n: plot: ' + this.meanStd('plotduration', 2, false)
                        tstr_ += '\n: communication: ' + this.meanStd('cliserduration', 2, false)
                        tstr_ += '\n: server: '
                        for (let task in this.usages3[0].serverdurations) {
                           tstr_ += '\n' + task + ': ' + this.meanStd('serverdurations.' + task, 2, false)
                        //   total += this.network_data.durations[task]
                        }
                      }
                    }
                  }
                }
              }
              this.tstr = tstr
              this.tstr_ = tstr_
              mstr += '\n\n' + tstr
              mstr += '\n' + tstr_

              return this.finishTimeString(mstr)
            })
          } else {
            this.infostrs.push('found from rendering the network on your screen')
            return this.finishTimeString(mstr)
          }
        })
      })
    },
    finishTimeString (mstr) {
        if (this.receivedTime) {
          mstr += "\n\n~~ time span found ~~"
          mstr += '\ncommunication: ' + this.cliserduration.toFixed(3)
          mstr += '\n::: server calculations: '
          let total = this.cliserduration
          for (let task in this.network_data.durations) {
            mstr += '\n' + task + ': ' + this.network_data.durations[task].toFixed(3)
            total += this.network_data.durations[task]
          }
          mstr += '\n(subtotal: ' + (total - this.cliserduration).toFixed(3) + ')'
          if (this.plotFinishedTime) {
            mstr += '\n::: plot: ' + this.plotduration.toFixed(3)
            total += this.plotduration
          }
          mstr += '\n::: total: ' + total.toFixed(3)
        }
        // make the find for all runs of the same network:
        // let a = document.getElementById('timebox') // TTM timebox2 adaptation
        // a.innerHTML = mstr
        // a.scrollTop = a.scrollHeight
        let ss = mstr.split('\n')
        this.sss = [ss, mstr]
        // ss.forEach( (s, i) => {
        //   let b = document.getElementById('miid' + (i))
        //   b.innerHTML = s
        // })

        this.upPars()
        return mstr
    },
    placeTimeString() {
      this.mkTimeString()
    },
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
        this.placeTimeString()
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
      delete this.receivedTime
      this.placeTimeString()
      this.saveSettings()
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
        this.network_data = network
        this.saveReturn()
      })
    },
    saveSettings () {
      this.sentTime = performance.now()
      // before sending to the server for calculations
      // timestamp is given by the server
      this.$store.dispatch('usage/create', {
        temp: this.temp,
        mangle: this.mangle,
        dimredmet: this.dimredmet,
        cdim: this.cdim,
        clustmet: this.clustmet,
        nc: this.nc,
        dimredmetL: this.dimredmetL,
        dimensions: this.dimensions,
        file: this.network._id,
        filename: this.network.filename,
        nnodes: this.network.nnodes,
        browser: this.cc__,
      }).then( res => {
        this.mset = res
      })
    },
    saveReturn () {
      // when returning from the server
      this.receivedTime = performance.now()
      let total = Object.values(__this.network_data.durations).reduce(
        (v, i) => v += i,
      0)
      let dur = this.receivedTime - this.sentTime - total * 1000
      this.cliserduration = dur / 1000
      this.total_ = total + this.cliserduration
      this.$store.dispatch('usage/patch', [this.mset._id, {
        serverdurations: this.network_data.durations,
        cliserduration: dur / 1000,
        subtotaldur: this.total_,
      }]).then( (res) => {
        this.mset2 = res
        if (this.draw_net) {
          console.log('destroy stuff here')
        }
        this.draw_net = true
        let ev = this.network_data.ev
        this.nclusters = this.ncluin + ev.indexOf(Math.max(...ev))
        this.plotData()
        this.savePlotFinished()
      })
    },
    savePlotFinished () {
      this.plotFinishedTime = performance.now()
      // as soon as plot is finished
      let dur = this.plotFinishedTime - this.receivedTime
      this.plotduration = dur / 1000
      console.log('plot duration', this.plotduration)
      this.$store.dispatch('usage/patch', [this.mset._id, {
        plotduration: dur / 1000,
        totaldur: this.total_ + this.plotduration,
      }]).then( (res) => {
        console.log('plot duration2', this.plotduration, res)
        this.mset3 = res
      })
      console.log(dur)
      this.placeTimeString()
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
    },
    upPars () {
      let  mdata = this.sss[0]
      this.mdatas = mdata
      d3.selectAll("#timebox2 > *").remove()
      this.pdiv = d3.select('#timebox2')
        .selectAll('p')
        .data(mdata) 
        .enter().append('p')
        .attr('id', (d, i) => 'miid' + i)
        .attr('class', 'ciid')
        .on('click', (d, i) => {
          console.log('before loop')
          // let line0 = i
          let line0 = i
          let item0 = d3.select('#miid' + line0)
          __this.item0 = item0
          if (item0.text()[0] !== '~') {
            do {
              line0--
            } while (d3.select('#miid' + line0).text()[0] !== '~')
          }
          __this.item0_ = d3.select('#miid' + line0)

          // change + to -

          let display
          __this.mthing2 = this
          let sign
          let color
          if (__this.showpar[line0]) {
            // hide util next ~
            display = 'none'
            // change + to -, maybe color
            sign = '-'
            color = '#aaffaa'
            __this.showpar[line0] = false
          } else {
            // show util next ~
            display = 'block'
            // change - to +, maybe color
            sign = '+'
            color = '#ccccff'
            __this.showpar[line0] = true
          }
          let line = line0 + 1
          while (1) {
            console.log('in loop' + line, display, sign, color, __this.showpar[i])
            let tid = '#miid' + line
            let item = d3.select(tid)
            if (item.empty() || item.text()[0] === '~')
              break
            item 
              .style('display', display)
              .style('background', color)
            line++
          }
        })
        .html( (d, i) => {
          __this.mthing = this
          __this.showpar[i] = true
          let tid = '#miid' + i
          let item = d3.select(tid)
          __this.allthis.push(item)
          let ap = ''
          let aclass = 'spanbt'
          if (d[0] === '~') {
            ap = ' <span class="spanbt2">+</span>'
            console.log('atitle')
            if (i !== 0) {
              aclass += ' ltitle'
            }
          }
          return '<span class="' + aclass + '" onclick="console.log(\'HA' + i +  '\')">'+  d + ap + '</span>'
        })
        .style('background', (d, i) => {
          let item = d3.select('#miid' + i)
          if (item.text()[0] === '~') {
            return 'ffaaaa'
          } else {
            return '#ccccff'
          }
        })
        .attr('title', (d, i) => {
          if (i === 0)
            __this.ntitle = 0
          let item = d3.select('#miid' + i)
          let it = item.text()
          if ( it.startsWith('~~') ) {
            __this.ntitle++
          }
          let title = this.infostrs[__this.ntitle]
          return title
        })
        // .style('display', d => {
        //   if (d[0] !== '~') {
        //     return 'none'
        //   } else {
        //     return 'block'
        //   }
        // })
      // this.pdiv
      //   .attr('scrollTop', 
      let a = document.getElementById('timebox2')
      a.scrollTop = a.scrollHeight
    },
    mkPars () {
      this.pdiv = d3.select('#timebox2')
      let mdata
      if (this.sss) {
        mdata = this.sss[1]
      } else {
        mdata = new Array(100).fill(1)
      }
      this.mps = this.pdiv
        .selectAll('p')
        .data(mdata) 
        .enter().append('p')
        .attr('id', (d, i) => 'miid' + i)
        .attr('class', 'ciid')
        .style('display', d => {
          // if (Math.random() < 0.3) {
          //   return 'none'
          // } else {
          //   return 'block'
          // }
          return true
        })
    },
  },
  components: {
    Chrome,
  },
  mounted () {
    this.Fingerprint2 = Fingerprint2
    // this.mkFP()
    window.__this = this
    window.__self = this
    this.allthis = []
    this.md3 = d3
    this.mkPars()
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
.timepar {
  text-align: left;
  margin: 0px 0px 0px 2px;
}
.ciid {
  text-align: left;
  margin: 0px 0px 0px 2px;
}
.spanbt {
  cursor: pointer;
}
.spanbt2 {
  background: #aaffaa;
}
.ltitle {
  display: inline-block;
  margin-top: 15px;
}
</style>
