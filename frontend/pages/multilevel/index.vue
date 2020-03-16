<template v-scroll:#scroll-target="onScroll" class="scroll-y">
<span>
<v-container justify-center>
      <h1>Analysis settings</h1>
<v-layout align-center justify-center row fill-height>
    <v-flex xs4 order-md2 order-xs2 center>
    <v-menu offset-y>
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
    </v-flex>
    <v-flex xs12 sm6 md3 order-md1 order-xs1>
    Load settings:
    <v-menu offset-y>
      <v-btn
        slot="activator"
        color="primary"
        dark
      >
        {{ name ? name : 'Select' }}
      </v-btn>
      <v-list>
        <v-list-tile
          v-for="(set, index) in settings"
          :key="index"
          @click="loadSettings(set)"
        >
          <v-list-tile-title color="primary">{{ set.name }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    </v-flex>
    <v-flex xs12 sm6 md3 order-md1 order-xs1>
      <v-text-field
        label="Settings name"
        v-if="name === 'new'"
        v-model="newname"
      ></v-text-field>
    </v-flex>
</v-layout>
<v-expansion-panel expand v-model="panel">
  <v-expansion-panel-content>
    <div slot="header">settings in general
    <span v-if="analysis_set">nodes: {{network_data.nodes.length}},
    edges: {{network_data.edges.length}},
    messages/transactions: {{network_data.transactions.length}}</span>
    </div>
<div style="border:2px solid black; padding: 4px">
<v-card flat dark>
  <v-layout align-center justify-center row fill-height>
    <v-flex xs2 order-md1 order-xs1 center>
    Layout algorithm:
    <v-menu offset-y>
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
    <v-flex xs3 order-md2 order-xs2>
    Dimensions of layout: {{ dimensions || 'null' }}
    <v-radio-group v-model="dimensions">
      <v-radio :label="'2'" :value="2"></v-radio>
      <v-radio :label="'3'" :value="3"></v-radio>
    </v-radio-group>
    </v-flex>
    <v-flex xs2 order-md3 order-xs3>
    Draw links: {{ links ? 'yes' : 'no' }}
    <v-radio-group v-model="links">
      <v-radio :label="'Yes'" :value="true"></v-radio>
      <v-radio :label="'No'" :value="false"></v-radio>
    </v-radio-group>
    </v-flex>
  </v-layout>
</v-card>
<v-flex mt-1>
<v-card flat dark>
  <v-layout align-center justify-center row fill-height pa-1>
    <v-flex xs4 order-md1 order-xs1 center>
      Coarsening method:
      <v-menu offset-y>
        <v-btn
          slot="activator"
          color="primary"
          dark
        >
          {{ method ? method : 'Select' }}
        </v-btn>
        <v-list>
          <v-list-tile
            v-for="(met, index) in methods"
            :key="index"
            @click="setMethod(met)"
          >
            <v-list-tile-title color="primary">{{ met }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-flex>
  </v-layout>
</v-card>
</v-flex>
<v-flex mt-1 v-if="isbi">
<v-card flat dark>
  <v-layout align-center justify-center>
    <v-flex>
      Coarsening settings
      <table>
      <tr class="row2"
        v-for="index in ntiers" :key="index"
      >
        <th class="tcolumn">
        layer {{ index }}
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'reduction'"
          :left="true"
          v-model="bi.reduction[index - 1]"
          type="number"
          step="0.1"
          max="1"
        ></v-text-field>
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'max levels'"
          :left="true"
          v-model="bi.max_levels[index - 1]"
          type="number"
          step="1"
          min="1"
        ></v-text-field>
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'min vertices'"
          :left="true"
          v-model="bi.global_min_vertices[index - 1]"
          type="number"
          step="1"
          min="1"
        ></v-text-field>
        </th>
        <th class="tcolumn">
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
        </th>
        <th class="tcolumn">
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
              <span>similarity criterion</span>
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
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'similarity'"
          :left="true"
          v-model="bi.similarity[index - 1]"
        ></v-text-field>
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'upper bound'"
          :left="true"
          v-model="bi.upper_bound[index - 1]"
          type="number"
          step="0.1"
          min="0"
        ></v-text-field>
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'iterations'"
          :left="true"
          v-model="bi.itr[index - 1]"
          type="number"
          step="1"
          min="1"
        ></v-text-field>
        </th>
        <th class="tcolumn">
        <v-text-field
          :label="'tolerance'"
          :left="true"
          v-model="bi.tolerance[index - 1]"
          type="number"
          step="0.0001"
          min="0"
        ></v-text-field>
        </th>
      </tr>
      </table>
    </v-flex>
  </v-layout>
</v-card>
</v-flex>
</div>
  </v-expansion-panel-content>
</v-expansion-panel>
<v-expansion-panel>
  <v-expansion-panel-content>
    <div slot="header">control
    <span v-if="analysis_set">nodes: {{network_data.nodes.length}},
    edges: {{network_data.edges.length}},
    messages/transactions: {{network_data.transactions.length}}</span>
    </div>
<div style="border:2px solid black; padding: 4px">
<v-card flat dark>
  <v-layout align-center justify-center row pa-1>
    <v-flex xs4 order-md2 order-xs2 center>
      <v-text-field
        :label="'Separation'"
        :left="true"
        v-model="separation"
        type="number"
        step="0.1"
        style="width:80px"
      ></v-text-field>
    </v-flex>
  </v-layout>
</v-card>
</div>
  </v-expansion-panel-content>
</v-expansion-panel>
</v-container>
  <div class="text-xs-left">
      <v-layout row ml-4>
        <v-btn
          slot="activator"
          color="green lighten-2"
          dark
          @click="renderNetwork()"
        >
          Render network
        </v-btn>
        <v-btn
          slot="activator"
          color="green lighten-2"
          dark
          @click="saveAnalysis()"
        >
          Save
        </v-btn>
        <v-btn
          slot="activator"
          color="green lighten-2"
          dark
          @click="toggleShow()"
        >
          {{ show }}
        </v-btn>
        <v-flex class="pr-3">
          <v-slider
            v-model="separation"
            :max="4"
            :min="0"
            :label="'separation'"
            :step="0.01"
            ma-0
            pa-0
            @change="sepLayers"
          ></v-slider>
        </v-flex>
        <v-flex shrink style="width: 60px">
          <v-text-field
            v-model="separation"
            class="mt-0"
            hide-details
            single-line
            type="number"
          ></v-text-field>
        </v-flex>
        <v-divider
          class="mx-3"
          inset
          vertical
        ></v-divider>
        <v-flex>
          <v-text-field
            :label="levelslabel"
            :left="true"
            v-model="layers"
            type="number"
            style="width:80px"
            min="1"
            class="mt-0"
            background-color="#aaffff"
            onChange="altLayers(this)"
            :disabled="!draw_net"
          ></v-text-field>
        </v-flex>
      </v-layout>
      <canvas id="renderCanvas" touch-action="none" v-if="draw_net"></canvas>
<div style="border:1px solid black; padding: 4px">
  <v-subheader>Histograms</v-subheader>
  <v-layout>
      <v-layout row wrap class="light--text">
        <v-flex xs6>
          Degree
        </v-flex>
        <v-flex xs6>
          Clustering coefficient
        </v-flex>
      </v-layout>
  </v-layout>
  <v-container grid-list-md text-xs-center>
    <v-layout row wrap>
      <v-flex :key="61" xs6>
        <div id="degreehist"></div>
      </v-flex>
      <v-flex :key="62" xs6>
        <div id="clusthist"></div>
      </v-flex>
    </v-layout>
  </v-container>
</div>
  </div>
    <v-snackbar
      v-model="snackbar"
      :multi-line="true"
      :timeout="6000"
      :top="true"
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
import * as BABYLON from 'babylonjs'
import $ from 'jquery'
import * as d3 from 'd3'

const methods = {
  'kclicks': 'kclick',
  'label propagation': 'lab',
  'connected components': 'cp'
}
export default {
  data () {
    return {
      levelslabel: 'Level',
      show: 'show last',
      panel: [true],
      diameter: 0.06,
      snackbar: false,
      snacktext: 'msnacktext',
      dialog: false,
      draw_net: false,
      draw_hist: false,
      separation: 0.3,
      hist: {
        degree: 0,
        clust: 0
      },
      analysis_set: 0,
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
      dimensions: 3,
      links: true,
      layers: 1,
      methods: [
        'kclicks',
        'label propagation',
        'connected components', 'bipartite'],
      method: 'label propagation',
      // method: 'bi:rgmb',
      isbi: false,
        ntiers: 2,
      bi: {
        reduction: [],
        max_levels: [],
        global_min_vertices: [],
        matching: [],
        similarity: [],
        upper_bound: [],
        itr: [],
        tolerance: [],
        valid_matching: ['rgmb', 'gmb', 'mlpb', 'hem', 'lem', 'rm'],
        valid_similarity: ['common_neighbors', 'weighted_common_neighbors',
        'salton', 'preferential_attachment', 'jaccard', 'weighted_jaccard',
        'adamic_adar', 'resource_allocation', 'sorensen', 'hub_promoted',
        'hub_depressed', 'leicht_holme_newman']
      },
      networks_: [],
      network: '',
      name: 'new',
      newname: '',
      settings: [],
      hist: {
        degree: false,
        clust: false
      }
    }
  },
  methods: {
    toggleShow () {
      if (this.show === 'show all') {
        this.show = 'show last'
        this.levelslabel = 'Level'
      } else {
        this.show = 'show all'
        this.levelslabel = 'Levels'
      }
    },
    colorBars (mmesh, highlight) {
      if (highlight) {
        var deg = mmesh.mdata.degree
        var clust = mmesh.mdata.clust
      }
      let self = this
      d3.selectAll('.barC').style('fill', function(d, i) {
        if (i === self.nbins - 1) {
          var test = function (x) {
            if (x >= d.x0 && x <= d.x1) {
              return true
            } else {
              return false
            }
          }
        } else {
          var test = function (x) {
            if (x >= d.x0 && x <= d.x1) {
              return true
            } else {
              return false
            }
          }
        }
        if (highlight && (this.layer === mmesh.mdata.layer) && test(clust)) {
          return '#00ffff'
        } else {
          return null
        }
      })
      d3.selectAll('.barD').style('fill', function(d, i) {
        if (i === self.nbins - 1) {
          var test = function (x) {
            if (x >= d.x0 && x <= d.x1) {
              return true
            } else {
              return false
            }
          }
        } else {
          var test = function (x) {
            if (x >= d.x0 && x <= d.x1) {
              return true
            } else {
              return false
            }
          }
        }
        if (highlight && (this.layer === mmesh.mdata.layer) && test(deg)) {
          return '#00ffff'
        } else {
          return null
        }
      })
    },
    colorNodes (mtype, layer, bin, i, highlight) {
      if (highlight) {
        var material = this.chighlight_material
      } else {
        var material = this.standard_material
      }
      if (i === this.nbins - 1) {
        var test = function (x, x0, x1) {
          if (x >= x0 && x <= x1) {
            return true
          } else {
            return false
          }
        }
      } else {
        var test = function (x, x0, x1) {
          if (x >= x0 && x <= x1) {
            return true
          } else {
            return false
          }
        }
      }
      for (let i = 0; i < this.networks[layer].nodes.length; i++) {
        if (test(this.networks[layer][mtype][i], bin.x0, bin.x1)) {
          this.spheres[layer][i].material = material
        }
      }
    },
    updateNodeSizes (up) {
      let quant = 0
      if (up) {
        quant += 0.01
      } else {
        quant -= 0.01
      }
      console.log(quant)
      for (let j = 0; j < this.spheres.length; j++) {
        for (let i = 0; i < this.spheres[j].length; i++) {
          this.spheres[j][i].scaling.x += quant
          this.spheres[j][i].scaling.y += quant
          this.spheres[j][i].scaling.z += quant
        }
      }
    },
    clustHist (layer) {
      let h = d3.histogram().thresholds(this.nbins)
      let bins = h(this.networks[layer].clust)

      let margin = {top: 20, right: 20, bottom: 30, left: 40}
      // let height = this.height || this.$vuetify.breakpoint.height
      let height_ = 200
      let height = height_ - ( margin.top + margin.bottom )
      let width = this.width || this.$vuetify.breakpoint.width
      width /= 2
      // let vb = -width / 2 + ' ' + -height / 2 + ' ' + width + ' ' + height

      let x = d3.scaleLinear().rangeRound([0, width/2])
      let y = d3.scaleLinear().rangeRound([height, 0])
      let yy = d3.scaleLinear().rangeRound([height, 0])

      let self = this
      x.domain([
        Math.min(...self.networks[layer].clust),
        Math.max(...self.networks[layer].clust)
      ])
      y.domain([0, d3.max(bins, function(d) { return d.length })])
      yy.domain([0, d3.max(bins, function(d) {
        return 100 * d.length / self.networks[layer].clust.length
      })])

      let svg = d3.select('#clusthist').append('svg')
        .attr('id', 'clust-' + layer)
        .attr('width', width)
        .attr('height', height_)
      //  .attr('viewBox', vb)

      svg.append("text")
        .attr('class', 'alabel')
        .attr("x", width / 3)
        .attr("y", 0.8 * margin.top)
        .attr("text-anchor", "middle")
        .text("layer " + layer)

      let g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))

      let y_ = this.isfreq ? yy : y
      let text_ = this.isfreq ? 'Percentage' : 'Count'
      let text = g.append("g")
          .attr("class", "axis axis--y")
          .attr("id", "clustlabel-y-" + layer)
          .call(d3.axisLeft(y_).ticks(10))
        .append("text")
          .attr("class", "alabel")
          .attr("transform", "rotate(-90)")
          .attr("y", -36)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text(text_)
      this.clusty.push(y)
      this.clustyy.push(yy)

      g.selectAll(".barC")
        .data(bins)
        .enter().append("rect")
          .attr("class", "barC")
          .attr("x", function(d) { this.layer = layer; return x(d.x0); })
          .attr("y", function(d) { return y(d.length); })
          .attr("width", function(d) { return x(d.x1) - x(d.x0) })
          .attr("height", function(d) { return height - y(d.length); })
          .on('click', function (d, i) {
            if (this.colored) {
              self.colorNodes('clust', layer, d, i, 0)
              d3.select(this).style('fill', null)
              delete this.colored
            } else {
              console.log(d, i)
              self.colorNodes('clust', layer, d, i, 1)
              d3.select(this).style('fill', 'yellow')
              this.colored = 1
            }
          })
      this.bins = bins
      this.xx = x
      this.width_ = width
    },
    degreeHist (layer) {
      let self = this
      let h = d3.histogram().thresholds(self.nbins)
      let bins = h(this.networks[layer].degrees)

      let margin = {top: 20, right: 20, bottom: 30, left: 40}
      // let height = this.height || this.$vuetify.breakpoint.height
      let height_ = 200
      let height = height_ - ( margin.top + margin.bottom )
      let width = this.width || this.$vuetify.breakpoint.width
      width /= 2
      let vb = -width / 2 + ' ' + -height / 2 + ' ' + width + ' ' + height

      let x = d3.scaleLinear().rangeRound([0, width/2])
      let y = d3.scaleLinear().rangeRound([height, 0])
      let yy = d3.scaleLinear().rangeRound([height, 0])

      x.domain([
        Math.min(...self.networks[layer].degrees),
        Math.max(...self.networks[layer].degrees)
      ])
      y.domain([0, d3.max(bins, function(d) { return d.length; })])
      yy.domain([0, d3.max(bins, function(d) {
        return 100 * d.length/self.networks[layer].degrees.length
      })])

      let svg = d3.select('#degreehist').append('svg')
        .attr('id', 'degree-' + layer)
        .attr('width', width)
        .attr('height', height_)
      //  .attr('viewBox', vb)

      svg.append("text")
        .attr('class', 'alabel')
        .attr("x", width / 3)
        .attr("y", 0.8 * margin.top)
        .attr("text-anchor", "middle")
        .text("layer " + layer)

      let g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))

      console.log('isfreq', this.isfreq)
      let y_ = this.isfreq ? yy : y
      let text_ = this.isfreq ? 'Percentage' : 'Count'
      g.append("g")
          .attr("class", "axis axis--y")
          .attr("id", "degreelabel-y-" + layer)
          .call(d3.axisLeft(y_).ticks(10))
        .append("text")
          .attr("class", "alabel")
          .attr("transform", "rotate(-90)")
          .attr("y", -36)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text(text_)
      this.degreey.push(y)
      this.degreeyy.push(yy)

      g.selectAll(".barD")
        .data(bins)
        .enter().append("rect")
          .attr("class", "barD")
          .attr("x", function(d) { this.layer = layer; return x(d.x0); })
          .attr("y", function(d) { return y(d.length); })
          .attr("width", function(d) { return x(d.x1) - x(d.x0) })
          .attr("height", function(d) { return height - y(d.length); })
          .on('click', function (d, i) {
            if (this.colored) {
              self.colorNodes('degrees', layer, d, i, 0)
              d3.select(this).style('fill', null)
              delete this.colored
            } else {
              console.log(d, i)
              self.colorNodes('degrees', layer, d, i, 1)
              d3.select(this).style('fill', 'yellow')
              this.colored = 1
            }
          })
      this.bins = bins
      this.xx = x
      this.width_ = width
    },
    renderNetwork () {
      if (this.draw_net) {
        this.draw_net = false
      } else {
        this.draw_net = true
        let method
        if (methods[this.method])
          method = methods[this.method]
        else
          method = this.method
        console.log(method)
        if (!this.isbi) {
          $.get(
            process.env.flaskURL + `/netlevelDB/${this.network._id}/${this.layout}/${this.dimensions}/0/${method}/`,
            {},
            this.stablishScene
          )
        } else {
          if (this.show === 'show last') {
            $.post(
              // `http://rfabbri.vicg.icmc.usp.br:5000/postTest2/`,
              process.env.flaskURL + '/biMLDBAll/',
              // {see: 'this', and: 'thisother', num: 5}
              {
                netid: this.network._id,
                bi: this.bi,
                layout: this.layout,
                dim: this.dimensions,
                method: this.method
              }
            ).done( networks => { 
              console.log('tnetssss', networks)
              this.networks = networks
              this.curlevel = networks.length - 1
              this.stablishScene(networks[0])
              for (let j = 1; j < networks.length; j++) {
                this.addLayer(networks[j])
              }
              this.separation = 0
              this.sepLayers(this.separation)
            })
          } else {
            $.post(
              // `http://rfabbri.vicg.icmc.usp.br:5000/postTest2/`,
              process.env.flaskURL + '/biMLDB/',
              // {see: 'this', and: 'thisother', num: 5}
              {
                netid: this.network._id,
                layout: this.layout,
                dim: this.dimensions,
                method: this.method,
                bi: this.bi,
                layer: 0
              }
            ).done( network => { 
              // console.log(networks)
              // this.networks = networks
              this.stablishScene(network)
              // this.stablishScene(networks[0])
              // this.addLayer(networks[1])
            })
          }
        }
      }
    },
    stablishScene (network) {
      this.canvas = document.getElementById('renderCanvas') // Get the canvas element
      this.engine = new BABYLON.Engine(this.canvas, true) // Generate the BABYLON 3D engine

      this.scene = new BABYLON.Scene(this.engine)
      this.standard_material = new BABYLON.StandardMaterial("sMaterial", this.scene)
      // this.standardMaterial.diffuseColor = new BABYLON.Color3(1, 1 - clust, 1 - clust)
      this.highlight_material = new BABYLON.StandardMaterial("hMaterial", this.scene)
      this.highlight_material.diffuseColor = new BABYLON.Color3(0, 0, 0)
      this.phighlight_material = new BABYLON.StandardMaterial("pMaterial", this.scene)
      this.phighlight_material.diffuseColor = new BABYLON.Color3(0, 1, 0)
      this.mhighlight_material = new BABYLON.StandardMaterial("mMaterial", this.scene)
      this.mhighlight_material.diffuseColor = new BABYLON.Color3(1, 1, 1)
      this.chighlight_material = new BABYLON.StandardMaterial("cMaterial", this.scene)
      this.chighlight_material.diffuseColor = new BABYLON.Color3(1, 1, 0)
      this.chighlight2_material = new BABYLON.StandardMaterial("cMaterial2", this.scene)
      this.chighlight2_material.diffuseColor = new BABYLON.Color3(0, 1, 1)
      this.shighlight_material = new BABYLON.StandardMaterial("sMaterial", this.scene)
      this.shighlight_material.diffuseColor = new BABYLON.Color3(1, 0, 1)

      var camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this.scene)
      camera.attachControl(this.canvas, true)
      camera.wheelPrecision = 100
      new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene)

      let spheres = []
      let lines = []
      let lines_ = []
      let networks = [network]
      for (let j = 0; j < networks.length; j++) {
        let nodes = networks[j].nodes
        let edges = networks[j].edges
        let degrees = networks[j].degrees
        let mdegree = Math.max(...degrees)
        spheres.push([])
        lines.push([])
        lines_.push([])

        for (let i = 0; i < nodes.length; i++) {
          let node = nodes[i]
          let sphere = BABYLON.MeshBuilder.CreateSphere(j + 'sphere' + i, {diameter: 0.03 + this.diameter*0.1*degrees[i], updatable: 1}, this.scene)
          if (!node[2])
            node.push(0)
          sphere.position = new BABYLON.Vector3(node[0], node[1], node[2] + j * this.separation)
          let material = new BABYLON.StandardMaterial(j+"sMaterial"+i, this.scene)
          let c = degrees[i] / mdegree
          material.diffuseColor = new BABYLON.Color3(c, 0, 1-c)
          sphere.material = material
          sphere.mdata = {
            id: i,
            layer: j,
            degree: networks[j].degrees[i],
            clust: networks[j].clust[i],
            children: networks[j].children[i],
            source: networks[j].source[i],
            neighbors: []
          }
          spheres[spheres.length - 1].push(sphere)
          if (spheres.length > 1) {
            sphere.mdata.children.forEach( child => {
              spheres[spheres.length - 2][child].mdata.tparent = i
            })
          }
          sphere.isVisible = ( j === this.curlevel ) || (this.show === 'show all')
        }
        let links = 1
        for (let i = 0; i < edges.length; i++) {
          let pos1 = nodes[edges[i][0]]
          let pos2 = nodes[edges[i][1]]
          spheres[spheres.length - 1][edges[i][0]].mdata.neighbors.push(edges[i][1])
          spheres[spheres.length - 1][edges[i][1]].mdata.neighbors.push(edges[i][0])
          if (links === 1) {
            let pos1_ = new BABYLON.Vector3(pos1[0], pos1[1], pos1[2] + j * this.separation)
            let pos2_ = new BABYLON.Vector3(pos2[0], pos2[1], pos2[2] + j * this.separation)
            var line = BABYLON.MeshBuilder.CreateLines(j + 'line' + i, {points: [pos1_, pos2_], updatable: 1}, this.scene)
            line.isPickable = false
            lines[lines.length - 1].push(line)
            line.isVisible = ( j === this.curlevel ) || (this.show === 'show all')
            if (typeof lines_[j][edges[i][0]] === 'undefined') {
              lines_[j][edges[i][0]] = []
            }
            lines_[j][edges[i][0]][edges[i][1]] = line
            }
        }
      }

      // if (!this.isbi)
      this.networks = networks
      this.spheres = spheres
      this.lines = lines
      this.lines_ = lines_

      let selff = this
      this.engine.runRenderLoop(function () {
        selff.scene.render()
      })
      window.addEventListener('resize', function () {
        selff.engine.resize()
      })
      this.mkKeyShortcuts()
      this.nlayers = 0
      this.degreeHist(0)
      this.clustHist(0)
      this.nlayers = 1
    },
    nBins (up) {
      if (up) {
        this.nbins++
      } else {
        this.nbins--
      }
      d3.selectAll('svg').remove()
      this.degreey = []
      this.degreeyy = []
      this.clusty = []
      this.clustyy = []
      console.log(this.nbins)
      for (let j = 0; j < this.nlayers; j++) {
        this.clustHist(j)
        this.degreeHist(j)
      }
    },
    mkKeyShortcuts () {
      let self = this
      d3.select('canvas')
        .on('mouseenter', function () {
          d3.select('body').style('overflow', 'hidden')
        })
        .on('mouseout', function () {
          d3.select('body').style('overflow', 'scroll')
        })
      window.addEventListener('keypress', function (e) {
        console.log(e, e.key)
        // $ i n N c C m M f b B l L e E s S w p h
        if (e.key == '$') {
          if (self.keys) {
            delete self.keys
          } else {
            self.keys = 1
          }
        }
        if (self.keys) {
          if (e.key == 'i') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            self.snacktext = mmesh.mdata
            self.snackbar = 1
          } else if (e.key == 'w') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            mmesh.bmaterial = mmesh.material
            mmesh.material = self.chighlight2_material
            let layer = mmesh.mdata.layer
            if (layer === 0) {
              self.snacktext = 'layer 0 has no more children'
              self.snackbar = 1
              return
            }
            if (typeof self.widened[layer - 1] === 'undefined') {
              self.widened[layer - 1] = []
            }
            mmesh.mdata.children.forEach( c => {
              self.spheres[layer - 1][c].isVisible = true
              self.widened[layer - 1].push(c)
            })
            self.widened[layer - 1].forEach( c => {
              self.widened[layer - 1].forEach( c2 => {
                console.log(c, c2, ',=======')
                if (typeof self.lines_[layer - 1][c] !== 'undefined') {
                  if (typeof self.lines_[layer - 1][c][c2] !== 'undefined') {
                    self.lines_[layer - 1][c][c2].isVisible = true
                  }
                }
                if (typeof self.lines_[layer - 1][c2] !== 'undefined') {
                  if (typeof self.lines_[layer - 1][c2][c] !== 'undefined') {
                    self.lines_[layer - 1][c2][c].isVisible = true
                  }
                }
              })
            })
          } else if (e.key == 'W') {
            // colapse node and related into parent
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            let layer = mmesh.mdata.layer
            let tparent = mmesh.mdata.tparent
            if (layer + 1 > self.networks.length) {
              self.snacktext = 'this layer is the last one: nodes have no parent'
              self.snackbar = 1
              return
            }
            let pmesh = self.spheres[layer + 1][tparent]
            let brothers = pmesh.mdata.children
            brothers.forEach( c => {
              self.widened[layer].forEach( c2 => {
                console.log(c, c2, '======= BBBBBBB')
                if (typeof self.lines_[layer][c] !== 'undefined') {
                  if (typeof self.lines_[layer][c][c2] !== 'undefined') {
                    self.lines_[layer][c][c2].isVisible = false
                  }
                }
                if (typeof self.lines_[layer][c2] !== 'undefined') {
                  if (typeof self.lines_[layer][c2][c] !== 'undefined') {
                    self.lines_[layer][c2][c].isVisible = false
                  }
                }
              })
            })
            brothers.forEach( c => {
              self.spheres[layer][c].isVisible = false
              self.widened[layer] = self.widened[layer].filter( e => {
                return e !== c
              })
            })
            pmesh.material = pmesh.bmaterial
          } else if (e.key == 'h') {
            // make help!
            let msg = '~ key strokes available ~\n'
            msg += '$ -> enable/disable keystrokes\n'
            msg += 'i -> display the info on each node\n'
            msg += 'l/L -> add/remove layer\n'
            msg += 'n/N -> increase/decrease size of nodes\n\n'

            msg += 'c -> color on/off neighbors\n'
            msg += 'C -> color on/off parents and children\n'
            msg += 's -> color on/off source vertices\n'
            msg += 'S -> color on/off children tree (not implemented)\n'
            msg += 'm -> place/remove markers on nodes (e.g. for guiding coarsening\n'
            msg += 'M -> color on/off nodes with markers\n\n'

            msg += 'f -> histograms on count or percentages\n'
            msg += 'b/B -> more/less bins on histograms\n'
            msg += 'e/E -> highlight on/off histogram bars related to node\n'
            msg += 'click on histogram bars to highlight nodes\n\n'

            msg += 'w (widen) -> open/uncoarsen node\n'
            msg += 'W (unwiden) -> close/coarsen nodes in node metanode\n'
            msg += 'p (parent) -> make parent visible (not implemented)\n\n'

            msg += 'h -> show this help window\n\n'
            msg += ':::'
            alert(msg)
          } else if (e.key == 'f') {
            if (self.isfreq) {
              d3.selectAll('.alabel').text('Count')
              for (let j = 0; j < self.nlayers; j++) {
                d3.select('#degreelabel-y-' + j)
                  .call(d3.axisLeft(self.degreey[j]).ticks(10))
                d3.select('#clustlabel-y-' + j)
                  .call(d3.axisLeft(self.clusty[j]).ticks(10))
              }
              delete self.isfreq
            } else {
              d3.selectAll('.alabel').text('Percentage')
              for (let j = 0; j < self.nlayers; j++) {
                d3.select('#degreelabel-y-' + j)
                  .call(d3.axisLeft(self.degreeyy[j]).ticks(10))
                d3.select('#clustlabel-y-' + j)
                  .call(d3.axisLeft(self.clustyy[j]).ticks(10))
              }
              self.isfreq = 1
            }
          } else if (e.key == 'e') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            self.colorBars(mmesh, 1)
            mmesh.bmaterial = mmesh.material
            mmesh.material = self.chighlight2_material
            if (self.chighmesh) {
              self.chighmesh.material = self.chighmesh.bmaterial
            }
            self.chighmesh = mmesh
          } else if (e.key == 'E') {
            if (self.chighmesh) {
              self.chighmesh.material = self.chighmesh.bmaterial
            }
            self.colorBars({}, 0)
          } else if (e.key == 'l') {
            // add layer
            self.layers++
            self.altLayers({value: self.layers})
          } else if (e.key == 'L') {
            // rm layer
            if (self.layers > 1) {
              self.layers--
              self.altLayers({value: self.layers})
            }
          } else if (e.key == 'b') {
            // more bins in histograms
            self.nBins(1)
          } else if (e.key == 'B') {
            // less bins in histograms
            self.nBins(0)
          } else if (e.key == 'N') {
            // make nodes smaller
            self.updateNodeSizes(0)
          } else if (e.key == 'n') {
            // make nodes bigger
            self.updateNodeSizes(1)
          } else if (e.key == 's') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            // color the source vertices
            if (self.scolored) {
              // restore usual colors on vertices
              self.scolored_nodes.ids.forEach( i => {
                self.spheres[0][i].material = self.spheres[0][i].bmaterial
              })
              self.scolored = false
              self.snackbar = 0
            } else {
              // make distinct colors for sources
              self.snacktext = mmesh.mdata.source
              self.snackbar = 1
              mmesh.mdata.source.forEach( i => {
                self.spheres[0][i].bmaterial = self.spheres[0][i].material
                self.spheres[0][i].material = self.shighlight_material
              })
              self.scolored_nodes = {ids: mmesh.mdata.source}
              self.scolored = true
            }
          } else if (e.key == 'S') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            if (self.Scolored) {
              // restore usual colors on vertices
              self.Scolored_nodes.forEach( i => {
                self.spheres[i.layer][i._id].material = self.standard_material
              })
              self.Scolored = false
              self.snackbar = 0
            } else {
              // color children util reaching the source
              self.snacktext = 'implement coloring of children tree ?'
              self.snackbar = 1
              self.Scolored_nodes = []
            }
          } else if (e.key == 'c') {
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            // color the neighbors
            if (self.colored) {
              // restore usual colors on vertices
              self.colored_nodes.ids.forEach( i => {
                self.spheres[self.colored_nodes.layer][i].material = self.spheres[self.colored_nodes.layer][i].bmaterial
              })
              self.colored = false
              self.snackbar = 0
            } else {
              // make distinct colors for neighbors
              self.snacktext = mmesh.mdata.neighbors
              self.snackbar = 1
              mmesh.mdata.neighbors.forEach( i => {
                self.spheres[mmesh.mdata.layer][i].bmaterial = self.spheres[mmesh.mdata.layer][i].material
                self.spheres[mmesh.mdata.layer][i].material = self.highlight_material
              })
              self.colored_nodes = {ids: mmesh.mdata.neighbors, layer: mmesh.mdata.layer}
              self.colored = true
            }
          } else if (e.key == 'C') {
            // color parents and children
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            // color the neighbors
            if (self.pcolored) {
              // restore usual colors on vertices
              self.pcolored_nodes.ids.forEach( i => {
                self.spheres[self.pcolored_nodes.layer - 1][i].material = self.spheres[self.pcolored_nodes.layer - 1][i].bmaterial
              })
              if (!(typeof self.pcolored_nodes.tparent === 'undefined')) {
                self.spheres[self.pcolored_nodes.layer + 1][self.pcolored_nodes.tparent].material = self.spheres[self.pcolored_nodes.layer + 1][self.pcolored_nodes.tparent].bmaterial
              }
              self.pcolored = false
              self.snackbar = 0
            } else {
              // make funny colors for neighbors
              self.snacktext = mmesh.mdata.children
              self.snackbar = 1
              mmesh.mdata.children.forEach( i => {
                self.spheres[mmesh.mdata.layer - 1][i].bmaterial = self.spheres[mmesh.mdata.layer - 1][i].material
                self.spheres[mmesh.mdata.layer - 1][i].material = self.phighlight_material
              })
              self.pcolored_nodes = {ids: mmesh.mdata.children, layer: mmesh.mdata.layer}
              if (!(typeof mmesh.mdata.tparent === 'undefined')) {
                self.spheres[mmesh.mdata.layer + 1][mmesh.mdata.tparent].bmaterial = self.spheres[mmesh.mdata.layer + 1][mmesh.mdata.tparent].material
                self.spheres[mmesh.mdata.layer + 1][mmesh.mdata.tparent].material = self.phighlight_material
                self.pcolored_nodes.tparent = mmesh.mdata.tparent
              }
              self.pcolored = true
            }
          } else if (e.key === 'm') {
            // place marker on node to guide coarsening
            self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
            let mmesh = self.pickResult.pickedMesh
            window.mmesh = mmesh
            if (!mmesh)
              return
            if (!mmesh.mdata.coarsening_pivot) {
              mmesh.mdata.coarsening_pivot = 1
            } else {
              delete mmesh.mdata.coarsening_pivot
            }
          } else if (e.key === 'M') {
            if (self.mcolored) {
              self.mcolored_nodes.forEach( n => {
                self.spheres[n.layer][n._id].material = self.spheres[n.layer][n._id].bmaterial
              })
              delete self.mcolored_nodes
              self.mcolored = 0
            } else {
              self.mcolored_nodes = []
              for (let j = 0; j < self.spheres.length; j++) {
                for (let i = 0; i < self.spheres[j].length; i++) {
                  if (self.spheres[j][i].mdata.coarsening_pivot) {
                    self.spheres[j][i].bmaterial = self.spheres[j][i].material
                    self.spheres[j][i].material = self.mhighlight_material
                    self.mcolored_nodes.push({
                      layer: j, _id: i
                    })
                  }
                }
              }
              self.mcolored = 1
            }
          }
        }
      })
    },
    altLayers (val) {
      this.nlayers_new = parseInt(val.value)
      this.curlevel = parseInt(val.value)
      console.log('curlevel updated')
      this.updateLayers()
      console.log('updated layers yey')
    },
    updateVisibility () {
      let self = this
      let level = 0
      this.spheres.forEach( l => {
        l.forEach( n => {
          n.isVisible = level === self.curlevel
        })
        level++
      })
      level = 0
      this.lines.forEach( l => {
        l.forEach( ll => {
          ll.isVisible = level === self.curlevel
        })
        level++
      })
    },
    updateLayers () {
      if (this.show === 'show last') {
        console.log('going for and update visibility')
        this.updateVisibility()
        return
      }
      console.log('going for and update off add Layer')
      if (this.networks.length < this.nlayers_new) {
        // get networks and plot them
        let method
        if (methods[this.method])
          method = methods[this.method]
        else
          method = this.method
        console.log(method)
        for (let i = this.networks.length + 1; i <= this.nlayers_new; i++) {
          if (!this.isbi) {
            $.get(
              process.env.flaskURL + `/netlevelDB/${this.network._id}/${this.layout}/${this.dimensions}/${i - 1}/${method}/`,
              {},
              this.addLayer
            )
          } else {
            let __this = this
            $.post(
              // `http://rfabbri.vicg.icmc.usp.br:5000/postTest2/`,
              process.env.flaskURL + `/biMLDB/`,
              // {see: 'this', and: 'thisother', num: 5}
              {
                netid: this.network._id,
                layout: this.layout,
                dim: this.dimensions,
                method: this.method,
                bi: this.bi,
                layer: i - 1
              }
            ).done( network => { 
              // console.log(networks)
              // this.networks = networks
              // this.stablishScene(network)
              // this.stablishScene(networks[0])
              if (network === 'coarsening finished') {
                __this.tmsg = network
                __this.snacktext = network
                __this.snackbar = 1
                __this.layers--
              } else {
                this.addLayer(network)
              }
            })
          }
        }
      } else {
        // plot or remove layers as needed
        this.updateLayersVisibility()
      }
    },
    updateLayersVisibility () {
      for (let j = 0; j < this.nlayers_new; j++) {
        this.spheres[j].forEach( e => {
          e.visibility = 1
        })
        d3.select('#clust-' + j)
          .style('display', 'inline')
        d3.select('#degree-' + j)
          .style('display', 'inline')
      }
      for (let j = this.nlayers_new; j < this.networks.length; j++) {
        this.spheres[j].forEach( e => {
          e.visibility = 0
        })
        d3.select('#clust-' + j)
          .style('display', 'none')
        d3.select('#degree-' + j)
          .style('display', 'none')
      }
      this.nlayers = this.nlayers_new
    },
    addLayer (network) {
      this.networks.push(network)
      let spheres = this.spheres
      let lines = this.lines
      let lines_ = this.lines_
      let networks = this.networks
      let nodes = network.nodes
      let edges = network.edges
      let degrees = network.degrees
      let mdegree = Math.max(...degrees)

      spheres.push([])
      lines.push([])
      lines_.push([])

      let j_ = this.nlayers
      let j = j_
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        let sphere = BABYLON.MeshBuilder.CreateSphere(j + 'sphere' + i, {diameter: 0.03 + this.diameter*0.1*degrees[i], updatable: 1}, this.scene)
        if (!node[2])
          node.push(0)
        sphere.position = new BABYLON.Vector3(node[0], node[1], node[2] + j_ * this.separation)
        let material = new BABYLON.StandardMaterial(j+"sMaterial"+i, this.scene)
        let c = degrees[i] / mdegree
        material.diffuseColor = new BABYLON.Color3(c, 0, 1-c)
        sphere.material = material
        sphere.mdata = {
          id: i,
          layer: j,
          degree: networks[j].degrees[i],
          clust: networks[j].clust[i],
          children: networks[j].children[i],
          source: networks[j].source[i],
          neighbors: []
        }
        spheres[spheres.length - 1].push(sphere)
        if (spheres.length > 1) {
          sphere.mdata.children.forEach( child => {
            spheres[spheres.length - 2][child].mdata.tparent = i
          })
        }
        sphere.isVisible = ( j === this.curlevel ) || (this.show === 'show all')
      }
      let links = 1
      for (let i = 0; i < edges.length; i++) {
        let pos1 = nodes[edges[i][0]]
        let pos2 = nodes[edges[i][1]]
        spheres[spheres.length - 1][edges[i][0]].mdata.neighbors.push(edges[i][1])
        spheres[spheres.length - 1][edges[i][1]].mdata.neighbors.push(edges[i][0])
        if (links === 1) {
          let pos1_ = new BABYLON.Vector3(pos1[0], pos1[1], pos1[2] + j * this.separation)
          let pos2_ = new BABYLON.Vector3(pos2[0], pos2[1], pos2[2] + j * this.separation)
          var line = BABYLON.MeshBuilder.CreateLines(j+ 'line' + i, {points: [pos1_, pos2_], updatable: 1}, this.scene)
          line.isPickable = false
          lines[lines.length - 1].push(line)
          line.isVisible = ( j === this.curlevel ) || (this.show === 'show all')
          if (typeof lines_[j][edges[i][0]] === 'undefined') {
            lines_[j][edges[i][0]] = []
          }
          lines_[j][edges[i][0]][edges[i][1]] = line
        }
      }

      this.degreeHist(this.nlayers)
      this.clustHist(this.nlayers)
      this.nlayers++
    },
    saveAnalysis () {
      this.dialog = false
      // let set = this.$refs.netsettings
      let aname = this.newname ? this.newname : this.name
      let met = this.method === 'bipartite' ? this.bi : this.method
      let tobj = {
        layout: this.layout,
        dimensions: this.dimensions,
        links: this.links,
        // layers: 1,
        method: met,
        separation: this.separation,
        network: this.network._id,
        name: aname,
      }
      if (this.newname) {
        this.$store.dispatch('ansettings/create', tobj)
      } else {
        // pensar como resolver esse
        this.$store.dispatch('ansettings/update', [this._id, tobj])
      }
    },
    upload (e) {
      this.loading = true
      let reader = new FileReader()
      let file = e.target.files[0]
      console.log('raw', e, e.path[0].files[0].name)
      reader.readAsText(file)
      let self = this
      reader.addEventListener('load', () => {
        console.log(reader)
        this.$store.dispatch('networks/create', {
          data: reader.result,
          layer: 0,
          coarsen_method: 'none',
          uncoarsened_network: null,
          title: 'a title',
          description: 'a description',
          filename: e.path[0].files[0].name,
          // user: this.user._id
          user: '5c51162561e2414b1f85ac0b'
        }).then((res) => {
          this.loading = false
          this.text = 'file ' + e.path[0].files[0].name + 'loaded. Reload page to load more files'
          this.findNetworks()
        })
      })
    },
    findNetworks () {
      this.$store.dispatch('networks/find').then(() => {
        let networks_ = this.$store.getters['networks/list']
        this.networks_ = networks_.filter(i => i.layer === 0)
      })
    },
    findSettings () {
      this.$store.dispatch('ansettings/find').then(() => {
        this.settings = this.$store.getters['ansettings/list']
        this.settings.push({name: 'new'})
        // this.loadSettings(this.settings[1])
        this.loadSettings(this.settings[0])
      })
    },
    loadSettings (set) {
      if (set.name !== 'new') {
        this.asetting = set
        this.name = set.name
        this.layout = set.layout
        this.dimensions = set.dimensions
        this.links = set.links
        // this.layers = set.layers
        this.layers = 1
        if (typeof set.method === 'object') {
          this.bi = set.method
          this.method = 'bipartite'
          this.isbi = true
        } else {
          this.method = set.method
          this.isbi = false
        }
        this.separation = set.separation
        this.network = set.networkObj
        this._id = set._id
      } else {
        this.newname = this.name + '_clone'
        this.name = 'new'
      }
    },
    setMethod(met) {
      this.method = met
      if ((typeof method !== 'object') && this.method !== 'bipartite') {
        this.isbi = false
      } else {
        this.isbi = true
      }
    },
    sepLayers (val) {
      for (let j = 1; j < this.spheres.length; j++) {
        let nodes = this.networks[j].nodes
        let edges = this.networks[j].edges
        for (let i = 0; i < this.spheres[j].length; i++) {
          this.spheres[j][i].position.z = nodes[i][2] + j * val
        }
        for (let i = 0; i < this.lines[j].length; i++) {
          // this.lines[j][i].position.z = this.networks[j].nodes[i][2] + j * val
          let pos1 = nodes[edges[i][0]]
          let pos2 = nodes[edges[i][1]]
          let line = this.lines[j][i]
          let mpos = line.getVerticesData(BABYLON.VertexBuffer.PositionKind)

          mpos[2] = pos1[2] + j * this.separation
          mpos[5] = pos2[2] + j * this.separation

          line.updateVerticesData(BABYLON.VertexBuffer.PositionKind, mpos)
        }
      }
    }
  },
  mounted () {
    window.__this = this
    window.altLayers = this.altLayers
    window.md3 = d3
    this.degreey = []
    this.degreeyy = []
    this.clusty = []
    this.clustyy = []
    this.nbins = 10
    for (let i = 0; i < this.ntiers; i++) {
      this.bi.reduction.push('0.1')
      this.bi.max_levels.push('5')
      this.bi.global_min_vertices.push('100')
      this.bi.matching.push('mlpb')
      this.bi.similarity.push('weighted_common_neighbors')
      this.bi.upper_bound.push('0.1')
      this.bi.itr.push('10')
      this.bi.tolerance.push('0.0001')
    }
    // this.method = 'bi'
    this.widened = []
  },
  created () {
    this.findNetworks()
    this.findSettings()
  }
}
// vim: ft=vue
</script>

<style>
html, body {
  overflow: scroll;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#renderCanvas {
  /* width: 100%; */
  /* height: 100%; */
  width:  60%;
  height: 60%;
  touch-action: none;
}
.v-input--selection-controls {
    margin-top: 0px;
  }
.v-input--selection-controls:not(.v-input--hide-details) .v-input__slot {
    margin-bottom: 0px;
}
.v-messages {
    min-height: 2px;
}
*{ text-transform: none !important; }
.barC {
  fill: steelblue;
}

.barC:hover {
  fill: brown;
}
.barD {
  fill: steelblue;
}

.barD:hover {
  fill: brown;
}


.alabel {
  fill: black;
}

.axis--x path {
  /* display: none; */
}

.upme {
  text-align: center;
}
.column {
  margin-left: 15px;
  display:inline-block;
  position:relative;
}

/* Clear floats after the columns */
.row {
}
.row:after {
  content: "";
  display: table;
  clear: both;
}

.btn22 {
  margin: 0;
  min-width: 60px;
  max-width: 60px;
  width: 60px;
}

.tcolumn {
  padding-left: 5px;
}
/* vim: set ft=vue: */
</style>
