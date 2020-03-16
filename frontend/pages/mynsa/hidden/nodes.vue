<template>
  <span>
    <h1>
      Nós, Nodes (MyNSA)
    </h1>
    <h3>
    </h3>
    <ul>
      <li>
        List all nodes in current LOSD (maybe only FB for now). 
      </li>
      <li>
        Maybe stats and names of special sets of participants,
        about whole network.
      </li>
      <li>
        Link to MyNSA base URL, where the networks are nodes.
      </li>
    </ul>
    <div>
      Participants: {{ npart }}, Friendships: {{ nrel }}, Interactions: 3,030,433<br /> 
      Data contributions: {{ nsnap }},
      <br />
63 are ego snapshots, 54 are group snapshots; 50 have interaction links, 89 have friendship links; 43 have text content associated to participant activity.

      <br />
      Facebook data donations: {{ nsnapfb }}
    </div>
    <br />
    <div v-if="mset && mset.mmount">
      Total timing: {{ (mset.mvmapt - mset.mstartt).toFixed(3) }}s reach 100%.
      Mounted start: {{ (mset.mrequestt - mset.mstartt).toFixed(3) }}s,<br /> 
      Data callback: {{ (mset.mdatat - mset.mrequestt).toFixed(3) }}s,<br /> 
      Text info: {{ (mset.minfot - mset.mdatat).toFixed(3) }},<br /> 
      Visual mapping: {{ (mset.mvmapt - mset.minfot).toFixed(3) }}<br /> 
    </div>
    <br />
    <div>
      canvas with whole network reduced to ~10 participants and N superparticipants.
    </div>
  </span>
</template>

<script>
import $ from 'jquery'
function formatInt (tint_) {
  let tint = tint_.toString()
  let s = ''
  for (let i = 0; i < tint.length; i++) {
    if (i % 3 === 0 && i !== 0)
      s += ','
    s += tint[tint.length - i - 1]
  }
  let ss = s.split("")
  console.log(ss)
  ss.reverse()
  console.log(ss)
  return ss.join("")
}

export default {
  data () {
    return {
      mcreatedt: 1, // performance.now(),
      npart: 'loading...',
      nrel: 'loading...',
      nsnap: 'loading...',
      nsnapfb: 'loading...',
    }
  },
  methods: {
    getAllNodes () {
      this.requestTime = performance.now()
        this.$store.dispatch('mynsa/patch', [this.mset._id, {
          mrequestt: this.requestTime / 1000,
        }])
      $.ajax(
        // `http://rfabbri.vicg.icmc.usp.br:5000/communicability/`,
        process.env.flaskURL + '/mynsa/',
        // `http://127.0.0.1:5000/communicability/`,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            name_: ['all', 'nodes']
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( data => { 
        this.serverlog = data
        this.alldata = data.all.more_
        let a = this.alldata
        this.npart =   formatInt( a[2] )
        this.nrel =    formatInt( a[3] )
        this.nsnap =   formatInt( a[0].length )
        this.nsnapfb = formatInt( a[1].length )

        this.dataTime = performance.now()
        this.$store.dispatch('mynsa/patch', [this.mset._id, {
          mdatat: this.dataTime / 1000,
        }])
        this.mInfo()
        this.mVMap()
      })
    },
    startState () {
      this.startTime = performance.now()
      // before sending to the server for calculations
      // timestamp is given by the server
      this.$store.dispatch('mynsa/create', {
        mcreatedt: this.mcreatedt,
        mstartt: this.startTime / 1000,
        mtype: 'allnodes',
        mmount: false,
      }).then( res => {
        this.mset = res
        this.getAllNodes()
      })
    },
    mInfo () {
      this.infoTime = performance.now()
      this.$store.dispatch('mynsa/patch', [this.mset._id, {
        minfot: this.infoTime / 1000,
      }])
    },
    mVMap () {
      this.mvmapTime = performance.now()
      this.$store.dispatch('mynsa/patch', [this.mset._id, {
        mvmapt: this.mvmapTime / 1000,
        mmount: true,
      }])
    },
  },
  mounted () {
    this.startState()
    window.__this = this
  },
}
</script>

