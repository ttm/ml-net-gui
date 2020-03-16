<template>
  <span>
    <h1>
      {{ urlstring, statemsg }}
    </h1>
    <h3>
      (MyNSA: {{urlstring2}})
    </h3>
<p>Um vértice para da rede, se clicar na rede, abre ela.</p>
<p>Abre criando um estado que ficará como #asodij, ou como for criado.</p>
  </span>
</template>

<script>
import $ from 'jquery'

export default {
  data () {
    return {
      urlstring: this.$nuxt.$route.params.urlized,
      urlstring2: '',
      name: '',
      mstate: {},
      statemsg: 'getting data from server (WAIT)...'
    }
  },
  methods: {
    getRelated (name) {
      let name__ = name.toLowerCase()
      let name_ = name__.split(' ')
      this.urlstring2 = name__
      // ask for stats && potential networks && all related networks in a graph
      // listar alias potenciais p nomes:
      // fabri fabbri, etc
      if (name.startsWith('fb--')) {
        this.fbnet = true
      } else {
        this.fbnet = false
      }
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsa/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            name__: name__,
            name_: name_,
            name: name,
            fbnet: this.fbnet
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( minfo => { 
        this.minfo = minfo
        this.mid = minfo.mid
      })
    },
    startState () {
      // start new state of interface and history of user actions
      this.mstate.mounted = 'finished'
      this.mstate.modified = false
      this.statemsg = 'your session has started! Click and write, and comeback (WAIT)...'
    },
    vmapRelated () {
      this.statemsg = 'data from server received, placing visual elements (WAIT)...'
      // put visual information
      // about the data obtained from getRelated() and infoRelated()
      // initial JS computations.
      // html elements are shown.
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsaLog/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            mid: this.mid,
            maction: 'vplot',
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( data => { 
        this.serverlog2 = data
      })
    },
    infoRelated () {
      this.statemsg = 'data from server received, placing text (WAIT)...'
      // put textual
      // information about the name and data obtained from getRelated()
      // initial JS computations.
      // html elements are shown.
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsaLog/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            mid: this.mid,
            maction: 'textplot',
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( data => { 
        this.serverlog = data
      })
    },
  },
  mounted () {
    this.mstate.mounted = 'started'
    window.__this = this
    // this.name_ = this.urlstring.replace(/([a-zA-Z]) ([a-zA-Z])/g, '$1 $2')
    if (this.urlstring)
      this.name = this.urlstring.replace(/([a-z])([A-Z])/g, '$1 $2')
    this.getRelated(this.name)
    this.infoRelated()
    this.vmapRelated()
    this.startState()
  },
}
</script>
