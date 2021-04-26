/* global wand */
// to facilitate debug in mobile:
// window.onerror = function (msg, url, lineNo, columnNo, error) {
//   const string = msg.toLowerCase()
//   const substring = 'script error'
//   if (string.indexOf(substring) > -1) {
//     window.alert('Script Error: See Browser Console for Detail')
//   } else {
//     const message = [
//       'Message: ' + msg,
//       'URL: ' + url,
//       'Line: ' + lineNo,
//       'Column: ' + columnNo,
//       'Error object: ' + JSON.stringify(error)
//     ].join(' - ')
//     window.alert(message)
//   }
// }
window.wand = {
  router: require('./modules/router.js'),
  net: require('./modules/net.js'),
  maestro: require('./modules/maestro.js'),
  transfer: require('./modules/transfer.js'),
  med: require('./modules/med'),
  monk: require('./modules/monk'),
  utils: require('./modules/utils.js'),
  test: require('./modules/test.js'),
  $: require('jquery')
}

// cleaning facebook auto added argument (aesthetics, cleaning for users):
window.history.pushState('', '', window.location.search.split('&fbclid=')[0])

const uargs = wand.router.urlAllArguments()

// page is first arg key without value
// meditation is the same, but starts with _ (version 1)
// or @ or . (version 2),
// ~ or - (version 2 through mkLight)
// sync is specified with <sync id>=<participant ref>
// else just welcome page
let found = false
if (uargs.values[0] === '') {
  const k = uargs.keys[0]
  found = true
  if (k[0] === '_') { // meditation model 1:
    wand.currentMed = wand.med.model(k.slice(1))
    wand.utils.confirmExit()
  } else if ('~-@.'.includes(k[0])) { // meditation model 2
    wand.$('<div/>', { id: 'canvasDiv' }).appendTo('body')
    const query = { 'header.med2': k.slice(1) }
    if ('~-'.includes(k[0])) query['header.creator'] = { $exists: true } // created by mkLight
    wand.transfer.findAny(query).then(r => {
      // use r.lemniscate to decide model2 or 3
      if (r.visSetting.lemniscate > 30) wand.currentMed = new wand.med.Model3(r, Boolean(r.header.creator))
      else wand.currentMed = new wand.med.Model2(r, Boolean(r.header.creator))
    })
    wand.utils.confirmExit()
  } else if (k in wand.test) { // standard page:
    wand.test[k]() // if k[0] === '-': k is an article
  } else {
    found = false
  }
} else { // sync:
  const syncId = uargs.keys[0]
  const userRef = uargs.values[0]
  // something as: wand.conductor.gradus(syncId, userRef)
  console.log(`sync is under migration: id: ${syncId}, user: ${userRef}`)
}
if (!found) { // includes empty/no URL parameters:
  if (uargs.keys.length === 0) {
    wand.test.welcome()
  } else {
    window.open(window.location.origin, '_self')
  }
}

wand.router.mkFooter()
