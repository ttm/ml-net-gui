<template>
  <span>
    <h1>{{ urlstring }}
    (MyNSA: {{urlstring2}})</h1>

    <p>
    Page for hidden pages. Index (without the URLs):
    <ul>
      <li>
        To update available data from LOSD (e.g. names).
      </li>
      <li>
      </li>
      <li>
      </li>
      <li>
      </li>
    </ul>
    </p>
  </span>
</template>

<script>
export default {
  data () {
    return {
      urlstring: this.$nuxt.$route.params.urlized,
      urlstring2: '',
      name: '',
      msg: '',
    }
  },
  methods: {
    getRelated(name) {
      let name__ = name.toLowerCase()
      let name_ = name__.split(' ')
      this.urlstring2 = name__
      // ask for stats && potential networks && all related networks in a graph
      // listar alias potenciais p nomes:
      // fabri fabbri, etc
    },
  },
  mounted () {
    window.__this = this
    // this.name_ = this.urlstring.replace(/([a-zA-Z]) ([a-zA-Z])/g, '$1 $2')
    if (this.urlstring) {
      this.name = this.urlstring.replace(/([a-z])([A-Z])/g, '$1 $2')
    } else {
      this.msg = 'Page for hidden pages. Index (without the URLs): '
    }
    this.getRelated(this.name)
  },
}
</script>
