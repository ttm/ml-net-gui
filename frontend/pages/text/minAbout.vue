<template>
<span>
  <h1>About NetText -- minimal</h1>
  <div class="videoWrapper">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/MH1D8S75d7E" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
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

