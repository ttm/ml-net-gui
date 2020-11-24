/* global wand */
console.log('yeah man')
window.wand = {
  router: require('./modules/router.js'),
  net: require('./modules/net.js'),
  test: require('./modules/test.js')
}

wand.test[wand.router.urlArgument('p')]()
