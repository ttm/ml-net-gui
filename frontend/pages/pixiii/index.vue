<template>
  <div class="container">
    <div>
      <h1 class="title">
        PIXI-NUXT-EXAMPLE
      </h1>
      <h2 class="subtitle">
        ssr with pixi
      </h2>
      <h2 class="subtitle">
        scroll down to see the canvas
      </h2>
    </div>
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
  mounted () {
    const app = new PIXI.Application();

    // The application will create a canvas element for you that you
    // can then insert into the DOM
    document.body.appendChild(app.view);

    // load the texture we need
    app.loader.add('bunny', '/imgs/bunny.jpg').load((loader, resources) => {
      // This creates a texture from a 'bunny.png' image
      const bunny = new PIXI.Sprite(resources.bunny.texture);

      // Setup the position of the bunny
      bunny.x = app.renderer.width / 2;
      bunny.y = app.renderer.height / 2;

      // Rotate around the center
      bunny.anchor.x = 0.5;
      bunny.anchor.y = 0.5;

      // Add the bunny to the scene we are building
      app.stage.addChild(bunny);

      // Listen for frame updates
      app.ticker.add(() => {
           // each frame we spin the bunny around a bit
          bunny.rotation += 0.01;
      });
    });
  }
}
</script>

<style>
.container
{
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.title
{
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}
.subtitle
{
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}
.links
{
  padding-top: 15px;
}
</style>
