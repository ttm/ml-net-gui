<template>
  <v-btn
    :loading="loading"
    :disabled="loading"
    class="jbtn-file"
  >
    {{text ? text : ''}}
    <input id="selectFotos" type="file" @change="upload">
  </v-btn>
</template>

<script>

export default {
  data () {
    return {
      text: 'accepted formats: gml (gdf is being implemented) ',
      loading: false
    }
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
        })
      })
    }
  }
}
// vim: ft=vue
</script>

