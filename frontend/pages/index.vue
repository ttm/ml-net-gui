<template>
  <div>
    <v-btn class="red" to="evolution">Evolution</v-btn>
    <v-btn class="pink" to="text">Text</v-btn>
    <v-btn class="purple" to="multilevel">Multilevel</v-btn>
    <v-btn class="blue" to="bio">Gene</v-btn>
    <v-btn class="green" to="communicability">Communicability</v-btn>
    <v-btn class="orange" to="multilevel2/interpolated">Multilevel 2D interpolated</v-btn>
    <v-btn class="teal" to="multilevel2/topdown">Multilevel 2D topdown</v-btn>
    <v-btn class="brown" to="multilevel2/topdown2">Multilevel 2D topdown v2</v-btn>
    <v-btn class="yellow" to="pixiii">mpixi</v-btn>
  </div>
</template>

<script>
import Tone from 'tone'

export default {
  data () {
    return {
      something: 10,
    }
  },
  methods: {
    sporkThing () {
      this.synth.triggerAttackRelease('C4', 0.5, 0)
      this.synth.triggerAttackRelease('E4', 0.5, 1)
      this.synth.triggerAttackRelease('G4', 0.5, 2)
      this.synth.triggerAttackRelease('B4', 0.5, 3)
      this.synth2.triggerAttackRelease('C5', 0.5, 4)
      this.synth3.triggerAttackRelease('E4', 0.3, 4)
      this.synth4.triggerAttackRelease('G4', 0.6, 4)
      this.synth5.triggerAttackRelease('C4', 0.8, 5)
      this.synth.triggerAttackRelease('B4', 0.5, 4.5)
      this.synth.triggerAttackRelease('A4', 0.7, 5)
    },
    initSynths () {
      this.synth = new Tone.Synth().toMaster()
      this.synth2 = new Tone.Synth().toMaster()
      this.synth3 = new Tone.Synth().toMaster()
      this.synth4 = new Tone.Synth().toMaster()
      this.synth5 = new Tone.Synth().toMaster()
    },
  },
  mounted () {
    window.__this = this
    this.initSynths()
    this.sporkThing()
  },
}
</script>
