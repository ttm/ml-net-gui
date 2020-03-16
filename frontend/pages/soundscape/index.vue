<template>
<span>
  <h1>Soundscape analysis -- minimal
    <nuxt-link to="/soundscape/minAbout">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue"></i>
    </nuxt-link>
  </h1>
  <div class="comp">
    sound to be analysed
  <div @click="spec0 = !spec0" class="sbtn">{{spec0 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform" style="border: 1px solid;"></div>
  <div v-show="spec0"  @click="spec0 = false" id="waveform-spec" style="border: 1px solid;"></div>
  <div>
    <v-btn color="success" @click="wss[0].skipBackward()">
      <i class="fa fa-step-backward sspace"></i>
      Backward
    </v-btn>
    <v-btn color="success" @click="wss[0].skipForward()">
      <i class="fa fa-step-forward sspace"></i>
      Forward
    </v-btn>
    <v-btn color="success" @click="play(0)">
      <i class="fa fa-play sspace"></i>
      Play
      /
      <i class="fa fa-pause ssspace"></i>
      Pause
    </v-btn>
    <v-btn color="success" @click="wss[0].regions.clear()">
      <i class="fas fa-broom sspace"></i>
      Clear
    </v-btn>
  </div>
  <v-btn color="warning" @click="analyze()">
    <i class="fas fa-microchip sspace"></i>
    Analyze
  </v-btn>
  <div v-show="analyzed">
  <v-divider style="margin-top:20px;margin-bottom:10px;"></v-divider>
  <div class="comp">
    experpt
      <i class="fa fa-step-backward sspace_" @click="wss[1].skipBackward()"></i>
      <i class="fa fa-step-forward sspace_" @click="wss[1].skipForward()"></i>
      <i class="fa fa-play sspace_" @click="pause(1)"></i>
      <i class="fas fa-broom sspace_" @click="wss[1].regions.clear()"></i>
      <div @click="spec1 = !spec1" class="sbtn">{{spec1 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform2" style="border: 1px solid;"></div>
  <div v-show="spec1"  @click="spec1 = false" id="waveform2-spec" style="border: 1px solid;"></div>

  <div class="comp">
    component 1
      <i class="fa fa-step-backward sspace_" @click="wss[2].skipBackward()"></i>
      <i class="fa fa-step-forward sspace_" @click="wss[2].skipForward()"></i>
      <i class="fa fa-play sspace_" @click="pause(2)"></i>
      <i class="fas fa-broom sspace_" @click="wss[2].regions.clear()"></i>
      <div class="pbtn" @click="selectComp(1)" id="pbtn1"> select </div>
      <div @click="spec2 = !spec2" class="sbtn">{{spec2 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform3" style="border: 1px solid;"></div>
  <div v-show="spec2"  @click="spec2 = false" id="waveform3-spec" style="border: 1px solid;"></div>

  <div class="comp">
    component 2
      <i class="fa fa-step-backward sspace_" @click="wss[3].skipBackward()"></i>
      <i class="fa fa-step-forward sspace_" @click="wss[3].skipForward()"></i>
      <i class="fa fa-play sspace_" @click="pause(3)"></i>
      <i class="fas fa-broom sspace_" @click="wss[3].regions.clear()"></i>
      <div class="pbtn" @click="selectComp(2)" id="pbtn2"> select </div>
      <div @click="spec3 = !spec3" class="sbtn">{{spec3 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform4" style="border: 1px solid;"></div>
  <div v-show="spec3"  @click="spec3 = false" id="waveform4-spec" style="border: 1px solid;"></div>

  <div class="comp">
    component 3:
      <i class="fa fa-step-backward sspace_" @click="wss[4].skipBackward()"></i>
      <i class="fa fa-step-forward sspace_" @click="wss[4].skipForward()"></i>
      <i class="fa fa-play sspace_" @click="pause(4)"></i>
      <i class="fas fa-broom sspace_" @click="wss[4].regions.clear()"></i>
      <div class="pbtn" @click="selectComp(3)" id="pbtn3"> select </div>
      <div @click="spec4 = !spec4" class="sbtn">{{spec4 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform5" style="border: 1px solid;"></div>
  <div v-show="spec4"  @click="spec4 = false" id="waveform5-spec" style="border: 1px solid;"></div>

  <v-btn color="warning" @click="findEvents()">
    <i class="fas fa-microchip sspace"></i>
    find all events of the chosen type chosen
  </v-btn>
  </div>
  <v-progress-circular
      v-show="loading"
      :size="70"
      :width="7"
      color="purple"
      indeterminate
    ></v-progress-circular>
  <v-footer class="pa-3">
    <v-spacer></v-spacer>
    <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
  </v-footer>
</span>
</template>

<script>
import $ from 'jquery'

export default {
  head () {
    return {
      script: [
        { src: 'https://unpkg.com/wavesurfer.js' },
        { src: 'https://unpkg.com/wavesurfer.js/dist/plugin/wavesurfer.regions.js' },
        { src: 'https://unpkg.com/wavesurfer.js/dist/plugin/wavesurfer.spectrogram.js' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css' }
      ],
    }
  },
  data () {
    return {
      analyzed: false,
      spec0: false,
      spec1: false,
      spec2: false,
      spec3: false,
      spec4: false,
      spec5: false,
      loading: false,
    }
  },
  methods: {
    findEvents () {
      let turl = process.env.flaskURL + '/findEvents/'
      if (1) {
        alert('not implemented, we need to find a way to decompose initial audio with the frequency patterns found from the excerpt.')
        return
      }
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            c: this.selectedcomponent,
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( an => {
        this.an2 = an
      })
    },
    selectComp (ind) {
      for (let i = 1; i < 4; i++) {
        if (i === ind) {
          $('#pbtn' + i).css('background-color', '#FFFF77')
        } else {
          $('#pbtn' + i).css('background-color', '#FFFFFF')
        }
        console.log('clicked', ind)
      }
      this.selectedcomponent = ind
    },
    pause (ind) {
      let regs = Object.keys(this.wss[ind].regions.list)
      if (regs.length === 0) {
        this.wss[ind].playPause()
      } else {
        if (this.wss[ind].isPlaying()) {
          this.wss[ind].stop()
        } else {
          let i = (this.rcounter) % regs.length
          let reg = this.wss[ind].regions.list[regs[i]]
          reg.play()
          this.rcounter++
        }
      }
    },
    play (ind) {
      let regs = Object.keys(this.wss[ind].regions.list)
      if (regs.length === 0) {
        this.wss[ind].playPause()
      } else {
        let i = this.rcounter % regs.length
        let reg = this.wss[ind].regions.list[regs[i]]
        reg.play()
        this.rcounter++
      }
    },
    analyze () {
      if (Object.keys(this.wss[0].regions.list).length === 0) {
        alert('click and drag on the waveform to make a region befor analyzing')
        return
      } else if (this.wss.length > 1) {
        for (let i = 1; i < this.wss.length; i++) {
          // this.wss[i].spectrogram.destroy()
          this.wss[i].destroy()
        }
        for (let i = 1; i < this.wss.length; i++) {
          delete this.wss[i]
        }
        this.wss = this.wss.filter(Boolean)
      }
      this.analyzed = false
      this.loading = true
      let regs = Object.keys(this.wss[0].regions.list)
      let i = (this.rcounter - 1) % regs.length
      let reg = this.wss[0].regions.list[regs[i]]
      let [s, e] = [reg.start, reg.end]
      console.log(s, e)
      let turl = process.env.flaskURL + '/anSound/'
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            s: s,
            e: e,
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( an => {
        this.an = an
        this.createWaveform ('birds_.wav', 'waveform2')
        this.createWaveform ('component0.wav', 'waveform3')
        this.createWaveform ('component1.wav', 'waveform4')
        this.createWaveform ('component2.wav', 'waveform5')
        this.analyzed = true
        this.loading = false
      })
    },
    createWaveform (fname, did) {
      let wavesurfer = WaveSurfer.create({
        container: '#' + did,
        waveColor: 'violet',
        progressColor: 'purple',
        scrollParent: true,
        normalize: true,
        plugins: [
          WaveSurfer.regions.create({
            dragSelection: {
                slop: 5
            }
          }),
          WaveSurfer.spectrogram.create({
              wavesurfer: wavesurfer,
              container: "#" + did + '-spec',
              labels: true
          })
        ]
      })
      wavesurfer.load('/audio/' + fname)
      this.wss.push(wavesurfer)
    },
  },
  mounted () {
    this.rcounter = 0
    this.wss = []
    window.__this = this
    this.createWaveform('birds.wav', 'waveform')
  },
}

</script>

<style>
.tbtn {
  background-color: gray;
}
#renderCanvas {
  border: 1px solid;
}
.sspace {
  margin-right: 5px;
}
.ssspace {
  margin-right: 5px;
  margin-left: 5px;
}
.sspace_ {
  margin-right: 0px;
  cursor: pointer;
}
.ssspace_ {
  margin-right: 0px;
  margin-left: 0px;
  cursor: pointer;
}
.abtn {
  width: 10px;
}
.sbtn {
  background-color: #66A;
  float: right;
  padding: 0 3px 0 3px;
  cursor: pointer;
  border: 1px solid;
}
.comp {
  margin-top: 20px;
  margin-bottom:1px;
}
.pbtn {
  display: inline;
  margin-left: 20px;
  border: 1px solid;
  padding-left: 3px;
  padding-right: 3px;
  cursor: pointer;
}
</style>

