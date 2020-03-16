<template>
  <div>
      <div>
        Transport time: <span id='seconds'>0</span> sec
      </div>
      <div>
        AudioContext time: <span id='time'>0</span> sec
      </div>
      <div id="blackdiv">
        BLACK DIV
      </div>
      <div id="reddiv">
        RED DIV
      </div>
      <div id="renderCanvas"></div>
  </div>
</template>

<script>
// with all the basic stuff in https://tonejs.github.io
// qua out  2 22:59:24 -03 2019
import Tone from 'tone'
import $ from 'jquery'
import * as d3 from 'd3'

function updateTime () {
  requestAnimationFrame(updateTime)
  //the time elapsed in seconds
  document.querySelector('#seconds').textContent = Tone.Transport.seconds.toFixed(2)
  //the AudioContext time
  document.querySelector('#time').textContent = Tone.context.currentTime.toFixed(2)
}

function clickNode () {
  console.log('click - pid: ' + this.pid)
  if (this.mpath.length == 6) { // triangle, firth pivot
    __this.synths.poly.triggerAttack(['C4', 'E4', 'G4', 'B4']) 
  } else if (this.mpath.length == 8) { // square, second pivot
    __this.synths.poly.triggerAttack(['C4', 'C2', 'G6', 'A4']) 
  } else {
    __this.synths.poly.triggerAttack(['C2', 'D2', 'B2', 'F2']) 
  }
}
function releaseNode () {
  console.log('release - pid: ' + this.pid)
  if (this.mpath.length == 6) { // triangle, firth pivot
    __this.synths.poly.triggerRelease(['C4', 'E4', 'G4', 'B4']) 
  } else if (this.mpath.length == 8) { // square, second pivot
    __this.synths.poly.triggerRelease(['C4', 'C2', 'G6', 'A4']) 
  } else {
    __this.synths.poly.triggerRelease(['C2', 'D2', 'B2', 'F2']) 
  }
}
function releaseNode2 () {
  // console.log('release2 - pid: ' + this.pid)
}
function moveNode () {
  // console.log('move - pid: ' + this.pid)
}

