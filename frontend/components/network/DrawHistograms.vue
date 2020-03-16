<template>
  <v-container grid-list-md text-xs-center>
    <v-layout row wrap>
      <v-flex xs12>
        Histograms
      </v-flex>
      <v-flex :key="61" xs6>
        <div  v-if="degree">
          <v-card dark color="secondary">
            <v-card-text class="px-0">degree</v-card-text>
          </v-card>
          <div id="degreehist"></div>
        </div>
      </v-flex>
      <v-flex :key="62" xs6>
        <div v-if="clust">
        <v-card dark color="secondary">
          <v-card-text class="px-0">clust</v-card-text>
        </v-card>
        <div id="clusthist"></div>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import * as d3 from 'd3'

export default {
  data () {
    return {
      histMade: {
        degree: false,
        clust: false
      }
    }
  },
  props: ['degree', 'clust'],
  mounted () {
    this.createData()
    this.mkHist('degree')
    this.mkHist('clust')
    window.md3 = d3
  },
  methods: {
    createData () {
      this.adata = []
      for (let i = 0; i < 20; i++) {
        this.adata.push({x: i, y: Math.random()})
      }
    },
    mkHist (measureName) {
      console.log('mkhist')
      if (!this.histMade[measureName]) {
        let did = 'foo'
        if (measureName === 'degree') {
          did = '#degreehist'
        } else if (measureName === 'clust') {
          did = '#clusthist'
        }
        const self = this
        let height = this.height || this.$vuetify.breakpoint.height
        let width = this.width || this.$vuetify.breakpoint.width
        let vb = -width / 4 + ' ' + -height / 2 + ' ' + width / 2 + ' ' + height
        this.svg = d3.select(did).append('svg')
          .attr('width', '50%')
          .attr('height', height)
          .attr('viewBox', vb)

        this.svg.append('circle')
          .attr('r', 40)
          .attr('fill', self.$vuetify.theme.primary)
          .attr('stroke', '#00426f')
          .attr('stroke-width', '5px')
          .append('svg:title')
          .text('acompanhando')
        this.histMade[measureName] = true
      }
    },
    mkHist2 (measureName) {
      if (!this.histMade[measureName]) {
        let did = 'foo'
        if (measureName === 'degree') {
          did = '#degreehist'
        } else if (measureName === 'clust') {
          did = '#clusthist'
        }
        let margin = {top: 20, right: 20, bottom: 30, left: 40}
        let height = this.height || this.$vuetify.breakpoint.height
        height -= margin.top + margin.bottom
        console.log(did)
        let svg = d3.select(did).append('svg')
          .attr('width', '50%')
          .attr('height', height)
        let width = +svg.attr('width') - margin.left - margin.right
        console.log('width', width)
        window.msvg = svg
      }
    }
  }
}
</script>

