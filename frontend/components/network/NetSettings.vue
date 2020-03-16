<template>
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
          v-for="(net, index) in networks"
          :key="index"
          @click="network = net"
        >
          <v-list-tile-title color="primary">{{ net.filename }}</v-list-tile-title>
        </v-list-tile>
        <v-list-tile>
    <input id="selectFotos" type="file" @change="upload">
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
      <v-btn v-if="name && name !== 'new'" color="success" @click="cloneSettings(set)">Clone settings</v-btn>
    </v-flex>
</v-layout>
<v-expansion-panel>
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
            @click="method = met"
          >
            <v-list-tile-title color="primary">{{ met }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-flex>
    <v-flex xs4 order-md2 order-xs2 center>
      <v-text-field
        :label="'Layers'"
        :left="true"
        v-model="layers"
        type="number"
        style="width:80px"
        min="0"
      ></v-text-field>
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
    <v-flex xs5 order-md1 order-xs1 center>
      Axis of coarsened networks:
        <v-menu offset-y>
          <v-btn
            slot="activator"
            color="primary"
            dark
          >
          {{ axis ? axis : 'Select' }}
          </v-btn>
          <v-list>
            <v-list-tile
              v-for="(ax, index) in axis_"
              :key="index"
              @click="axis = ax"
            >
              <v-list-tile-title color="primary">{{ ax }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
    </v-flex>
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
</template>

<script>
export default {
  data () {
    return {
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
      layers: 2,
      methods: [
        'kclicks',
        'label propagation',
        'connected components'
      ],
      method: 'label propagation',
      separation: 0.3,
      axis: 'y',
      axis_: [
        'x',
        'y',
        'z'
      ],
      networks: [],
      network: '',
      name: 'new',
      newname: '',
      settings: [],
      hist: {
        degree: false,
        clust: false
      }
    }
    // method, sep, axis
  },
  methods: {
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
        this.networks = networks_.filter(i => i.layer === 0)
      })
    },
    findSettings () {
      this.$store.dispatch('ansettings/find').then(() => {
        this.settings = this.$store.getters['ansettings/list']
        this.settings.push({name: 'new'})
      })
    },
    loadSettings (set) {
      this.asetting = set
      this.name = set.name
      this.layout = set.layout
      this.dimensions = set.dimensions
      this.links = set.links
      this.layers = set.layers
      this.method = set.method
      this.separations = set.separation
      this.axis = set.axis
      this.network = set.networkObj
      this._id = set._id
    },
    cloneSettings (set) {
      this.newname = this.name + '_'
      this.name = 'new'
    }
  },
  watch: {
    name () {
      console.log('set is new')
    }
  },
  created () {
    this.findNetworks()
    this.findSettings()
  }

}
</script>

<style>
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
/* vim: set ft=vue: */
</style>

