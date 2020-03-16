<template>
  <v-container justify-center style="width:800px">
    <h1>ESFNetVis
    <nuxt-link to="/evolution/about">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue"></i>
    </nuxt-link>
    </h1>
<v-layout align-center justify-start row ma-1 pa-1>
    Load settings:
    <v-menu offset-y>
      <v-btn
        slot="activator"
        color="primary"
        dark
      >
        {{ sname ? sname : 'Select' }}
      </v-btn>
      <v-list>
        <v-list-tile
          v-for="(set, index) in settings"
          :key="index"
          @click="loadSettings(set)"
          class="green--text"
        >
          <v-list-tile-title>{{ set.name }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <v-flex xs4>
    <v-text-field
      label="Settings name"
      v-if="sname === 'new'"
      v-model="newname"
      counter
      maxlength="90"
      width="'90%'"
      pa-1 ma-1
    ></v-text-field>
    <v-btn v-if="sname && sname !== 'new'" color="success" @click="cloneSettings()"
    pa-1 ma-1
    >Clone settings</v-btn>
    </v-flex>
      <v-btn
        color="primary"
        dark
      >
        save to settings
      </v-btn>
</v-layout>
<v-expansion-panel>
  <v-expansion-panel-content>
    <div slot="header">Visualization settings. Name of the loaded settings: <b>{{ sname }}</b>,
    <span v-if="network_data.nodes">nodes: {{network_data.nodes.length}},
    edges: {{network_data.edges.length}},
    messages/transactions: {{network_data.transactions.length}}</span>
    </div>
  <div style="border:2px solid black; padding: 4px">
<v-card flat dark>
<v-layout align-center justify-start pa-1 row>
  <v-flex xs2 ml-2>
    Network: 
    <v-menu offset-y>
      <v-btn
        slot="activator"
        color="primary"
        dark
      >
        {{ network ? network.name : 'Select' }}
      </v-btn>
      <v-list>
        <v-list-tile
          v-for="(net, index) in networks"
          :key="index"
          @click="loadNetwork(net)"
        >
          <v-list-tile-title color="primary">{{ net.name }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
  </v-flex>

  <v-layout align-center justify-start row v-if="network_data.transactions">
    messages:
        <v-flex
          shrink
          style="width: 60px"
          ml-3
        >
          <v-text-field
            v-model="message_range[0]"
            type="number"
            :label="'first'"
          ></v-text-field>
        </v-flex>
        <v-flex class="px-3">
          <v-range-slider
            v-model="message_range"
            :max="network_data.transactions.length"
            :min="0"
          ></v-range-slider>
        </v-flex>
        <v-flex
          shrink
          style="width: 60px"
        >
          <v-text-field
            :label="'last'"
            :left="true"
            v-model="message_range[1]"
            type="number"
          ></v-text-field>
        </v-flex>
  </v-layout>
</v-layout>
</v-card>

<v-flex mt-1>
<v-card flat dark>
<v-layout align-center justify-start row>
    <v-flex xs2 ml-2>
      Sectorialization method: 
    </v-flex>
    <v-flex xs2 mr-2 ml-2>
      <v-menu>
        <v-btn
          slot="activator"
          color="primary"
          dark
        >
          {{ sec_method ? sec_method : 'Select' }}
        </v-btn>
        <v-list>
          <v-list-tile
            v-for="(sec, index) in sec_methods"
            :key="index"
            @click="loadSecMethod(sec)"
          >
            <v-list-tile-title>{{ sec }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-flex>
    <v-flex xs6>
  <v-layout align-center justify-start row v-if="sec_method === 'Percentages'">
    <v-flex xs2 mr-2>
    <v-text-field
      :label="'hubs'"
      :left="true"
      v-model="hip_perc.h"
      type="number"
      min="0"
      max="100"
      v-on:input="percChange()"
    ></v-text-field>
    </v-flex>
    <v-flex xs2>
    <v-text-field
      :label="'intermediary'"
      :left="true"
      v-model="hip_perc.i"
      type="number"
      min="0"
      max="100"
      v-on:input="percChange()"
      :key="compKey"
    ></v-text-field>
    </v-flex>
    <v-flex xs2 ml-2>
    <v-text-field
      :label="'periphery'"
      :left="true"
      v-model="hip_perc.p"
      type="number"
      min="0"
      max="100"
      v-on:input="percChangePer()"
    ></v-text-field>
    </v-flex>
  </v-layout>
    </v-flex>
</v-layout>
</v-card>
</v-flex>
</div>
  </v-expansion-panel-content>
</v-expansion-panel>
<v-expansion-panel style="margin-top:10px;">
  <v-expansion-panel-content>
    <div slot="header">Controls (window size: {{ window_size }}, separation {{window_sep}}, messages/s: {{ messages_second }})</div>
    <div style="border:2px solid black; padding: 4px">
          <v-layout row ml-4>
            <v-flex class="pr-3">
              <v-slider
                v-model="window_size"
                :max="1000"
                :min="1"
                :label="'window size'"
                :step="1"
                ma-0
                pa-0
              ></v-slider>
            </v-flex>
            <v-flex shrink style="width: 60px">
              <v-text-field
                v-model="window_size"
                class="mt-0"
                hide-details
                single-line
                type="number"
              ></v-text-field>
            </v-flex>
          </v-layout>
          <v-layout row ml-4>
            <v-flex class="pr-3">
              <v-slider
                v-model="window_sep"
                :max="1000"
                :min="1"
                :label="'messages separation between snapshots'"
                :step="1"
                ma-0
                pa-0
              ></v-slider>
            </v-flex>
            <v-flex shrink style="width: 60px">
              <v-text-field
                v-model="window_sep"
                class="mt-0"
                hide-details
                single-line
                type="number"
              ></v-text-field>
            </v-flex>
          </v-layout>
          <v-layout row ml-4>
            <v-flex class="pr-3">
              <v-slider
                v-model="messages_second"
                :max="100"
                :min="0.1"
                :label="'messages per second'"
                :step="0.1"
                ma-0
                pa-0
              ></v-slider>
            </v-flex>
            <v-flex shrink style="width: 60px">
              <v-text-field
                v-model="messages_second"
                class="mt-0"
                hide-details
                single-line
                type="number"
              ></v-text-field>
            </v-flex>
          </v-layout>
    </div>
  </v-expansion-panel-content>
</v-expansion-panel>
  <v-layout align-center justify-start row>
      <v-btn
        color="red"
        @click="loadCanvas()"
        :disabled="status.loaded ? true : false"
      >
        load canvas
      </v-btn>
    </v-layout>
  <canvas id="renderCanvas"></canvas>
<v-layout row ml-4>
    <textarea
      name="infoareaname"
      width="100%"
      style="width:100%;height:80px;border:solid 1px black"
      id="netinfoarea"
      box
      label="information about the network (editable)"
    >statistics:</textarea>
  <v-btn outline icon @click="status.playing ? pause() : play_()" :disabled="!status.loaded">
    <v-icon v-if="!status.playing">play_arrow</v-icon>
    <v-icon v-else>pause</v-icon>
  </v-btn>
  <v-btn outline icon @click="rewind()">
    <v-icon>fast_rewind</v-icon>
  </v-btn>
</v-layout>
    <svg></svg>
<v-footer class="pa-3">
  <v-spacer></v-spacer>
  <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
</v-footer>
  </v-container>
</template>

<script>
// import enet from '~/static/here.json'
const enet = require('~/static/here.json')
// import fs from 'fs'
// const enet = JSON.parse(fs.readFileSync('~/static/here.json', 'utf8'))
import * as BABYLON from 'babylonjs'
import $ from 'jquery'
import * as d3 from 'd3'

function mkArrow(v1, v2) {
  let theta = Math.PI * 5 / 6
  theta = Math.PI
  let a = v2.subtract(v1)
  let b = new BABYLON.Vector3(0,-100,0)
  let c = BABYLON.Vector3.Cross(a, b)
  c.normalize()
  let f = BABYLON.Vector3.Cross(c, a)

  let g = a.scale(Math.cos(theta)).add(f.scale(Math.sin(theta)))
  let g_ = g.normalize().scale(0.1)

  return v2.add(g_)
  // find c = a x b normalized
  // find f = c x a
  // make g = cos(theta) a + sin(theta) f
}

function mkPoints(p1, p2, mesh) {
  // make p2_ with p2 - size of polyhedron
  // let dir = new BABYLON.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z)
  let dir = p2.subtract(p1)
  console.log(p2, p1, dir, mesh.position)
  let ray = new BABYLON.Ray(p1, dir)
  let inter = ray.intersectsMesh(mesh)
  window.minter.push([ray, mesh, inter, p1, p2])
  let p2_ = inter.pickedPoint
  // let arrowpoint = mkArrow(p1, p2_)
  return [p1, p2_] //, arrowpoint]
}

const mcolors2 = [
  new BABYLON.Color4(0, 0, 1, 1),
  new BABYLON.Color4(0, 1, 0, 1),
  new BABYLON.Color4(1, 0, 0, 1)
]

export default {
  head () {
    return {
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' }
      ],
    }
  },
  data () {
    return {
      networks: [{name: 'scale-free 1', data: enet}, {name: 'other', data: []}],
      // network: ''
      network: {name: 'scale-free 1', data: enet},
      settings: [{name: 'new'}, {name: 'other'}],
      sname: 'example settings',
      newname: '',
      message_range: [0, 0],
      sec_methods: ['Erdös', 'Percentages'],
      // sec_method: 'Percentages',
      sec_method: 'Erdös',
      window_size: 150,
      window_sep: 10,
      messages_second: 30,
      hubs_perc: 5,
      int_perc: 15,
      hip_perc: {
        h: 5,
        i: 15,
        p: 80
      },
      min_size: 0.01,
      size_inc: 0.003,
      status: {
        render: 1,
        rendered: 0,
        loaded: 0,
        playing: 0,
      },
      hub_markers: {
        ysep: 0.2,
        alpha: 0.4
      },
      network_data: {},
      compKey: 0
    }
  },
  methods: {
    mkLineChart () {
      var margin = {top: 50, right: 350, bottom: 50, left: 50}
        //, width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , width = 700
        // , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height
        , height = 200 - margin.top - margin.bottom; // Use the window's height

      // The number of datapoints
      var n = this.net_snapshots.networks.length - 1

      let self = this

      // 5. X scale will use the index of our data
      var xScale = d3.scaleLinear()
          .domain([0, n-1]) // input
          .range([0, width]) // output

      // 6. Y scale will use the randomly generate number 
      var yScale = d3.scaleLinear()
          .domain([0, 1]) // input 
          .range([height, 0]) // output 


      // // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
      // var dataset = d3.range(n).map(function(d) { return {"y": d3.randomUniform(1)() } })

      // 7. d3's line generator
      var line = d3.line()
          .x(function(d, i) { return xScale(i); }) // set the x values for the line generator
          .y(function(d) { return yScale(d); }) // set the y values for the line generator 
          .curve(d3.curveMonotoneX) // apply smoothing to the line
      // 1. Add the SVG to the page and employ #2
      var svg = d3.select("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      // 3. Call the x axis in a group tag
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(xScale)) // Create an axis component with d3.axisBottom

      // 4. Call the y axis in a group tag
      svg.append("g")
          .attr("class", "y axis")
          .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

      // 9. Append the path, bind the data, and call the line generator 
      svg.append("path")
          .datum(self.hubs_timeline) // 10. Binds data to the line 
          .attr("class", "line") // Assign a class for styling 
          .attr("d", line); // 11. Calls the line generator 

      svg.append("path")
          .datum(self.inter_timeline) // 10. Binds data to the line 
          .attr("class", "line2") // Assign a class for styling 
          .attr("d", line); // 11. Calls the line generator 

      svg.append("path")
          .datum(self.per_timeline) // 10. Binds data to the line 
          .attr("class", "line3") // Assign a class for styling 
          .attr("d", line); // 11. Calls the line generator 

      // 12. Appends a circle for each datapoint 
      svg.selectAll(".dot")
        .data(self.hubs_timeline)
        .enter().append("circle") // Uses the enter().append() method
          .attr("class", "dot") // Assign a class for styling
          .attr("cx", function(d, i) { return xScale(i) })
          .attr("cy", function(d) { return yScale(d) })
          .attr("r", 5)
            .on("mouseover", function(a, b, c) { 
              self.highlightNodes('hubs')
            })
            .on("mouseout", function() {
              self.highlightSpheresOff()
            }) 

      d3.select('svg').on("click", function() { 
        let coords = d3.mouse(this)
        let xcoord = Math.round(xScale.invert(coords[0]) - 1)
        console.log('click', coords, xcoord)
        self.cur_net = xcoord - 2
        self.updateFrameline()
      })
      window.XS = xScale
      svg.selectAll(".dot2")
        .data(self.inter_timeline)
        .enter().append("circle") // Uses the enter().append() method
          .attr("class", "dot2") // Assign a class for styling
          .attr("cx", function(d, i) { return xScale(i) })
          .attr("cy", function(d) { return yScale(d) })
          .attr("r", 5)
            .on("mouseover", function(a, b, c) { 
              console.log('inter', a) 
              self.highlightNodes('inter')
            })
            .on("mouseout", function() {
              self.highlightSpheresOff()
            }) 
      svg.selectAll(".dot3")
        .data(self.per_timeline)
        .enter().append("circle") // Uses the enter().append() method
          .attr("class", "dot3") // Assign a class for styling
          .attr("cx", function(d, i) { return xScale(i) })
          .attr("cy", function(d) { return yScale(d) })
          .attr("r", 5)
            .on("mouseover", function(a, b, c) { 
              console.log('per', a) 
              self.highlightNodes('per')
            })
            .on("mouseout", function() {
              self.highlightSpheresOff()
            }) 
      svg.append('line')
        .attr('class', 'frameline')
        .attr('x1', xScale(20))
        .attr('x2', xScale(20))
        .attr('y1', yScale(0))
        .attr('y2', yScale(1))
        .style("stroke-width", 5)
        .style("stroke", "#911eb4")
        .style("fill", "none")

      svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width * 0.543)
        .attr("y", height * 1.28)
        .text("snapshot")

      svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", - height * 0.4)
        .attr("y", - width * 0.045)
        .attr("transform", "rotate(-90)")
        // .attr("dy", "- 3.75em")
        .text("fraction")
      this.xScale = xScale
      this.dims = [width, height]

    },
    highlightNodes (sec, offset = -1) {
      this.status.highlight_sec = sec
      let stats = this.net_snapshots.stats[this.cur_net + offset]
      let sec_ = {'hubs': 0, 'inter': 1, 'per': 2}[sec]
      let hip = stats.hip[sec_]
      let nodes = this.net_snapshots.networks[this.cur_net].nodes
      this.highlightSpheres = []
      hip.forEach( n => {
        // make transparent green sphere
        let diameter = this.spheres[n].getBoundingInfo().boundingSphere.radius * 2
        let sphere = BABYLON.MeshBuilder.CreateSphere("sphere" + n, {diameter: diameter * 1.02}, this.scene);
        sphere.position = this.spheres[n].position
        sphere.material = this.highlightMaterial
        this.highlightSpheres.push(sphere)
      })
    },
    highlightSpheresOff () {
      this.highlightSpheres.forEach( s => {
        console.log('dipose', s)
        s.dispose()
      })
      delete this.highlightSpheres
      delete this.status.highlight_sec
    },
    updateFrameline () {
      let self = this
      d3.select('.frameline')
        .attr('x1', self.xScale(self.cur_net - 1))
        .attr('x2', self.xScale(self.cur_net - 1))
    },
    loadSettings (set) {
      this.setting = set
      this.sname = set.name
    },
    cloneSettings (set) {
      console.log('make settings clone')
      // use this.setting and make a new setting instance
    },
    loadNetwork (net) {
      this.network = net
      $.get(
        process.env.flaskURL + '/evolvingNet/someNetId/',
        {},
        this.absorbNetworksData
      )
    },
    testPost () {
      $.post(
        // `http://rfabbri.vicg.icmc.usp.br:5000/postTest2/`,
        process.env.flaskURL + '/postTest3/',
        // {see: 'this', and: 'thisother', num: 5}
        {
          network: this.network.name,
          sec_method: this.sec_method,
          message_range: this.message_range,
          window_size: this.window_size,
          window_sep: this.window_sep,
          scf: true,
          hip_perc: [
            this.hip_perc.h,
            this.hip_perc.i,
            this.hip_perc.p
          ]
        }
      ).done( data => { 
        this.net_snapshots = data 
        this.textinfo.value += '\n~ total stats ~\n'
        this.textinfo.value += 'snapshots: ' + (data.networks.length - 1)
        this.textinfo.value += ', nodes: ' + data.networks[0].nodes.length
        this.textinfo.value += ', edges: ' + data.networks[0].edges.length

        let st = data.stats[0]
        this.textinfo.value += '\ndegree mean, std: ' + st.degree_mean.toFixed(3) + ', ' + st.degree_std.toFixed(3)
        this.textinfo.value += '\nclustering mean, std: ' + st.clust_mean.toFixed(3) + ', ' + st.clust_std.toFixed(3)

        this.textinfo.value += '\ndegree mean (mean, std): ' + st.degree_mean_mean.toFixed(3) + ', ' + st.degree_mean_std.toFixed(3)
        this.textinfo.value += '\ndegree std (mean, std): ' + st.degree_std_mean.toFixed(3) + ', ' + st.degree_std_std.toFixed(3)

        this.textinfo.value += '\nclust mean (mean std): ' + st.clust_mean_mean.toFixed(3) + ', ' + st.clust_mean_std.toFixed(3)
        this.textinfo.value += '\nclust std (mean, std): ' + st.clust_std_mean.toFixed(3) + ', ' + st.clust_std_std.toFixed(3)

        this.textinfo.value += '\n~ picked stats ~'
        console.log('post returned', data) 
        this.mkTimelineData()
        this.mkLineChart()
        this.loadBabylon()
      })
    },
    mkTimelineData () {
      this.hubs_timeline = []
      this.inter_timeline = []
      this.per_timeline = []
      for (let i = 1; i < this.net_snapshots.stats.length; i++) {
        let hip = this.net_snapshots.stats[i].hip
        let total = hip[0].length + hip[1].length + hip[2].length
        let h_frac = hip[0].length / total
        let i_frac = hip[1].length / total
        let p_frac = hip[2].length / total
        this.hubs_timeline.push(h_frac)
        this.inter_timeline.push(i_frac)
        this.per_timeline.push(p_frac)
      }
    },
    absorbNetworksData (data) {
      // data.transactions = data.transactions.slice(0,100)
      window.mdata = data
      this.network_data = data
      this.message_range[1] = data.transactions.length
    },
    loadSecMethod (sec) {
      this.sec_method = sec
    },
    percChange () {
      let leftover = 100 - this.hip_perc.h - this.hip_perc.i
      if (leftover >= 0) {
        this.hip_perc.p = leftover
      } else {
        console.log('< 0 po')
        this.hip_perc.p = 0
        this.hip_perc.i = 100 - this.hip_perc.h
        this.compKey += 1
        // this.hip_perc.h = 100 - this.hip_perc.i
      }
    },
    percChangePer () {
      let leftover = 100 - this.hip_perc.h - this.hip_perc.p
      if (leftover >= 0) {
        this.hip_perc.i = leftover
      } else {
        this.hip_perc.i = 0
        this.hip_perc.h = 100 - this.hip_perc.p
      }
    },
    play_ () {
      this.status.playing = 1
    },
    pause () {
      this.status.playing = 0
    },
    setSizeColor(sec) {
      let stats = this.net_snapshots.stats[this.cur_net]
      let hip = stats.hip[sec]
      let nodes = this.net_snapshots.networks[this.cur_net].nodes
      let pre = ['h', 'i', 'p'][sec]
      let mtype = [3, 6, 0][sec]
      hip.forEach( n => {
        let poly = this.spheres[n]
        let name = poly.name
        poly.dispose()
        let nn = nodes.indexOf(n)
        let deg = stats.degree[nn]
        let clust = stats.clust[nn]
        let msize = this.min_size + this.size_inc * deg
        // console.log('msize', msize, deg)
        poly = BABYLON.MeshBuilder.CreatePolyhedron(
          pre+'sphere'+n,
          // {type: 3, updatable: 1, size: 0.01 + 0.001*deg},
          {type: mtype, updatable: 1, size: msize},
          this.scene
        )
        poly.position = this.nodepos[n]
        poly.material = new BABYLON.StandardMaterial(pre + "Material" + n, this.scene)
        poly.material.diffuseColor = new BABYLON.Color3(1, 1 - clust, 1 - clust)
        poly.actionManager = new BABYLON.ActionManager(this.scene)
        poly.mdata = {
          clust: clust,
          degree: deg,
          sec: pre
        }
        poly.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            // BABYLON.ActionManager.OnRightPickTrigger,
            // this.onOver
            this.highlightLine
          )
        )
        poly.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            // this.onOut
            this.restoreLine
          )
        )
        this.spheres[n] = poly
        // poly.type = 3
        // poly.options.size = 1
        
      })
    },
    updateNodes2 () {
      // delete meshes made before
      if (this.cur_net >= this.net_snapshots.networks.length) {
        return
      }
      this.setSizeColor(0)
      this.setSizeColor(1)
      this.setSizeColor(2)
      this.updateFrameline()
    },
    updateNodes () {
      let num = Math.random()
      this.spheres[0][0].scaling = new BABYLON.Vector3(num, num, num)
      this.spheres[0][0].material.diffuseColor = new BABYLON.Color3(num, num, num)
      this.spheres[0][1].material.diffuseColor = new BABYLON.Color3(num, 0, 0)
      if (Math.random() < 0.04) {
        this.spheres[0][2].dispose()
        if (Math.random() < 0.5) {
          this.spheres[0][2] = new BABYLON.MeshBuilder.CreateBox('box'+2, {size: 0.04}, this.scene)
        } else {
          this.spheres[0][2] = new BABYLON.MeshBuilder.CreateSphere('sphere'+2, {diameter: 0.07}, this.scene)
        }
        this.spheres[0][2].position = this.nodepos[2]
        this.spheres[0][2].material = new BABYLON.StandardMaterial("hMaterial" + 2, this.scene)
        this.spheres[0][2].material.diffuseColor = new BABYLON.Color3(num, 1 - num, 0)
      }
    },
    onOut (meshEvent) {
      while (document.getElementById("mybut")) {
        document.getElementById("mybut").parentNode.removeChild(document.getElementById("mybut"));
      }
    },
    rewind () {
      this.cur_net = 1
    },
    highlightLine (meshEvent) {
      let sec = ''
      if (typeof(meshEvent) !== 'string') {
        sec = {'h': '', 'i': 2, 'p': 3}[meshEvent.meshUnderPointer.mdata.sec]
        console.log('msec', sec)
      } else {
        sec = meshEvent
      }
      d3.select('.line' + sec).style('stroke', '#000000')
      this.status.highlight_line = sec
    },
    restoreLine (meshEvent) {
      d3.select('.line').style('stroke', '#ffab00')
      d3.select('.line2').style('stroke', '#00abff')
      d3.select('.line3').style('stroke', '#00ffab')
      delete this.status.highlight_line
    },
    onOver (meshEvent) {
        var but = document.createElement("span");
        // but.textContent = " ";
        but.setAttribute("id", "mybut");
        // but.zIndex = 0;
        var sty = but.style;
        sty.position = "absolute";
        sty.lineHeight = "1.2em";
        sty.paddingLeft = "10px";
        sty.paddingRight = "10px";
        sty.color = "#ffff00";
        sty.border = "5pt ridge blue";
        sty.borderRadius = "12px";
        sty.backgroundColor = "none";
        sty.fontSize = "24pt";
        sty.top = this.scene.pointerY + "px";
        sty.top = this.canvas.offsetTop + this.scene.pointerY + "px";
        sty.left = this.canvas.width + this.scene.pointerX + "px";
        sty.left = this.scene.pointerX + "px";
        sty.cursor = "pointer";
        but.setAttribute("onclick", "alert('ouch!')");
        document.body.appendChild(but);
        but.textContent = meshEvent.meshUnderPointer.name;
        but.textContent = meshEvent.meshUnderPointer.mdata.clust;
        // console.log(meshEvent);
        // console.log(wsc);
    },
    positionNodes () {
      let zfreq = 2
      let zamp = 0.5
      let zfreq_per = 2
      let zamp_per = 0.1
      let zdisp_per = 0.2

      this.nodepos = {}
      // let nnodes = this.net_snapshots.networks[0].nodes.length
      // let nhubs = Math.round(nnodes * this.hubs_perc / 100)
      // let nint = Math.round(nnodes * this.int_perc / 100)
      // let nper = nnodes - nhubs - nint
      let nhubs = this.net_snapshots.stats[0].hip[0].length
      let nint = this.net_snapshots.stats[0].hip[1].length
      let nper = this.net_snapshots.stats[0].hip[2].length

      let sine_ampl = .3

      let step_hubsx = 1 / nhubs
      let step_hubsy = Math.PI / nhubs
      let hMaterial = new BABYLON.StandardMaterial("hMaterial", this.scene)
      hMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7)
      let spheres = {}  // for hubs, int and peripherals
      for (let n = 0; n < nhubs; n++) {
        let hid = this.net_snapshots.stats[0].hip[0][n]
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron(
          'sphere_h'+hid,
          {type: 3, updatable: 1, size: this.min_size},
          this.scene
        )
        let x = 1 - step_hubsx * n
        let y = sine_ampl * Math.sin(step_hubsy * n)
        let z = zamp*Math.sin(2 * Math.PI * n / (nhubs + nint - 1))
        this.nodepos[hid] = new BABYLON.Vector3(
          x,
          y,
          z
        )
        sphere.position = this.nodepos[hid]
        sphere.material = new BABYLON.StandardMaterial("hMaterial" + n, this.scene)
        spheres[hid] = sphere
        // create boxes
        let box = BABYLON.MeshBuilder.CreateBox('box' + n,
          {size: 0.1, height: 0.01},
          this.scene
        )
        box.position = new BABYLON.Vector3(
          x,
          y - this.hub_markers.ysep,
          z
        )
        box.material = new BABYLON.StandardMaterial("mMaterial" + n, this.scene)
        box.material.diffuseColor = new BABYLON.Color3(0, 1, 0)
        box.material.alpha = this.hub_markers.alpha

      }

      let step_intx = 1 / (nint - 1)
      let step_inty = Math.PI / (nint - 1)
      let iMaterial = new BABYLON.StandardMaterial("iMaterial", this.scene);
      iMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0.7)
      for (let n = 0; n < nint; n++) {
        let iid = this.net_snapshots.stats[0].hip[1][n]
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron(
          'sphere_i'+iid,
          {type: 6, updatable: 1, size: this.min_size},
          this.scene
        )
        let x = - step_intx * n
        let y = sine_ampl * Math.sin(step_inty * n + Math.PI)
        this.nodepos[iid] = new BABYLON.Vector3(
          x,
          y,
          zamp*Math.sin(2 * Math.PI * (n + nhubs) / (nhubs + nint - 1))
        )
        sphere.position = this.nodepos[iid]
        sphere.material = new BABYLON.StandardMaterial("iMaterial" + n, this.scene)
        spheres[iid] = sphere
      }

      let step_perx = 1.3 / nper
      let step_pery = 0.3 / nper
      let pMaterial = new BABYLON.StandardMaterial("pMaterial", this.scene);
      pMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1)
      for (let n = 0; n < nper; n++) {
        let pid = this.net_snapshots.stats[0].hip[2][n]
        let sphere = BABYLON.MeshBuilder.CreatePolyhedron(
          'sphere_p'+pid,
          {type: 0, updatable: true, size: this.min_size},
          this.scene
        )
        let x = - 0.9 + step_perx * n
        let y = sine_ampl * 0.8  + step_pery * n + zamp_per * Math.cos( 2 * Math.PI * n / (nper -1) )
        this.nodepos[pid] = new BABYLON.Vector3(
          x,
          y,
          zdisp_per + zamp_per * Math.sin( 2 * Math.PI * n / (nper -1) )
        )
        sphere.position = this.nodepos[pid]
        sphere.material = new BABYLON.StandardMaterial("pMaterial" + n, this.scene)
        spheres[pid] = sphere
      }
      this.spheres = spheres
    },
    loadEdges2 () {
      if (this.cur_net >= this.net_snapshots.networks.length) {
        return
      }
      let edges = this.net_snapshots.networks[this.cur_net].edges
      this.old_edges.forEach( e => {
        e.dispose()
      })
      this.old_edges = []
      edges.forEach( e => {
        let name = 'line' + e[0] + '-' + e[1]
        let xy1 = this.nodepos[e[0]]
        let xy2 = this.nodepos[e[1]]
        let arrowpoint = mkArrow(xy1, xy2)
        let points2_ = [xy1, xy2, arrowpoint]
        // let points__ = mkPoints(xy1, xy2, this.spheres[e[1]])  // for edge to only tough the surface of mesh
        let line = BABYLON.MeshBuilder.CreateLines(
          name,
          // {points: points__, colors: mcolors2, updatable: 1},
          {points: points2_, colors: mcolors2, updatable: 1},
          this.scene
        )
        // line.enableEdgesRendering()
        line.enableEdgesRendering()
        line.edgesWidth = (e[2].weight-1)*2
        line.edgesColor = new BABYLON.Color4(0,1,1,.3)
        // this.old_edges.push(e)
        // this.current_edges[name] = line
        this.old_edges.push(line)
      });
      this.cur_net++
    },
    loadEdges (msgs_to_update) { // create and delete edges
      // edges creation
      // used for the dummy network (for tests)
      let edges = this.network_data.transactions.slice(
        this.current_message,
        this.current_message + msgs_to_update
      )
      let mcolors = []
      for (let i = 0; i < 6; i++) {
        mcolors.push(new BABYLON.Color4(0, 0, i * 1/6, 1))
      }
      let mcolors2 = [
        new BABYLON.Color4(0, 0, 1, 1),
        new BABYLON.Color4(0, 1, 0, 1),
        new BABYLON.Color4(1, 0, 0, 1)
      ]
      edges.forEach( e => {
        let name = 'line' + e[0] + '-' + e[1]
        if (this.current_edges[name]) {
          console.log('already exists', name)
          this.current_edges[name].edgesWidth += 10
        } else {
          console.log('new link', name)
          let xy1 = this.nodepos[e[0]]
          let xy2 = this.nodepos[e[1]]
          let arrowpoint = mkArrow(xy1, xy2)
          let control = new BABYLON.Vector3(
            xy1.x**2 + xy2.x**2,
            xy2.y**2 + xy2.y**2,
            0
          )
          let bez = BABYLON.Curve3.CreateQuadraticBezier(xy1, control, xy2, 5)
          let points_ = bez.getPoints()
          let points2_ = [xy1, xy2, arrowpoint]
          console.log('control', control, points_.length, mcolors, points_.length, mcolors.length)
          let line = BABYLON.MeshBuilder.CreateLines(
            name,
            {points: points2_, colors: mcolors2, updatable: 1},
            this.scene
          )
          // line.enableEdgesRendering()
          this.current_edges[name] = line
        }
      });
      // edges to delete
      let from = Math.max(0, this.current_message - this.window_size - msgs_to_update)
      let to = Math.max(0, this.current_message - this.window_size)
      this.current_message += msgs_to_update
      let edges_delete = this.network_data.transactions.slice(
        this.deleted_messages,
        to
      )
      edges_delete.forEach( e => {
        let name = 'line' + e[0] + '-' + e[1]
        console.log('dispose or make thinner', name)
        if (this.current_edges[name].edgesWidth > 1) {
          this.current_edges[name].edgesWidth -= 10
        } else {
          this.current_edges[name].dispose()
        }
      })
      this.deleted_messages += edges_delete.length
    },
    loadBabylon () {
      this.engine = new BABYLON.Engine(this.canvas, true) // Generate the BABYLON 3D engine
      this.engine.stopRenderLoop()
      // Create the scene space
      this.scene = new BABYLON.Scene(this.engine)
      this.scene.onDispose = function() {
        while (document.getElementById("mybut")) {
          document.getElementById("mybut").parentNode.removeChild(document.getElementById("mybut"))
        }
      }

      // Add a camera to the scene and attach it to the canvas
      let camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this.scene)
      // let camera = new BABYLON.ArcRotateCamera('Camera', 0, 0, 2, BABYLON.Vector3.Zero(), this.scene)
      camera.setTarget(BABYLON.Vector3.Zero())
      camera.attachControl(this.canvas, false)
      camera.wheelPrecision = 100
      this.camera = camera

      // Add lights to the scene
      new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), this.scene)
      this.positionNodes()
      this.current_edges = {}
      this.current_message = 0
      this.deleted_messages = 0
      // this.loadEdges(this.window_size)
      this.cur_net = 1
      this.old_edges = []
      this.updateNodes2()
      this.loadEdges2()
      let _this = this
      this.last_time = new Date()
      this.init_time = new Date()
      this.engine.runRenderLoop(function () {
        if (_this.status.playing) {
          _this.current_time = new Date()
          let elapsed = _this.current_time - _this.last_time
          let elapsed_ = _this.current_time - _this.init_time
          // calculation with elapsed_, message_sep,
          // messages_sec and cur_net
          // let msgs_to_update = _this.messages_second * elapsed / 1000
          let msgs_to_update = _this.messages_second * elapsed_ / 1000
          let msgs_to_update_ = msgs_to_update - (_this.cur_net -1) * _this.window_sep
          if (msgs_to_update_ > 0) {
            _this.last_time = new Date()
            // _this.loadEdges(msgs_to_update)
            _this.loadEdges2()
            // _this.updateNodes()
            _this.updateNodes2()
            if (_this.status.highlight_sec) {
              let sec = _this.status.highlight_sec
              _this.highlightSpheresOff()
              _this.highlightNodes(sec, 0)
            }
            if (_this.status.highlight_line) {
              let sec = _this.status.highlight_line
              _this.restoreLine()
              _this.highlightLine('foo')
            }
          }
        }
        _this.scene.render()
      })
      window.addEventListener('resize', function () {
        _this.engine.resize()
      })
      this.highlightMaterial = new BABYLON.StandardMaterial("highMaterial", this.scene)
      this.highlightMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1)
      this.highlightMaterial.alpha = 0.3
      this.status.loaded = 1
    },
    loadCanvas () {
      // this.fetchAnalysisData()
      this.testPost()
    },
    fetchAnalysisData () {
      $.get(
        process.env.flaskURL + '/evolvingNet/someNetId/',
        {},
        this.absorbAnalysisData
      )
    },
    absorbAnalysisData (data) {
      console.log(data)
    }
  },
  mounted () {
    window.md3 = d3
    this.loadNetwork(this.network)
    //this.loadBabylon()
    window.__this = this
    this.canvas = document.getElementById('renderCanvas') // Get the canvas element
    this.textinfo = document.getElementById('netinfoarea')
    var self = this
    window.addEventListener('keypress', function (e) {
      console.log(e, e.code)
      if (e.code == 'KeyI') {
        self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
        let mmesh = self.pickResult.pickedMesh
        if (mmesh && mmesh.mdata) {
          let mdata = mmesh.mdata
          self.textinfo.value += '\n'
          self.textinfo.value += 'snapshot: ' + self.cur_net
          self.textinfo.value += ', node: ' + mmesh.name
          self.textinfo.value += ', degree: ' + mdata.degree + ', clust: ' + mdata.clust.toFixed(3)
          self.textinfo.scrollTop = self.textinfo.scrollHeight
        }
      } else if (e.code == 'KeyS') {
          let st = self.net_snapshots.stats[self.cur_net]
          self.textinfo.value += '\n'
          self.textinfo.value += 'snapshot: ' + self.cur_net
          self.textinfo.value += ', degree mean, std: ' + st.degree_mean.toFixed(3) + ', ' + st.degree_std.toFixed(3)
          self.textinfo.value += ', clust mean, std: ' + st.clust_mean.toFixed(3) + ', ' + st.clust_std.toFixed(3)
          self.textinfo.value += ', hip: ' + st.hip.map( s => s.length )
          self.textinfo.scrollTop = self.textinfo.scrollHeight
      }
    })
  }
}
</script>

<style>
#renderCanvas {
    width   : 750px;
    height  : 85%;
    touch-action: none;
}

.line {
    fill: none;
    stroke: #ffab00;
    stroke-width: 3;
}

.line2 {
    fill: none;
    stroke: #00abff;
    stroke-width: 3;
}

.line3 {
    fill: none;
    stroke: #00ffab;
    stroke-width: 3;
}
  
.overlay {
  fill: none;
  pointer-events: all;
}

/* Style the dots by assigning a fill and stroke */
.dot {
    fill: #ff0000;
    stroke: #fff;
}

.dot2 {
    fill: #00ff00;
    stroke: #fff;
}
  
.dot3 {
    fill: #0000ff;
    stroke: #fff;
}
.focus circle {
  fill: none;
  stroke: steelblue;
}
*{ text-transform: none !important; }
/* vim: set ft=vue: */
</style>