export default {
  head () {
    return {
      script: [
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
        { src: '/libs/vue-color.min.js' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-AMS_HTML' },
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' },
      ],
    }
  },
  data () {
    return {
      a: 0,
      b: 3,
      c: 7,
      s: '',
      note: 'C2',
      freq: 200,
      x: 0,
      y: 0,
      x2: 0,
      y2: 0,
      r: 0,
      c: 0xFF0000,
    }
  },
  mounted () {
    window.__this = this
    this.Tone = Tone
    this.mInit()
  },
  methods: {
    mInit () {
      if (typeof PIXI === 'undefined') {
        let ele = document.createElement("script");
        let scriptPath = "http://" + window.location.host + "/libs/pixi5.0.2.js"
        ele.setAttribute("src",scriptPath)
        document.head.appendChild(ele)
        console.log(scriptPath)
        $.ajax({
          url: scriptPath,
          dataType: 'script',
          async: true,
          success: () => {
            this.mAfterInit()
        }})
      } else {
        this.mAfterInit()
      }
    },
    mAfterInit () {
        this.startDAW()
        this.initPixi()
        this.sporkLoop()
        this.sporkLoop2()
        // this.sporkThing()
        this.mGetData() // then start stuff with data ?
    },
    startDAW () {
      updateTime()
      Tone.Transport.bpm.value = 120
      //set the transport to repeat
      Tone.Transport.loopEnd = '1m'
      Tone.Transport.loop = true
      document.getElementById('blackdiv')
        .onclick = e => {
          Tone.Transport.toggle()
      }
      Tone.Transport.toggle()
      this.initSynths()
    },
    initPixi () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth_ = document.getElementsByTagName('canvas')[0].width
      this.cheight_ = document.getElementsByTagName('canvas')[0].height
      this.cwidth =  0.9 * document.getElementsByTagName('canvas')[0].width
      this.cheight = 0.9 * document.getElementsByTagName('canvas')[0].height
      // document.getElementById('toolbar').style.width = this.cwidth_ + 'px'
      this.initGraphics()
    },
    initSynths () {
      this.synth = new Tone.Synth().toMaster()
      this.synth2 = new Tone.Synth().toMaster()
      this.synth3 = new Tone.Synth().toMaster()
      this.synth4 = new Tone.Synth().toMaster()
      this.synth5 = new Tone.Synth().toMaster()
      this.initCustomSynths()
    },
    initCustomSynths () {
      this.synths = {}
      this.initToneSynth()
      this.initChordSynth()
      this.initDistSynth()
      this.initPWMSynth()
    },
    initGraphics () {
      this.mkPaths()
      this.drawPivots()
    },
    drawPivots () {
      // use draw pivots
      this.pivot = this.drawSomething()
      this.pivot2 = this.drawSomething(this.pathrect)
      this.pivot2.tint = 0xFFFF00
      this.pivot3 = this.drawSomething(this.pathhex)
      this.x = this.pivot.x
      this.y = this.pivot.y
      this.x2 = this.pivot2.x
      this.y2 = this.pivot2.y
      this.c = this.pivot3.tint
      this.r = this.pivot3.rotation
      this.pivot3.scale.set(4)
      this.pivot2.scale.set(2)
      this.pivot.scale.set(4)

      // c_r pivots c e r
      // x, x2, pivots x e x2, pid = c, r, x, x2, 
      // aí inicializa aqui a variavel com o parametro do Something()
      // e sinca colocando no loop, evento, ou o que for
      // e no watch como quiser
      // computed? TTM
      // aperta bbte é p acumular, aperta pouco é p soltar:
      // do-in p ux?
    },
    mGetData () {
      let turl = process.env.flaskURL + '/mGadget/'
      let nodes = ['asd', 4, [33.4, 'tyu']]
      let links = [1,2,3,4]
      $.ajax(
        turl,
        {
          data: JSON.stringify({
            layout: 'spring',
            dim: 2,
            nodes: nodes,
            links: links,
            first: true,
            lonely: false,
            l0: []
          }),
          contentType : 'application/json',
          type : 'POST',
        },
      ).done( mdata => {
        this.manageData(mdata)
      })
    },
    manageData (mdata) {
      Tone.Transport.bpm.value = mdata.something + 60
      this.note = 'E' + (mdata.all[2] - 1)
      this.freq = mdata.all[0] + 200
      this.sporkLoop3()
      this.sporkPart()
      this.sporkFilterLoop()
      this.mdata = mdata
      // parametrize PIXI and Tone with data
      // start more studd
      // spork some widgets
    },
    initChordSynth () {
      //creates 4 instances of the Tone.Synth
      var polySynth = new Tone.PolySynth(4, Tone.Synth).toMaster()
      this.synths.poly = polySynth
    },
    initToneSynth () {
      let synthA = new Tone.Synth({
        oscillator: {
          type: 'fmsquare',
          modulationType: 'sawtooth',
          modulationIndex: 3,
          harmonicity: 3.4
        },
        envelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.1,
          release: 0.1
        }
      }).toMaster()

      let synthB = new Tone.Synth({
        oscillator: {
          type: 'triangle8'
        },
        envelope: {
          attack: 2,
          decay: 1,
          sustain: 0.4,
          release: 4
        }
      }).toMaster()
      $( "#reddiv" ).mousedown( () => {
        synthA.triggerAttack(this.note)
        synthB.triggerAttack('C4')
        this.synths.filter[1].frequency.setValueAtTime('B5', 0)
        this.synths.filter[0].volume.linearRampToValueAtTime(20, 2)
        this.synths.filter[0].volume.linearRampToValueAtTime(-Infinity, 3)
        console.log('down')
      });
      $( "#reddiv" ).mouseup( () => {
        synthA.triggerRelease()
        synthB.triggerRelease()
        console.log('up')
      });
      this.synths.tone = [
        synthA,
        synthB,
      ]
    },
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
    sporkLoop () {
      let synth = new Tone.PluckSynth().toMaster()

      //this function is called right before the scheduled time
      self = this
      function triggerSynth (time){
        //the time is the sample-accurate time of the event
        synth.triggerAttackRelease(self.note, '8n', time)
        self.x2 += 40 * (Math.random() -0.5)
        self.y2 += 40 * (Math.random() -0.5)
        self.synths.dist.triggerAttack(['C4', 'E4', 'G4', 'B4'])
      }

      Tone.Transport.schedule(triggerSynth, 0)
      Tone.Transport.schedule(triggerSynth, '0:2')
      Tone.Transport.schedule(triggerSynth, '0:2:2.5')
    },
    sporkLoop2 () {
      let synth = new Tone.MetalSynth().toMaster()

      let self = this
      function triggerSynth(time){
        // synth.frequency = self.freq
        synth.triggerAttackRelease('16n', time)
        self.x += 10 * (Math.random() -0.5)
        self.y += 10 * (Math.random() -0.5)
        self.synths.dist.triggerRelease(['C2', 'E2', 'G2', 'B4'])
      }

      Tone.Transport.schedule(triggerSynth, 0)
      Tone.Transport.schedule(triggerSynth, 2 * Tone.Time('8t'))
      Tone.Transport.schedule(triggerSynth, Tone.Time('4n') + Tone.Time('8t'))
      Tone.Transport.schedule(triggerSynth, Tone.Time('4n') + 2 * Tone.Time('8t'))
      Tone.Transport.schedule(triggerSynth, Tone.Time('0:2') + Tone.Time('8t'))
      Tone.Transport.schedule(triggerSynth, Tone.Time('0:3') + Tone.Time('8t'))
      this.synth2_ = synth
    },
    sporkLoop3 () {
      let synth = new Tone.MembraneSynth().toMaster()

      //create a loop
      let self = this
      let loop = new Tone.Loop(function(time){
        synth.triggerAttackRelease("C1", "8n", time)
        self.synths.pwm.start()
      }, "4n")

      //play the loop between 0-2m on the transport
      loop.start(0).stop('2m')
    },
    sporkPart () {
      let synth = new Tone.Synth().toMaster()

      //pass in an array of events
      let self = this
      let part = new Tone.Part(function(time, event){
        //the events will be given to the callback with the time they occur
        synth.triggerAttackRelease(event.note, event.dur, time)
        self.r += (Math.random() -0.5) * Math.PI
        self.c += 0x00FFF0
        self.synths.pwm.stop()
      }, [
        { time : 0, note : 'C8', dur : '4n'},
        { time : {'4n' : 1, '8n' : 1}, note : 'E2', dur : '8n'},
        { time : '2n', note : 'G7', dur : '16n'},
        { time : {'2n' : 1, '8t' : 1}, note : 'B4', dur : '4n'}
      ])

      //start the part at the beginning of the Transport's timeline
      part.start(0)

      //loop the part 3 times
      part.loop = 3
      part.loopEnd = '1m'
    },
    mkPaths () {
      this.radius = 10
      this.dx = Math.cos(Math.PI/6) * this.radius
      this.dy = Math.sin(Math.PI/6) * this.radius
      let p1x = 0
      let p1y = - this.radius
      let p2x = + this.dx
      let p2y = + this.dy
      let p3x = - this.dx
      let p3y = + this.dy
      this.path = [p1x, p1y, p2x, p2y, p3x, p3y]
      let r = this.radius
      this.pathrect = [-r, -r, -r, r, r, r, r, -r]
      let an = Math.PI/3
      let s = Math.sin(an)
      let c = Math.cos(an)
      this.pathhex = [
        r, 0,
        r*c, -r*s,
        -r*c, -r*s,
        -r, 0,
        -r*c, r*s,
        r*c, r*s
      ]
    },
    drawSomething (path=false) {
      if (!path) {
        path = this.path
      }
      let v = new PIXI.Graphics()
      let c = this.getCenter()
      v.x=c.x
      v.y=c.y
      v.beginFill(0xFFFFFF)
      v.drawPolygon(path)
      v.endFill()
      v.tint = 0xFF0000
      v.interactive = true
      v.mpath = path
      this.app_.stage.addChild(v)
      return v
        .on('pointerdown', clickNode)
        .on('pointerup', releaseNode)
        .on('pointerupoutside', releaseNode2)
        .on('pointermove', moveNode)
    },
    getCenter () {
      let s = this.app_.stage
      let c = {
        x: (this.cwidth_ - 2*s.x) / (2*s.scale.x),
        y: (this.cheight_ - 2*s.y) / (2*s.scale.y)
      }
      return c
    },
    initDistSynth () {
      let distortion = new Tone.Distortion(120)
      let tremolo = new Tone.Tremolo(230).start()

      let polySynth = new Tone.PolySynth(4, Tone.Synth).chain(distortion, tremolo, Tone.Master)

      this.synths.dist = polySynth
    },
    initPWMSynth () {
      //a pwm oscillator
      let pwm = new Tone.PWMOscillator("Bb3").toMaster()
      pwm.volume.value = -110
      this.synths.pwm = pwm
    },
    sporkFilterLoop () {
      //a pwm oscillator
      let filter = new Tone.Filter({
        type : 'bandpass',
        Q : 12
      }).toMaster()

      //schedule a series of frequency changes
      filter.frequency.setValueAtTime('C5', 0)
      filter.frequency.setValueAtTime('E5', 0.5)
      filter.frequency.setValueAtTime('G5', 1)
      filter.frequency.setValueAtTime('B5', 1.5)
      filter.frequency.setValueAtTime('C6', 2)
      filter.frequency.linearRampToValueAtTime('C1', 3)

      let noise = new Tone.Noise("brown").connect(filter).start(0).stop(3)

      //schedule an amplitude curve
      noise.volume.setValueAtTime(-20, 0)
      noise.volume.linearRampToValueAtTime(20, 2)
      noise.volume.linearRampToValueAtTime(-Infinity, 3)
      this.synths.filter = [noise, filter]

      function triggerSynth(time){
        filter.frequency.setValueAtTime('C5', time)
        filter.frequency.setValueAtTime('B3', time + 2)
        filter.frequency.linearRampToValueAtTime('C6', time + 4)
        noise.volume.setValueAtTime(-20, time)
        noise.volume.linearRampToValueAtTime(20, time + 2)
        noise.volume.linearRampToValueAtTime(20, time + 3)
        noise.volume.linearRampToValueAtTime(-Infinity, time + 6)
        // synth.frequency = self.freq
      }
      Tone.Transport.schedule(triggerSynth, 0)
    },
  },
  watch: {
    x (val) {
      this.pivot.x = val
      if (Math.random() < 0.1) {
        let k = 'ABCDEFG'[Math.floor(6 * Math.random())]
        let o = 1 + Math.floor(6 * Math.random())
        let n = k + o
        console.log('note changed: ', this.note)
        this.note = n
      }
    },
    y (val) {
      this.pivot.y = val
    },
    x2 (val) {
      this.pivot2.x = val
    },
    y2 (val) {
      this.pivot2.y = val
    },
    r (val) {
      this.pivot3.rotation += val
      this.pivot3.scale.x *= (val * 0.1)
      this.pivot3.scale.y /= (val * 0.1)
    },
    c (val) {
      this.pivot3.tint += val
    },
  },
}
</script>

<style>
#reddiv {
  border: 1px solid red;
  background-color: red;
  width: 5%;
}#blackdiv {
  border: 1px solid red;
  background-color: black;
  width: 5%;
}
</style>
