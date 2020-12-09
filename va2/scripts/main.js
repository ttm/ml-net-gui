/* global wand */
console.log('yeah man')
window.wand = {
  router: require('./modules/router.js'),
  net: require('./modules/net.js'),
  med: require('./modules/med'),
  test: require('./modules/test.js'),
  $: require('jquery')
}

const page = wand.router.urlArgument('p')
if (page !== null) wand.test[wand.router.urlArgument('p')]()

const meditation = wand.router.urlArgument('m')
if (meditation !== null) wand.med.model(meditation)

wand.router.mkFooter()
