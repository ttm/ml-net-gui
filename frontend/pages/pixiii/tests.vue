<template>
  <div id="renderCanvas">
  </div>
</template>

<script>
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
    mkShaderGeo () {
      this.app_ = new PIXI.Application()
      document.getElementById('renderCanvas').appendChild(this.app_.view)
      this.shader = PIXI.Shader.from(`
          precision mediump float;
          attribute vec2 aVertexPosition;

          uniform mat3 translationMatrix;
          uniform mat3 projectionMatrix;

          void main() {
              gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
          }`,

      `precision mediump float;

          void main() {
              gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }

      `);
      this.geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', [-10, 5, 10, 5, 0, -10]);
      this.cwidth = document.getElementsByTagName('canvas')[0].width
      this.cheight = document.getElementsByTagName('canvas')[0].height
    },
    mkTriangle(p) {
      const triangle = new PIXI.Mesh(this.geometry, this.shader);
      triangle.position.set(...p)
      triangle.interactive = true
      this.app_.stage.addChild(triangle);
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
      this.app_.stage.addChild(line)
      this.mline = line
    },
    cgLine () {
      this.mline.lineWidth = 100
      this.mline.dirty++
      this.mline.clearDirty++
    },
  },
  mounted () {
    window.__this = this
    this.mkShaderGeo()
    // let ps = [[400, 300], [600, 200]]
    let ps = [[400, 300], [600, 200]]
    this.mkLine(...ps)
    this.mkTriangles(ps)
  }
}
</script>
<style>
/* vim: set ft=vue: */
</style>
