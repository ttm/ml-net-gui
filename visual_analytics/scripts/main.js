var net = require('./modules/networks.js')
var artist = require('./modules/artist.js')
var router = require('./modules/router.js')
// fixme: create and import needed modules, probably migrated from ../modules/*

console.log('yeah man, initialized');
window.main_loaded = true;
window.you = net.you;
window.net = net;
window.net2 = net.net2;
window.artist = artist;
console.log('objects added to `window`');

window.rr = router
const _router = new router.use.Router([])
_router.loadCurrent()
