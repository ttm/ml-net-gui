<template>
<span>
  <h1>About ComNetVis</h1>
  <p>
    ComNetVis is an interface for interactive visualization of networks as enabled by the <a href="https://doi.org/10.1103/PhysRevE.77.036111" target="_blank">communicability measures</a>.
    For its usage, the analyst selects one of the networks available or uploads a new one (only the text representation of the adjacency matrix is currently supported). The next step consists in setting the parameters related to communicability: inverse temperature, minimum angle, and number of communities.
    Then the user selects the dimensionality reducion desired: 2D or 3D, the dimensionality reduction algorithm (MDS or t-SNE), and their settings of iterations, initializations, perplexity, and learning rate.
    Finally, to achieve the visualization, the user hits the 'Render Network' button.
  </p>
  <h3> Rotating, translating, and zooming</h3>
  <p>
  By clicking on the canvas and draging, the network is rotated.
  By CTRL+clicking on the canvas and draging, the network is translated.
  By scrolling on the canvas, a zoom in/out is performed.
  </p>
  <h3> The toolbar</h3>
  <p>
    For navigating the visualization, the toolbar has 3 sets of buttons which display their funcionality when the mouse is left over them.
    Using the first set, one may increase/decrease node size, emphasize node proportionality to degree (number of neighbors), reset proportionality, increase/decrease node transparency, increase/decrease link transparency.
  </p>
  <p>
    Using the second set of buttons, one may show/hide the centroid, the best sphere center, the best sphere surface, or recover the initial position.
    Using the third set of buttons, the user obtains exports of the current image or of the current communities (as node IDs related to each community).
  </p>
  <h3> A demo video</h3>
  <p>
    The following video should assist the newcommer in using ComNetVis:
  </p>
  <div class="videoWrapper">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/-d9be7aTkUM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
  <h3> Contact</h3>
  <p>
    Questions and ideas should be sent to <a href="mailto:renato.fabbri@gmail.com?Subject=ComNetVis%20Interface">Renato Fabbri</a>, <a href="mailto:cristina@icmc.usp.br?Subject=ComNetVis%20Interface">Cristina Oliveira</a>, and <a href="mailto:estrada66@unizar.es?Subject=ComNetVis%20Interface">Ernesto Estrada</a>.
  </p>
  <v-footer class="pa-3">
    <v-spacer></v-spacer>
    <div>&copy;{{ new Date().getFullYear() }} - <a href="https://iuma.unizar.es/" target="_blank">IUMA/UNIZAR</a>, <a href="http://vicg.icmc.usp.br" target="_blank">VICG-ICMC/USP</a>, FAPESP 2017/05838-3</div>
  </v-footer>
</span>
</template>

<script>
import $ from 'jquery'

export default {
  mounted () {
    let $allVideos = $("iframe[src^='https://www.youtube.com']")
      // The element that is fluid width
    let  $fluidEl = $("body")
    // Figure out and save aspect ratio for each video
    $allVideos.each(function() {
      $(this)
        .data('aspectRatio', this.height / this.width)
      // and remove the hard coded width/height
        .removeAttr('height')
        .removeAttr('width')
    })
    // When the window is resized
    $(window).resize(function() {
      let newWidth = $fluidEl.width() * 0.4
      console.log(newWidth)
      // Resize all videos according to their own aspect ratio
      $allVideos.each(function() {
        let $el = $(this)
        console.log($el, 'abanana')
        $el
          .width(newWidth)
          .height(newWidth * $el.data('aspectRatio'))
      })
      // Kick off one resize to fix all videos on page load
    }).resize()
    this.av = $allVideos
    window.__this = this
  },
}
</script>

<style>
.videoWrapper {
  text-align: center;
  margin-bottom: 30px;
}
/* vim: set ft=vue: */
</style>
