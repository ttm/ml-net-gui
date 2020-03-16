<template>
  <div class="text-xs-left">
    <v-dialog
      v-model="dialog"
      width="700"
    >
      <v-btn
        slot="activator"
        color="red lighten-2"
        dark
      >
        Set
      </v-btn>
      <NetSettings ref="netsettings"/>
      <v-layout align-center justify-center row fill-height style="background:#FFFFFF">
        <v-btn color="success" @click="saveAnalysis()">Save</v-btn>
      </v-layout>
    </v-dialog>
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
        @click="renderHistograms()"
      >
        Render histograms
      </v-btn>
      <DrawNetworks v-if="draw_net" 
        :layout="$refs.netsettings.layout"
        :dimensions="$refs.netsettings.dimensions"
        :links="$refs.netsettings.links"
        :layers="$refs.netsettings.layers"
        :method="$refs.netsettings.method"
        :separation="$refs.netsettings.separation"
        :axis="$refs.netsettings.axis"
        :network="$refs.netsettings.network"
      />
      <DrawHistograms v-if="draw_hist"
        :degree="$refs.netsettings.hist.degree"
        :clust="$refs.netsettings.hist.clust"
      />
  </div>
</template>

<script>
import NetSettings from '~/components/network/NetSettings'
import DrawNetworks from '~/components/network/DrawNetwork'
import DrawHistograms from '~/components/network/DrawHistograms'

export default {
  // put basic infos about the network
  // save visualization parameters and resulting data in store
  components: {
    NetSettings,
    DrawNetworks,
    DrawHistograms
  },
  data () {
    return {
      dialog: false,
      draw_net: false,
      draw_hist: false
    }
  },
  methods: {
    renderNetwork () {
      console.log('hahahahiii')
      if (this.draw_net) {
        this.draw_net = false
      } else {
        this.draw_net = true
      }
    },
    renderHistograms () {
      console.log('rendering histograms')
      if (this.draw_hist) {
        this.draw_hist = false
      } else {
        this.draw_hist = true
      }
    },
    saveAnalysis () {
      this.dialog = false
      let set = this.$refs.netsettings
      let aname = set.newname ? set.newname : set.name
      let tobj = {
        layout: set.layout,
        dimensions: set.dimensions,
        links: set.links,
        layers: set.layers,
        method: set.method,
        separation: set.separation,
        network: set.network._id,
        name: aname,
        axis: set.axis
      }
      if (set.newname) {
        this.$store.dispatch('ansettings/create', tobj)
      } else {
        this.$store.dispatch('ansettings/update', [set._id, tobj])
      }
    }
  }
}
// vim: ft=vue
</script>
