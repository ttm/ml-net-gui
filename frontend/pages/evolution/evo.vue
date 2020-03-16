<template>
  <v-container justify-center>
    <h1>ESFNet</h1>
  <div style="border:1px solid black; padding: 4px">
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
    <div style="border:1px solid black; padding: 4px; margin-top:10px;">
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
  <v-layout align-center justify-start row>
      <v-btn
        color="red"
        @click="loadCanvas()"
        :disabled="status_.loaded ? true : false"
      >
        load canvas
      </v-btn>
    </v-layout>
  <canvas id="renderCanvas"></canvas>
  <v-btn outline icon @click="status_.playing ? pause() : play_()" :disabled="!status_.loaded">
    <v-icon v-if="!status_.playing">play_arrow</v-icon>
    <v-icon v-else>pause</v-icon>
  </v-btn>
  <v-btn outline icon @click="rewind()">
    <v-icon>fast_rewind</v-icon>
  </v-btn>
    <textarea
      name="infoareaname"
      width="100%"
      style="width:100%;height:80px;border:solid 1px black"
      id="netinfoarea"
      box
      label="information about the network (editable)"
    >statistics:</textarea>
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

export default {
  data () {
    return {
      network_data: {},
      status_: {
      },
      network: '',
    }
  },
  methods: {
    loadCanvas () {
      // this.fetchAnalysisData()
      // this.testPost()
    },
  },
}
</script>

<style>
#renderCanvas {
    width   : 50%;
    height  : 50%;
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
    fill: #ffab00;
    stroke: #fff;
}

.dot2 {
    fill: #00abff;
    stroke: #fff;
}
  
.dot3 {
    fill: #00ffab;
    stroke: #fff;
}
.focus circle {
  fill: none;
  stroke: steelblue;
}
*{ text-transform: none !important; }
/* vim: set ft=vue: */
</style>
