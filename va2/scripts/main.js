/* global wand */
console.log('yeah man')
window.wand = {
  router: require('./modules/router.js'),
  net: require('./modules/net.js'),
  test: require('./modules/test.js')
}

const page = wand.router.urlArgument('p')
if (page !== null) wand.test[wand.router.urlArgument('p')]()

const meditation = wand.router.urlArgument('m') // identificator created in the dedicated page
if (meditation !== null) wand.test.atry(meditation)
