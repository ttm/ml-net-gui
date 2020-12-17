/* global wand */
window.wand = {
  router: require('./modules/router.js'),
  net: require('./modules/net.js'),
  med: require('./modules/med'),
  monk: require('./modules/monk'),
  test: require('./modules/test.js'),
  $: require('jquery')
}

const uargs = wand.router.urlAllArguments()

// page is first arg key without value
// meditation is the same, but starts with _
// sync is specified with <sync id>=<participant ref>
// else just welcome page
let found = false
if (uargs.values[0] === '') {
  const k = uargs.keys[0]
  if (k[0] === '_') { // meditation:
    wand.med.model(k.slice(1))
    found = true
  } else if (k in wand.test) { // standard page:
    wand.test[k]()
    found = true
  }
} else {
  const syncId = uargs.keys[0]
  const userRef = uargs.keys[1]
  // something as: wand.conductor.gradus(syncId, userRef)
  console.log(`sync is under migration: id: ${syncId}, user: ${userRef}`)
}
if (!found) { // includes empty/no URL parameters:
  wand.test.welcome()
}

wand.router.mkFooter()
