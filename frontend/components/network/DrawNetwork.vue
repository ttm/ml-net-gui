<template v-scroll:#scroll-target="onScroll" class="scroll-y">
  <v-content>
    <canvas id="renderCanvas" touch-action="none"></canvas>
  </v-content>
</template>

<script>
import * as BABYLON from 'babylonjs'
// import 'babylonjs-loaders'
import $ from 'jquery'

export default {
  data () {
    return {
      methods: {
        'kclicks': 'kclick',
        'label propagation': 'lab',
        'connected components': 'cp'
      },
      axis_: {
        'x': '0',
        'y': '1',
        'z': '2'
      }
    }
  },
  props: ['layout', 'dimensions', 'links', 'layers', 'method', 'separation', 'axis', 'network'],
  mounted () {
    this.canvas = document.getElementById('renderCanvas') // Get the canvas element
    this.engine = new BABYLON.Engine(this.canvas, true) // Generate the BABYLON 3D engine

    $.get(
      `http://127.0.0.1:5000/netlevelsDB/${this.network._id}/${this.layout}/${this.dimensions}/${this.layers}/${this.methods[this.method]}/${this.separation}/${this.axis_[this.axis]}/`,
      {},
      this.stablishScene
    )
    let self = this
    window.addEventListener('keypress', function (e) {
      console.log(e, e.code)
      if (e.code == 'KeyI') {
        self.pickResult = self.scene.pick(self.scene.pointerX, self.scene.pointerY)
        let mmesh = self.pickResult.pickedMesh
        window.mmesh = mmesh
        if (mmesh && mmesh.mdata) {
          let mdata = mmesh.mdata
          self.textinfo.value += '\n'
          self.textinfo.value += 'frame: ' + self.cur_net
          self.textinfo.value += ', node: ' + mmesh.name
          self.textinfo.value += ', degree: ' + mdata.degree + ', clust: ' + mdata.clust
          self.textinfo.scrollTop = self.textinfo.scrollHeight
        }
      } else if (e.code == 'KeyS') {
      }
    })
  },
  methods: {
    stablishScene2 (network) {
      console.log('ok man', network)
    },
    stablishScene (network) {
      window.mnet = network
      this.createScene(network)

      let selff = this
      this.engine.runRenderLoop(function () {
        selff.scene.render()
      })
      window.addEventListener('resize', function () {
        selff.engine.resize()
      })
    },
    createScene (networks) {
      // Create the scene space
      this.scene = new BABYLON.Scene(this.engine)

      // Add a camera to the scene and attach it to the canvas
      var camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this.scene)
      camera.attachControl(this.canvas, true)
      camera.wheelPrecision = 100

      // Add lights to the scene
      let ll = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this.scene)
      console.log(ll)
      // light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

      // Add and manipulate meshes in the scene
      // var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:2}, scene);
      var spheres = []
      for (let j = 0; j < networks.length; j++) {
        var nodes = networks[j].nodes
        var edges = networks[j].edges

        for (let i = 0; i < nodes.length; i++) {
          let node = nodes[i]
          let sphere = BABYLON.MeshBuilder.CreateSphere('sphere' + i, {diameter: 0.02}, this.scene)
          sphere.position = new BABYLON.Vector3(node[0], node[1], node[2] + j * 0.3)
          sphere.nodeid = i
          sphere.degree = networks[j].degrees[i]
          sphere.clust = networks[j].clust[i]
          spheres.push(sphere)
        }
        let links = 1
        if (links === 1) {
          var lines = []
          for (let i = 0; i < edges.length; i++) {
            let pos1 = nodes[edges[i][0]]
            let pos2 = nodes[edges[i][1]]
            let pos1_ = new BABYLON.Vector3(pos1[0], pos1[1], pos1[2] + j * 0.3)
            let pos2_ = new BABYLON.Vector3(pos2[0], pos2[1], pos2[2] + j * 0.3)
            var line = BABYLON.MeshBuilder.CreateLines('line' + i, {points: [pos1_, pos2_]}, this.scene)
            lines.push(line)
          }
        }
      }

      return this.scene
    }
  }
}
</script>

<style>
  html, body {
    overflow: scroll;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  #renderCanvas {
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
