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

// const meditation = wand.router.urlArgument('m') // identificator created in the dedicated page
// // if (meditation !== null) wand.test.atry(meditation)
// if (meditation !== null) {
//   wand.test.atry2(meditation)
// }

const meditation2 = wand.router.urlArgument('m')
if (meditation2 !== null) wand.med.model4(meditation2)
// if (meditation2 !== null) wand.med.model3(meditation2)

wand.router.mkFooter()
