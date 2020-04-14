meteor app with experiments on doing network theory in js

source of recipes to be used in the node.js app, stripped of Meteor.js or Vue.js/Nuxt.

## pages available
* <http://localhost:3000/ml/net/?id=facebook-legacy-avlab_JulianaSouza23022014>
  wait for loading, the first time the data is pulled from DataWorld's SparQL endpoint.
  can take a while.
  It performs a (bad) coarsening, up to 60 levels. Force Atlas 2 Layout. Pure Javascript run on the client.

* <http://localhost:3000/search2/?mstring=renato>
  takes long. Seems to fetch all names, finds a reasonable results (optimum in some sense),
  peaks the most probable and plots the network yield but the incidence of that name in any of the LOSD networks.

* <http://localhost:3000/search/?mstring=renato>
  might be a deprecated version of the previous link, takes looong to compute, maybe the merging of the networks was perfected in serach2.

* <http://localhost:3000/>
  a flaky version of the networks available linked (by facebook id or name, don't know).
  <http://localhost:3000/ml/> seems to be a more well-behaved version of the same page.

* <http://localhost:3000/intro/>
  a bare sketch of a game interface tentative, nice to remember to call for gamification.

* <http://localhost:3000/net/?id=facebook-legacy-avlab_JulianaSouza23022014>
  shows only one network with force atlas 2

* <http://localhost:3000/cascade/:_id/>
  no valuable clue on what this is for.
