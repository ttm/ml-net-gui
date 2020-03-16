<template>
<span>
  <h1>About BiNetViz</h1>
  <p>
    MlBiNetViz is designed to allow the navigation of large bipartite graphs using node-link diagrams by the assistance of multilevel strategies.
    It is the result of research and development acoomplished within
    <a target="_blank" href="http://vicg.icmc.usp.br/vicg">VICG-ICMC/USP</a> and supported by FAPESP (project 2017/05838-3).
    Please get in contact if any issue arise. This software has been tested thoroughly in Google Chrome, and seems to behave well also in Mozilla Firefox.
    The versions reported are Chrome 74.0.3729.157 (Official Build) (64-bit), and Firefox 66.0.5 (64-bit).
  </p>
  <p>
    The main documentation is the article which describes MlBiNetViz in scientific terms, and will be linked here when published.
    One may also see following video and the <a target="_blank" href="https://github.com/ttm/netText">repository where the code is made available</a>.
  </p>
  <div class="videoWrapper">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/-d9be7aTkUM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
  <p>
    The interface elements show tooltips when hovered (when your mouse is over it), and it is intended to be fairly intuitive, at least after absorbing the usage guidelines in this page.
    In brief terms, the operation of MlBiNetViz is as follows.
    The user selects one of the available networks from the first drop-down menu, or uploads a network to make it available therein.
    We are only using the NCOL format for bipartite networks, reason why it is the only format currently available.
    If you need some other format, please let us know, importing networks in other formats should be implemented rapidly as we use them in other projects.
  </p>
  <p>
    Before initating the naviagion, you may tweak the coarsening setup. It tunes the simplified representations of the network that allows navigation using the multilevel strategy.
    It is described in <a target="_blank" href="https://doi.org/10.1016/j.knosys.2018.03.021">this article</a> in greater detail, but may be summarized by the tooltips you will see when hovering the option.
    You may the choose one of the availabe layouts (defaults to Spring layout), choose to show links (useful to aid some visualization settings and in
    ammeliorating the computational overload implied by the visual mapping of huge networks).
    The final step in before naviation is hiting the "Render Network" button, which disables the widgets for choosing the network and for tunning the coarsening.
  </p>
  <p>
    From then on, the canvas in populated with nodes and links, and you may use some visual elements to explore the network.
    Most importantly, the toolbar on the top of the canvas, and the table, to the right of the canvas, are filled with elements which react to both left and right clicks.
    Most of the tools only act on the level selected in the table. You may choose to to show links and shange the layout used when selecting supernodes to show predecessors.
    Further details are given in the video above and may also be discovered by simple trial-and-error given the tooltips contained in the interface.
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
