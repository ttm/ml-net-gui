<template>
  <div id="renderCanvas">
  </div>
</template>

<script>
function onClick () {
  console.log(this, __this.path, this.mdata)
  this.x += 10
}
export default {
  head () {
    return {
      script: [
        // { src: 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.5.1/pixi.min.js' },
        // { src: 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.0.2/pixi.js' },
        // { src: '/libs/pixi4.8.7.js' },
        { src: '/libs/pixi5.0.2.js' },
        // { src: 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.0.2/pixi.js.map' },
      ]
    }
  },
  methods: {
    onClick () {
      console.log('ok', this.path)
    },
    initPixi () {
      this.app_ = new PIXI.Application({ antialias: true })
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.cwidth = document.getElementsByTagName('canvas')[0].width
      this.cheight = document.getElementsByTagName('canvas')[0].height
      PIXI.Graphics.prototype.updateLineStyle = function(lineWidth, color, alpha){   
        __this.mthing = this
        var len = this.graphicsData.length;    
        for (var i = 0; i < len; i++) {        
          var data = this.graphicsData[i];
          data.lineWidth = lineWidth;        
          data.lineColor = color;        
          data.alpha = alpha;   
          this.dirty++;        
          this.clearDirty++;    
        }    
      }
    },
    mkTriangle(p) {
      // const triangle = new PIXI.Mesh(this.geometry, this.shader);
      // triangle.position.set(...p)
      const node = new PIXI.Graphics()
      node.lineStyle(0)
      node.beginFill(0xFF0000)
      node.drawPolygon(this.path)
      node.endFill()
      node.x = p[0]
      node.y = p[1]
      node.mdata = 'the data here'
      node.interactive = true
      node.on('pointerdown', onClick)
      this.app_.stage.addChild(node)
      this.nodes.push(node)
    },
    mkTriangles(ps) {
      ps.forEach(p => {
        this.mkTriangle(p)
      })
    },
    mkLine (p1, p2) {
      let line = new PIXI.Graphics()
      line.lineStyle(1, 0xffff00)
      line.moveTo(...p1)
      line.lineTo(...p2)
      line.hitArea = line.getBounds()
      line.interactive = true
      this.app_.stage.addChild(line)
      this.lines.push(line)
    },
  },
  mounted () {
    window.__this = this
    this.initPixi()
    // let ps = [[400, 300], [600, 200]]
    let ps = [[400, 300], [600, 200]]
    this.lines = []
    this.mkLine(...ps)
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
    this.nodes = []
    this.mkTriangles(ps)
  }
}
</script>
<style>
/* vim: set ft=vue: */
</style>
