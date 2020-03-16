<template>
<span>
  <h1>Soundscape analysis -- minimal
    <nuxt-link to="/soundscape/minAbout">
      <i class="fa fa-question-circle mhelp" style="font-size:28px;color:blue"></i>
    </nuxt-link>
  </h1>
  sound file: 
<v-menu offset-y class="setstuff"
>
  <v-btn
    slot="activator"
    color="primary"
  >
    {{ soundfile ? soundfile : 'Loading...' }}
  </v-btn>
  <v-list
    class="scroll-y"
  >
    <v-list-tile
      v-for="(s, index) in soundfiles"
      :key="index"
      @click="soundfile = s"
    >
      <v-list-tile-title color="primary">{{ s }}</v-list-tile-title>
    </v-list-tile>
    <v-list-tile>
<input type="file" @change="upload">
    </v-list-tile>
  </v-list>
</v-menu>
( length: {{ this.lsec ? this.lsec.toFixed(2) + ' seconds' : 'loading...'}} )
  <v-btn color="warning" @click="loadFile()">
    Load
  </v-btn>
  <div class="comp">
    sound to be analysed
  <div @click="spec0 = !spec0" class="sbtn">{{spec0 ? '-' : '+'}} spectrogram</div>
  </div>
  <div id="waveform" style="border: 1px solid;"></div>
  <div v-show="spec0"  @click="spec0 = false" id="waveform-spec" style="border: 1px solid;"></div>
  <div>
    <v-btn color="success" @click="wss[0].skipBackward()" :disabled="!fileloaded">
      <i class="fa fa-step-backward sspace"></i>
      Backward
    </v-btn>
    <v-btn color="success" @click="wss[0].skipForward()" :disabled="!fileloaded">
      <i class="fa fa-step-forward sspace"></i>
      Forward
    </v-btn>
    <v-btn color="success" @click="play(0)" :disabled="!fileloaded">
      <i class="fa fa-play sspace"></i>
      Play
      /
      <i class="fa fa-pause ssspace"></i>
      Pause
    </v-btn>
    <v-btn color="success" @click="wss[0].regions.clear()" :disabled="!fileloaded">
      <i class="fas fa-broom sspace"></i>
      Clear
    </v-btn>
  </div>
  <v-layout row>
    <v-text-field
      v-model="ncomponents"
      type="number"
      :label="'components'"
      class="setstuff3"
    ></v-text-field>
    <v-btn color="warning" @click="analyze()" :disabled="!fileloaded">
      <i class="fas fa-microchip sspace"></i>
      Analyze
    </v-btn>
  </v-layout>
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

<div id='cdiv'>
<div v-for="(comp, index) in parseInt(ncomponents)">
  <div class="comp">
    component {{ index + 1 }}
      <i class="fa fa-step-backward sspace_" @click="wss[index+2].skipBackward()"></i>
      <i class="fa fa-step-forward sspace_" @click="wss[index+2].skipForward()"></i>
      <i class="fa fa-play sspace_" @click="pause(index+2)"></i>
      <i class="fas fa-broom sspace_" @click="wss[index+2].regions.clear()"></i>
      <div class="pbtn" @click="selectComp(index + 1)" v-bind:id="'pbtn' + (index + 1)"> select </div>
      <div @click="specs[index] = !specs[index]" class="sbtn">{{specs[index] ? '-' : '+'}} spectrogram</div>
  </div>
  <div v-bind:id="'waveform' + (index + 3)" style="border: 1px solid;"></div>
  <div v-show="specs[index]"  @click="specs[index] = false" v-bind:id="'waveform' + (index + 3) + '-spec'" style="border: 1px solid;"></div>
</div>
</div>

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
      specs: {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false, 10: false, 11: false, 12: false, 13: false, 14: false, 15: false, 16: false, 17: false, 18: false, 19: false},
      loading: false,
      soundfiles: [],
      soundfile: '',
      lsec: '',
      ncomponents: 3,
      loaded: false,
      fileloaded: false,
    }
  },
  methods: {
    loadFile () {
      for (let i = 0; i < this.wss.length; i++) {
        this.wss[i].destroy()
      }
      this.wss = []
      this.createWaveform(this.soundfile, 'waveform')
      this.fileloaded = true
      this.analyzed = false
    },
    upload (e) {
      this.loading = true
      let reader = new FileReader()
      let file = e.target.files[0]
      reader.onload = () => {
        console.log(reader.result, '<<<<<<< HERE')
        let path = e.path || (e.composedPath && e.composedPath())
        let turl = process.env.flaskURL + '/saveSound/'
        this.mdata = JSON.stringify({
          fname: path[0].files[0].name,
          fdata: reader.result,
        })
        $.ajax(
          turl,
          {
            data: this.mdata,
            contentType : 'application/json',
            type : 'POST',
          },
        ).done( an => {
          this.loading = false
          this.findSoundfiles()
        })
      }
      // reader.readAsBinaryString(file)
      reader.readAsDataURL(file)
    },
    findSoundfiles () {
      let turl = process.env.flaskURL + '/getSoundfiles/'
      console.log('ajax start', turl)
      console.log(turl)
      $.ajax(
        turl,
        {
          data: {},
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( sfs => {
        console.log('ajax end')
        // nets[0].{filename, _id, nnodes, nlinks}
        this.soundfiles = sfs
        this.soundfile = this.soundfiles[0]
      })
    },
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
      for (let i = 1; i < this.ncomponents + 1; i++) {
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
        alert('click and drag on the waveform to make a region before analyzing')
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
      this.loaded = true
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            fname: this.soundfile,
            s: s,
            e: e,
            ncomp: this.ncomponents
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( an => {
        this.an = an
        let efn = this.soundfile.replace('.wav', 'MMMEXCERPT.wav')
        this.createWaveform (efn, 'waveform2')
        for (let i = 0; i < this.ncomponents; i++) {
          let cfn = this.soundfile.replace('.wav', 'MMMCOMPONENT' + i + '.wav')
          this.createWaveform (cfn, 'waveform' + (i + 3))
          this.specs[i] = false
        }
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
  watch: {
    soundfile (val) {
      this.lsec = ''
      let turl = process.env.flaskURL + '/sfileInfo/'
      $.ajax(
        turl,
        // {see: 'this', and: 'thisother', num: 5}
        {
          data: JSON.stringify({
            fname: this.soundfile
          }),
          contentType : 'application/json',
          type : 'POST',
        }
      ).done( duration => { 
        this.lsec = duration
      })
    },
  },
  mounted () {
    this.rcounter = 0
    this.wss = []
    window.__this = this
    this.findSoundfiles()
    // this.createWaveform('birds.wav', 'waveform')
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
.setstuff3 {
  width: 10px;
  flex: 0.1 1 auto;
}
</style>

