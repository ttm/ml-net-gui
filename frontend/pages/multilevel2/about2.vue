<template>
<span>
  <h1>About BiNetVis 2</h1>
  <p>
    This is a version of BiNetVis in which the multilevel navigation of the network
    is performed by using hybrid links, i.e. links between nodes in different levels as yield by links between their successors and other successors.
  </p>
  <p>
    Further information is found on the <a href=/multilevel2/about>About page for original BiNetVis</a> and in the following video:
  </p>
  <div class="videoWrapper">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/-d9be7aTkUM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
  <p>
    This page should hold a better description of BiNetVis 2 as soon as our research reaches more mature results.
  </p>
  <v-footer class="pa-3">
    <v-spacer></v-spacer>
    <div>&copy;{{ new Date().getFullYear() }} - VICG-ICMC/USP, FAPESP 2017/05838-3</div>
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
}
/* vim: set ft=vue: */
</style>
