(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* global chrome */
const Graph = require('graphology')
const transf = require('../../scripts/modules/transfer/mong.js')
window.transf = transf
let graph
let anonString
let anonCount
let anonNames
// chrome.storage.clear()

const setVars = () => {
  anonString = 'unnactive-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '-'
  anonCount = 0
  anonNames = {}
  graph = new Graph()
  window.graph = graph
}

console.log('server loaded ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const msg = request.message
    if (msg === 'popup_msg') {
      console.log('background received popup msg')
      setVars()
      chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }, function (win) {
        chrome.storage.sync.set({ windid: win.id })
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_msg' })
        })
      })
    } else if (msg === 'popup_login_msg') {
      chrome.tabs.getSelected(null, function (tab) {
        window.tabkeep = tab
        chrome.tabs.create({ url: 'https://www.facebook.com/profile.php' }, function (tab) {
          chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
            chrome.tabs.sendMessage(tab.id, { message: 'popup_login_msg' })
          })
        })
      })
      // create tab to profile to get id
      // return message to page with id
      // page handles it
    } else if (msg === 'popup_login_performed') {
      chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.remove(tab.id)
        console.log('HEY JUDE')
        // const dataToWebPage = { text: 'test', foo: 1, bar: false }
        chrome.tabs.create({ url: window.tabkeep.url }, function (tab) {
          setTimeout(() => {
            chrome.tabs.executeScript(tab.id, {
              code: '(' + function (params) {
                // This function will  work in webpage
                console.log(params, 'JOWWWW') // logs in webpage console
                window.theSage = params
                document.theSage = params
                window.postMessage({ type: 'FROM_CONTENT', text: 'Something message here', params }, '*')
                return { success: true, response: 'This is from webpage.' }
              } + ')(' + JSON.stringify(request.userData) + ');'
            }, function (results) {
              // This is the callback response from webpage
              window.theSage_ = results
              console.log(results[0]) // logs in extension console
            })
          }, 0)
        })
      })
    } else if (msg === 'client_msg') {
      console.log('background received client msg')
    } else if (msg === 'client_scrapped_user') { // open new tab
      const { sid, nid } = request.userData
      const query = sid ? { sid } : { nid }
      transf.client.auth.loginWithCredential(new transf.s.AnonymousCredential()).then(user => {
        transf.testCollection.findOne(query).then(r => {
          if (r) {
            // load network
            console.log('network loaded')
            graph.import(JSON.parse(r.text))
            openMutualFriendsPage()
          } else {
            console.log('network started')
            graph.setAttribute('userData', request.userData) // { name, codename, sid, nid }
            openUserFriendsPage()
          }
        })
      })
    } else if (msg === 'client_scrapped_user_friends') { // close current tab, open new
      const s = request.structs
      graph.setAttribute('userFriends', s)
      addNodesFrom(s)
      openMutualFriendsPage()
    } else if (msg === 'client_scrapped_mutual_friends') { // close current tab if finished and open new
      const s = request.structs
      updateNodesFrom(s)
      openMutualFriendsPage()
    } else if (msg === 'client_numeric_mutual_friends_blocked') {
      const { iid, id, type } = graph.getAttribute('lastId')
      const url = type === 'numeric' ? mutualFriendsNumeric2(id) : mutualFriendsString(id)
      graph.setNodeAttribute(iid, 'scrapped', false)
      newMutualTab(url)
    } else if (msg === 'client_friends_blocked') {
      const { iid } = graph.getAttribute('lastId')
      graph.setNodeAttribute(iid, 'scrapped', false)
      openTabToDownload()
    }
  }
)

const updateNodesFrom = structs => {
  const { sids, nids } = getIds()

  const lastId = graph.getAttribute('lastId')
  const id0 = lastId.iid

  structs.forEach(s => {
    const { name, sid, nid, mutual, nfriends } = s
    const id = findNode(name, sid, nid, sids, nids)
    if (id === undefined) {
      s.foundIn = { id0, lastId }
      let m = graph.getAttribute('membersNotFound')
      if (m !== undefined) {
        m.push(s)
      } else {
        m = [s]
      }
      graph.setAttribute('membersNotFound', m)
      return
    }
    const a = graph.getNodeAttributes(id)
    a.sid = a.sid || sid
    a.nid = a.nid || nid
    a.mutual = a.mutual || mutual
    a.nfriends = a.nfriends || nfriends
    if (!graph.hasEdge(id0, id)) {
      graph.addUndirectedEdge(id0, id)
    }
  })
}

const getIds = () => {
  const sids = {}
  const nids = {}
  graph.forEachNode((n, a) => {
    sids[a.sid] = a.nid
    nids[a.nid] = a.sid
  })
  return { sids, nids }
}

const findNode = (name, sid, nid, sids, nids) => {
  // node can be sid or nid or anon-xxx, have to try them all
  const nodes = graph.nodes()
  if (nodes.includes(sid)) {
    return sid
  } else if (nodes.includes(nid)) {
    return nid
  } else { // id returned might be in the attributes
    const temp = nid
    nid = sids[sid]
    sid = nids[temp]
    if (nodes.includes(sid)) {
      return sid
    } else if (nodes.includes(nid)) {
      return nid
    } else { // or anon
      // fixme: will raise error if two anons have same name, but ok for now:
      return anonNames[name]
    }
  }
}

const addNodesFrom = structs => {
  structs.forEach(s => {
    const { name, sid, nid, mutual, nfriends } = s
    let id = sid || nid
    let anon = false
    if (!id) {
      id = anonString + anonCount++
      anon = true
      anonNames[name] = id
    }
    graph.addNode(id, { name, sid, nid, mutual, nfriends, anon })
  })
}

const openMutualFriendsPage = () => {
  // todo: try to use this Ajax call: https://www.facebook.com/ajax/browser/list/mutualfriends/?uid=781909429&view=list&location=other&infinitescroll=0&start=30&av=100035035968952
  const url = getNextURL()
  if (url === undefined) {
    // upload to mongo and give download dialog:
    openTabToDownload()
    return
  }
  newMutualTab(url)
}

const openTabToDownload = () => {
  let friendsVisited = 0
  graph.forEachNode((n, a) => {
    friendsVisited += Boolean(a.scrapped)
  })
  const { sid, nid, name } = graph.getAttribute('userData')
  chrome.storage.sync.set({
    scrapeStatus: {
      name,
      sid,
      nid,
      nfriends: graph.order,
      friendsVisited,
      friendships: graph.size
    }
  })
  const net = JSON.stringify(graph.toJSON())
  const id = sid || nid
  const filename = `${name} (${id}), ${(new Date()).toISOString().split('.')[0]}.json`
  // fixme: set 'Secure' because 'SameSite=None' (future versions of chrome will disallow this as is:
  transf.writeNet(net, filename, sid, nid, id, () => console.log('written net:', filename, name))
  chrome.tabs.create({ url: 'https://www.facebook.com' }, function (tab) {
    chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
      chrome.tabs.sendMessage(tab.id, {
        message: 'download_network',
        filename,
        net
      })
    })
  })
}

const getNextURL = () => {
  const nodeIds = []
  graph.forEachNode((n, a) => {
    nodeIds.push({
      nid: a.nid,
      sid: a.sid,
      scrapped: a.scrapped,
      id: n
    })
  })
  let url
  nodeIds.some(i => {
    if (i.nid !== undefined && !i.scrapped) {
      graph.setNodeAttribute(i.id, 'scrapped', true)
      url = mutualFriendsNumeric(i.nid)
      graph.setAttribute('lastId', { id: i.nid, type: 'numeric', iid: i.id })
      return true
    }
  })
  if (url === undefined) {
    nodeIds.some(i => {
      if (i.sid !== undefined && !i.scrapped) {
        graph.setNodeAttribute(i.id, 'scrapped', true)
        url = mutualFriendsString(i.sid)
        graph.setAttribute('lastId', { id: i.sid, type: 'string', iid: i.id })
        return true
      }
    })
  }
  return url
}

const mutualFriendsString = id => {
  return `https://www.facebook.com/${id}/friends_mutual`
}

const mutualFriendsNumeric = id => {
  return `https://www.facebook.com/browse/mutual_friends/?uid=${id}`
}

const mutualFriendsNumeric2 = id => {
  // if blocked:
  return `https://www.facebook.com/profile.php?id=${id}&sk=friends_mutual`
}

const openUserFriendsPage = () => {
  const { sid, nid } = graph.getAttribute('userData')
  let url
  if (sid) {
    url = `https://www.facebook.com/${sid}/friends`
  } else {
    url = `https://www.facebook.com/profile.php?id=${nid}&sk=friends`
  }
  chrome.tabs.create({ url }, function (tab) {
    chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
      chrome.tabs.sendMessage(tab.id, { message: 'opened_user_friends_page', userData: graph.getAttribute('userData') })
    })
  })
}

const newMutualTab = url => {
  chrome.storage.sync.get(['winid'], function (r) {
    chrome.tabs.getAllInWindow(r.winid, tabs => {
      if (tabs.length > 2) chrome.tabs.remove(tabs[tabs.length - 1].id)
      chrome.tabs.create({ url, windowId: r.winid }, function (tab) {
        chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(tab.id, { message: 'opened_mutual_friends_page', userData: graph.getAttribute('userData') })
        })
      })
    })
  })
}

},{"../../scripts/modules/transfer/mong.js":131,"graphology":6}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":7}],4:[function(require,module,exports){
(function (process){
function detect() {
  if (typeof navigator !== 'undefined') {
    return parseUserAgent(navigator.userAgent);
  }

  return getNodeVersion();
}

function detectOS(userAgentString) {
  var rules = getOperatingSystemRules();
  var detected = rules.filter(function (os) {
    return os.rule && os.rule.test(userAgentString);
  })[0];

  return detected ? detected.name : null;
}

function getNodeVersion() {
  var isNode = typeof process !== 'undefined' && process.version;
  return isNode && {
    name: 'node',
    version: process.version.slice(1),
    os: process.platform
  };
}

function parseUserAgent(userAgentString) {
  var browsers = getBrowserRules();
  if (!userAgentString) {
    return null;
  }

  var detected = browsers.map(function(browser) {
    var match = browser.rule.exec(userAgentString);
    var version = match && match[1].split(/[._]/).slice(0,3);

    if (version && version.length < 3) {
      version = version.concat(version.length == 1 ? [0, 0] : [0]);
    }

    return match && {
      name: browser.name,
      version: version.join('.')
    };
  }).filter(Boolean)[0] || null;

  if (detected) {
    detected.os = detectOS(userAgentString);
  }

  if (/alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|google web preview|nagios|postrank|pingdom|slurp|spider|yahoo!|yandex/i.test(userAgentString)) {
    detected = detected || {};
    detected.bot = true;
  }

  return detected;
}

function getBrowserRules() {
  return buildRules([
    [ 'aol', /AOLShield\/([0-9\._]+)/ ],
    [ 'edge', /Edge\/([0-9\._]+)/ ],
    [ 'yandexbrowser', /YaBrowser\/([0-9\._]+)/ ],
    [ 'vivaldi', /Vivaldi\/([0-9\.]+)/ ],
    [ 'kakaotalk', /KAKAOTALK\s([0-9\.]+)/ ],
    [ 'samsung', /SamsungBrowser\/([0-9\.]+)/ ],
    [ 'chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/ ],
    [ 'phantomjs', /PhantomJS\/([0-9\.]+)(:?\s|$)/ ],
    [ 'crios', /CriOS\/([0-9\.]+)(:?\s|$)/ ],
    [ 'firefox', /Firefox\/([0-9\.]+)(?:\s|$)/ ],
    [ 'fxios', /FxiOS\/([0-9\.]+)/ ],
    [ 'opera', /Opera\/([0-9\.]+)(?:\s|$)/ ],
    [ 'opera', /OPR\/([0-9\.]+)(:?\s|$)$/ ],
    [ 'ie', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/ ],
    [ 'ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/ ],
    [ 'ie', /MSIE\s(7\.0)/ ],
    [ 'bb10', /BB10;\sTouch.*Version\/([0-9\.]+)/ ],
    [ 'android', /Android\s([0-9\.]+)/ ],
    [ 'ios', /Version\/([0-9\._]+).*Mobile.*Safari.*/ ],
    [ 'safari', /Version\/([0-9\._]+).*Safari/ ],
    [ 'facebook', /FBAV\/([0-9\.]+)/],
    [ 'instagram', /Instagram\s([0-9\.]+)/],
    [ 'ios-webview', /AppleWebKit\/([0-9\.]+).*Mobile/]
  ]);
}

function getOperatingSystemRules() {
  return buildRules([
    [ 'iOS', /iP(hone|od|ad)/ ],
    [ 'Android OS', /Android/ ],
    [ 'BlackBerry OS', /BlackBerry|BB10/ ],
    [ 'Windows Mobile', /IEMobile/ ],
    [ 'Amazon OS', /Kindle/ ],
    [ 'Windows 3.11', /Win16/ ],
    [ 'Windows 95', /(Windows 95)|(Win95)|(Windows_95)/ ],
    [ 'Windows 98', /(Windows 98)|(Win98)/ ],
    [ 'Windows 2000', /(Windows NT 5.0)|(Windows 2000)/ ],
    [ 'Windows XP', /(Windows NT 5.1)|(Windows XP)/ ],
    [ 'Windows Server 2003', /(Windows NT 5.2)/ ],
    [ 'Windows Vista', /(Windows NT 6.0)/ ],
    [ 'Windows 7', /(Windows NT 6.1)/ ],
    [ 'Windows 8', /(Windows NT 6.2)/ ],
    [ 'Windows 8.1', /(Windows NT 6.3)/ ],
    [ 'Windows 10', /(Windows NT 10.0)/ ],
    [ 'Windows ME', /Windows ME/ ],
    [ 'Open BSD', /OpenBSD/ ],
    [ 'Sun OS', /SunOS/ ],
    [ 'Linux', /(Linux)|(X11)/ ],
    [ 'Mac OS', /(Mac_PowerPC)|(Macintosh)/ ],
    [ 'QNX', /QNX/ ],
    [ 'BeOS', /BeOS/ ],
    [ 'OS/2', /OS\/2/ ],
    [ 'Search Bot', /(nuhk)|(Googlebot)|(Yammybot)|(Openbot)|(Slurp)|(MSNBot)|(Ask Jeeves\/Teoma)|(ia_archiver)/ ]
  ]);
}

function buildRules(ruleTuples) {
  return ruleTuples.map(function(tuple) {
    return {
      name: tuple[0],
      rule: tuple[1]
    };
  });
}

module.exports = {
  detect: detect,
  detectOS: detectOS,
  getNodeVersion: getNodeVersion,
  parseUserAgent: parseUserAgent
};

}).call(this,require('_process'))
},{"_process":129}],5:[function(require,module,exports){
(function (root, factory) {
    // Hack to make all exports of this module sha256 function object properties.
    var exports = {};
    factory(exports);
    var sha256 = exports["default"];
    for (var k in exports) {
        sha256[k] = exports[k];
    }
        
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = sha256;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return sha256; }); 
    } else {
        root.sha256 = sha256;
    }
})(this, function(exports) {
"use strict";
exports.__esModule = true;
// SHA-256 (+ HMAC and PBKDF2) for JavaScript.
//
// Written in 2014-2016 by Dmitry Chestnykh.
// Public domain, no warranty.
//
// Functions (accept and return Uint8Arrays):
//
//   sha256(message) -> hash
//   sha256.hmac(key, message) -> mac
//   sha256.pbkdf2(password, salt, rounds, dkLen) -> dk
//
//  Classes:
//
//   new sha256.Hash()
//   new sha256.HMAC(key)
//
exports.digestLength = 32;
exports.blockSize = 64;
// SHA-256 constants
var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
function hashBlocks(w, v, p, pos, len) {
    var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
    while (len >= 64) {
        a = v[0];
        b = v[1];
        c = v[2];
        d = v[3];
        e = v[4];
        f = v[5];
        g = v[6];
        h = v[7];
        for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (((p[j] & 0xff) << 24) | ((p[j + 1] & 0xff) << 16) |
                ((p[j + 2] & 0xff) << 8) | (p[j + 3] & 0xff));
        }
        for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << (32 - 17)) ^ (u >>> 19 | u << (32 - 19)) ^ (u >>> 10);
            u = w[i - 15];
            t2 = (u >>> 7 | u << (32 - 7)) ^ (u >>> 18 | u << (32 - 18)) ^ (u >>> 3);
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
        }
        for (i = 0; i < 64; i++) {
            t1 = (((((e >>> 6 | e << (32 - 6)) ^ (e >>> 11 | e << (32 - 11)) ^
                (e >>> 25 | e << (32 - 25))) + ((e & f) ^ (~e & g))) | 0) +
                ((h + ((K[i] + w[i]) | 0)) | 0)) | 0;
            t2 = (((a >>> 2 | a << (32 - 2)) ^ (a >>> 13 | a << (32 - 13)) ^
                (a >>> 22 | a << (32 - 22))) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            h = g;
            g = f;
            f = e;
            e = (d + t1) | 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) | 0;
        }
        v[0] += a;
        v[1] += b;
        v[2] += c;
        v[3] += d;
        v[4] += e;
        v[5] += f;
        v[6] += g;
        v[7] += h;
        pos += 64;
        len -= 64;
    }
    return pos;
}
// Hash implements SHA256 hash algorithm.
var Hash = /** @class */ (function () {
    function Hash() {
        this.digestLength = exports.digestLength;
        this.blockSize = exports.blockSize;
        // Note: Int32Array is used instead of Uint32Array for performance reasons.
        this.state = new Int32Array(8); // hash state
        this.temp = new Int32Array(64); // temporary state
        this.buffer = new Uint8Array(128); // buffer for data to hash
        this.bufferLength = 0; // number of bytes in buffer
        this.bytesHashed = 0; // number of total bytes hashed
        this.finished = false; // indicates whether the hash was finalized
        this.reset();
    }
    // Resets hash state making it possible
    // to re-use this instance to hash other data.
    Hash.prototype.reset = function () {
        this.state[0] = 0x6a09e667;
        this.state[1] = 0xbb67ae85;
        this.state[2] = 0x3c6ef372;
        this.state[3] = 0xa54ff53a;
        this.state[4] = 0x510e527f;
        this.state[5] = 0x9b05688c;
        this.state[6] = 0x1f83d9ab;
        this.state[7] = 0x5be0cd19;
        this.bufferLength = 0;
        this.bytesHashed = 0;
        this.finished = false;
        return this;
    };
    // Cleans internal buffers and re-initializes hash state.
    Hash.prototype.clean = function () {
        for (var i = 0; i < this.buffer.length; i++) {
            this.buffer[i] = 0;
        }
        for (var i = 0; i < this.temp.length; i++) {
            this.temp[i] = 0;
        }
        this.reset();
    };
    // Updates hash state with the given data.
    //
    // Optionally, length of the data can be specified to hash
    // fewer bytes than data.length.
    //
    // Throws error when trying to update already finalized hash:
    // instance must be reset to use it again.
    Hash.prototype.update = function (data, dataLength) {
        if (dataLength === void 0) { dataLength = data.length; }
        if (this.finished) {
            throw new Error("SHA256: can't update because hash was finished.");
        }
        var dataPos = 0;
        this.bytesHashed += dataLength;
        if (this.bufferLength > 0) {
            while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
            }
            if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
            }
        }
        if (dataLength >= 64) {
            dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
            dataLength %= 64;
        }
        while (dataLength > 0) {
            this.buffer[this.bufferLength++] = data[dataPos++];
            dataLength--;
        }
        return this;
    };
    // Finalizes hash state and puts hash into out.
    //
    // If hash was already finalized, puts the same value.
    Hash.prototype.finish = function (out) {
        if (!this.finished) {
            var bytesHashed = this.bytesHashed;
            var left = this.bufferLength;
            var bitLenHi = (bytesHashed / 0x20000000) | 0;
            var bitLenLo = bytesHashed << 3;
            var padLength = (bytesHashed % 64 < 56) ? 64 : 128;
            this.buffer[left] = 0x80;
            for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
            }
            this.buffer[padLength - 8] = (bitLenHi >>> 24) & 0xff;
            this.buffer[padLength - 7] = (bitLenHi >>> 16) & 0xff;
            this.buffer[padLength - 6] = (bitLenHi >>> 8) & 0xff;
            this.buffer[padLength - 5] = (bitLenHi >>> 0) & 0xff;
            this.buffer[padLength - 4] = (bitLenLo >>> 24) & 0xff;
            this.buffer[padLength - 3] = (bitLenLo >>> 16) & 0xff;
            this.buffer[padLength - 2] = (bitLenLo >>> 8) & 0xff;
            this.buffer[padLength - 1] = (bitLenLo >>> 0) & 0xff;
            hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
            this.finished = true;
        }
        for (var i = 0; i < 8; i++) {
            out[i * 4 + 0] = (this.state[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (this.state[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (this.state[i] >>> 8) & 0xff;
            out[i * 4 + 3] = (this.state[i] >>> 0) & 0xff;
        }
        return this;
    };
    // Returns the final hash digest.
    Hash.prototype.digest = function () {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
    };
    // Internal function for use in HMAC for optimization.
    Hash.prototype._saveState = function (out) {
        for (var i = 0; i < this.state.length; i++) {
            out[i] = this.state[i];
        }
    };
    // Internal function for use in HMAC for optimization.
    Hash.prototype._restoreState = function (from, bytesHashed) {
        for (var i = 0; i < this.state.length; i++) {
            this.state[i] = from[i];
        }
        this.bytesHashed = bytesHashed;
        this.finished = false;
        this.bufferLength = 0;
    };
    return Hash;
}());
exports.Hash = Hash;
// HMAC implements HMAC-SHA256 message authentication algorithm.
var HMAC = /** @class */ (function () {
    function HMAC(key) {
        this.inner = new Hash();
        this.outer = new Hash();
        this.blockSize = this.inner.blockSize;
        this.digestLength = this.inner.digestLength;
        var pad = new Uint8Array(this.blockSize);
        if (key.length > this.blockSize) {
            (new Hash()).update(key).finish(pad).clean();
        }
        else {
            for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
            }
        }
        for (var i = 0; i < pad.length; i++) {
            pad[i] ^= 0x36;
        }
        this.inner.update(pad);
        for (var i = 0; i < pad.length; i++) {
            pad[i] ^= 0x36 ^ 0x5c;
        }
        this.outer.update(pad);
        this.istate = new Uint32Array(8);
        this.ostate = new Uint32Array(8);
        this.inner._saveState(this.istate);
        this.outer._saveState(this.ostate);
        for (var i = 0; i < pad.length; i++) {
            pad[i] = 0;
        }
    }
    // Returns HMAC state to the state initialized with key
    // to make it possible to run HMAC over the other data with the same
    // key without creating a new instance.
    HMAC.prototype.reset = function () {
        this.inner._restoreState(this.istate, this.inner.blockSize);
        this.outer._restoreState(this.ostate, this.outer.blockSize);
        return this;
    };
    // Cleans HMAC state.
    HMAC.prototype.clean = function () {
        for (var i = 0; i < this.istate.length; i++) {
            this.ostate[i] = this.istate[i] = 0;
        }
        this.inner.clean();
        this.outer.clean();
    };
    // Updates state with provided data.
    HMAC.prototype.update = function (data) {
        this.inner.update(data);
        return this;
    };
    // Finalizes HMAC and puts the result in out.
    HMAC.prototype.finish = function (out) {
        if (this.outer.finished) {
            this.outer.finish(out);
        }
        else {
            this.inner.finish(out);
            this.outer.update(out, this.digestLength).finish(out);
        }
        return this;
    };
    // Returns message authentication code.
    HMAC.prototype.digest = function () {
        var out = new Uint8Array(this.digestLength);
        this.finish(out);
        return out;
    };
    return HMAC;
}());
exports.HMAC = HMAC;
// Returns SHA256 hash of data.
function hash(data) {
    var h = (new Hash()).update(data);
    var digest = h.digest();
    h.clean();
    return digest;
}
exports.hash = hash;
// Function hash is both available as module.hash and as default export.
exports["default"] = hash;
// Returns HMAC-SHA256 of data under the key.
function hmac(key, data) {
    var h = (new HMAC(key)).update(data);
    var digest = h.digest();
    h.clean();
    return digest;
}
exports.hmac = hmac;
// Fills hkdf buffer like this:
// T(1) = HMAC-Hash(PRK, T(0) | info | 0x01)
function fillBuffer(buffer, hmac, info, counter) {
    // Counter is a byte value: check if it overflowed.
    var num = counter[0];
    if (num === 0) {
        throw new Error("hkdf: cannot expand more");
    }
    // Prepare HMAC instance for new data with old key.
    hmac.reset();
    // Hash in previous output if it was generated
    // (i.e. counter is greater than 1).
    if (num > 1) {
        hmac.update(buffer);
    }
    // Hash in info if it exists.
    if (info) {
        hmac.update(info);
    }
    // Hash in the counter.
    hmac.update(counter);
    // Output result to buffer and clean HMAC instance.
    hmac.finish(buffer);
    // Increment counter inside typed array, this works properly.
    counter[0]++;
}
var hkdfSalt = new Uint8Array(exports.digestLength); // Filled with zeroes.
function hkdf(key, salt, info, length) {
    if (salt === void 0) { salt = hkdfSalt; }
    if (length === void 0) { length = 32; }
    var counter = new Uint8Array([1]);
    // HKDF-Extract uses salt as HMAC key, and key as data.
    var okm = hmac(salt, key);
    // Initialize HMAC for expanding with extracted key.
    // Ensure no collisions with `hmac` function.
    var hmac_ = new HMAC(okm);
    // Allocate buffer.
    var buffer = new Uint8Array(hmac_.digestLength);
    var bufpos = buffer.length;
    var out = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
        if (bufpos === buffer.length) {
            fillBuffer(buffer, hmac_, info, counter);
            bufpos = 0;
        }
        out[i] = buffer[bufpos++];
    }
    hmac_.clean();
    buffer.fill(0);
    counter.fill(0);
    return out;
}
exports.hkdf = hkdf;
// Derives a key from password and salt using PBKDF2-HMAC-SHA256
// with the given number of iterations.
//
// The number of bytes returned is equal to dkLen.
//
// (For better security, avoid dkLen greater than hash length - 32 bytes).
function pbkdf2(password, salt, iterations, dkLen) {
    var prf = new HMAC(password);
    var len = prf.digestLength;
    var ctr = new Uint8Array(4);
    var t = new Uint8Array(len);
    var u = new Uint8Array(len);
    var dk = new Uint8Array(dkLen);
    for (var i = 0; i * len < dkLen; i++) {
        var c = i + 1;
        ctr[0] = (c >>> 24) & 0xff;
        ctr[1] = (c >>> 16) & 0xff;
        ctr[2] = (c >>> 8) & 0xff;
        ctr[3] = (c >>> 0) & 0xff;
        prf.reset();
        prf.update(salt);
        prf.update(ctr);
        prf.finish(u);
        for (var j = 0; j < len; j++) {
            t[j] = u[j];
        }
        for (var j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (var k = 0; k < len; k++) {
                t[k] ^= u[k];
            }
        }
        for (var j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t[j];
        }
    }
    for (var i = 0; i < len; i++) {
        t[i] = u[i] = 0;
    }
    for (var i = 0; i < 4; i++) {
        ctr[i] = 0;
    }
    prf.clean();
    return dk;
}
exports.pbkdf2 = pbkdf2;
});

},{}],6:[function(require,module,exports){
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).graphology=t()}(this,(function(){"use strict";function e(t){return(e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(t)}function t(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e.__proto__=t}function n(e){return(n=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function r(e,t){return(r=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function i(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}function o(e,t,n){return(o=i()?Reflect.construct:function(e,t,n){var i=[null];i.push.apply(i,t);var o=new(Function.bind.apply(e,i));return n&&r(o,n.prototype),o}).apply(null,arguments)}function a(e){var t="function"==typeof Map?new Map:void 0;return(a=function(e){if(null===e||(i=e,-1===Function.toString.call(i).indexOf("[native code]")))return e;var i;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,a)}function a(){return o(e,arguments,n(this).constructor)}return a.prototype=Object.create(e.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),r(a,e)})(e)}function c(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function d(){for(var e=arguments[0]||{},t=1,n=arguments.length;t<n;t++)if(arguments[t])for(var r in arguments[t])e[r]=arguments[t][r];return e}function u(e,t,n,r){var i=e._nodes.get(t),o=null;return i?o="mixed"===r?i.out&&i.out[n]||i.undirected&&i.undirected[n]:"directed"===r?i.out&&i.out[n]:i.undirected&&i.undirected[n]:o}function s(t){return null!==t&&"object"===e(t)&&"function"==typeof t.addUndirectedEdgeWithKey&&"function"==typeof t.dropNode}function h(t){return"object"===e(t)&&null!==t&&t.constructor===Object}function f(e){for(var t=""+e,n="",r=0,i=t.length;r<i;r++){n=t[i-r-1]+n,(r-2)%3||r===i-1||(n=","+n)}return n}function p(e,t,n){Object.defineProperty(e,t,{enumerable:!1,configurable:!1,writable:!0,value:n})}function g(e,t,n){var r={enumerable:!0,configurable:!0};"function"==typeof n?r.get=n:(r.value=n,r.writable=!1),Object.defineProperty(e,t,r)}function l(){}function y(){y.init.call(this)}function v(e){return void 0===e._maxListeners?y.defaultMaxListeners:e._maxListeners}function w(e,t,n){if(t)e.call(n);else for(var r=e.length,i=S(e,r),o=0;o<r;++o)i[o].call(n)}function b(e,t,n,r){if(t)e.call(n,r);else for(var i=e.length,o=S(e,i),a=0;a<i;++a)o[a].call(n,r)}function m(e,t,n,r,i){if(t)e.call(n,r,i);else for(var o=e.length,a=S(e,o),c=0;c<o;++c)a[c].call(n,r,i)}function _(e,t,n,r,i,o){if(t)e.call(n,r,i,o);else for(var a=e.length,c=S(e,a),d=0;d<a;++d)c[d].call(n,r,i,o)}function G(e,t,n,r){if(t)e.apply(n,r);else for(var i=e.length,o=S(e,i),a=0;a<i;++a)o[a].apply(n,r)}function E(e,t,n,r){var i,o,a,c;if("function"!=typeof n)throw new TypeError('"listener" argument must be a function');if((o=e._events)?(o.newListener&&(e.emit("newListener",t,n.listener?n.listener:n),o=e._events),a=o[t]):(o=e._events=new l,e._eventsCount=0),a){if("function"==typeof a?a=o[t]=r?[n,a]:[a,n]:r?a.unshift(n):a.push(n),!a.warned&&(i=v(e))&&i>0&&a.length>i){a.warned=!0;var d=new Error("Possible EventEmitter memory leak detected. "+a.length+" "+t+" listeners added. Use emitter.setMaxListeners() to increase limit");d.name="MaxListenersExceededWarning",d.emitter=e,d.type=t,d.count=a.length,c=d,"function"==typeof console.warn?console.warn(c):console.log(c)}}else a=o[t]=n,++e._eventsCount;return e}function k(e,t,n){var r=!1;function i(){e.removeListener(t,i),r||(r=!0,n.apply(e,arguments))}return i.listener=n,i}function x(e){var t=this._events;if(t){var n=t[e];if("function"==typeof n)return 1;if(n)return n.length}return 0}function S(e,t){for(var n=new Array(t);t--;)n[t]=e[t];return n}function A(e){Object.defineProperty(this,"_next",{writable:!1,enumerable:!1,value:e}),this.done=!1}l.prototype=Object.create(null),y.EventEmitter=y,y.usingDomains=!1,y.prototype.domain=void 0,y.prototype._events=void 0,y.prototype._maxListeners=void 0,y.defaultMaxListeners=10,y.init=function(){this.domain=null,y.usingDomains&&(void 0).active,this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=new l,this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},y.prototype.setMaxListeners=function(e){if("number"!=typeof e||e<0||isNaN(e))throw new TypeError('"n" argument must be a positive number');return this._maxListeners=e,this},y.prototype.getMaxListeners=function(){return v(this)},y.prototype.emit=function(e){var t,n,r,i,o,a,c,d="error"===e;if(a=this._events)d=d&&null==a.error;else if(!d)return!1;if(c=this.domain,d){if(t=arguments[1],!c){if(t instanceof Error)throw t;var u=new Error('Uncaught, unspecified "error" event. ('+t+")");throw u.context=t,u}return t||(t=new Error('Uncaught, unspecified "error" event')),t.domainEmitter=this,t.domain=c,t.domainThrown=!1,c.emit("error",t),!1}if(!(n=a[e]))return!1;var s="function"==typeof n;switch(r=arguments.length){case 1:w(n,s,this);break;case 2:b(n,s,this,arguments[1]);break;case 3:m(n,s,this,arguments[1],arguments[2]);break;case 4:_(n,s,this,arguments[1],arguments[2],arguments[3]);break;default:for(i=new Array(r-1),o=1;o<r;o++)i[o-1]=arguments[o];G(n,s,this,i)}return!0},y.prototype.addListener=function(e,t){return E(this,e,t,!1)},y.prototype.on=y.prototype.addListener,y.prototype.prependListener=function(e,t){return E(this,e,t,!0)},y.prototype.once=function(e,t){if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');return this.on(e,k(this,e,t)),this},y.prototype.prependOnceListener=function(e,t){if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');return this.prependListener(e,k(this,e,t)),this},y.prototype.removeListener=function(e,t){var n,r,i,o,a;if("function"!=typeof t)throw new TypeError('"listener" argument must be a function');if(!(r=this._events))return this;if(!(n=r[e]))return this;if(n===t||n.listener&&n.listener===t)0==--this._eventsCount?this._events=new l:(delete r[e],r.removeListener&&this.emit("removeListener",e,n.listener||t));else if("function"!=typeof n){for(i=-1,o=n.length;o-- >0;)if(n[o]===t||n[o].listener&&n[o].listener===t){a=n[o].listener,i=o;break}if(i<0)return this;if(1===n.length){if(n[0]=void 0,0==--this._eventsCount)return this._events=new l,this;delete r[e]}else!function(e,t){for(var n=t,r=n+1,i=e.length;r<i;n+=1,r+=1)e[n]=e[r];e.pop()}(n,i);r.removeListener&&this.emit("removeListener",e,a||t)}return this},y.prototype.removeAllListeners=function(e){var t,n;if(!(n=this._events))return this;if(!n.removeListener)return 0===arguments.length?(this._events=new l,this._eventsCount=0):n[e]&&(0==--this._eventsCount?this._events=new l:delete n[e]),this;if(0===arguments.length){for(var r,i=Object.keys(n),o=0;o<i.length;++o)"removeListener"!==(r=i[o])&&this.removeAllListeners(r);return this.removeAllListeners("removeListener"),this._events=new l,this._eventsCount=0,this}if("function"==typeof(t=n[e]))this.removeListener(e,t);else if(t)do{this.removeListener(e,t[t.length-1])}while(t[0]);return this},y.prototype.listeners=function(e){var t,n=this._events;return n&&(t=n[e])?"function"==typeof t?[t.listener||t]:function(e){for(var t=new Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}(t):[]},y.listenerCount=function(e,t){return"function"==typeof e.listenerCount?e.listenerCount(t):x.call(e,t)},y.prototype.listenerCount=x,y.prototype.eventNames=function(){return this._eventsCount>0?Reflect.ownKeys(this._events):[]},A.prototype.next=function(){if(this.done)return{done:!0};var e=this._next();return e.done&&(this.done=!0),e},"undefined"!=typeof Symbol&&(A.prototype[Symbol.iterator]=function(){return this}),A.of=function(){var e=arguments,t=e.length,n=0;return new A((function(){return n>=t?{done:!0}:{done:!1,value:e[n++]}}))},A.empty=function(){var e=new A(null);return e.done=!0,e},A.is=function(e){return e instanceof A||"object"==typeof e&&null!==e&&"function"==typeof e.next};var N=A,D=function(e,t){for(var n,r=arguments.length>1?t:1/0,i=r!==1/0?new Array(r):[],o=0;;){if(o===r)return i;if((n=e.next()).done)return o!==t?i.slice(0,o):i;i[o++]=n.value}},L=function(e){function n(t,n){var r;return(r=e.call(this)||this).name="GraphError",r.message=t||"",r.data=n||{},r}return t(n,e),n}(a(Error)),j=function(e){function n(t,r){var i;return(i=e.call(this,t,r)||this).name="InvalidArgumentsGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(c(i),n.prototype.constructor),i}return t(n,e),n}(L),U=function(e){function n(t,r){var i;return(i=e.call(this,t,r)||this).name="NotFoundGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(c(i),n.prototype.constructor),i}return t(n,e),n}(L),z=function(e){function n(t,r){var i;return(i=e.call(this,t,r)||this).name="UsageGraphError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(c(i),n.prototype.constructor),i}return t(n,e),n}(L);function O(e,t){this.key=e,this.attributes=t,this.inDegree=0,this.outDegree=0,this.undirectedDegree=0,this.directedSelfLoops=0,this.undirectedSelfLoops=0,this.in={},this.out={},this.undirected={}}function K(e,t){this.key=e,this.attributes=t||{},this.inDegree=0,this.outDegree=0,this.directedSelfLoops=0,this.in={},this.out={}}function M(e,t){this.key=e,this.attributes=t||{},this.undirectedDegree=0,this.undirectedSelfLoops=0,this.undirected={}}function C(e,t,n,r,i){this.key=e,this.attributes=i,this.source=n,this.target=r,this.generatedKey=t}function T(e,t,n,r,i){this.key=e,this.attributes=i,this.source=n,this.target=r,this.generatedKey=t}function P(e,t,n,r,i,o,a){var c=e.multi,d=t?"undirected":"out",u=t?"undirected":"in",s=o[d][i];void 0===s&&(s=c?new Set:n,o[d][i]=s),c&&s.add(n),r!==i&&void 0===a[u][r]&&(a[u][r]=s)}function W(e,t,n){var r=e.multi,i=n.source,o=n.target,a=i.key,c=o.key,d=i[t?"undirected":"out"],u=t?"undirected":"in";if(c in d)if(r){var s=d[c];1===s.size?(delete d[c],delete o[u][a]):s.delete(n)}else delete d[c];r||delete o[u][a]}K.prototype.upgradeToMixed=function(){this.undirectedDegree=0,this.undirectedSelfLoops=0,this.undirected={}},M.prototype.upgradeToMixed=function(){this.inDegree=0,this.outDegree=0,this.directedSelfLoops=0,this.in={},this.out={}};var R=[{name:function(e){return"get".concat(e,"Attribute")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+e,c=""+i;if(i=arguments[2],!(o=u(this,a,c,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(a,'" - "').concat(c,'").'))}else if(e=""+e,!(o=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("mixed"!==n&&!(o instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return o.attributes[i]}}},{name:function(e){return"get".concat(e,"Attributes")},attacher:function(e,t,n,r){e.prototype[t]=function(e){var i;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>1){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var o=""+e,a=""+arguments[1];if(!(i=u(this,o,a,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(o,'" - "').concat(a,'").'))}else if(e=""+e,!(i=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("mixed"!==n&&!(i instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return i.attributes}}},{name:function(e){return"has".concat(e,"Attribute")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+e,c=""+i;if(i=arguments[2],!(o=u(this,a,c,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(a,'" - "').concat(c,'").'))}else if(e=""+e,!(o=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("mixed"!==n&&!(o instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return o.attributes.hasOwnProperty(i)}}},{name:function(e){return"set".concat(e,"Attribute")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i,o){var a;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>3){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var c=""+e,d=""+i;if(i=arguments[2],o=arguments[3],!(a=u(this,c,d,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(c,'" - "').concat(d,'").'))}else if(e=""+e,!(a=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("mixed"!==n&&!(a instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return a.attributes[i]=o,this.emit("edgeAttributesUpdated",{key:a.key,type:"set",meta:{name:i,value:o}}),this}}},{name:function(e){return"update".concat(e,"Attribute")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i,o){var a;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>3){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var c=""+e,d=""+i;if(i=arguments[2],o=arguments[3],!(a=u(this,c,d,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(c,'" - "').concat(d,'").'))}else if(e=""+e,!(a=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("function"!=typeof o)throw new j("Graph.".concat(t,": updater should be a function."));if("mixed"!==n&&!(a instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return a.attributes[i]=o(a.attributes[i]),this.emit("edgeAttributesUpdated",{key:a.key,type:"set",meta:{name:i,value:a.attributes[i]}}),this}}},{name:function(e){return"remove".concat(e,"Attribute")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+e,c=""+i;if(i=arguments[2],!(o=u(this,a,c,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(a,'" - "').concat(c,'").'))}else if(e=""+e,!(o=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if("mixed"!==n&&!(o instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return delete o.attributes[i],this.emit("edgeAttributesUpdated",{key:o.key,type:"remove",meta:{name:i}}),this}}},{name:function(e){return"replace".concat(e,"Attributes")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+e,c=""+i;if(i=arguments[2],!(o=u(this,a,c,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(a,'" - "').concat(c,'").'))}else if(e=""+e,!(o=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if(!h(i))throw new j("Graph.".concat(t,": provided attributes are not a plain object."));if("mixed"!==n&&!(o instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));var d=o.attributes;return o.attributes=i,this.emit("edgeAttributesUpdated",{key:o.key,type:"replace",meta:{before:d,after:i}}),this}}},{name:function(e){return"merge".concat(e,"Attributes")},attacher:function(e,t,n,r){e.prototype[t]=function(e,i){var o;if("mixed"!==this.type&&"mixed"!==n&&n!==this.type)throw new z("Graph.".concat(t,": cannot find this type of edges in your ").concat(this.type," graph."));if(arguments.length>2){if(this.multi)throw new z("Graph.".concat(t,": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."));var a=""+e,c=""+i;if(i=arguments[2],!(o=u(this,a,c,n)))throw new U("Graph.".concat(t,': could not find an edge for the given path ("').concat(a,'" - "').concat(c,'").'))}else if(e=""+e,!(o=this._edges.get(e)))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" edge in the graph.'));if(!h(i))throw new j("Graph.".concat(t,": provided attributes are not a plain object."));if("mixed"!==n&&!(o instanceof r))throw new U("Graph.".concat(t,': could not find the "').concat(e,'" ').concat(n," edge in the graph."));return d(o.attributes,i),this.emit("edgeAttributesUpdated",{key:o.key,type:"merge",meta:{data:i}}),this}}}];var I=function(){var e,t=arguments,n=-1;return new N((function r(){if(!e){if(++n>=t.length)return{done:!0};e=t[n]}var i=e.next();return i.done?(e=null,r()):i}))},F=[{name:"edges",type:"mixed"},{name:"inEdges",type:"directed",direction:"in"},{name:"outEdges",type:"directed",direction:"out"},{name:"inboundEdges",type:"mixed",direction:"in"},{name:"outboundEdges",type:"mixed",direction:"out"},{name:"directedEdges",type:"directed"},{name:"undirectedEdges",type:"undirected"}];function Y(e,t){for(var n in t)t[n]instanceof Set?t[n].forEach((function(t){return e.push(t.key)})):e.push(t[n].key)}function J(e,t){for(var n in e){var r=e[n];t(r.key,r.attributes,r.source.key,r.target.key,r.source.attributes,r.target.attributes)}}function q(e,t){for(var n in e)e[n].forEach((function(e){return t(e.key,e.attributes,e.source.key,e.target.key,e.source.attributes,e.target.attributes)}))}function B(e){var t=Object.keys(e),n=t.length,r=null,i=0;return new N((function o(){var a;if(r){var c=r.next();if(c.done)return r=null,i++,o();a=c.value}else{if(i>=n)return{done:!0};var d=t[i];if((a=e[d])instanceof Set)return r=a.values(),o();i++}return{done:!1,value:[a.key,a.attributes,a.source.key,a.target.key,a.source.attributes,a.target.attributes]}}))}function H(e,t,n){n in t&&(t[n]instanceof Set?t[n].forEach((function(t){return e.push(t.key)})):e.push(t[n].key))}function Q(e,t,n){if(t in e)if(e[t]instanceof Set)e[t].forEach((function(e){return n(e.key,e.attributes,e.source.key,e.target.key,e.source.attributes,e.target.attributes)}));else{var r=e[t];n(r.key,r.attributes,r.source.key,r.target.key,r.source.attributes,r.target.attributes)}}function V(e,t){var n=e[t];if(n instanceof Set){var r=n.values();return new N((function(){var e=r.next();if(e.done)return e;var t=e.value;return{done:!1,value:[t.key,t.attributes,t.source.key,t.target.key,t.source.attributes,t.target.attributes]}}))}return N.of([n.key,n.attributes,n.source.key,n.target.key,n.source.attributes,n.target.attributes])}function X(e,t){if(0===e.size)return[];if("mixed"===t||t===e.type)return D(e._edges.keys(),e._edges.size);var n="undirected"===t?e.undirectedSize:e.directedSize,r=new Array(n),i="undirected"===t,o=0;return e._edges.forEach((function(e,t){e instanceof T===i&&(r[o++]=t)})),r}function Z(e,t,n){if(0!==e.size)if("mixed"===t||t===e.type)e._edges.forEach((function(e,t){var r=e.attributes,i=e.source,o=e.target;n(t,r,i.key,o.key,i.attributes,o.attributes)}));else{var r="undirected"===t;e._edges.forEach((function(e,t){if(e instanceof T===r){var i=e.attributes,o=e.source,a=e.target;n(t,i,o.key,a.key,o.attributes,a.attributes)}}))}}function $(e,t){return 0===e.size?N.empty():"mixed"===t?(n=e._edges.values(),new N((function(){var e=n.next();if(e.done)return e;var t=e.value;return{value:[t.key,t.attributes,t.source.key,t.target.key,t.source.attributes,t.target.attributes],done:!1}}))):(n=e._edges.values(),new N((function e(){var r=n.next();if(r.done)return r;var i=r.value;return i instanceof T==("undirected"===t)?{value:[i.key,i.attributes,i.source.key,i.target.key,i.source.attributes,i.target.attributes],done:!1}:e()})));var n}function ee(e,t,n){var r=[];return"undirected"!==e&&("out"!==t&&Y(r,n.in),"in"!==t&&Y(r,n.out)),"directed"!==e&&Y(r,n.undirected),r}function te(e,t,n,r,i){var o=e?q:J;"undirected"!==t&&("out"!==n&&o(r.in,i),"in"!==n&&o(r.out,i)),"directed"!==t&&o(r.undirected,i)}function ne(e,t,n){var r=N.empty();return"undirected"!==e&&("out"!==t&&void 0!==n.in&&(r=I(r,B(n.in))),"in"!==t&&void 0!==n.out&&(r=I(r,B(n.out)))),"directed"!==e&&void 0!==n.undirected&&(r=I(r,B(n.undirected))),r}function re(e,t,n,r){var i=[];return"undirected"!==e&&(void 0!==n.in&&"out"!==t&&H(i,n.in,r),void 0!==n.out&&"in"!==t&&H(i,n.out,r)),"directed"!==e&&void 0!==n.undirected&&H(i,n.undirected,r),i}function ie(e,t,n,r,i){"undirected"!==e&&(void 0!==n.in&&"out"!==t&&Q(n.in,r,i),void 0!==n.out&&"in"!==t&&Q(n.out,r,i)),"directed"!==e&&void 0!==n.undirected&&Q(n.undirected,r,i)}function oe(e,t,n,r){var i=N.empty();return"undirected"!==e&&(void 0!==n.in&&"out"!==t&&r in n.in&&(i=I(i,V(n.in,r))),void 0!==n.out&&"in"!==t&&r in n.out&&(i=I(i,V(n.out,r)))),"directed"!==e&&void 0!==n.undirected&&r in n.undirected&&(i=I(i,V(n.undirected,r))),i}var ae=[{name:"neighbors",type:"mixed"},{name:"inNeighbors",type:"directed",direction:"in"},{name:"outNeighbors",type:"directed",direction:"out"},{name:"inboundNeighbors",type:"mixed",direction:"in"},{name:"outboundNeighbors",type:"mixed",direction:"out"},{name:"directedNeighbors",type:"directed"},{name:"undirectedNeighbors",type:"undirected"}];function ce(e,t){if(void 0!==t)for(var n in t)e.add(n)}function de(e,t,n){if("mixed"!==e){if("undirected"===e)return Object.keys(n.undirected);if("string"==typeof t)return Object.keys(n[t])}var r=new Set;return"undirected"!==e&&("out"!==t&&ce(r,n.in),"in"!==t&&ce(r,n.out)),"directed"!==e&&ce(r,n.undirected),D(r.values(),r.size)}function ue(e,t,n){for(var r in t){var i=t[r];i instanceof Set&&(i=i.values().next().value);var o=i.source,a=i.target,c=o===e?a:o;n(c.key,c.attributes)}}function se(e,t,n,r){for(var i in n){var o=n[i];o instanceof Set&&(o=o.values().next().value);var a=o.source,c=o.target,d=a===t?c:a;e.has(d.key)||(e.add(d.key),r(d.key,d.attributes))}}function he(e,t){var n=Object.keys(t),r=n.length,i=0;return new N((function(){if(i>=r)return{done:!0};var o=t[n[i++]];o instanceof Set&&(o=o.values().next().value);var a=o.source,c=o.target,d=a===e?c:a;return{done:!1,value:[d.key,d.attributes]}}))}function fe(e,t,n){var r=Object.keys(n),i=r.length,o=0;return new N((function a(){if(o>=i)return{done:!0};var c=n[r[o++]];c instanceof Set&&(c=c.values().next().value);var d=c.source,u=c.target,s=d===t?u:d;return e.has(s.key)?a():(e.add(s.key),{done:!1,value:[s.key,s.attributes]})}))}function pe(e,t,n,r,i){var o=e._nodes.get(r);if("undirected"!==t){if("out"!==n&&void 0!==o.in)for(var a in o.in)if(a===i)return!0;if("in"!==n&&void 0!==o.out)for(var c in o.out)if(c===i)return!0}if("directed"!==t&&void 0!==o.undirected)for(var d in o.undirected)if(d===i)return!0;return!1}function ge(e,t){var n=t.name,r=t.type,i=t.direction,o="forEach"+n[0].toUpperCase()+n.slice(1,-1);e.prototype[o]=function(e,t){if("mixed"===r||"mixed"===this.type||r===this.type){e=""+e;var n=this._nodes.get(e);if(void 0===n)throw new U("Graph.".concat(o,': could not find the "').concat(e,'" node in the graph.'));!function(e,t,n,r){if("mixed"!==e){if("undirected"===e)return ue(n,n.undirected,r);if("string"==typeof t)return ue(n,n[t],r)}var i=new Set;"undirected"!==e&&("out"!==t&&se(i,n,n.in,r),"in"!==t&&se(i,n,n.out,r)),"directed"!==e&&se(i,n,n.undirected,r)}("mixed"===r?this.type:r,i,n,t)}}}function le(e,t){var n=t.name,r=t.type,i=t.direction,o=n.slice(0,-1)+"Entries";e.prototype[o]=function(e){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return N.empty();e=""+e;var t=this._nodes.get(e);if(void 0===t)throw new U("Graph.".concat(o,': could not find the "').concat(e,'" node in the graph.'));return function(e,t,n){if("mixed"!==e){if("undirected"===e)return he(n,n.undirected);if("string"==typeof t)return he(n,n[t])}var r=N.empty(),i=new Set;return"undirected"!==e&&("out"!==t&&(r=I(r,fe(i,n,n.in))),"in"!==t&&(r=I(r,fe(i,n,n.out)))),"directed"!==e&&(r=I(r,fe(i,n,n.undirected))),r}("mixed"===r?this.type:r,i,t)}}function ye(e,t){var n={key:e};return Object.keys(t.attributes).length&&(n.attributes=d({},t.attributes)),n}function ve(e,t){var n={source:t.source.key,target:t.target.key};return t.generatedKey||(n.key=e),Object.keys(t.attributes).length&&(n.attributes=d({},t.attributes)),t instanceof T&&(n.undirected=!0),n}function we(e){return h(e)?"key"in e?!("attributes"in e)||h(e.attributes)&&null!==e.attributes?null:"invalid-attributes":"no-key":"not-object"}function be(e){return h(e)?"source"in e?"target"in e?!("attributes"in e)||h(e.attributes)&&null!==e.attributes?"undirected"in e&&"boolean"!=typeof e.undirected?"invalid-undirected":null:"invalid-attributes":"no-target":"no-source":"not-object"}var me=new Set(["directed","undirected","mixed"]),_e=new Set(["domain","_events","_eventsCount","_maxListeners"]),Ge={allowSelfLoops:!0,edgeKeyGenerator:null,multi:!1,type:"mixed"};function Ee(e,t,n,r,i,o,a,c){if(!r&&"undirected"===e.type)throw new z("Graph.".concat(t,": you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead."));if(r&&"directed"===e.type)throw new z("Graph.".concat(t,": you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead."));if(c&&!h(c))throw new j("Graph.".concat(t,': invalid attributes. Expecting an object but got "').concat(c,'"'));if(o=""+o,a=""+a,c=c||{},!e.allowSelfLoops&&o===a)throw new z("Graph.".concat(t,': source & target are the same ("').concat(o,"\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."));var d=e._nodes.get(o),u=e._nodes.get(a);if(!d)throw new U("Graph.".concat(t,': source node "').concat(o,'" not found.'));if(!u)throw new U("Graph.".concat(t,': target node "').concat(a,'" not found.'));var s={key:null,undirected:r,source:o,target:a,attributes:c};if(n&&(i=e._edgeKeyGenerator(s)),i=""+i,e._edges.has(i))throw new z("Graph.".concat(t,': the "').concat(i,'" edge already exists in the graph.'));if(!e.multi&&(r?void 0!==d.undirected[a]:void 0!==d.out[a]))throw new z("Graph.".concat(t,': an edge linking "').concat(o,'" to "').concat(a,"\" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option."));var f=new(r?T:C)(i,n,d,u,c);return e._edges.set(i,f),o===a?r?d.undirectedSelfLoops++:d.directedSelfLoops++:r?(d.undirectedDegree++,u.undirectedDegree++):(d.outDegree++,u.inDegree++),P(e,r,f,o,a,d,u),r?e._undirectedSize++:e._directedSize++,s.key=i,e.emit("edgeAdded",s),i}function ke(e,t,n,r,i,o,a,c){if(!r&&"undirected"===e.type)throw new z("Graph.".concat(t,": you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead."));if(r&&"directed"===e.type)throw new z("Graph.".concat(t,": you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead."));if(c&&!h(c))throw new j("Graph.".concat(t,': invalid attributes. Expecting an object but got "').concat(c,'"'));if(o=""+o,a=""+a,c=c||{},!e.allowSelfLoops&&o===a)throw new z("Graph.".concat(t,': source & target are the same ("').concat(o,"\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."));var s,f,p=e._nodes.get(o),g=e._nodes.get(a),l=null;if(!n&&(s=e._edges.get(i))){if(s.source!==o||s.target!==a||r&&(s.source!==a||s.target!==o))throw new z("Graph.".concat(t,': inconsistency detected when attempting to merge the "').concat(i,'" edge with "').concat(o,'" source & "').concat(a,'" target vs. (').concat(s.source,", ").concat(s.target,")."));l=i}if(l||e.multi||!p||(r?void 0===p.undirected[a]:void 0===p.out[a])||(f=u(e,o,a,r?"undirected":"directed")),f)return c?(d(f.attributes,c),l):l;var y={key:null,undirected:r,source:o,target:a,attributes:c};if(n&&(i=e._edgeKeyGenerator(y)),i=""+i,e._edges.has(i))throw new z("Graph.".concat(t,': the "').concat(i,'" edge already exists in the graph.'));return p||(e.addNode(o),p=e._nodes.get(o),o===a&&(g=p)),g||(e.addNode(a),g=e._nodes.get(a)),s=new(r?T:C)(i,n,p,g,c),e._edges.set(i,s),o===a?r?p.undirectedSelfLoops++:p.directedSelfLoops++:r?(p.undirectedDegree++,g.undirectedDegree++):(p.outDegree++,g.inDegree++),P(e,r,s,o,a,p,g),r?e._undirectedSize++:e._directedSize++,y.key=i,e.emit("edgeAdded",y),i}var xe=function(e){function n(t){var n;if(n=e.call(this)||this,(t=d({},Ge,t)).edgeKeyGenerator&&"function"!=typeof t.edgeKeyGenerator)throw new j("Graph.constructor: invalid 'edgeKeyGenerator' option. Expecting a function but got \"".concat(t.edgeKeyGenerator,'".'));if("boolean"!=typeof t.multi)throw new j("Graph.constructor: invalid 'multi' option. Expecting a boolean but got \"".concat(t.multi,'".'));if(!me.has(t.type))throw new j('Graph.constructor: invalid \'type\' option. Should be one of "mixed", "directed" or "undirected" but got "'.concat(t.type,'".'));if("boolean"!=typeof t.allowSelfLoops)throw new j("Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got \"".concat(t.allowSelfLoops,'".'));var r,i="mixed"===t.type?O:"directed"===t.type?K:M;return p(c(n),"NodeDataClass",i),p(c(n),"_attributes",{}),p(c(n),"_nodes",new Map),p(c(n),"_edges",new Map),p(c(n),"_directedSize",0),p(c(n),"_undirectedSize",0),p(c(n),"_edgeKeyGenerator",t.edgeKeyGenerator||(r=0,function(){return"_geid".concat(r++,"_")})),p(c(n),"_options",t),_e.forEach((function(e){return p(c(n),e,n[e])})),g(c(n),"order",(function(){return n._nodes.size})),g(c(n),"size",(function(){return n._edges.size})),g(c(n),"directedSize",(function(){return n._directedSize})),g(c(n),"undirectedSize",(function(){return n._undirectedSize})),g(c(n),"multi",n._options.multi),g(c(n),"type",n._options.type),g(c(n),"allowSelfLoops",n._options.allowSelfLoops),n}t(n,e);var r=n.prototype;return r.hasNode=function(e){return this._nodes.has(""+e)},r.hasDirectedEdge=function(e,t){if("undirected"===this.type)return!1;if(1===arguments.length){var n=""+e,r=this._edges.get(n);return!!r&&r instanceof C}if(2===arguments.length){e=""+e,t=""+t;var i=this._nodes.get(e);if(!i)return!1;var o=i.out[t];return!!o&&(!this.multi||!!o.size)}throw new j("Graph.hasDirectedEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},r.hasUndirectedEdge=function(e,t){if("directed"===this.type)return!1;if(1===arguments.length){var n=""+e,r=this._edges.get(n);return!!r&&r instanceof T}if(2===arguments.length){e=""+e,t=""+t;var i=this._nodes.get(e);if(!i)return!1;var o=i.undirected[t];return!!o&&(!this.multi||!!o.size)}throw new j("Graph.hasDirectedEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},r.hasEdge=function(e,t){if(1===arguments.length){var n=""+e;return this._edges.has(n)}if(2===arguments.length){e=""+e,t=""+t;var r=this._nodes.get(e);if(!r)return!1;var i=void 0!==r.out&&r.out[t];return i||(i=void 0!==r.undirected&&r.undirected[t]),!!i&&(!this.multi||!!i.size)}throw new j("Graph.hasEdge: invalid arity (".concat(arguments.length,", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."))},r.directedEdge=function(e,t){if("undirected"!==this.type){if(e=""+e,t=""+t,this.multi)throw new z("Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.");var n=this._nodes.get(e);if(!n)throw new U('Graph.directedEdge: could not find the "'.concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U('Graph.directedEdge: could not find the "'.concat(t,'" target node in the graph.'));var r=n.out&&n.out[t]||void 0;return r?r.key:void 0}},r.undirectedEdge=function(e,t){if("directed"!==this.type){if(e=""+e,t=""+t,this.multi)throw new z("Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.");var n=this._nodes.get(e);if(!n)throw new U('Graph.undirectedEdge: could not find the "'.concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U('Graph.undirectedEdge: could not find the "'.concat(t,'" target node in the graph.'));var r=n.undirected&&n.undirected[t]||void 0;return r?r.key:void 0}},r.edge=function(e,t){if(this.multi)throw new z("Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.");e=""+e,t=""+t;var n=this._nodes.get(e);if(!n)throw new U('Graph.edge: could not find the "'.concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U('Graph.edge: could not find the "'.concat(t,'" target node in the graph.'));var r=n.out&&n.out[t]||n.undirected&&n.undirected[t]||void 0;if(r)return r.key},r.inDegree=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("boolean"!=typeof t)throw new j('Graph.inDegree: Expecting a boolean but got "'.concat(t,'" for the second parameter (allowing self-loops to be counted).'));e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.inDegree: could not find the "'.concat(e,'" node in the graph.'));if("undirected"===this.type)return 0;var r=t?n.directedSelfLoops:0;return n.inDegree+r},r.outDegree=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("boolean"!=typeof t)throw new j('Graph.outDegree: Expecting a boolean but got "'.concat(t,'" for the second parameter (allowing self-loops to be counted).'));e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.outDegree: could not find the "'.concat(e,'" node in the graph.'));if("undirected"===this.type)return 0;var r=t?n.directedSelfLoops:0;return n.outDegree+r},r.directedDegree=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("boolean"!=typeof t)throw new j('Graph.directedDegree: Expecting a boolean but got "'.concat(t,'" for the second parameter (allowing self-loops to be counted).'));if(e=""+e,!this.hasNode(e))throw new U('Graph.directedDegree: could not find the "'.concat(e,'" node in the graph.'));return"undirected"===this.type?0:this.inDegree(e,t)+this.outDegree(e,t)},r.undirectedDegree=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("boolean"!=typeof t)throw new j('Graph.undirectedDegree: Expecting a boolean but got "'.concat(t,'" for the second parameter (allowing self-loops to be counted).'));if(e=""+e,!this.hasNode(e))throw new U('Graph.undirectedDegree: could not find the "'.concat(e,'" node in the graph.'));if("directed"===this.type)return 0;var n=this._nodes.get(e),r=t?2*n.undirectedSelfLoops:0;return n.undirectedDegree+r},r.degree=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];if("boolean"!=typeof t)throw new j('Graph.degree: Expecting a boolean but got "'.concat(t,'" for the second parameter (allowing self-loops to be counted).'));if(e=""+e,!this.hasNode(e))throw new U('Graph.degree: could not find the "'.concat(e,'" node in the graph.'));var n=0;return"undirected"!==this.type&&(n+=this.directedDegree(e,t)),"directed"!==this.type&&(n+=this.undirectedDegree(e,t)),n},r.source=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.source: could not find the "'.concat(e,'" edge in the graph.'));return t.source.key},r.target=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.target: could not find the "'.concat(e,'" edge in the graph.'));return t.target.key},r.extremities=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.extremities: could not find the "'.concat(e,'" edge in the graph.'));return[t.source.key,t.target.key]},r.opposite=function(e,t){if(e=""+e,t=""+t,!this._nodes.has(e))throw new U('Graph.opposite: could not find the "'.concat(e,'" node in the graph.'));var n=this._edges.get(t);if(!n)throw new U('Graph.opposite: could not find the "'.concat(t,'" edge in the graph.'));var r=n.source,i=n.target,o=r.key,a=i.key;if(e!==o&&e!==a)throw new U('Graph.opposite: the "'.concat(e,'" node is not attached to the "').concat(t,'" edge (').concat(o,", ").concat(a,")."));return e===o?a:o},r.undirected=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.undirected: could not find the "'.concat(e,'" edge in the graph.'));return t instanceof T},r.directed=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.directed: could not find the "'.concat(e,'" edge in the graph.'));return t instanceof C},r.selfLoop=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.selfLoop: could not find the "'.concat(e,'" edge in the graph.'));return t.source===t.target},r.addNode=function(e,t){if(t&&!h(t))throw new j('Graph.addNode: invalid attributes. Expecting an object but got "'.concat(t,'"'));if(e=""+e,t=t||{},this._nodes.has(e))throw new z('Graph.addNode: the "'.concat(e,'" node already exist in the graph.'));var n=new this.NodeDataClass(e,t);return this._nodes.set(e,n),this.emit("nodeAdded",{key:e,attributes:t}),e},r.mergeNode=function(e,t){if(t&&!h(t))throw new j('Graph.mergeNode: invalid attributes. Expecting an object but got "'.concat(t,'"'));e=""+e,t=t||{};var n=this._nodes.get(e);return n?(t&&d(n.attributes,t),e):(n=new this.NodeDataClass(e,t),this._nodes.set(e,n),this.emit("nodeAdded",{key:e,attributes:t}),e)},r.dropNode=function(e){if(e=""+e,!this.hasNode(e))throw new U('Graph.dropNode: could not find the "'.concat(e,'" node in the graph.'));for(var t=this.edges(e),n=0,r=t.length;n<r;n++)this.dropEdge(t[n]);var i=this._nodes.get(e);this._nodes.delete(e),this.emit("nodeDropped",{key:e,attributes:i.attributes})},r.dropEdge=function(e){var t;if(arguments.length>1){var n=""+arguments[0],r=""+arguments[1];if(!(t=u(this,n,r,this.type)))throw new U('Graph.dropEdge: could not find the "'.concat(n,'" -> "').concat(r,'" edge in the graph.'))}else if(e=""+e,!(t=this._edges.get(e)))throw new U('Graph.dropEdge: could not find the "'.concat(e,'" edge in the graph.'));this._edges.delete(t.key);var i=t,o=i.source,a=i.target,c=i.attributes,d=t instanceof T;return o===a?o.selfLoops--:d?(o.undirectedDegree--,a.undirectedDegree--):(o.outDegree--,a.inDegree--),W(this,d,t),d?this._undirectedSize--:this._directedSize--,this.emit("edgeDropped",{key:e,attributes:c,source:o.key,target:a.key,undirected:d}),this},r.clear=function(){this._edges.clear(),this._nodes.clear(),this.emit("cleared")},r.clearEdges=function(){this._edges.clear(),this.clearIndex(),this.emit("edgesCleared")},r.getAttribute=function(e){return this._attributes[e]},r.getAttributes=function(){return this._attributes},r.hasAttribute=function(e){return this._attributes.hasOwnProperty(e)},r.setAttribute=function(e,t){return this._attributes[e]=t,this.emit("attributesUpdated",{type:"set",meta:{name:e,value:t}}),this},r.updateAttribute=function(e,t){if("function"!=typeof t)throw new j("Graph.updateAttribute: updater should be a function.");return this._attributes[e]=t(this._attributes[e]),this.emit("attributesUpdated",{type:"set",meta:{name:e,value:this._attributes[e]}}),this},r.removeAttribute=function(e){return delete this._attributes[e],this.emit("attributesUpdated",{type:"remove",meta:{name:e}}),this},r.replaceAttributes=function(e){if(!h(e))throw new j("Graph.replaceAttributes: provided attributes are not a plain object.");var t=this._attributes;return this._attributes=e,this.emit("attributesUpdated",{type:"replace",meta:{before:t,after:e}}),this},r.mergeAttributes=function(e){if(!h(e))throw new j("Graph.mergeAttributes: provided attributes are not a plain object.");return this._attributes=d(this._attributes,e),this.emit("attributesUpdated",{type:"merge",meta:{data:this._attributes}}),this},r.getNodeAttribute=function(e,t){e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.getNodeAttribute: could not find the "'.concat(e,'" node in the graph.'));return n.attributes[t]},r.getNodeAttributes=function(e){e=""+e;var t=this._nodes.get(e);if(!t)throw new U('Graph.getNodeAttributes: could not find the "'.concat(e,'" node in the graph.'));return t.attributes},r.hasNodeAttribute=function(e,t){e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.hasNodeAttribute: could not find the "'.concat(e,'" node in the graph.'));return n.attributes.hasOwnProperty(t)},r.setNodeAttribute=function(e,t,n){e=""+e;var r=this._nodes.get(e);if(!r)throw new U('Graph.setNodeAttribute: could not find the "'.concat(e,'" node in the graph.'));if(arguments.length<3)throw new j("Graph.setNodeAttribute: not enough arguments. Either you forgot to pass the attribute's name or value, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead.");return r.attributes[t]=n,this.emit("nodeAttributesUpdated",{key:e,type:"set",meta:{name:t,value:n}}),this},r.updateNodeAttribute=function(e,t,n){e=""+e;var r=this._nodes.get(e);if(!r)throw new U('Graph.updateNodeAttribute: could not find the "'.concat(e,'" node in the graph.'));if(arguments.length<3)throw new j("Graph.updateNodeAttribute: not enough arguments. Either you forgot to pass the attribute's name or updater, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead.");if("function"!=typeof n)throw new j("Graph.updateAttribute: updater should be a function.");var i=r.attributes;return i[t]=n(i[t]),this.emit("nodeAttributesUpdated",{key:e,type:"set",meta:{name:t,value:i[t]}}),this},r.removeNodeAttribute=function(e,t){e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.hasNodeAttribute: could not find the "'.concat(e,'" node in the graph.'));return delete n.attributes[t],this.emit("nodeAttributesUpdated",{key:e,type:"remove",meta:{name:t}}),this},r.replaceNodeAttributes=function(e,t){e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.replaceNodeAttributes: could not find the "'.concat(e,'" node in the graph.'));if(!h(t))throw new j("Graph.replaceNodeAttributes: provided attributes are not a plain object.");var r=n.attributes;return n.attributes=t,this.emit("nodeAttributesUpdated",{key:e,type:"replace",meta:{before:r,after:t}}),this},r.mergeNodeAttributes=function(e,t){e=""+e;var n=this._nodes.get(e);if(!n)throw new U('Graph.mergeNodeAttributes: could not find the "'.concat(e,'" node in the graph.'));if(!h(t))throw new j("Graph.mergeNodeAttributes: provided attributes are not a plain object.");return d(n.attributes,t),this.emit("nodeAttributesUpdated",{key:e,type:"merge",meta:{data:t}}),this},r.forEach=function(e){if("function"!=typeof e)throw new j("Graph.forEach: expecting a callback.");this._edges.forEach((function(t,n){var r=t.source,i=t.target;e(r.key,i.key,r.attributes,i.attributes,n,t.attributes)}))},r.adjacency=function(){var e=this._edges.values();return new N((function(){var t=e.next();if(t.done)return t;var n=t.value,r=n.source,i=n.target;return{done:!1,value:[r.key,i.key,r.attributes,i.attributes,n.key,n.attributes]}}))},r.nodes=function(){return D(this._nodes.keys(),this._nodes.size)},r.forEachNode=function(e){if("function"!=typeof e)throw new j("Graph.forEachNode: expecting a callback.");this._nodes.forEach((function(t,n){e(n,t.attributes)}))},r.nodeEntries=function(){var e=this._nodes.values();return new N((function(){var t=e.next();if(t.done)return t;var n=t.value;return{value:[n.key,n.attributes],done:!1}}))},r.exportNode=function(e){e=""+e;var t=this._nodes.get(e);if(!t)throw new U('Graph.exportNode: could not find the "'.concat(e,'" node in the graph.'));return ye(e,t)},r.exportEdge=function(e){e=""+e;var t=this._edges.get(e);if(!t)throw new U('Graph.exportEdge: could not find the "'.concat(e,'" edge in the graph.'));return ve(e,t)},r.export=function(){var e=new Array(this._nodes.size),t=0;this._nodes.forEach((function(n,r){e[t++]=ye(r,n)}));var n=new Array(this._edges.size);return t=0,this._edges.forEach((function(e,r){n[t++]=ve(r,e)})),{attributes:this.getAttributes(),nodes:e,edges:n}},r.importNode=function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=we(e);if(n){if("not-object"===n)throw new j('Graph.importNode: invalid serialized node. A serialized node should be a plain object with at least a "key" property.');if("no-key"===n)throw new j("Graph.importNode: no key provided.");if("invalid-attributes"===n)throw new j("Graph.importNode: invalid attributes. Attributes should be a plain object, null or omitted.")}var r=e.key,i=e.attributes,o=void 0===i?{}:i;return t?this.mergeNode(r,o):this.addNode(r,o),this},r.importEdge=function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=be(e);if(n){if("not-object"===n)throw new j('Graph.importEdge: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.');if("no-source"===n)throw new j("Graph.importEdge: missing souce.");if("no-target"===n)throw new j("Graph.importEdge: missing target.");if("invalid-attributes"===n)throw new j("Graph.importEdge: invalid attributes. Attributes should be a plain object, null or omitted.");if("invalid-undirected"===n)throw new j("Graph.importEdge: invalid undirected. Undirected should be boolean or omitted.")}var r=e.source,i=e.target,o=e.attributes,a=void 0===o?{}:o,c=e.undirected,d=void 0!==c&&c;return"key"in e?(t?d?this.mergeUndirectedEdgeWithKey:this.mergeDirectedEdgeWithKey:d?this.addUndirectedEdgeWithKey:this.addDirectedEdgeWithKey).call(this,e.key,r,i,a):(t?d?this.mergeUndirectedEdge:this.mergeDirectedEdge:d?this.addUndirectedEdge:this.addDirectedEdge).call(this,r,i,a),this},r.import=function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(s(e))return this.import(e.export(),n),this;if(!h(e))throw new j("Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.");if(e.attributes){if(!h(e.attributes))throw new j("Graph.import: invalid attributes. Expecting a plain object.");n?this.mergeAttributes(e.attributes):this.replaceAttributes(e.attributes)}return e.nodes&&e.nodes.forEach((function(e){return t.importNode(e,n)})),e.edges&&e.edges.forEach((function(e){return t.importEdge(e,n)})),this},r.nullCopy=function(e){return new n(d({},this._options,e))},r.emptyCopy=function(e){var t=new n(d({},this._options,e));return this._nodes.forEach((function(e,n){e=new t.NodeDataClass(n,d({},e.attributes)),t._nodes.set(n,e)})),t},r.copy=function(){var e=new n(this._options);return e.import(this),e},r.upgradeToMixed=function(){return"mixed"===this.type||(this._nodes.forEach((function(e){return e.upgradeToMixed()})),this._options.type="mixed",g(this,"type",this._options.type),p(this,"NodeDataClass",O)),this},r.upgradeToMulti=function(){return this.multi||(this._options.multi=!0,g(this,"multi",!0),(e=this)._nodes.forEach((function(t,n){if(t.out)for(var r in t.out){var i=new Set;i.add(t.out[r]),t.out[r]=i,e._nodes.get(r).in[n]=i}if(t.undirected)for(var o in t.undirected)if(!(o>n)){var a=new Set;a.add(t.undirected[o]),t.undirected[o]=a,e._nodes.get(o).undirected[n]=a}}))),this;var e},r.clearIndex=function(){return this._nodes.forEach((function(e){void 0!==e.in&&(e.in={},e.out={}),void 0!==e.undirected&&(e.undirected={})})),this},r.toJSON=function(){return this.export()},r.toString=function(){var e=this.order>1||0===this.order,t=this.size>1||0===this.size;return"Graph<".concat(f(this.order)," node").concat(e?"s":"",", ").concat(f(this.size)," edge").concat(t?"s":"",">")},r.inspect=function(){var e=this,t={};this._nodes.forEach((function(e,n){t[n]=e.attributes}));var n={},r={};this._edges.forEach((function(t,i){var o=t instanceof T?"--":"->",a="",c="(".concat(t.source.key,")").concat(o,"(").concat(t.target.key,")");t.generatedKey?e.multi&&(void 0===r[c]?r[c]=0:r[c]++,a+="".concat(r[c],". ")):a+="[".concat(i,"]: "),n[a+=c]=t.attributes}));var i={};for(var o in this)this.hasOwnProperty(o)&&!_e.has(o)&&"function"!=typeof this[o]&&(i[o]=this[o]);return i.attributes=this._attributes,i.nodes=t,i.edges=n,p(i,"constructor",this.constructor),i},n}(y);"undefined"!=typeof Symbol&&(xe.prototype[Symbol.for("nodejs.util.inspect.custom")]=xe.prototype.inspect),[{name:function(e){return"".concat(e,"Edge")},generateKey:!0},{name:function(e){return"".concat(e,"DirectedEdge")},generateKey:!0,type:"directed"},{name:function(e){return"".concat(e,"UndirectedEdge")},generateKey:!0,type:"undirected"},{name:function(e){return"".concat(e,"EdgeWithKey")}},{name:function(e){return"".concat(e,"DirectedEdgeWithKey")},type:"directed"},{name:function(e){return"".concat(e,"UndirectedEdgeWithKey")},type:"undirected"}].forEach((function(e){["add","merge"].forEach((function(t){var n=e.name(t),r="add"===t?Ee:ke;e.generateKey?xe.prototype[n]=function(t,i,o){return r(this,n,!0,"undirected"===(e.type||this.type),null,t,i,o)}:xe.prototype[n]=function(t,i,o,a){return r(this,n,!1,"undirected"===(e.type||this.type),t,i,o,a)}}))})),"undefined"!=typeof Symbol&&(xe.prototype[Symbol.iterator]=xe.prototype.adjacency),function(e){R.forEach((function(t){var n=t.name,r=t.attacher;r(e,n("Edge"),"mixed",C),r(e,n("DirectedEdge"),"directed",C),r(e,n("UndirectedEdge"),"undirected",T)}))}(xe),function(e){F.forEach((function(t){!function(e,t){var n=t.name,r=t.type,i=t.direction;e.prototype[n]=function(e,t){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return[];if(!arguments.length)return X(this,r);if(1===arguments.length){e=""+e;var o=this._nodes.get(e);if(void 0===o)throw new U("Graph.".concat(n,': could not find the "').concat(e,'" node in the graph.'));return ee("mixed"===r?this.type:r,i,o)}if(2===arguments.length){e=""+e,t=""+t;var a=this._nodes.get(e);if(!a)throw new U("Graph.".concat(n,':  could not find the "').concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U("Graph.".concat(n,':  could not find the "').concat(t,'" target node in the graph.'));return re(r,i,a,t)}throw new j("Graph.".concat(n,": too many arguments (expecting 0, 1 or 2 and got ").concat(arguments.length,")."))}}(e,t),function(e,t){var n=t.name,r=t.type,i=t.direction,o="forEach"+n[0].toUpperCase()+n.slice(1,-1);e.prototype[o]=function(e,t,n){if("mixed"===r||"mixed"===this.type||r===this.type){if(1===arguments.length)return Z(this,r,n=e);if(2===arguments.length){e=""+e,n=t;var a=this._nodes.get(e);if(void 0===a)throw new U("Graph.".concat(o,': could not find the "').concat(e,'" node in the graph.'));return te(this.multi,"mixed"===r?this.type:r,i,a,n)}if(3===arguments.length){e=""+e,t=""+t;var c=this._nodes.get(e);if(!c)throw new U("Graph.".concat(o,':  could not find the "').concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U("Graph.".concat(o,':  could not find the "').concat(t,'" target node in the graph.'));return ie(r,i,c,t,n)}throw new j("Graph.".concat(o,": too many arguments (expecting 1, 2 or 3 and got ").concat(arguments.length,")."))}}}(e,t),function(e,t){var n=t.name,r=t.type,i=t.direction,o=n.slice(0,-1)+"Entries";e.prototype[o]=function(e,t){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return N.empty();if(!arguments.length)return $(this,r);if(1===arguments.length){e=""+e;var n=this._nodes.get(e);if(!n)throw new U("Graph.".concat(o,': could not find the "').concat(e,'" node in the graph.'));return ne(r,i,n)}if(2===arguments.length){e=""+e,t=""+t;var a=this._nodes.get(e);if(!a)throw new U("Graph.".concat(o,':  could not find the "').concat(e,'" source node in the graph.'));if(!this._nodes.has(t))throw new U("Graph.".concat(o,':  could not find the "').concat(t,'" target node in the graph.'));return oe(r,i,a,t)}throw new j("Graph.".concat(o,": too many arguments (expecting 0, 1 or 2 and got ").concat(arguments.length,")."))}}(e,t)}))}(xe),function(e){ae.forEach((function(t){!function(e,t){var n=t.name,r=t.type,i=t.direction;e.prototype[n]=function(e){if("mixed"!==r&&"mixed"!==this.type&&r!==this.type)return[];if(2===arguments.length){var t=""+arguments[0],o=""+arguments[1];if(!this._nodes.has(t))throw new U("Graph.".concat(n,': could not find the "').concat(t,'" node in the graph.'));if(!this._nodes.has(o))throw new U("Graph.".concat(n,': could not find the "').concat(o,'" node in the graph.'));return pe(this,r,i,t,o)}if(1===arguments.length){e=""+e;var a=this._nodes.get(e);if(void 0===a)throw new U("Graph.".concat(n,': could not find the "').concat(e,'" node in the graph.'));var c=de("mixed"===r?this.type:r,i,a);return c}throw new j("Graph.".concat(n,": invalid number of arguments (expecting 1 or 2 and got ").concat(arguments.length,")."))}}(e,t),ge(e,t),le(e,t)}))}(xe);var Se=function(e){function n(t){return e.call(this,d({type:"directed"},t))||this}return t(n,e),n}(xe),Ae=function(e){function n(t){return e.call(this,d({type:"undirected"},t))||this}return t(n,e),n}(xe),Ne=function(e){function n(t){return e.call(this,d({multi:!0},t))||this}return t(n,e),n}(xe),De=function(e){function n(t){return e.call(this,d({multi:!0,type:"directed"},t))||this}return t(n,e),n}(xe),Le=function(e){function n(t){return e.call(this,d({multi:!0,type:"undirected"},t))||this}return t(n,e),n}(xe);function je(e){e.from=function(t,n){var r=new e(n);return r.import(t),r}}return je(xe),je(Se),je(Ae),je(Ne),je(De),je(Le),xe.Graph=xe,xe.DirectedGraph=Se,xe.UndirectedGraph=Ae,xe.MultiGraph=Ne,xe.MultiDirectedGraph=De,xe.MultiUndirectedGraph=Le,xe.InvalidArgumentsGraphError=j,xe.NotFoundGraphError=U,xe.UsageGraphError=z,xe}));


},{}],7:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],8:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],9:[function(require,module,exports){
module.exports = Long;

/**
 * wasm optimizations, to do native i64 multiplication and divide
 */
var wasm = null;

try {
  wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11
  ])), {}).exports;
} catch (e) {
  // no wasm support :(
}

/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Longs.
 * @exports Long
 * @class A Long class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @constructor
 */
function Long(low, high, unsigned) {

    /**
     * The low 32 bits as a signed value.
     * @type {number}
     */
    this.low = low | 0;

    /**
     * The high 32 bits as a signed value.
     * @type {number}
     */
    this.high = high | 0;

    /**
     * Whether unsigned or not.
     * @type {boolean}
     */
    this.unsigned = !!unsigned;
}

// The internal representation of a long is the two given signed, 32-bit values.
// We use 32-bit pieces because these are the size of integers on which
// Javascript performs bit-operations.  For operations like addition and
// multiplication, we split each number into 16 bit pieces, which can easily be
// multiplied within Javascript's floating-point representation without overflow
// or change in sign.
//
// In the algorithms below, we frequently reduce the negative case to the
// positive case by negating the input(s) and then post-processing the result.
// Note that we must ALWAYS check specially whether those values are MIN_VALUE
// (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
// a positive number, it overflows back into a negative).  Not handling this
// case would often result in infinite recursion.
//
// Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
// methods on which they depend.

/**
 * An indicator used to reliably determine if an object is a Long or not.
 * @type {boolean}
 * @const
 * @private
 */
Long.prototype.__isLong__;

Object.defineProperty(Long.prototype, "__isLong__", { value: true });

/**
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 * @inner
 */
function isLong(obj) {
    return (obj && obj["__isLong__"]) === true;
}

/**
 * Tests if the specified object is a Long.
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 */
Long.isLong = isLong;

/**
 * A cache of the Long representations of small integer values.
 * @type {!Object}
 * @inner
 */
var INT_CACHE = {};

/**
 * A cache of the Long representations of small unsigned integer values.
 * @type {!Object}
 * @inner
 */
var UINT_CACHE = {};

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */
function fromInt(value, unsigned) {
    var obj, cachedObj, cache;
    if (unsigned) {
        value >>>= 0;
        if (cache = (0 <= value && value < 256)) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
            UINT_CACHE[value] = obj;
        return obj;
    } else {
        value |= 0;
        if (cache = (-128 <= value && value < 128)) {
            cachedObj = INT_CACHE[value];
            if (cachedObj)
                return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
            INT_CACHE[value] = obj;
        return obj;
    }
}

/**
 * Returns a Long representing the given 32 bit integer value.
 * @function
 * @param {number} value The 32 bit integer in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */
Long.fromInt = fromInt;

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */
function fromNumber(value, unsigned) {
    if (isNaN(value))
        return unsigned ? UZERO : ZERO;
    if (unsigned) {
        if (value < 0)
            return UZERO;
        if (value >= TWO_PWR_64_DBL)
            return MAX_UNSIGNED_VALUE;
    } else {
        if (value <= -TWO_PWR_63_DBL)
            return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
            return MAX_VALUE;
    }
    if (value < 0)
        return fromNumber(-value, unsigned).neg();
    return fromBits((value % TWO_PWR_32_DBL) | 0, (value / TWO_PWR_32_DBL) | 0, unsigned);
}

/**
 * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
 * @function
 * @param {number} value The number in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */
Long.fromNumber = fromNumber;

/**
 * @param {number} lowBits
 * @param {number} highBits
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */
function fromBits(lowBits, highBits, unsigned) {
    return new Long(lowBits, highBits, unsigned);
}

/**
 * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
 *  assumed to use 32 bits.
 * @function
 * @param {number} lowBits The low 32 bits
 * @param {number} highBits The high 32 bits
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */
Long.fromBits = fromBits;

/**
 * @function
 * @param {number} base
 * @param {number} exponent
 * @returns {number}
 * @inner
 */
var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Long}
 * @inner
 */
function fromString(str, unsigned, radix) {
    if (str.length === 0)
        throw Error('empty string');
    if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return ZERO;
    if (typeof unsigned === 'number') {
        // For goog.math.long compatibility
        radix = unsigned,
        unsigned = false;
    } else {
        unsigned = !! unsigned;
    }
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');

    var p;
    if ((p = str.indexOf('-')) > 0)
        throw Error('interior hyphen');
    else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = fromNumber(pow_dbl(radix, 8));

    var result = ZERO;
    for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i),
            value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
        } else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
        }
    }
    result.unsigned = unsigned;
    return result;
}

/**
 * Returns a Long representation of the given string, written using the specified radix.
 * @function
 * @param {string} str The textual representation of the Long
 * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to signed
 * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
 * @returns {!Long} The corresponding Long value
 */
Long.fromString = fromString;

/**
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */
function fromValue(val, unsigned) {
    if (typeof val === 'number')
        return fromNumber(val, unsigned);
    if (typeof val === 'string')
        return fromString(val, unsigned);
    // Throws for non-objects, converts non-instanceof Long:
    return fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
}

/**
 * Converts the specified value to a Long using the appropriate from* function for its type.
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long}
 */
Long.fromValue = fromValue;

// NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
// no runtime penalty for these.

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_16_DBL = 1 << 16;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_24_DBL = 1 << 24;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

/**
 * @type {number}
 * @const
 * @inner
 */
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

/**
 * @type {!Long}
 * @const
 * @inner
 */
var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

/**
 * @type {!Long}
 * @inner
 */
var ZERO = fromInt(0);

/**
 * Signed zero.
 * @type {!Long}
 */
Long.ZERO = ZERO;

/**
 * @type {!Long}
 * @inner
 */
var UZERO = fromInt(0, true);

/**
 * Unsigned zero.
 * @type {!Long}
 */
Long.UZERO = UZERO;

/**
 * @type {!Long}
 * @inner
 */
var ONE = fromInt(1);

/**
 * Signed one.
 * @type {!Long}
 */
Long.ONE = ONE;

/**
 * @type {!Long}
 * @inner
 */
var UONE = fromInt(1, true);

/**
 * Unsigned one.
 * @type {!Long}
 */
Long.UONE = UONE;

/**
 * @type {!Long}
 * @inner
 */
var NEG_ONE = fromInt(-1);

/**
 * Signed negative one.
 * @type {!Long}
 */
Long.NEG_ONE = NEG_ONE;

/**
 * @type {!Long}
 * @inner
 */
var MAX_VALUE = fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);

/**
 * Maximum signed value.
 * @type {!Long}
 */
Long.MAX_VALUE = MAX_VALUE;

/**
 * @type {!Long}
 * @inner
 */
var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);

/**
 * Maximum unsigned value.
 * @type {!Long}
 */
Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

/**
 * @type {!Long}
 * @inner
 */
var MIN_VALUE = fromBits(0, 0x80000000|0, false);

/**
 * Minimum signed value.
 * @type {!Long}
 */
Long.MIN_VALUE = MIN_VALUE;

/**
 * @alias Long.prototype
 * @inner
 */
var LongPrototype = Long.prototype;

/**
 * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
 * @returns {number}
 */
LongPrototype.toInt = function toInt() {
    return this.unsigned ? this.low >>> 0 : this.low;
};

/**
 * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
 * @returns {number}
 */
LongPrototype.toNumber = function toNumber() {
    if (this.unsigned)
        return ((this.high >>> 0) * TWO_PWR_32_DBL) + (this.low >>> 0);
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
};

/**
 * Converts the Long to a string written in the specified radix.
 * @param {number=} radix Radix (2-36), defaults to 10
 * @returns {string}
 * @override
 * @throws {RangeError} If `radix` is out of range
 */
LongPrototype.toString = function toString(radix) {
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw RangeError('radix');
    if (this.isZero())
        return '0';
    if (this.isNegative()) { // Unsigned Longs are never negative
        if (this.eq(MIN_VALUE)) {
            // We need to change the Long value before it can be negated, so we remove
            // the bottom-most digit in this base and then recurse to do the rest.
            var radixLong = fromNumber(radix),
                div = this.div(radixLong),
                rem1 = div.mul(radixLong).sub(this);
            return div.toString(radix) + rem1.toInt().toString(radix);
        } else
            return '-' + this.neg().toString(radix);
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
        rem = this;
    var result = '';
    while (true) {
        var remDiv = rem.div(radixToPower),
            intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
            digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero())
            return digits + result;
        else {
            while (digits.length < 6)
                digits = '0' + digits;
            result = '' + digits + result;
        }
    }
};

/**
 * Gets the high 32 bits as a signed integer.
 * @returns {number} Signed high bits
 */
LongPrototype.getHighBits = function getHighBits() {
    return this.high;
};

/**
 * Gets the high 32 bits as an unsigned integer.
 * @returns {number} Unsigned high bits
 */
LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
    return this.high >>> 0;
};

/**
 * Gets the low 32 bits as a signed integer.
 * @returns {number} Signed low bits
 */
LongPrototype.getLowBits = function getLowBits() {
    return this.low;
};

/**
 * Gets the low 32 bits as an unsigned integer.
 * @returns {number} Unsigned low bits
 */
LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
    return this.low >>> 0;
};

/**
 * Gets the number of bits needed to represent the absolute value of this Long.
 * @returns {number}
 */
LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
    if (this.isNegative()) // Unsigned Longs are never negative
        return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
    var val = this.high != 0 ? this.high : this.low;
    for (var bit = 31; bit > 0; bit--)
        if ((val & (1 << bit)) != 0)
            break;
    return this.high != 0 ? bit + 33 : bit + 1;
};

/**
 * Tests if this Long's value equals zero.
 * @returns {boolean}
 */
LongPrototype.isZero = function isZero() {
    return this.high === 0 && this.low === 0;
};

/**
 * Tests if this Long's value equals zero. This is an alias of {@link Long#isZero}.
 * @returns {boolean}
 */
LongPrototype.eqz = LongPrototype.isZero;

/**
 * Tests if this Long's value is negative.
 * @returns {boolean}
 */
LongPrototype.isNegative = function isNegative() {
    return !this.unsigned && this.high < 0;
};

/**
 * Tests if this Long's value is positive.
 * @returns {boolean}
 */
LongPrototype.isPositive = function isPositive() {
    return this.unsigned || this.high >= 0;
};

/**
 * Tests if this Long's value is odd.
 * @returns {boolean}
 */
LongPrototype.isOdd = function isOdd() {
    return (this.low & 1) === 1;
};

/**
 * Tests if this Long's value is even.
 * @returns {boolean}
 */
LongPrototype.isEven = function isEven() {
    return (this.low & 1) === 0;
};

/**
 * Tests if this Long's value equals the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.equals = function equals(other) {
    if (!isLong(other))
        other = fromValue(other);
    if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high >>> 31) === 1)
        return false;
    return this.high === other.high && this.low === other.low;
};

/**
 * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.eq = LongPrototype.equals;

/**
 * Tests if this Long's value differs from the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.notEquals = function notEquals(other) {
    return !this.eq(/* validates */ other);
};

/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.neq = LongPrototype.notEquals;

/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.ne = LongPrototype.notEquals;

/**
 * Tests if this Long's value is less than the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.lessThan = function lessThan(other) {
    return this.comp(/* validates */ other) < 0;
};

/**
 * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.lt = LongPrototype.lessThan;

/**
 * Tests if this Long's value is less than or equal the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
    return this.comp(/* validates */ other) <= 0;
};

/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.lte = LongPrototype.lessThanOrEqual;

/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.le = LongPrototype.lessThanOrEqual;

/**
 * Tests if this Long's value is greater than the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.greaterThan = function greaterThan(other) {
    return this.comp(/* validates */ other) > 0;
};

/**
 * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.gt = LongPrototype.greaterThan;

/**
 * Tests if this Long's value is greater than or equal the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
    return this.comp(/* validates */ other) >= 0;
};

/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.gte = LongPrototype.greaterThanOrEqual;

/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */
LongPrototype.ge = LongPrototype.greaterThanOrEqual;

/**
 * Compares this Long's value with the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */
LongPrototype.compare = function compare(other) {
    if (!isLong(other))
        other = fromValue(other);
    if (this.eq(other))
        return 0;
    var thisNeg = this.isNegative(),
        otherNeg = other.isNegative();
    if (thisNeg && !otherNeg)
        return -1;
    if (!thisNeg && otherNeg)
        return 1;
    // At this point the sign bits are the same
    if (!this.unsigned)
        return this.sub(other).isNegative() ? -1 : 1;
    // Both are positive if at least one is unsigned
    return (other.high >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
};

/**
 * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */
LongPrototype.comp = LongPrototype.compare;

/**
 * Negates this Long's value.
 * @returns {!Long} Negated Long
 */
LongPrototype.negate = function negate() {
    if (!this.unsigned && this.eq(MIN_VALUE))
        return MIN_VALUE;
    return this.not().add(ONE);
};

/**
 * Negates this Long's value. This is an alias of {@link Long#negate}.
 * @function
 * @returns {!Long} Negated Long
 */
LongPrototype.neg = LongPrototype.negate;

/**
 * Returns the sum of this and the specified Long.
 * @param {!Long|number|string} addend Addend
 * @returns {!Long} Sum
 */
LongPrototype.add = function add(addend) {
    if (!isLong(addend))
        addend = fromValue(addend);

    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;

    var b48 = addend.high >>> 16;
    var b32 = addend.high & 0xFFFF;
    var b16 = addend.low >>> 16;
    var b00 = addend.low & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
};

/**
 * Returns the difference of this and the specified Long.
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */
LongPrototype.subtract = function subtract(subtrahend) {
    if (!isLong(subtrahend))
        subtrahend = fromValue(subtrahend);
    return this.add(subtrahend.neg());
};

/**
 * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
 * @function
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */
LongPrototype.sub = LongPrototype.subtract;

/**
 * Returns the product of this and the specified Long.
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */
LongPrototype.multiply = function multiply(multiplier) {
    if (this.isZero())
        return ZERO;
    if (!isLong(multiplier))
        multiplier = fromValue(multiplier);

    // use wasm support if present
    if (wasm) {
        var low = wasm.mul(this.low,
                           this.high,
                           multiplier.low,
                           multiplier.high);
        return fromBits(low, wasm.get_high(), this.unsigned);
    }

    if (multiplier.isZero())
        return ZERO;
    if (this.eq(MIN_VALUE))
        return multiplier.isOdd() ? MIN_VALUE : ZERO;
    if (multiplier.eq(MIN_VALUE))
        return this.isOdd() ? MIN_VALUE : ZERO;

    if (this.isNegative()) {
        if (multiplier.isNegative())
            return this.neg().mul(multiplier.neg());
        else
            return this.neg().mul(multiplier).neg();
    } else if (multiplier.isNegative())
        return this.mul(multiplier.neg()).neg();

    // If both longs are small, use float multiplication
    if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
        return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high >>> 16;
    var a32 = this.high & 0xFFFF;
    var a16 = this.low >>> 16;
    var a00 = this.low & 0xFFFF;

    var b48 = multiplier.high >>> 16;
    var b32 = multiplier.high & 0xFFFF;
    var b16 = multiplier.low >>> 16;
    var b00 = multiplier.low & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
};

/**
 * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
 * @function
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */
LongPrototype.mul = LongPrototype.multiply;

/**
 * Returns this Long divided by the specified. The result is signed if this Long is signed or
 *  unsigned if this Long is unsigned.
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */
LongPrototype.divide = function divide(divisor) {
    if (!isLong(divisor))
        divisor = fromValue(divisor);
    if (divisor.isZero())
        throw Error('division by zero');

    // use wasm support if present
    if (wasm) {
        // guard against signed division overflow: the largest
        // negative number / -1 would be 1 larger than the largest
        // positive number, due to two's complement.
        if (!this.unsigned &&
            this.high === -0x80000000 &&
            divisor.low === -1 && divisor.high === -1) {
            // be consistent with non-wasm code path
            return this;
        }
        var low = (this.unsigned ? wasm.div_u : wasm.div_s)(
            this.low,
            this.high,
            divisor.low,
            divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
    }

    if (this.isZero())
        return this.unsigned ? UZERO : ZERO;
    var approx, rem, res;
    if (!this.unsigned) {
        // This section is only relevant for signed longs and is derived from the
        // closure library as a whole.
        if (this.eq(MIN_VALUE)) {
            if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                return MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
            else if (divisor.eq(MIN_VALUE))
                return ONE;
            else {
                // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                var halfThis = this.shr(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(ZERO)) {
                    return divisor.isNegative() ? ONE : NEG_ONE;
                } else {
                    rem = this.sub(divisor.mul(approx));
                    res = approx.add(rem.div(divisor));
                    return res;
                }
            }
        } else if (divisor.eq(MIN_VALUE))
            return this.unsigned ? UZERO : ZERO;
        if (this.isNegative()) {
            if (divisor.isNegative())
                return this.neg().div(divisor.neg());
            return this.neg().div(divisor).neg();
        } else if (divisor.isNegative())
            return this.div(divisor.neg()).neg();
        res = ZERO;
    } else {
        // The algorithm below has not been made for unsigned longs. It's therefore
        // required to take special care of the MSB prior to running it.
        if (!divisor.unsigned)
            divisor = divisor.toUnsigned();
        if (divisor.gt(this))
            return UZERO;
        if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
            return UONE;
        res = UZERO;
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    rem = this;
    while (rem.gte(divisor)) {
        // Approximate the result of division. This may be a little greater or
        // smaller than the actual value.
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

        // We will tweak the approximate result by changing it in the 48-th digit or
        // the smallest non-fractional digit, whichever is larger.
        var log2 = Math.ceil(Math.log(approx) / Math.LN2),
            delta = (log2 <= 48) ? 1 : pow_dbl(2, log2 - 48),

        // Decrease the approximation until it is smaller than the remainder.  Note
        // that if it is too large, the product overflows and is negative.
            approxRes = fromNumber(approx),
            approxRem = approxRes.mul(divisor);
        while (approxRem.isNegative() || approxRem.gt(rem)) {
            approx -= delta;
            approxRes = fromNumber(approx, this.unsigned);
            approxRem = approxRes.mul(divisor);
        }

        // We know the answer can't be zero... and actually, zero would cause
        // infinite recursion since we would make no progress.
        if (approxRes.isZero())
            approxRes = ONE;

        res = res.add(approxRes);
        rem = rem.sub(approxRem);
    }
    return res;
};

/**
 * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */
LongPrototype.div = LongPrototype.divide;

/**
 * Returns this Long modulo the specified.
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */
LongPrototype.modulo = function modulo(divisor) {
    if (!isLong(divisor))
        divisor = fromValue(divisor);

    // use wasm support if present
    if (wasm) {
        var low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(
            this.low,
            this.high,
            divisor.low,
            divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
    }

    return this.sub(this.div(divisor).mul(divisor));
};

/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */
LongPrototype.mod = LongPrototype.modulo;

/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */
LongPrototype.rem = LongPrototype.modulo;

/**
 * Returns the bitwise NOT of this Long.
 * @returns {!Long}
 */
LongPrototype.not = function not() {
    return fromBits(~this.low, ~this.high, this.unsigned);
};

/**
 * Returns the bitwise AND of this Long and the specified.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */
LongPrototype.and = function and(other) {
    if (!isLong(other))
        other = fromValue(other);
    return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
};

/**
 * Returns the bitwise OR of this Long and the specified.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */
LongPrototype.or = function or(other) {
    if (!isLong(other))
        other = fromValue(other);
    return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
};

/**
 * Returns the bitwise XOR of this Long and the given one.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */
LongPrototype.xor = function xor(other) {
    if (!isLong(other))
        other = fromValue(other);
    return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
};

/**
 * Returns this Long with bits shifted to the left by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shiftLeft = function shiftLeft(numBits) {
    if (isLong(numBits))
        numBits = numBits.toInt();
    if ((numBits &= 63) === 0)
        return this;
    else if (numBits < 32)
        return fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
    else
        return fromBits(0, this.low << (numBits - 32), this.unsigned);
};

/**
 * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shl = LongPrototype.shiftLeft;

/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shiftRight = function shiftRight(numBits) {
    if (isLong(numBits))
        numBits = numBits.toInt();
    if ((numBits &= 63) === 0)
        return this;
    else if (numBits < 32)
        return fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
    else
        return fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
};

/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shr = LongPrototype.shiftRight;

/**
 * Returns this Long with bits logically shifted to the right by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
    if (isLong(numBits))
        numBits = numBits.toInt();
    numBits &= 63;
    if (numBits === 0)
        return this;
    else {
        var high = this.high;
        if (numBits < 32) {
            var low = this.low;
            return fromBits((low >>> numBits) | (high << (32 - numBits)), high >>> numBits, this.unsigned);
        } else if (numBits === 32)
            return fromBits(high, 0, this.unsigned);
        else
            return fromBits(high >>> (numBits - 32), 0, this.unsigned);
    }
};

/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shru = LongPrototype.shiftRightUnsigned;

/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */
LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;

/**
 * Converts this Long to signed.
 * @returns {!Long} Signed long
 */
LongPrototype.toSigned = function toSigned() {
    if (!this.unsigned)
        return this;
    return fromBits(this.low, this.high, false);
};

/**
 * Converts this Long to unsigned.
 * @returns {!Long} Unsigned long
 */
LongPrototype.toUnsigned = function toUnsigned() {
    if (this.unsigned)
        return this;
    return fromBits(this.low, this.high, true);
};

/**
 * Converts this Long to its byte representation.
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {!Array.<number>} Byte representation
 */
LongPrototype.toBytes = function toBytes(le) {
    return le ? this.toBytesLE() : this.toBytesBE();
};

/**
 * Converts this Long to its little endian byte representation.
 * @returns {!Array.<number>} Little endian byte representation
 */
LongPrototype.toBytesLE = function toBytesLE() {
    var hi = this.high,
        lo = this.low;
    return [
        lo        & 0xff,
        lo >>>  8 & 0xff,
        lo >>> 16 & 0xff,
        lo >>> 24       ,
        hi        & 0xff,
        hi >>>  8 & 0xff,
        hi >>> 16 & 0xff,
        hi >>> 24
    ];
};

/**
 * Converts this Long to its big endian byte representation.
 * @returns {!Array.<number>} Big endian byte representation
 */
LongPrototype.toBytesBE = function toBytesBE() {
    var hi = this.high,
        lo = this.low;
    return [
        hi >>> 24       ,
        hi >>> 16 & 0xff,
        hi >>>  8 & 0xff,
        hi        & 0xff,
        lo >>> 24       ,
        lo >>> 16 & 0xff,
        lo >>>  8 & 0xff,
        lo        & 0xff
    ];
};

/**
 * Creates a Long from its byte representation.
 * @param {!Array.<number>} bytes Byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {Long} The corresponding Long value
 */
Long.fromBytes = function fromBytes(bytes, unsigned, le) {
    return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
};

/**
 * Creates a Long from its little endian byte representation.
 * @param {!Array.<number>} bytes Little endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */
Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
    return new Long(
        bytes[0]       |
        bytes[1] <<  8 |
        bytes[2] << 16 |
        bytes[3] << 24,
        bytes[4]       |
        bytes[5] <<  8 |
        bytes[6] << 16 |
        bytes[7] << 24,
        unsigned
    );
};

/**
 * Creates a Long from its big endian byte representation.
 * @param {!Array.<number>} bytes Big endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */
Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
    return new Long(
        bytes[4] << 24 |
        bytes[5] << 16 |
        bytes[6] <<  8 |
        bytes[7],
        bytes[0] << 24 |
        bytes[1] << 16 |
        bytes[2] <<  8 |
        bytes[3],
        unsigned
    );
};

},{}],10:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var LocalStorage_1 = __importDefault(require("./internal/common/LocalStorage"));
var BrowserFetchStreamTransport_1 = __importDefault(require("./internal/net/BrowserFetchStreamTransport"));
var BrowserFetchTransport_1 = __importDefault(require("./internal/net/BrowserFetchTransport"));
var StitchAppClientImpl_1 = __importDefault(require("./internal/StitchAppClientImpl"));
var DEFAULT_BASE_URL = "https://stitch.mongodb.com";
var appClients = {};
var Stitch = (function () {
    function Stitch() {
    }
    Object.defineProperty(Stitch, "defaultAppClient", {
        get: function () {
            if (Stitch.defaultClientAppId === undefined) {
                throw new Error("default app client has not yet been initialized/set");
            }
            return appClients[Stitch.defaultClientAppId];
        },
        enumerable: true,
        configurable: true
    });
    Stitch.getAppClient = function (clientAppId) {
        if (appClients[clientAppId] === undefined) {
            throw new Error("client for app '" + clientAppId + "' has not yet been initialized");
        }
        return appClients[clientAppId];
    };
    Stitch.hasAppClient = function (clientAppId) {
        return appClients[clientAppId] !== undefined;
    };
    Stitch.initializeDefaultAppClient = function (clientAppId, config) {
        if (config === void 0) { config = new mongodb_stitch_core_sdk_1.StitchAppClientConfiguration.Builder().build(); }
        if (clientAppId === undefined || clientAppId === "") {
            throw new Error("clientAppId must be set to a non-empty string");
        }
        if (Stitch.defaultClientAppId !== undefined) {
            throw new Error("default app can only be set once; currently set to '" + Stitch.defaultClientAppId + "'");
        }
        var client = Stitch.initializeAppClient(clientAppId, config);
        Stitch.defaultClientAppId = clientAppId;
        return client;
    };
    Stitch.initializeAppClient = function (clientAppId, config) {
        if (config === void 0) { config = new mongodb_stitch_core_sdk_1.StitchAppClientConfiguration.Builder().build(); }
        if (clientAppId === undefined || clientAppId === "") {
            throw new Error("clientAppId must be set to a non-empty string");
        }
        if (appClients[clientAppId] !== undefined) {
            throw new Error("client for app '" + clientAppId + "' has already been initialized");
        }
        var builder = config.builder ? config.builder() : new mongodb_stitch_core_sdk_1.StitchAppClientConfiguration.Builder(config);
        if (builder.storage === undefined) {
            builder.withStorage(new LocalStorage_1.default(clientAppId));
        }
        if (builder.transport === undefined) {
            if (window["EventSource"]) {
                builder.withTransport(new BrowserFetchStreamTransport_1.default());
            }
            else {
                builder.withTransport(new BrowserFetchTransport_1.default());
            }
        }
        if (builder.baseUrl === undefined || builder.baseUrl === "") {
            builder.withBaseUrl(DEFAULT_BASE_URL);
        }
        if (builder.localAppName === undefined || builder.localAppName === "") {
            builder.withLocalAppName(Stitch.localAppName);
        }
        if (builder.localAppVersion === undefined ||
            builder.localAppVersion === "") {
            builder.withLocalAppVersion(Stitch.localAppVersion);
        }
        var client = new StitchAppClientImpl_1.default(clientAppId, builder.build());
        appClients[clientAppId] = client;
        return client;
    };
    Stitch.clearApps = function () {
        appClients = {};
    };
    return Stitch;
}());
exports.default = Stitch;

},{"./internal/StitchAppClientImpl":25,"./internal/common/LocalStorage":26,"./internal/net/BrowserFetchStreamTransport":28,"./internal/net/BrowserFetchTransport":29,"mongodb-stitch-core-sdk":90}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RedirectFragmentFields;
(function (RedirectFragmentFields) {
    RedirectFragmentFields["StitchError"] = "_stitch_error";
    RedirectFragmentFields["State"] = "_stitch_state";
    RedirectFragmentFields["UserAuth"] = "_stitch_ua";
    RedirectFragmentFields["LinkUser"] = "_stitch_link_user";
    RedirectFragmentFields["StitchLink"] = "_stitch_link";
    RedirectFragmentFields["ClientAppId"] = "_stitch_client_app_id";
})(RedirectFragmentFields || (RedirectFragmentFields = {}));
exports.default = RedirectFragmentFields;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RedirectKeys;
(function (RedirectKeys) {
    RedirectKeys["ProviderName"] = "_stitch_redirect_provider_name";
    RedirectKeys["ProviderType"] = "_stitch_redirect_provider_type";
    RedirectKeys["State"] = "_stitch_redirect_state";
})(RedirectKeys || (RedirectKeys = {}));
exports.default = RedirectKeys;

},{}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var detect_browser_1 = require("detect-browser");
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var Version_1 = __importDefault(require("../../internal/common/Version"));
var RedirectFragmentFields_1 = __importDefault(require("./RedirectFragmentFields"));
var RedirectKeys_1 = __importDefault(require("./RedirectKeys"));
var StitchRedirectError_1 = __importDefault(require("./StitchRedirectError"));
var StitchUserFactoryImpl_1 = __importDefault(require("./StitchUserFactoryImpl"));
var alphaNumericCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var StitchAuthImpl = (function (_super) {
    __extends(StitchAuthImpl, _super);
    function StitchAuthImpl(requestClient, browserAuthRoutes, authStorage, appInfo, jsdomWindow) {
        if (jsdomWindow === void 0) { jsdomWindow = window; }
        var _this = _super.call(this, requestClient, browserAuthRoutes, authStorage) || this;
        _this.browserAuthRoutes = browserAuthRoutes;
        _this.authStorage = authStorage;
        _this.appInfo = appInfo;
        _this.jsdomWindow = jsdomWindow;
        _this.listeners = new Set();
        _this.synchronousListeners = new Set();
        return _this;
    }
    Object.defineProperty(StitchAuthImpl.prototype, "userFactory", {
        get: function () {
            return new StitchUserFactoryImpl_1.default(this);
        },
        enumerable: true,
        configurable: true
    });
    StitchAuthImpl.prototype.getProviderClient = function (factory, providerName) {
        if (isAuthProviderClientFactory(factory)) {
            return factory.getClient(this, this.requestClient, this.authRoutes);
        }
        else {
            return factory.getNamedClient(providerName, this.requestClient, this.authRoutes);
        }
    };
    StitchAuthImpl.prototype.loginWithCredential = function (credential) {
        return _super.prototype.loginWithCredentialInternal.call(this, credential);
    };
    StitchAuthImpl.prototype.loginWithRedirect = function (credential) {
        var _this = this;
        var _a = this.prepareRedirect(credential), redirectUrl = _a.redirectUrl, state = _a.state;
        this.requestClient.getBaseURL().then(function (baseUrl) {
            _this.jsdomWindow.location.replace(baseUrl +
                _this.browserAuthRoutes.getAuthProviderRedirectRoute(credential, redirectUrl, state, _this.deviceInfo));
        });
    };
    StitchAuthImpl.prototype.linkWithRedirectInternal = function (user, credential) {
        var _this = this;
        if (this.user !== undefined && user.id !== this.user.id) {
            return Promise.reject(new mongodb_stitch_core_sdk_1.StitchClientError(mongodb_stitch_core_sdk_1.StitchClientErrorCode.UserNoLongerValid));
        }
        var _a = this.prepareRedirect(credential), redirectUrl = _a.redirectUrl, state = _a.state;
        return this.requestClient.getBaseURL().then(function (baseUrl) {
            var link = baseUrl +
                _this.browserAuthRoutes.getAuthProviderLinkRedirectRoute(credential, redirectUrl, state, _this.deviceInfo);
            return (StitchAuthImpl.injectedFetch ? StitchAuthImpl.injectedFetch : fetch)(new Request(link, {
                credentials: "include",
                headers: {
                    Authorization: "Bearer " + _this.authInfo.accessToken
                },
                mode: 'cors'
            }));
        }).then(function (response) {
            _this.jsdomWindow.location.replace(response.headers.get("X-Stitch-Location"));
        });
    };
    StitchAuthImpl.prototype.hasRedirectResult = function () {
        var isValid = false;
        try {
            isValid = this.parseRedirect().isValid;
            return isValid;
        }
        catch (_) {
            return false;
        }
        finally {
            if (!isValid) {
                this.cleanupRedirect();
            }
        }
    };
    StitchAuthImpl.prototype.handleRedirectResult = function () {
        try {
            var providerName = this.authStorage.get(RedirectKeys_1.default.ProviderName);
            var providerType = this.authStorage.get(RedirectKeys_1.default.ProviderType);
            var redirectFragment = this.parseRedirect();
            return this.loginWithCredentialInternal(new mongodb_stitch_core_sdk_1.StitchAuthResponseCredential(this.processRedirectResult(redirectFragment), providerType, providerName, redirectFragment.asLink)).then(function (user) { return user; });
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    StitchAuthImpl.prototype.linkWithCredential = function (user, credential) {
        return _super.prototype.linkUserWithCredentialInternal.call(this, user, credential);
    };
    StitchAuthImpl.prototype.logout = function () {
        if (arguments.length > 0) {
            return Promise.reject(new mongodb_stitch_core_sdk_1.StitchClientError(mongodb_stitch_core_sdk_1.StitchClientErrorCode.UnexpectedArguments));
        }
        return _super.prototype.logoutInternal.call(this);
    };
    StitchAuthImpl.prototype.logoutUserWithId = function (userId) {
        return _super.prototype.logoutUserWithIdInternal.call(this, userId);
    };
    StitchAuthImpl.prototype.removeUser = function () {
        if (arguments.length > 0) {
            return Promise.reject(new mongodb_stitch_core_sdk_1.StitchClientError(mongodb_stitch_core_sdk_1.StitchClientErrorCode.UnexpectedArguments));
        }
        return _super.prototype.removeUserInternal.call(this);
    };
    StitchAuthImpl.prototype.removeUserWithId = function (userId) {
        return _super.prototype.removeUserWithIdInternal.call(this, userId);
    };
    Object.defineProperty(StitchAuthImpl.prototype, "deviceInfo", {
        get: function () {
            var info = {};
            if (this.hasDeviceId) {
                info[mongodb_stitch_core_sdk_1.DeviceFields.DEVICE_ID] = this.deviceId;
            }
            if (this.appInfo.localAppName !== undefined) {
                info[mongodb_stitch_core_sdk_1.DeviceFields.APP_ID] = this.appInfo.localAppName;
            }
            if (this.appInfo.localAppVersion !== undefined) {
                info[mongodb_stitch_core_sdk_1.DeviceFields.APP_VERSION] = this.appInfo.localAppVersion;
            }
            var browser = detect_browser_1.detect();
            if (browser) {
                info[mongodb_stitch_core_sdk_1.DeviceFields.PLATFORM] = browser.name;
                info[mongodb_stitch_core_sdk_1.DeviceFields.PLATFORM_VERSION] = browser.version;
            }
            else {
                info[mongodb_stitch_core_sdk_1.DeviceFields.PLATFORM] = "web";
                info[mongodb_stitch_core_sdk_1.DeviceFields.PLATFORM_VERSION] = "0.0.0";
            }
            info[mongodb_stitch_core_sdk_1.DeviceFields.SDK_VERSION] = Version_1.default;
            return info;
        },
        enumerable: true,
        configurable: true
    });
    StitchAuthImpl.prototype.addAuthListener = function (listener) {
        this.listeners.add(listener);
        this.onAuthEvent(listener);
        this.dispatchAuthEvent({
            kind: mongodb_stitch_core_sdk_1.AuthEventKind.ListenerRegistered,
        });
    };
    StitchAuthImpl.prototype.addSynchronousAuthListener = function (listener) {
        this.listeners.add(listener);
        this.onAuthEvent(listener);
        this.dispatchAuthEvent({
            kind: mongodb_stitch_core_sdk_1.AuthEventKind.ListenerRegistered,
        });
    };
    StitchAuthImpl.prototype.removeAuthListener = function (listener) {
        this.listeners.delete(listener);
    };
    StitchAuthImpl.prototype.onAuthEvent = function (listener) {
        var _this = this;
        if (listener) {
            var _1 = new Promise(function (resolve) {
                if (listener.onAuthEvent) {
                    listener.onAuthEvent(_this);
                }
                resolve(undefined);
            });
        }
        else {
            this.listeners.forEach(function (one) {
                _this.onAuthEvent(one);
            });
        }
    };
    StitchAuthImpl.prototype.dispatchAuthEvent = function (event) {
        var _this = this;
        switch (event.kind) {
            case mongodb_stitch_core_sdk_1.AuthEventKind.ActiveUserChanged:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onActiveUserChanged) {
                        listener.onActiveUserChanged(_this, event.currentActiveUser, event.previousActiveUser);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.ListenerRegistered:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onListenerRegistered) {
                        listener.onListenerRegistered(_this);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.UserAdded:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onUserAdded) {
                        listener.onUserAdded(_this, event.addedUser);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.UserLinked:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onUserLinked) {
                        listener.onUserLinked(_this, event.linkedUser);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.UserLoggedIn:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onUserLoggedIn) {
                        listener.onUserLoggedIn(_this, event.loggedInUser);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.UserLoggedOut:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onUserLoggedOut) {
                        listener.onUserLoggedOut(_this, event.loggedOutUser);
                    }
                });
                break;
            case mongodb_stitch_core_sdk_1.AuthEventKind.UserRemoved:
                this.dispatchBlockToListeners(function (listener) {
                    if (listener.onUserRemoved) {
                        listener.onUserRemoved(_this, event.removedUser);
                    }
                });
                break;
            default:
                return this.assertNever(event);
        }
    };
    StitchAuthImpl.prototype.refreshCustomData = function () {
        return this.refreshAccessToken();
    };
    StitchAuthImpl.prototype.assertNever = function (x) {
        throw new Error("unexpected object: " + x);
    };
    StitchAuthImpl.prototype.dispatchBlockToListeners = function (block) {
        this.synchronousListeners.forEach(block);
        this.listeners.forEach(function (listener) {
            var _ = new Promise(function (resolve) {
                block(listener);
                resolve(undefined);
            });
        });
    };
    StitchAuthImpl.prototype.cleanupRedirect = function () {
        this.jsdomWindow.history.replaceState(null, "", this.pageRootUrl());
        this.authStorage.remove(RedirectKeys_1.default.State);
        this.authStorage.remove(RedirectKeys_1.default.ProviderName);
        this.authStorage.remove(RedirectKeys_1.default.ProviderType);
    };
    StitchAuthImpl.prototype.parseRedirect = function () {
        if (typeof this.jsdomWindow === "undefined") {
            throw new StitchRedirectError_1.default("running in a non-browser environment");
        }
        if (!this.jsdomWindow.location || !this.jsdomWindow.location.hash) {
            throw new StitchRedirectError_1.default("window location hash was undefined");
        }
        var ourState = this.authStorage.get(RedirectKeys_1.default.State);
        var redirectFragment = this.jsdomWindow.location.hash.substring(1);
        return parseRedirectFragment(redirectFragment, ourState, this.appInfo.clientAppId);
    };
    StitchAuthImpl.prototype.processRedirectResult = function (redirectFragment) {
        try {
            if (!redirectFragment.isValid) {
                throw new StitchRedirectError_1.default("invalid redirect result");
            }
            if (redirectFragment.lastError) {
                throw new StitchRedirectError_1.default("error handling redirect: " + redirectFragment.lastError);
            }
            if (!redirectFragment.authInfo) {
                throw new StitchRedirectError_1.default("no user auth value was found: it could not be decoded from fragment");
            }
        }
        catch (err) {
            throw err;
        }
        finally {
            this.cleanupRedirect();
        }
        return redirectFragment.authInfo;
    };
    StitchAuthImpl.prototype.prepareRedirect = function (credential) {
        this.authStorage.set(RedirectKeys_1.default.ProviderName, credential.providerName);
        this.authStorage.set(RedirectKeys_1.default.ProviderType, credential.providerType);
        var redirectUrl = credential.redirectUrl;
        if (redirectUrl === undefined) {
            redirectUrl = this.pageRootUrl();
        }
        var state = generateState();
        this.authStorage.set(RedirectKeys_1.default.State, state);
        return { redirectUrl: redirectUrl, state: state };
    };
    StitchAuthImpl.prototype.pageRootUrl = function () {
        return [
            this.jsdomWindow.location.protocol,
            "//",
            this.jsdomWindow.location.host,
            this.jsdomWindow.location.pathname
        ].join("");
    };
    return StitchAuthImpl;
}(mongodb_stitch_core_sdk_1.CoreStitchAuth));
exports.default = StitchAuthImpl;
function generateState() {
    var state = "";
    for (var i = 0; i < 64; ++i) {
        state += alphaNumericCharacters.charAt(Math.floor(Math.random() * alphaNumericCharacters.length));
    }
    return state;
}
function unmarshallUserAuth(data) {
    var parts = data.split("$");
    if (parts.length !== 4) {
        throw new StitchRedirectError_1.default("invalid user auth data provided while " +
            "marshalling user authentication data: " +
            data);
    }
    var _a = __read(parts, 4), accessToken = _a[0], refreshToken = _a[1], userId = _a[2], deviceId = _a[3];
    return new mongodb_stitch_core_sdk_1.AuthInfo(userId, deviceId, accessToken, refreshToken);
}
var ParsedRedirectFragment = (function () {
    function ParsedRedirectFragment() {
        this.stateValid = false;
        this.clientAppIdValid = false;
        this.asLink = false;
    }
    Object.defineProperty(ParsedRedirectFragment.prototype, "isValid", {
        get: function () {
            return this.stateValid && this.clientAppIdValid;
        },
        enumerable: true,
        configurable: true
    });
    return ParsedRedirectFragment;
}());
function parseRedirectFragment(fragment, ourState, ourClientAppId) {
    var vars = fragment.split("&");
    var result = new ParsedRedirectFragment();
    vars.forEach(function (kvp) {
        var pairParts = kvp.split("=");
        var pairKey = decodeURIComponent(pairParts[0]);
        switch (pairKey) {
            case RedirectFragmentFields_1.default.StitchError:
                result.lastError = decodeURIComponent(pairParts[1]);
                break;
            case RedirectFragmentFields_1.default.UserAuth:
                try {
                    result.authInfo = unmarshallUserAuth(decodeURIComponent(pairParts[1]));
                }
                catch (e) {
                    result.lastError = e;
                }
                break;
            case RedirectFragmentFields_1.default.StitchLink:
                if (pairParts[1] === "ok") {
                    result.asLink = true;
                }
                break;
            case RedirectFragmentFields_1.default.State:
                var theirState = decodeURIComponent(pairParts[1]);
                if (ourState === theirState) {
                    result.stateValid = true;
                }
                break;
            case RedirectFragmentFields_1.default.ClientAppId:
                var clientAppId = decodeURIComponent(pairParts[1]);
                if (ourClientAppId === clientAppId) {
                    result.clientAppIdValid = true;
                }
                break;
            default:
                break;
        }
    });
    return result;
}
function isAuthProviderClientFactory(factory) {
    return (factory.getClient !== undefined);
}

},{"../../internal/common/Version":27,"./RedirectFragmentFields":11,"./RedirectKeys":12,"./StitchRedirectError":16,"./StitchUserFactoryImpl":17,"detect-browser":4,"mongodb-stitch-core-sdk":90}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var StitchBrowserAppAuthRoutes = (function (_super) {
    __extends(StitchBrowserAppAuthRoutes, _super);
    function StitchBrowserAppAuthRoutes(clientAppId) {
        return _super.call(this, clientAppId) || this;
    }
    StitchBrowserAppAuthRoutes.prototype.getAuthProviderRedirectRoute = function (credential, redirectUrl, state, deviceInfo) {
        return this.getAuthProviderLoginRoute(credential.providerName) + "?redirect=" + encodeURI(redirectUrl) + "&state=" + state + "&device=" + this.uriEncodeObject(deviceInfo);
    };
    StitchBrowserAppAuthRoutes.prototype.getAuthProviderLinkRedirectRoute = function (credential, redirectUrl, state, deviceInfo) {
        return this.getAuthProviderLoginRoute(credential.providerName) + "?redirect=" + encodeURI(redirectUrl) + "&state=" + state + "&device=" + this.uriEncodeObject(deviceInfo) + "&link=true&providerRedirectHeader=true";
    };
    StitchBrowserAppAuthRoutes.prototype.uriEncodeObject = function (obj) {
        return encodeURIComponent(mongodb_stitch_core_sdk_1.base64Encode(JSON.stringify(obj)));
    };
    return StitchBrowserAppAuthRoutes;
}(mongodb_stitch_core_sdk_1.StitchAppAuthRoutes));
exports.default = StitchBrowserAppAuthRoutes;

},{"mongodb-stitch-core-sdk":90}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var StitchBrowserAppAuthRoutes_1 = __importDefault(require("./StitchBrowserAppAuthRoutes"));
var StitchBrowserAppRoutes = (function (_super) {
    __extends(StitchBrowserAppRoutes, _super);
    function StitchBrowserAppRoutes(clientAppId) {
        var _this = _super.call(this, clientAppId) || this;
        _this.authRoutes = new StitchBrowserAppAuthRoutes_1.default(clientAppId);
        return _this;
    }
    return StitchBrowserAppRoutes;
}(mongodb_stitch_core_sdk_1.StitchAppRoutes));
exports.default = StitchBrowserAppRoutes;

},{"./StitchBrowserAppAuthRoutes":14,"mongodb-stitch-core-sdk":90}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var StitchRedirectError = (function (_super) {
    __extends(StitchRedirectError, _super);
    function StitchRedirectError(msg) {
        return _super.call(this, msg) || this;
    }
    return StitchRedirectError;
}(mongodb_stitch_core_sdk_1.StitchError));
exports.default = StitchRedirectError;

},{"mongodb-stitch-core-sdk":90}],17:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserImpl_1 = __importDefault(require("./StitchUserImpl"));
var StitchUserFactoryImpl = (function () {
    function StitchUserFactoryImpl(auth) {
        this.auth = auth;
    }
    StitchUserFactoryImpl.prototype.makeUser = function (id, loggedInProviderType, loggedInProviderName, isLoggedIn, lastAuthActivity, userProfile, customData) {
        return new StitchUserImpl_1.default(id, loggedInProviderType, loggedInProviderName, isLoggedIn, lastAuthActivity, userProfile, this.auth, customData);
    };
    return StitchUserFactoryImpl;
}());
exports.default = StitchUserFactoryImpl;

},{"./StitchUserImpl":18}],18:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var StitchUserImpl = (function (_super) {
    __extends(StitchUserImpl, _super);
    function StitchUserImpl(id, loggedInProviderType, loggedInProviderName, isLoggedIn, lastAuthActivity, profile, auth, customData) {
        var _this = _super.call(this, id, loggedInProviderType, loggedInProviderName, isLoggedIn, lastAuthActivity, profile, customData) || this;
        _this.auth = auth;
        return _this;
    }
    StitchUserImpl.prototype.linkWithCredential = function (credential) {
        return this.auth.linkWithCredential(this, credential);
    };
    StitchUserImpl.prototype.linkUserWithRedirect = function (credential) {
        return this.auth.linkWithRedirectInternal(this, credential);
    };
    return StitchUserImpl;
}(mongodb_stitch_core_sdk_1.CoreStitchUserImpl));
exports.default = StitchUserImpl;

},{"mongodb-stitch-core-sdk":90}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var FacebookRedirectCredential = (function () {
    function FacebookRedirectCredential(redirectUrl, providerName, providerType) {
        if (providerName === void 0) { providerName = mongodb_stitch_core_sdk_1.FacebookAuthProvider.DEFAULT_NAME; }
        if (providerType === void 0) { providerType = mongodb_stitch_core_sdk_1.FacebookAuthProvider.TYPE; }
        this.redirectUrl = redirectUrl;
        this.providerName = providerName;
        this.providerType = providerType;
    }
    return FacebookRedirectCredential;
}());
exports.default = FacebookRedirectCredential;

},{"mongodb-stitch-core-sdk":90}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var GoogleRedirectCredential = (function () {
    function GoogleRedirectCredential(redirectUrl, providerName, providerType) {
        if (providerName === void 0) { providerName = mongodb_stitch_core_sdk_1.GoogleAuthProvider.DEFAULT_NAME; }
        if (providerType === void 0) { providerType = mongodb_stitch_core_sdk_1.GoogleAuthProvider.TYPE; }
        this.redirectUrl = redirectUrl;
        this.providerName = providerName;
        this.providerType = providerType;
    }
    return GoogleRedirectCredential;
}());
exports.default = GoogleRedirectCredential;

},{"mongodb-stitch-core-sdk":90}],21:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var UserApiKeyAuthProviderClientImpl_1 = __importDefault(require("./internal/UserApiKeyAuthProviderClientImpl"));
var UserApiKeyAuthProviderClient;
(function (UserApiKeyAuthProviderClient) {
    UserApiKeyAuthProviderClient.factory = new (function () {
        function class_1() {
        }
        class_1.prototype.getClient = function (authRequestClient, requestClient, routes) {
            return new UserApiKeyAuthProviderClientImpl_1.default(authRequestClient, routes);
        };
        return class_1;
    }())();
})(UserApiKeyAuthProviderClient = exports.UserApiKeyAuthProviderClient || (exports.UserApiKeyAuthProviderClient = {}));

},{"./internal/UserApiKeyAuthProviderClientImpl":22}],22:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var UserApiKeyAuthProviderClientImpl = (function (_super) {
    __extends(UserApiKeyAuthProviderClientImpl, _super);
    function UserApiKeyAuthProviderClientImpl(requestClient, routes) {
        return _super.call(this, requestClient, routes) || this;
    }
    UserApiKeyAuthProviderClientImpl.prototype.createApiKey = function (name) {
        return _super.prototype.createApiKey.call(this, name);
    };
    UserApiKeyAuthProviderClientImpl.prototype.fetchApiKey = function (keyId) {
        return _super.prototype.fetchApiKey.call(this, keyId);
    };
    UserApiKeyAuthProviderClientImpl.prototype.fetchApiKeys = function () {
        return _super.prototype.fetchApiKeys.call(this);
    };
    UserApiKeyAuthProviderClientImpl.prototype.deleteApiKey = function (keyId) {
        return _super.prototype.deleteApiKey.call(this, keyId);
    };
    UserApiKeyAuthProviderClientImpl.prototype.enableApiKey = function (keyId) {
        return _super.prototype.enableApiKey.call(this, keyId);
    };
    UserApiKeyAuthProviderClientImpl.prototype.disableApiKey = function (keyId) {
        return _super.prototype.disableApiKey.call(this, keyId);
    };
    return UserApiKeyAuthProviderClientImpl;
}(mongodb_stitch_core_sdk_1.CoreUserApiKeyAuthProviderClient));
exports.default = UserApiKeyAuthProviderClientImpl;

},{"mongodb-stitch-core-sdk":90}],23:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var UserPasswordAuthProviderClientImpl_1 = __importDefault(require("./internal/UserPasswordAuthProviderClientImpl"));
var UserPasswordAuthProviderClient;
(function (UserPasswordAuthProviderClient) {
    UserPasswordAuthProviderClient.factory = new (function () {
        function class_1() {
        }
        class_1.prototype.getClient = function (authRequestClient, requestClient, routes) {
            return new UserPasswordAuthProviderClientImpl_1.default(requestClient, routes);
        };
        return class_1;
    }())();
})(UserPasswordAuthProviderClient = exports.UserPasswordAuthProviderClient || (exports.UserPasswordAuthProviderClient = {}));

},{"./internal/UserPasswordAuthProviderClientImpl":24}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var UserPasswordAuthProviderClientImpl = (function (_super) {
    __extends(UserPasswordAuthProviderClientImpl, _super);
    function UserPasswordAuthProviderClientImpl(requestClient, routes) {
        return _super.call(this, mongodb_stitch_core_sdk_1.UserPasswordAuthProvider.DEFAULT_NAME, requestClient, routes) || this;
    }
    UserPasswordAuthProviderClientImpl.prototype.registerWithEmail = function (email, password) {
        return _super.prototype.registerWithEmailInternal.call(this, email, password);
    };
    UserPasswordAuthProviderClientImpl.prototype.confirmUser = function (token, tokenId) {
        return _super.prototype.confirmUserInternal.call(this, token, tokenId);
    };
    UserPasswordAuthProviderClientImpl.prototype.resendConfirmationEmail = function (email) {
        return _super.prototype.resendConfirmationEmailInternal.call(this, email);
    };
    UserPasswordAuthProviderClientImpl.prototype.resetPassword = function (token, tokenId, password) {
        return _super.prototype.resetPasswordInternal.call(this, token, tokenId, password);
    };
    UserPasswordAuthProviderClientImpl.prototype.sendResetPasswordEmail = function (email) {
        return _super.prototype.sendResetPasswordEmailInternal.call(this, email);
    };
    UserPasswordAuthProviderClientImpl.prototype.callResetPasswordFunction = function (email, password, args) {
        return _super.prototype.callResetPasswordFunctionInternal.call(this, email, password, args);
    };
    return UserPasswordAuthProviderClientImpl;
}(mongodb_stitch_core_sdk_1.CoreUserPassAuthProviderClient));
exports.default = UserPasswordAuthProviderClientImpl;

},{"mongodb-stitch-core-sdk":90}],25:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var StitchServiceClientImpl_1 = __importDefault(require("../../services/internal/StitchServiceClientImpl"));
var StitchAuthImpl_1 = __importDefault(require("../auth/internal/StitchAuthImpl"));
var StitchBrowserAppRoutes_1 = __importDefault(require("../auth/internal/StitchBrowserAppRoutes"));
var StitchAppClientImpl = (function () {
    function StitchAppClientImpl(clientAppId, config) {
        this.info = new mongodb_stitch_core_sdk_1.StitchAppClientInfo(clientAppId, config.dataDirectory, config.localAppName, config.localAppVersion);
        this.routes = new StitchBrowserAppRoutes_1.default(this.info.clientAppId);
        var requestClient = new mongodb_stitch_core_sdk_1.StitchAppRequestClient(clientAppId, config.baseUrl, config.transport);
        this.auth = new StitchAuthImpl_1.default(requestClient, this.routes.authRoutes, config.storage, this.info);
        this.coreClient = new mongodb_stitch_core_sdk_1.CoreStitchAppClient(this.auth, this.routes);
        this.serviceClients = [];
        this.auth.addSynchronousAuthListener(this);
    }
    StitchAppClientImpl.prototype.getServiceClient = function (factory, serviceName) {
        if (isServiceClientFactory(factory)) {
            var serviceClient = new mongodb_stitch_core_sdk_1.CoreStitchServiceClientImpl(this.auth, this.routes.serviceRoutes, "");
            this.bindServiceClient(serviceClient);
            return factory.getClient(serviceClient, this.info);
        }
        else {
            var serviceClient = new mongodb_stitch_core_sdk_1.CoreStitchServiceClientImpl(this.auth, this.routes.serviceRoutes, serviceName);
            this.bindServiceClient(serviceClient);
            return factory.getNamedClient(serviceClient, this.info);
        }
    };
    StitchAppClientImpl.prototype.getGeneralServiceClient = function (serviceName) {
        var serviceClient = new mongodb_stitch_core_sdk_1.CoreStitchServiceClientImpl(this.auth, this.routes.serviceRoutes, serviceName);
        this.bindServiceClient(serviceClient);
        return new StitchServiceClientImpl_1.default(serviceClient);
    };
    StitchAppClientImpl.prototype.callFunction = function (name, args) {
        return this.coreClient.callFunction(name, args);
    };
    StitchAppClientImpl.prototype.onActiveUserChanged = function (_, currentActiveUser, previousActiveUser) {
        this.onRebindEvent(new mongodb_stitch_core_sdk_1.AuthRebindEvent({
            currentActiveUser: currentActiveUser,
            kind: mongodb_stitch_core_sdk_1.AuthEventKind.ActiveUserChanged,
            previousActiveUser: previousActiveUser
        }));
    };
    StitchAppClientImpl.prototype.bindServiceClient = function (coreStitchServiceClient) {
        this.serviceClients.push(coreStitchServiceClient);
    };
    StitchAppClientImpl.prototype.onRebindEvent = function (rebindEvent) {
        this.serviceClients.forEach(function (serviceClient) {
            serviceClient.onRebindEvent(rebindEvent);
        });
    };
    return StitchAppClientImpl;
}());
exports.default = StitchAppClientImpl;
function isServiceClientFactory(factory) {
    return factory.getClient !== undefined;
}

},{"../../services/internal/StitchServiceClientImpl":32,"../auth/internal/StitchAuthImpl":13,"../auth/internal/StitchBrowserAppRoutes":15,"mongodb-stitch-core-sdk":90}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stitchPrefixKey = "__stitch.client";
var LocalStorage = (function () {
    function LocalStorage(suiteName) {
        this.suiteName = suiteName;
    }
    LocalStorage.prototype.get = function (key) {
        return localStorage.getItem(this.getKey(key));
    };
    LocalStorage.prototype.set = function (key, value) {
        localStorage.setItem(this.getKey(key), value);
    };
    LocalStorage.prototype.remove = function (key) {
        localStorage.removeItem(this.getKey(key));
    };
    LocalStorage.prototype.getKey = function (forKey) {
        return stitchPrefixKey + "." + this.suiteName + "." + forKey;
    };
    return LocalStorage;
}());
exports.default = LocalStorage;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var version = "4.8.0";
exports.default = version;


},{}],28:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var whatwg_fetch_1 = require("whatwg-fetch");
var BrowserFetchTransport_1 = __importDefault(require("./BrowserFetchTransport"));
var EventSourceEventStream_1 = __importDefault(require("./EventSourceEventStream"));
var BrowserFetchStreamTransport = (function (_super) {
    __extends(BrowserFetchStreamTransport, _super);
    function BrowserFetchStreamTransport() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BrowserFetchStreamTransport.prototype.stream = function (request, open, retryRequest) {
        if (open === void 0) { open = true; }
        var reqHeaders = __assign({}, request.headers);
        reqHeaders[mongodb_stitch_core_sdk_1.Headers.ACCEPT] = mongodb_stitch_core_sdk_1.ContentTypes.TEXT_EVENT_STREAM;
        reqHeaders[mongodb_stitch_core_sdk_1.Headers.CONTENT_TYPE] = mongodb_stitch_core_sdk_1.ContentTypes.TEXT_EVENT_STREAM;
        return whatwg_fetch_1.fetch(request.url + "&stitch_validate=true", {
            body: request.body,
            headers: reqHeaders,
            method: request.method,
            mode: 'cors'
        }).then(function (response) {
            var respHeaders = {};
            response.headers.forEach(function (value, key) {
                respHeaders[key] = value;
            });
            if (response.status < 200 || response.status >= 300) {
                return response.text()
                    .then(function (body) { return mongodb_stitch_core_sdk_1.handleRequestError(new mongodb_stitch_core_sdk_1.Response(respHeaders, response.status, body)); });
            }
            return new Promise(function (resolve, reject) {
                return new EventSourceEventStream_1.default(new EventSource(request.url), function (stream) { return resolve(stream); }, function (error) { return reject(error); }, retryRequest ?
                    function () { return retryRequest().then(function (es) { return es; }); }
                    : undefined);
            });
        });
    };
    return BrowserFetchStreamTransport;
}(BrowserFetchTransport_1.default));
exports.default = BrowserFetchStreamTransport;

},{"./BrowserFetchTransport":29,"./EventSourceEventStream":30,"mongodb-stitch-core-sdk":90,"whatwg-fetch":130}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var whatwg_fetch_1 = require("whatwg-fetch");
var BrowserFetchTransport = (function () {
    function BrowserFetchTransport() {
    }
    BrowserFetchTransport.prototype.roundTrip = function (request) {
        var responsePromise = whatwg_fetch_1.fetch(request.url, {
            body: request.body,
            headers: request.headers,
            method: request.method,
            mode: 'cors'
        });
        var responseTextPromise = responsePromise.then(function (response) {
            return response.text();
        });
        return Promise.all([responsePromise, responseTextPromise]).then(function (values) {
            var response = values[0];
            var body = values[1];
            var headers = {};
            response.headers.forEach(function (value, key) {
                headers[key] = value;
            });
            return new mongodb_stitch_core_sdk_1.Response(headers, response.status, body);
        });
    };
    BrowserFetchTransport.prototype.stream = function (request, open, retryRequest) {
        if (open === void 0) { open = true; }
        throw new mongodb_stitch_core_sdk_1.StitchClientError(mongodb_stitch_core_sdk_1.StitchClientErrorCode.StreamingNotSupported);
    };
    return BrowserFetchTransport;
}());
exports.default = BrowserFetchTransport;

},{"mongodb-stitch-core-sdk":90,"whatwg-fetch":130}],30:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var EventSourceEventStream = (function (_super) {
    __extends(EventSourceEventStream, _super);
    function EventSourceEventStream(evtSrc, onOpen, onOpenError, reconnecter) {
        var _this = _super.call(this, reconnecter) || this;
        _this.evtSrc = evtSrc;
        _this.onOpenError = onOpenError;
        _this.openedOnce = false;
        _this.evtSrc.onopen = function (e) {
            onOpen(_this);
            _this.openedOnce = true;
        };
        _this.reset();
        return _this;
    }
    EventSourceEventStream.prototype.open = function () {
        if (this.closed) {
            throw new mongodb_stitch_core_sdk_1.StitchClientError(mongodb_stitch_core_sdk_1.StitchClientErrorCode.StreamClosed);
        }
    };
    EventSourceEventStream.prototype.afterClose = function () {
        this.evtSrc.close();
    };
    EventSourceEventStream.prototype.onReconnect = function (next) {
        this.evtSrc = next.evtSrc;
        this.reset();
        this.events = next.events.concat(this.events);
    };
    EventSourceEventStream.prototype.reset = function () {
        var _this = this;
        this.evtSrc.onmessage = function (e) {
            _this.events.push(new mongodb_stitch_core_sdk_1.Event(mongodb_stitch_core_sdk_1.Event.MESSAGE_EVENT, e.data));
            _this.poll();
        };
        this.evtSrc.onerror = function (e) {
            if (e instanceof MessageEvent) {
                _this.lastErr = e.data;
                _this.events.push(new mongodb_stitch_core_sdk_1.Event(mongodb_stitch_core_sdk_1.StitchEvent.ERROR_EVENT_NAME, _this.lastErr));
                _this.close();
                _this.poll();
                return;
            }
            if (!_this.openedOnce) {
                _this.close();
                _this.onOpenError(new Error("event source failed to open and will not reconnect; check network log for more details"));
                return;
            }
            _this.evtSrc.close();
            _this.reconnect();
        };
    };
    return EventSourceEventStream;
}(mongodb_stitch_core_sdk_1.BaseEventStream));
exports.default = EventSourceEventStream;

},{"mongodb-stitch-core-sdk":90}],31:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
exports.AnonymousAuthProvider = mongodb_stitch_core_sdk_1.AnonymousAuthProvider;
exports.AnonymousCredential = mongodb_stitch_core_sdk_1.AnonymousCredential;
exports.BSON = mongodb_stitch_core_sdk_1.BSON;
exports.CustomAuthProvider = mongodb_stitch_core_sdk_1.CustomAuthProvider;
exports.CustomCredential = mongodb_stitch_core_sdk_1.CustomCredential;
exports.FacebookAuthProvider = mongodb_stitch_core_sdk_1.FacebookAuthProvider;
exports.FacebookCredential = mongodb_stitch_core_sdk_1.FacebookCredential;
exports.FunctionAuthProvider = mongodb_stitch_core_sdk_1.FunctionAuthProvider;
exports.FunctionCredential = mongodb_stitch_core_sdk_1.FunctionCredential;
exports.GoogleAuthProvider = mongodb_stitch_core_sdk_1.GoogleAuthProvider;
exports.GoogleCredential = mongodb_stitch_core_sdk_1.GoogleCredential;
exports.MemoryStorage = mongodb_stitch_core_sdk_1.MemoryStorage;
exports.ServerApiKeyAuthProvider = mongodb_stitch_core_sdk_1.ServerApiKeyAuthProvider;
exports.ServerApiKeyCredential = mongodb_stitch_core_sdk_1.ServerApiKeyCredential;
exports.StitchAppClientConfiguration = mongodb_stitch_core_sdk_1.StitchAppClientConfiguration;
exports.StitchAppClientInfo = mongodb_stitch_core_sdk_1.StitchAppClientInfo;
exports.StitchClientError = mongodb_stitch_core_sdk_1.StitchClientError;
exports.StitchClientErrorCode = mongodb_stitch_core_sdk_1.StitchClientErrorCode;
exports.StitchRequestError = mongodb_stitch_core_sdk_1.StitchRequestError;
exports.StitchRequestErrorCode = mongodb_stitch_core_sdk_1.StitchRequestErrorCode;
exports.StitchServiceError = mongodb_stitch_core_sdk_1.StitchServiceError;
exports.StitchServiceErrorCode = mongodb_stitch_core_sdk_1.StitchServiceErrorCode;
exports.StitchUserIdentity = mongodb_stitch_core_sdk_1.StitchUserIdentity;
exports.Stream = mongodb_stitch_core_sdk_1.Stream;
exports.UserApiKey = mongodb_stitch_core_sdk_1.UserApiKey;
exports.UserApiKeyAuthProvider = mongodb_stitch_core_sdk_1.UserApiKeyAuthProvider;
exports.UserApiKeyCredential = mongodb_stitch_core_sdk_1.UserApiKeyCredential;
exports.UserPasswordAuthProvider = mongodb_stitch_core_sdk_1.UserPasswordAuthProvider;
exports.UserPasswordCredential = mongodb_stitch_core_sdk_1.UserPasswordCredential;
exports.UserType = mongodb_stitch_core_sdk_1.UserType;
var FacebookRedirectCredential_1 = __importDefault(require("./core/auth/providers/facebook/FacebookRedirectCredential"));
exports.FacebookRedirectCredential = FacebookRedirectCredential_1.default;
var GoogleRedirectCredential_1 = __importDefault(require("./core/auth/providers/google/GoogleRedirectCredential"));
exports.GoogleRedirectCredential = GoogleRedirectCredential_1.default;
var UserApiKeyAuthProviderClient_1 = require("./core/auth/providers/userapikey/UserApiKeyAuthProviderClient");
exports.UserApiKeyAuthProviderClient = UserApiKeyAuthProviderClient_1.UserApiKeyAuthProviderClient;
var UserPasswordAuthProviderClient_1 = require("./core/auth/providers/userpassword/UserPasswordAuthProviderClient");
exports.UserPasswordAuthProviderClient = UserPasswordAuthProviderClient_1.UserPasswordAuthProviderClient;
var BrowserFetchTransport_1 = __importDefault(require("./core/internal/net/BrowserFetchTransport"));
exports.BrowserFetchTransport = BrowserFetchTransport_1.default;
var Stitch_1 = __importDefault(require("./core/Stitch"));
exports.Stitch = Stitch_1.default;

},{"./core/Stitch":10,"./core/auth/providers/facebook/FacebookRedirectCredential":19,"./core/auth/providers/google/GoogleRedirectCredential":20,"./core/auth/providers/userapikey/UserApiKeyAuthProviderClient":21,"./core/auth/providers/userpassword/UserPasswordAuthProviderClient":23,"./core/internal/net/BrowserFetchTransport":29,"mongodb-stitch-core-sdk":90}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchServiceClientImpl = (function () {
    function StitchServiceClientImpl(proxy) {
        this.proxy = proxy;
    }
    StitchServiceClientImpl.prototype.callFunction = function (name, args, codec) {
        return this.proxy.callFunction(name, args, codec);
    };
    StitchServiceClientImpl.prototype.streamFunction = function (name, args, codec) {
        return this.proxy.streamFunction(name, args, codec);
    };
    return StitchServiceClientImpl;
}());
exports.default = StitchServiceClientImpl;

},{}],33:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("mongodb-stitch-browser-core"));
__export(require("mongodb-stitch-browser-services-mongodb-remote"));

},{"mongodb-stitch-browser-core":31,"mongodb-stitch-browser-services-mongodb-remote":37}],34:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_services_mongodb_remote_1 = require("mongodb-stitch-core-services-mongodb-remote");
var RemoteMongoClientImpl_1 = __importDefault(require("./internal/RemoteMongoClientImpl"));
var RemoteMongoClient;
(function (RemoteMongoClient) {
    RemoteMongoClient.factory = new (function () {
        function class_1() {
        }
        class_1.prototype.getNamedClient = function (service, client) {
            return new RemoteMongoClientImpl_1.default(new mongodb_stitch_core_services_mongodb_remote_1.CoreRemoteMongoClientImpl(service));
        };
        return class_1;
    }())();
})(RemoteMongoClient = exports.RemoteMongoClient || (exports.RemoteMongoClient = {}));

},{"./internal/RemoteMongoClientImpl":38,"mongodb-stitch-core-services-mongodb-remote":122}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteMongoCursor = (function () {
    function RemoteMongoCursor(proxy) {
        this.proxy = proxy;
    }
    RemoteMongoCursor.prototype.next = function () {
        return Promise.resolve(this.proxy.next().value);
    };
    return RemoteMongoCursor;
}());
exports.default = RemoteMongoCursor;

},{}],36:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteMongoCursor_1 = __importDefault(require("./RemoteMongoCursor"));
var RemoteMongoReadOperation = (function () {
    function RemoteMongoReadOperation(proxy) {
        this.proxy = proxy;
    }
    RemoteMongoReadOperation.prototype.first = function () {
        return this.proxy.first();
    };
    RemoteMongoReadOperation.prototype.toArray = function () {
        return this.proxy.toArray();
    };
    RemoteMongoReadOperation.prototype.asArray = function () {
        return this.toArray();
    };
    RemoteMongoReadOperation.prototype.iterator = function () {
        return this.proxy.iterator().then(function (res) { return new RemoteMongoCursor_1.default(res); });
    };
    return RemoteMongoReadOperation;
}());
exports.default = RemoteMongoReadOperation;

},{"./RemoteMongoCursor":35}],37:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_services_mongodb_remote_1 = require("mongodb-stitch-core-services-mongodb-remote");
exports.RemoteInsertManyResult = mongodb_stitch_core_services_mongodb_remote_1.RemoteInsertManyResult;
var RemoteMongoClient_1 = require("./RemoteMongoClient");
exports.RemoteMongoClient = RemoteMongoClient_1.RemoteMongoClient;
var RemoteMongoReadOperation_1 = __importDefault(require("./RemoteMongoReadOperation"));
exports.RemoteMongoReadOperation = RemoteMongoReadOperation_1.default;

},{"./RemoteMongoClient":34,"./RemoteMongoReadOperation":36,"mongodb-stitch-core-services-mongodb-remote":122}],38:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteMongoDatabaseImpl_1 = __importDefault(require("./RemoteMongoDatabaseImpl"));
var RemoteMongoClientImpl = (function () {
    function RemoteMongoClientImpl(proxy) {
        this.proxy = proxy;
    }
    RemoteMongoClientImpl.prototype.db = function (name) {
        return new RemoteMongoDatabaseImpl_1.default(this.proxy.db(name));
    };
    return RemoteMongoClientImpl;
}());
exports.default = RemoteMongoClientImpl;

},{"./RemoteMongoDatabaseImpl":40}],39:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteMongoReadOperation_1 = __importDefault(require("../RemoteMongoReadOperation"));
var RemoteMongoCollectionImpl = (function () {
    function RemoteMongoCollectionImpl(proxy) {
        this.proxy = proxy;
        this.namespace = this.proxy.namespace;
    }
    RemoteMongoCollectionImpl.prototype.withCollectionType = function (codec) {
        return new RemoteMongoCollectionImpl(this.proxy.withCollectionType(codec));
    };
    RemoteMongoCollectionImpl.prototype.count = function (query, options) {
        return this.proxy.count(query, options);
    };
    RemoteMongoCollectionImpl.prototype.find = function (query, options) {
        return new RemoteMongoReadOperation_1.default(this.proxy.find(query, options));
    };
    RemoteMongoCollectionImpl.prototype.findOne = function (query, options) {
        return this.proxy.findOne(query, options);
    };
    RemoteMongoCollectionImpl.prototype.findOneAndUpdate = function (query, update, options) {
        return this.proxy.findOneAndUpdate(query, update, options);
    };
    RemoteMongoCollectionImpl.prototype.findOneAndReplace = function (query, replacement, options) {
        return this.proxy.findOneAndReplace(query, replacement, options);
    };
    RemoteMongoCollectionImpl.prototype.findOneAndDelete = function (query, options) {
        return this.proxy.findOneAndDelete(query, options);
    };
    RemoteMongoCollectionImpl.prototype.aggregate = function (pipeline) {
        return new RemoteMongoReadOperation_1.default(this.proxy.aggregate(pipeline));
    };
    RemoteMongoCollectionImpl.prototype.insertOne = function (doc) {
        return this.proxy.insertOne(doc);
    };
    RemoteMongoCollectionImpl.prototype.insertMany = function (docs) {
        return this.proxy.insertMany(docs);
    };
    RemoteMongoCollectionImpl.prototype.deleteOne = function (query) {
        return this.proxy.deleteOne(query);
    };
    RemoteMongoCollectionImpl.prototype.deleteMany = function (query) {
        return this.proxy.deleteMany(query);
    };
    RemoteMongoCollectionImpl.prototype.updateOne = function (query, update, updateOptions) {
        return this.proxy.updateOne(query, update, updateOptions);
    };
    RemoteMongoCollectionImpl.prototype.updateMany = function (query, update, updateOptions) {
        return this.proxy.updateMany(query, update, updateOptions);
    };
    RemoteMongoCollectionImpl.prototype.watch = function (arg) {
        return this.proxy.watch(arg);
    };
    RemoteMongoCollectionImpl.prototype.watchCompact = function (ids) {
        return this.proxy.watchCompact(ids);
    };
    return RemoteMongoCollectionImpl;
}());
exports.default = RemoteMongoCollectionImpl;

},{"../RemoteMongoReadOperation":36}],40:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteMongoCollectionImpl_1 = __importDefault(require("./RemoteMongoCollectionImpl"));
var RemoteMongoDatabaseImpl = (function () {
    function RemoteMongoDatabaseImpl(proxy) {
        this.proxy = proxy;
        this.name = this.proxy.name;
    }
    RemoteMongoDatabaseImpl.prototype.collection = function (name, codec) {
        return new RemoteMongoCollectionImpl_1.default(this.proxy.collection(name, codec));
    };
    return RemoteMongoDatabaseImpl;
}());
exports.default = RemoteMongoDatabaseImpl;

},{"./RemoteMongoCollectionImpl":39}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var StitchClientConfiguration_1 = require("./StitchClientConfiguration");
var StitchAppClientConfiguration = (function (_super) {
    __extends(StitchAppClientConfiguration, _super);
    function StitchAppClientConfiguration(config, localAppName, localAppVersion) {
        var _this = _super.call(this, config.baseUrl, config.storage, config.dataDirectory, config.transport) || this;
        _this.localAppVersion = localAppVersion;
        _this.localAppName = localAppName;
        return _this;
    }
    StitchAppClientConfiguration.prototype.builder = function () {
        return new StitchAppClientConfiguration.Builder(this);
    };
    return StitchAppClientConfiguration;
}(StitchClientConfiguration_1.StitchClientConfiguration));
exports.StitchAppClientConfiguration = StitchAppClientConfiguration;
(function (StitchAppClientConfiguration) {
    var Builder = (function (_super) {
        __extends(Builder, _super);
        function Builder(config) {
            var _this = _super.call(this, config) || this;
            if (config) {
                _this.localAppVersion = config.localAppVersion;
                _this.localAppName = config.localAppName;
            }
            return _this;
        }
        Builder.prototype.withLocalAppName = function (localAppName) {
            this.localAppName = localAppName;
            return this;
        };
        Builder.prototype.withLocalAppVersion = function (localAppVersion) {
            this.localAppVersion = localAppVersion;
            return this;
        };
        Builder.prototype.build = function () {
            var config = _super.prototype.build.call(this);
            return new StitchAppClientConfiguration(config, this.localAppName, this.localAppVersion);
        };
        return Builder;
    }(StitchClientConfiguration_1.StitchClientConfiguration.Builder));
    StitchAppClientConfiguration.Builder = Builder;
})(StitchAppClientConfiguration = exports.StitchAppClientConfiguration || (exports.StitchAppClientConfiguration = {}));
exports.StitchAppClientConfiguration = StitchAppClientConfiguration;

},{"./StitchClientConfiguration":43}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchAppClientInfo = (function () {
    function StitchAppClientInfo(clientAppId, dataDirectory, localAppName, localAppVersion) {
        this.clientAppId = clientAppId;
        this.dataDirectory = dataDirectory;
        this.localAppName = localAppName;
        this.localAppVersion = localAppVersion;
    }
    return StitchAppClientInfo;
}());
exports.default = StitchAppClientInfo;

},{}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchClientConfiguration = (function () {
    function StitchClientConfiguration(baseUrl, storage, dataDirectory, transport) {
        this.baseUrl = baseUrl;
        this.storage = storage;
        this.dataDirectory = dataDirectory;
        this.transport = transport;
    }
    StitchClientConfiguration.prototype.builder = function () {
        return new StitchClientConfiguration.Builder(this);
    };
    return StitchClientConfiguration;
}());
exports.StitchClientConfiguration = StitchClientConfiguration;
(function (StitchClientConfiguration) {
    var Builder = (function () {
        function Builder(config) {
            if (config) {
                this.baseUrl = config.baseUrl;
                this.storage = config.storage;
                this.dataDirectory = config.dataDirectory;
                this.transport = config.transport;
            }
        }
        Builder.prototype.withBaseUrl = function (baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        };
        Builder.prototype.withStorage = function (storage) {
            this.storage = storage;
            return this;
        };
        Builder.prototype.withDataDirectory = function (dataDirectory) {
            this.dataDirectory = dataDirectory;
            return this;
        };
        Builder.prototype.withTransport = function (transport) {
            this.transport = transport;
            return this;
        };
        Builder.prototype.build = function () {
            return new StitchClientConfiguration(this.baseUrl, this.storage, this.dataDirectory, this.transport);
        };
        return Builder;
    }());
    StitchClientConfiguration.Builder = Builder;
})(StitchClientConfiguration = exports.StitchClientConfiguration || (exports.StitchClientConfiguration = {}));
exports.StitchClientConfiguration = StitchClientConfiguration;

},{}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchClientErrorCode_1 = require("./StitchClientErrorCode");
var StitchError_1 = __importDefault(require("./StitchError"));
var StitchClientError = (function (_super) {
    __extends(StitchClientError, _super);
    function StitchClientError(errorCode) {
        var _this = this;
        var message = "(" + StitchClientErrorCode_1.StitchClientErrorCode[errorCode] + "): " + StitchClientErrorCode_1.clientErrorCodeDescs[errorCode];
        _this = _super.call(this, message) || this;
        _this.errorCode = errorCode;
        _this.errorCodeName = StitchClientErrorCode_1.StitchClientErrorCode[errorCode];
        return _this;
    }
    return StitchClientError;
}(StitchError_1.default));
exports.default = StitchClientError;

},{"./StitchClientErrorCode":45,"./StitchError":46}],45:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var StitchClientErrorCode;
(function (StitchClientErrorCode) {
    StitchClientErrorCode[StitchClientErrorCode["LoggedOutDuringRequest"] = 0] = "LoggedOutDuringRequest";
    StitchClientErrorCode[StitchClientErrorCode["MustAuthenticateFirst"] = 1] = "MustAuthenticateFirst";
    StitchClientErrorCode[StitchClientErrorCode["UserNoLongerValid"] = 2] = "UserNoLongerValid";
    StitchClientErrorCode[StitchClientErrorCode["UserNotFound"] = 3] = "UserNotFound";
    StitchClientErrorCode[StitchClientErrorCode["UserNotLoggedIn"] = 4] = "UserNotLoggedIn";
    StitchClientErrorCode[StitchClientErrorCode["CouldNotLoadPersistedAuthInfo"] = 5] = "CouldNotLoadPersistedAuthInfo";
    StitchClientErrorCode[StitchClientErrorCode["CouldNotPersistAuthInfo"] = 6] = "CouldNotPersistAuthInfo";
    StitchClientErrorCode[StitchClientErrorCode["StreamingNotSupported"] = 7] = "StreamingNotSupported";
    StitchClientErrorCode[StitchClientErrorCode["StreamClosed"] = 8] = "StreamClosed";
    StitchClientErrorCode[StitchClientErrorCode["UnexpectedArguments"] = 9] = "UnexpectedArguments";
})(StitchClientErrorCode = exports.StitchClientErrorCode || (exports.StitchClientErrorCode = {}));
exports.clientErrorCodeDescs = (_a = {},
    _a[StitchClientErrorCode.LoggedOutDuringRequest] = "logged out while making a request to Stitch",
    _a[StitchClientErrorCode.MustAuthenticateFirst] = "method called requires being authenticated",
    _a[StitchClientErrorCode.UserNoLongerValid] = "user instance being accessed is no longer valid; please get a new user with auth.getUser()",
    _a[StitchClientErrorCode.UserNotFound] = "user not found in list of users",
    _a[StitchClientErrorCode.UserNotLoggedIn] = "cannot make the active user a logged out user; please use loginWithCredential() to switch to this user",
    _a[StitchClientErrorCode.CouldNotLoadPersistedAuthInfo] = "failed to load stored auth information for Stitch",
    _a[StitchClientErrorCode.CouldNotPersistAuthInfo] = "failed to save auth information for Stitch",
    _a[StitchClientErrorCode.StreamingNotSupported] = "streaming not supported in this SDK",
    _a[StitchClientErrorCode.StreamClosed] = "stream is closed",
    _a[StitchClientErrorCode.UnexpectedArguments] = "function does not accept arguments",
    _a);

},{}],46:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _Error = function (message) {
    Error.call(this, message);
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this);
    }
    this.message = message;
    this.name = this.constructor.name;
};
_Error.prototype = Object.create(Error.prototype);
var StitchError = (function (_super) {
    __extends(StitchError, _super);
    function StitchError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return StitchError;
}(_Error));
exports.default = StitchError;

},{}],47:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchError_1 = __importDefault(require("./StitchError"));
var StitchRequestErrorCode_1 = require("./StitchRequestErrorCode");
var StitchRequestError = (function (_super) {
    __extends(StitchRequestError, _super);
    function StitchRequestError(underlyingError, errorCode) {
        var _this = this;
        var message = "(" + StitchRequestErrorCode_1.StitchRequestErrorCode[errorCode] + "): " + StitchRequestErrorCode_1.requestErrorCodeDescs[errorCode] + ": " + underlyingError.message;
        _this = _super.call(this, message) || this;
        _this.underlyingError = underlyingError;
        _this.errorCode = errorCode;
        _this.errorCodeName = StitchRequestErrorCode_1.StitchRequestErrorCode[errorCode];
        return _this;
    }
    return StitchRequestError;
}(StitchError_1.default));
exports.default = StitchRequestError;

},{"./StitchError":46,"./StitchRequestErrorCode":48}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var StitchRequestErrorCode;
(function (StitchRequestErrorCode) {
    StitchRequestErrorCode[StitchRequestErrorCode["TRANSPORT_ERROR"] = 0] = "TRANSPORT_ERROR";
    StitchRequestErrorCode[StitchRequestErrorCode["DECODING_ERROR"] = 1] = "DECODING_ERROR";
    StitchRequestErrorCode[StitchRequestErrorCode["ENCODING_ERROR"] = 2] = "ENCODING_ERROR";
})(StitchRequestErrorCode = exports.StitchRequestErrorCode || (exports.StitchRequestErrorCode = {}));
exports.requestErrorCodeDescs = (_a = {},
    _a[StitchRequestErrorCode.TRANSPORT_ERROR] = "the request transport encountered an error communicating with Stitch",
    _a[StitchRequestErrorCode.DECODING_ERROR] = "an error occurred while decoding a response from Stitch",
    _a[StitchRequestErrorCode.ENCODING_ERROR] = "an error occurred while encoding a request for Stitch",
    _a);

},{}],49:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchError_1 = __importDefault(require("./StitchError"));
var StitchServiceErrorCode_1 = require("./StitchServiceErrorCode");
var StitchServiceError = (function (_super) {
    __extends(StitchServiceError, _super);
    function StitchServiceError(message, errorCode) {
        if (errorCode === void 0) { errorCode = StitchServiceErrorCode_1.StitchServiceErrorCode.Unknown; }
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.errorCode = errorCode;
        _this.errorCodeName = StitchServiceErrorCode_1.StitchServiceErrorCode[errorCode];
        return _this;
    }
    return StitchServiceError;
}(StitchError_1.default));
exports.default = StitchServiceError;

},{"./StitchError":46,"./StitchServiceErrorCode":50}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchServiceErrorCode;
(function (StitchServiceErrorCode) {
    StitchServiceErrorCode[StitchServiceErrorCode["MissingAuthReq"] = 0] = "MissingAuthReq";
    StitchServiceErrorCode[StitchServiceErrorCode["InvalidSession"] = 1] = "InvalidSession";
    StitchServiceErrorCode[StitchServiceErrorCode["UserAppDomainMismatch"] = 2] = "UserAppDomainMismatch";
    StitchServiceErrorCode[StitchServiceErrorCode["DomainNotAllowed"] = 3] = "DomainNotAllowed";
    StitchServiceErrorCode[StitchServiceErrorCode["ReadSizeLimitExceeded"] = 4] = "ReadSizeLimitExceeded";
    StitchServiceErrorCode[StitchServiceErrorCode["InvalidParameter"] = 5] = "InvalidParameter";
    StitchServiceErrorCode[StitchServiceErrorCode["MissingParameter"] = 6] = "MissingParameter";
    StitchServiceErrorCode[StitchServiceErrorCode["TwilioError"] = 7] = "TwilioError";
    StitchServiceErrorCode[StitchServiceErrorCode["GCMError"] = 8] = "GCMError";
    StitchServiceErrorCode[StitchServiceErrorCode["HTTPError"] = 9] = "HTTPError";
    StitchServiceErrorCode[StitchServiceErrorCode["AWSError"] = 10] = "AWSError";
    StitchServiceErrorCode[StitchServiceErrorCode["MongoDBError"] = 11] = "MongoDBError";
    StitchServiceErrorCode[StitchServiceErrorCode["ArgumentsNotAllowed"] = 12] = "ArgumentsNotAllowed";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionExecutionError"] = 13] = "FunctionExecutionError";
    StitchServiceErrorCode[StitchServiceErrorCode["NoMatchingRuleFound"] = 14] = "NoMatchingRuleFound";
    StitchServiceErrorCode[StitchServiceErrorCode["InternalServerError"] = 15] = "InternalServerError";
    StitchServiceErrorCode[StitchServiceErrorCode["AuthProviderNotFound"] = 16] = "AuthProviderNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["AuthProviderAlreadyExists"] = 17] = "AuthProviderAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["ServiceNotFound"] = 18] = "ServiceNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["ServiceTypeNotFound"] = 19] = "ServiceTypeNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["ServiceAlreadyExists"] = 20] = "ServiceAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["ServiceCommandNotFound"] = 21] = "ServiceCommandNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["ValueNotFound"] = 22] = "ValueNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["ValueAlreadyExists"] = 23] = "ValueAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["ValueDuplicateName"] = 24] = "ValueDuplicateName";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionNotFound"] = 25] = "FunctionNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionAlreadyExists"] = 26] = "FunctionAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionDuplicateName"] = 27] = "FunctionDuplicateName";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionSyntaxError"] = 28] = "FunctionSyntaxError";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionInvalid"] = 29] = "FunctionInvalid";
    StitchServiceErrorCode[StitchServiceErrorCode["IncomingWebhookNotFound"] = 30] = "IncomingWebhookNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["IncomingWebhookAlreadyExists"] = 31] = "IncomingWebhookAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["IncomingWebhookDuplicateName"] = 32] = "IncomingWebhookDuplicateName";
    StitchServiceErrorCode[StitchServiceErrorCode["RuleNotFound"] = 33] = "RuleNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["ApiKeyNotFound"] = 34] = "ApiKeyNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["RuleAlreadyExists"] = 35] = "RuleAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["RuleDuplicateName"] = 36] = "RuleDuplicateName";
    StitchServiceErrorCode[StitchServiceErrorCode["AuthProviderDuplicateName"] = 37] = "AuthProviderDuplicateName";
    StitchServiceErrorCode[StitchServiceErrorCode["RestrictedHost"] = 38] = "RestrictedHost";
    StitchServiceErrorCode[StitchServiceErrorCode["ApiKeyAlreadyExists"] = 39] = "ApiKeyAlreadyExists";
    StitchServiceErrorCode[StitchServiceErrorCode["IncomingWebhookAuthFailed"] = 40] = "IncomingWebhookAuthFailed";
    StitchServiceErrorCode[StitchServiceErrorCode["ExecutionTimeLimitExceeded"] = 41] = "ExecutionTimeLimitExceeded";
    StitchServiceErrorCode[StitchServiceErrorCode["FunctionNotCallable"] = 42] = "FunctionNotCallable";
    StitchServiceErrorCode[StitchServiceErrorCode["UserAlreadyConfirmed"] = 43] = "UserAlreadyConfirmed";
    StitchServiceErrorCode[StitchServiceErrorCode["UserNotFound"] = 44] = "UserNotFound";
    StitchServiceErrorCode[StitchServiceErrorCode["UserDisabled"] = 45] = "UserDisabled";
    StitchServiceErrorCode[StitchServiceErrorCode["Unknown"] = 46] = "Unknown";
})(StitchServiceErrorCode = exports.StitchServiceErrorCode || (exports.StitchServiceErrorCode = {}));
var apiErrorCodes = {
    APIKeyAlreadyExists: StitchServiceErrorCode.ApiKeyAlreadyExists,
    APIKeyNotFound: StitchServiceErrorCode.ApiKeyNotFound,
    AWSError: StitchServiceErrorCode.AWSError,
    ArgumentsNotAllowed: StitchServiceErrorCode.ArgumentsNotAllowed,
    AuthProviderAlreadyExists: StitchServiceErrorCode.AuthProviderAlreadyExists,
    AuthProviderDuplicateName: StitchServiceErrorCode.AuthProviderDuplicateName,
    AuthProviderNotFound: StitchServiceErrorCode.AuthProviderNotFound,
    DomainNotAllowed: StitchServiceErrorCode.DomainNotAllowed,
    ExecutionTimeLimitExceeded: StitchServiceErrorCode.ExecutionTimeLimitExceeded,
    FunctionAlreadyExists: StitchServiceErrorCode.FunctionAlreadyExists,
    FunctionDuplicateName: StitchServiceErrorCode.FunctionDuplicateName,
    FunctionExecutionError: StitchServiceErrorCode.FunctionExecutionError,
    FunctionInvalid: StitchServiceErrorCode.FunctionInvalid,
    FunctionNotCallable: StitchServiceErrorCode.FunctionNotCallable,
    FunctionNotFound: StitchServiceErrorCode.FunctionNotFound,
    FunctionSyntaxError: StitchServiceErrorCode.FunctionSyntaxError,
    GCMError: StitchServiceErrorCode.GCMError,
    HTTPError: StitchServiceErrorCode.HTTPError,
    IncomingWebhookAlreadyExists: StitchServiceErrorCode.IncomingWebhookAlreadyExists,
    IncomingWebhookAuthFailed: StitchServiceErrorCode.IncomingWebhookAuthFailed,
    IncomingWebhookDuplicateName: StitchServiceErrorCode.IncomingWebhookDuplicateName,
    IncomingWebhookNotFound: StitchServiceErrorCode.IncomingWebhookNotFound,
    InternalServerError: StitchServiceErrorCode.InternalServerError,
    InvalidParameter: StitchServiceErrorCode.InvalidParameter,
    InvalidSession: StitchServiceErrorCode.InvalidSession,
    MissingAuthReq: StitchServiceErrorCode.MissingAuthReq,
    MissingParameter: StitchServiceErrorCode.MissingParameter,
    MongoDBError: StitchServiceErrorCode.MongoDBError,
    NoMatchingRuleFound: StitchServiceErrorCode.NoMatchingRuleFound,
    ReadSizeLimitExceeded: StitchServiceErrorCode.ReadSizeLimitExceeded,
    RestrictedHost: StitchServiceErrorCode.RestrictedHost,
    RuleAlreadyExists: StitchServiceErrorCode.RuleAlreadyExists,
    RuleDuplicateName: StitchServiceErrorCode.RuleDuplicateName,
    RuleNotFound: StitchServiceErrorCode.RuleNotFound,
    ServiceAlreadyExists: StitchServiceErrorCode.ServiceAlreadyExists,
    ServiceCommandNotFound: StitchServiceErrorCode.ServiceCommandNotFound,
    ServiceNotFound: StitchServiceErrorCode.ServiceNotFound,
    ServiceTypeNotFound: StitchServiceErrorCode.ServiceTypeNotFound,
    TwilioError: StitchServiceErrorCode.TwilioError,
    UserAlreadyConfirmed: StitchServiceErrorCode.UserAlreadyConfirmed,
    UserAppDomainMismatch: StitchServiceErrorCode.UserAppDomainMismatch,
    UserDisabled: StitchServiceErrorCode.UserDisabled,
    UserNotFound: StitchServiceErrorCode.UserNotFound,
    ValueAlreadyExists: StitchServiceErrorCode.ValueAlreadyExists,
    ValueDuplicateName: StitchServiceErrorCode.ValueDuplicateName,
    ValueNotFound: StitchServiceErrorCode.ValueNotFound
};
function stitchServiceErrorCodeFromApi(code) {
    if (!(code in apiErrorCodes)) {
        return StitchServiceErrorCode.Unknown;
    }
    return apiErrorCodes[code];
}
exports.stitchServiceErrorCodeFromApi = stitchServiceErrorCodeFromApi;

},{}],51:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Event_1 = __importDefault(require("./internal/net/Event"));
var StitchEvent_1 = __importDefault(require("./internal/net/StitchEvent"));
var Stream = (function () {
    function Stream(eventStream, decoder) {
        this.eventStream = eventStream;
        this.decoder = decoder;
        this.listeners = [];
    }
    Stream.prototype.next = function () {
        var _this = this;
        return this.eventStream.nextEvent()
            .then(function (event) {
            var se = StitchEvent_1.default.fromEvent(event, _this.decoder);
            if (se.eventName === StitchEvent_1.default.ERROR_EVENT_NAME) {
                throw se.error;
            }
            if (se.eventName === Event_1.default.MESSAGE_EVENT) {
                return se.data;
            }
            return _this.next();
        });
    };
    Stream.prototype.onNext = function (callback) {
        var _this = this;
        var wrapper = {
            onEvent: function (e) {
                var se = StitchEvent_1.default.fromEvent(e, _this.decoder);
                if (se.eventName !== Event_1.default.MESSAGE_EVENT) {
                    return;
                }
                callback(se.data);
            }
        };
        this.eventStream.addListener(wrapper);
    };
    Stream.prototype.onError = function (callback) {
        var _this = this;
        var wrapper = {
            onEvent: function (e) {
                var se = StitchEvent_1.default.fromEvent(e, _this.decoder);
                if (se.eventName === StitchEvent_1.default.ERROR_EVENT_NAME) {
                    callback(se.error);
                }
            }
        };
        this.eventStream.addListener(wrapper);
    };
    Stream.prototype.addListener = function (listener) {
        var _this = this;
        var wrapper = {
            onEvent: function (e) {
                var se = StitchEvent_1.default.fromEvent(e, _this.decoder);
                if (se.eventName === StitchEvent_1.default.ERROR_EVENT_NAME) {
                    if (listener.onError) {
                        listener.onError(se.error);
                    }
                }
                else {
                    if (listener.onNext) {
                        listener.onNext(se.data);
                    }
                }
            }
        };
        this.listeners.push([listener, wrapper]);
        this.eventStream.addListener(wrapper);
    };
    Stream.prototype.removeListener = function (listener) {
        var index = -1;
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i][0] === listener) {
                index = i;
                break;
            }
        }
        if (index === -1) {
            return;
        }
        var wrapper = this.listeners[index][1];
        this.listeners.splice(index, 1);
        this.eventStream.removeListener(wrapper);
    };
    Stream.prototype.isOpen = function () {
        return this.eventStream.isOpen();
    };
    Stream.prototype.close = function () {
        this.eventStream.close();
    };
    return Stream;
}());
exports.default = Stream;

},{"./internal/net/Event":101,"./internal/net/StitchEvent":111}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities = (function () {
    function ProviderCapabilities(reusesExistingSession) {
        if (reusesExistingSession === void 0) { reusesExistingSession = false; }
        this.reusesExistingSession = reusesExistingSession;
    }
    return ProviderCapabilities;
}());
exports.default = ProviderCapabilities;

},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserIdentity = (function () {
    function StitchUserIdentity(id, providerType) {
        this.id = id;
        this.providerType = providerType;
    }
    return StitchUserIdentity;
}());
exports.default = StitchUserIdentity;

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UserType;
(function (UserType) {
    UserType["Normal"] = "normal";
    UserType["Server"] = "server";
    UserType["Unknown"] = "unknown";
})(UserType || (UserType = {}));
exports.default = UserType;

},{}],55:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var JWT_1 = __importDefault(require("./JWT"));
var SLEEP_MILLIS = 60000;
var EXPIRATION_WINDOW_SECS = 300;
var AccessTokenRefresher = (function () {
    function AccessTokenRefresher(auth) {
        this.auth = auth;
    }
    AccessTokenRefresher.prototype.shouldRefresh = function () {
        var auth = this.auth;
        if (auth === undefined) {
            return false;
        }
        if (!auth.isLoggedIn) {
            return false;
        }
        var info = auth.authInfo;
        if (info === undefined) {
            return false;
        }
        if (!info.isLoggedIn) {
            return false;
        }
        var jwt;
        try {
            jwt = JWT_1.default.fromEncoded(info.accessToken);
        }
        catch (e) {
            console.log(e);
            return false;
        }
        if (Date.now() / 1000 < jwt.expires - EXPIRATION_WINDOW_SECS) {
            return false;
        }
        return true;
    };
    AccessTokenRefresher.prototype.run = function () {
        var _this = this;
        if (!this.shouldRefresh()) {
            this.nextTimeout = setTimeout(function () { return _this.run(); }, SLEEP_MILLIS);
        }
        else {
            this.auth.refreshAccessToken().then(function () {
                _this.nextTimeout = setTimeout(function () { return _this.run(); }, SLEEP_MILLIS);
            }).catch(function () {
                _this.nextTimeout = setTimeout(function () { return _this.run(); }, SLEEP_MILLIS);
            });
        }
    };
    AccessTokenRefresher.prototype.stop = function () {
        clearTimeout(this.nextTimeout);
    };
    return AccessTokenRefresher;
}());
exports.default = AccessTokenRefresher;

},{"./JWT":61}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AuthEventKind;
(function (AuthEventKind) {
    AuthEventKind[AuthEventKind["ActiveUserChanged"] = 0] = "ActiveUserChanged";
    AuthEventKind[AuthEventKind["ListenerRegistered"] = 1] = "ListenerRegistered";
    AuthEventKind[AuthEventKind["UserAdded"] = 2] = "UserAdded";
    AuthEventKind[AuthEventKind["UserLinked"] = 3] = "UserLinked";
    AuthEventKind[AuthEventKind["UserLoggedIn"] = 4] = "UserLoggedIn";
    AuthEventKind[AuthEventKind["UserLoggedOut"] = 5] = "UserLoggedOut";
    AuthEventKind[AuthEventKind["UserRemoved"] = 6] = "UserRemoved";
})(AuthEventKind = exports.AuthEventKind || (exports.AuthEventKind = {}));

},{}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AuthInfo = (function () {
    function AuthInfo(userId, deviceId, accessToken, refreshToken, loggedInProviderType, loggedInProviderName, lastAuthActivity, userProfile) {
        this.userId = userId;
        this.deviceId = deviceId;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.loggedInProviderType = loggedInProviderType;
        this.loggedInProviderName = loggedInProviderName;
        this.lastAuthActivity = lastAuthActivity;
        this.userProfile = userProfile;
    }
    AuthInfo.empty = function () {
        return new AuthInfo(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
    };
    Object.defineProperty(AuthInfo.prototype, "hasUser", {
        get: function () {
            return this.userId !== undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthInfo.prototype, "isEmpty", {
        get: function () {
            return this.deviceId === undefined;
        },
        enumerable: true,
        configurable: true
    });
    AuthInfo.prototype.loggedOut = function () {
        return new AuthInfo(this.userId, this.deviceId, undefined, undefined, this.loggedInProviderType, this.loggedInProviderName, new Date(), this.userProfile);
    };
    AuthInfo.prototype.withClearedUser = function () {
        return new AuthInfo(undefined, this.deviceId, undefined, undefined, undefined, undefined, undefined, undefined);
    };
    AuthInfo.prototype.withAuthProvider = function (providerType, providerName) {
        return new AuthInfo(this.userId, this.deviceId, this.accessToken, this.refreshToken, providerType, providerName, new Date(), this.userProfile);
    };
    AuthInfo.prototype.withNewAuthActivityTime = function () {
        return new AuthInfo(this.userId, this.deviceId, this.accessToken, this.refreshToken, this.loggedInProviderType, this.loggedInProviderName, new Date(), this.userProfile);
    };
    Object.defineProperty(AuthInfo.prototype, "isLoggedIn", {
        get: function () {
            return this.accessToken !== undefined && this.refreshToken !== undefined;
        },
        enumerable: true,
        configurable: true
    });
    AuthInfo.prototype.merge = function (newInfo) {
        return new AuthInfo(newInfo.userId === undefined ? this.userId : newInfo.userId, newInfo.deviceId === undefined ? this.deviceId : newInfo.deviceId, newInfo.accessToken === undefined
            ? this.accessToken
            : newInfo.accessToken, newInfo.refreshToken === undefined
            ? this.refreshToken
            : newInfo.refreshToken, newInfo.loggedInProviderType === undefined
            ? this.loggedInProviderType
            : newInfo.loggedInProviderType, newInfo.loggedInProviderName === undefined
            ? this.loggedInProviderName
            : newInfo.loggedInProviderName, newInfo.lastAuthActivity === undefined
            ? this.lastAuthActivity
            : newInfo.lastAuthActivity, newInfo.userProfile === undefined
            ? this.userProfile
            : newInfo.userProfile);
    };
    return AuthInfo;
}());
exports.default = AuthInfo;

},{}],58:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var StitchErrorUtils_1 = require("../../internal/common/StitchErrorUtils");
var Headers_1 = __importDefault(require("../../internal/net/Headers"));
var Method_1 = __importDefault(require("../../internal/net/Method"));
var StitchAuthDocRequest_1 = require("../../internal/net/StitchAuthDocRequest");
var StitchAuthRequest_1 = require("../../internal/net/StitchAuthRequest");
var StitchDocRequest_1 = require("../../internal/net/StitchDocRequest");
var StitchClientError_1 = __importDefault(require("../../StitchClientError"));
var StitchClientErrorCode_1 = require("../../StitchClientErrorCode");
var StitchError_1 = __importDefault(require("../../StitchError"));
var StitchRequestError_1 = __importDefault(require("../../StitchRequestError"));
var StitchRequestErrorCode_1 = require("../../StitchRequestErrorCode");
var StitchServiceError_1 = __importDefault(require("../../StitchServiceError"));
var StitchServiceErrorCode_1 = require("../../StitchServiceErrorCode");
var Stream_1 = __importDefault(require("../../Stream"));
var CoreStitchUserImpl_1 = __importDefault(require("../internal/CoreStitchUserImpl"));
var AnonymousAuthProvider_1 = __importDefault(require("../providers/anonymous/AnonymousAuthProvider"));
var StitchAuthResponseCredential_1 = __importDefault(require("../providers/internal/StitchAuthResponseCredential"));
var AccessTokenRefresher_1 = __importDefault(require("./AccessTokenRefresher"));
var AuthEvent_1 = require("./AuthEvent");
var AuthInfo_1 = __importDefault(require("./AuthInfo"));
var JWT_1 = __importDefault(require("./JWT"));
var ApiAuthInfo_1 = __importDefault(require("./models/ApiAuthInfo"));
var ApiCoreUserProfile_1 = __importDefault(require("./models/ApiCoreUserProfile"));
var StoreAuthInfo_1 = require("./models/StoreAuthInfo");
var OPTIONS = "options";
var DEVICE = "device";
var CoreStitchAuth = (function () {
    function CoreStitchAuth(requestClient, authRoutes, storage, useTokenRefresher) {
        if (useTokenRefresher === void 0) { useTokenRefresher = true; }
        this.requestClient = requestClient;
        this.authRoutes = authRoutes;
        this.storage = storage;
        var allUsersAuthInfo;
        try {
            allUsersAuthInfo = StoreAuthInfo_1.readCurrentUsersFromStorage(storage);
        }
        catch (e) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotLoadPersistedAuthInfo);
        }
        this.allUsersAuthInfo = allUsersAuthInfo;
        var activeUserAuthInfo;
        try {
            activeUserAuthInfo = StoreAuthInfo_1.readActiveUserFromStorage(storage);
        }
        catch (e) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotLoadPersistedAuthInfo);
        }
        this.activeUserAuthInfo =
            activeUserAuthInfo === undefined ? AuthInfo_1.default.empty() : activeUserAuthInfo;
        if (this.activeUserAuthInfo.hasUser) {
            this.currentUser = this.prepUser(this.activeUserAuthInfo);
        }
        if (useTokenRefresher) {
            this.accessTokenRefresher = new AccessTokenRefresher_1.default(this);
            this.accessTokenRefresher.run();
        }
    }
    Object.defineProperty(CoreStitchAuth.prototype, "authInfo", {
        get: function () {
            return this.activeUserAuthInfo;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreStitchAuth.prototype, "isLoggedIn", {
        get: function () {
            return this.currentUser !== undefined && this.currentUser.isLoggedIn;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreStitchAuth.prototype, "user", {
        get: function () {
            return this.currentUser;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreStitchAuth.prototype, "hasDeviceId", {
        get: function () {
            return (this.activeUserAuthInfo.deviceId !== undefined &&
                this.activeUserAuthInfo.deviceId !== "" &&
                this.activeUserAuthInfo.deviceId !== "000000000000000000000000");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreStitchAuth.prototype, "deviceId", {
        get: function () {
            if (!this.hasDeviceId) {
                return undefined;
            }
            return this.activeUserAuthInfo.deviceId;
        },
        enumerable: true,
        configurable: true
    });
    CoreStitchAuth.prototype.listUsers = function () {
        var _this = this;
        var list = [];
        this.allUsersAuthInfo.forEach(function (authInfo) {
            list.push(_this.prepUser(authInfo));
        });
        return list;
    };
    CoreStitchAuth.prototype.doAuthenticatedRequest = function (stitchReq, authInfo) {
        var _this = this;
        try {
            return this.requestClient
                .doRequest(this.prepareAuthRequest(stitchReq, authInfo || this.activeUserAuthInfo))
                .catch(function (err) {
                return _this.handleAuthFailure(err, stitchReq);
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    };
    CoreStitchAuth.prototype.doAuthenticatedRequestWithDecoder = function (stitchReq, decoder) {
        return this.doAuthenticatedRequest(stitchReq)
            .then(function (response) {
            var obj = bson_1.EJSON.parse(response.body, { strict: false });
            if (decoder) {
                return decoder.decode(obj);
            }
            return obj;
        })
            .catch(function (err) {
            throw StitchErrorUtils_1.wrapDecodingError(err);
        });
    };
    CoreStitchAuth.prototype.openAuthenticatedEventStream = function (stitchReq, open) {
        var _this = this;
        if (open === void 0) { open = true; }
        if (!this.isLoggedIn) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.MustAuthenticateFirst);
        }
        var authToken = stitchReq.useRefreshToken ?
            this.activeUserAuthInfo.refreshToken : this.activeUserAuthInfo.accessToken;
        return this.requestClient.doStreamRequest(stitchReq.builder
            .withPath(stitchReq.path + "&stitch_at=" + authToken)
            .build(), open, function () { return _this.openAuthenticatedEventStream(stitchReq, false); })
            .catch(function (err) {
            return _this.handleAuthFailureForEventStream(err, stitchReq, open);
        });
    };
    CoreStitchAuth.prototype.openAuthenticatedStreamWithDecoder = function (stitchReq, decoder) {
        return this.openAuthenticatedEventStream(stitchReq)
            .then(function (eventStream) {
            return new Stream_1.default(eventStream, decoder);
        });
    };
    CoreStitchAuth.prototype.refreshAccessToken = function () {
        var _this = this;
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder()
            .withRefreshToken()
            .withPath(this.authRoutes.sessionRoute)
            .withMethod(Method_1.default.POST);
        return this.doAuthenticatedRequest(reqBuilder.build()).then(function (response) {
            try {
                var partialInfo = ApiAuthInfo_1.default.fromJSON(JSON.parse(response.body));
                _this.activeUserAuthInfo = _this.activeUserAuthInfo.merge(partialInfo);
                if (partialInfo.accessToken && _this.user instanceof CoreStitchUserImpl_1.default) {
                    var userData = JWT_1.default.fromEncoded(partialInfo.accessToken).userData;
                    _this.user.customData = userData === undefined ? {} : userData;
                }
            }
            catch (err) {
                throw new StitchRequestError_1.default(err, StitchRequestErrorCode_1.StitchRequestErrorCode.DECODING_ERROR);
            }
            try {
                StoreAuthInfo_1.writeActiveUserAuthInfoToStorage(_this.activeUserAuthInfo, _this.storage);
                _this.allUsersAuthInfo.set(_this.activeUserAuthInfo.userId, _this.activeUserAuthInfo);
                StoreAuthInfo_1.writeAllUsersAuthInfoToStorage(_this.allUsersAuthInfo, _this.storage);
            }
            catch (err) {
                throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotPersistAuthInfo);
            }
        });
    };
    CoreStitchAuth.prototype.switchToUserWithId = function (userId) {
        var authInfo = this.allUsersAuthInfo.get(userId);
        if (authInfo === undefined) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNotFound);
        }
        if (!authInfo.isLoggedIn) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNotLoggedIn);
        }
        if (this.activeUserAuthInfo.hasUser) {
            this.allUsersAuthInfo.set(this.activeUserAuthInfo.userId, this.activeUserAuthInfo.withNewAuthActivityTime());
        }
        var newAuthInfo = authInfo.withNewAuthActivityTime();
        this.allUsersAuthInfo.set(userId, newAuthInfo);
        StoreAuthInfo_1.writeActiveUserAuthInfoToStorage(newAuthInfo, this.storage);
        this.activeUserAuthInfo = newAuthInfo;
        var previousUser = this.currentUser;
        this.currentUser = this.prepUser(newAuthInfo);
        this.onAuthEvent();
        this.dispatchAuthEvent({
            currentActiveUser: this.currentUser,
            kind: AuthEvent_1.AuthEventKind.ActiveUserChanged,
            previousActiveUser: previousUser
        });
        return this.currentUser;
    };
    CoreStitchAuth.prototype.loginWithCredentialInternal = function (credential) {
        var _this = this;
        var e_1, _a;
        if (credential instanceof StitchAuthResponseCredential_1.default) {
            return this.processLogin(credential, credential.authInfo, credential.asLink).then(function (user) {
                _this.dispatchAuthEvent({
                    kind: AuthEvent_1.AuthEventKind.UserLoggedIn,
                    loggedInUser: user
                });
                return user;
            });
        }
        if (credential.providerCapabilities.reusesExistingSession) {
            try {
                for (var _b = __values(this.allUsersAuthInfo), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), userId = _d[0], authInfo = _d[1];
                    if (authInfo.loggedInProviderType === credential.providerType) {
                        if (authInfo.isLoggedIn) {
                            try {
                                return Promise.resolve(this.switchToUserWithId(userId));
                            }
                            catch (error) {
                                return Promise.reject(error);
                            }
                        }
                        if (authInfo.userId !== undefined) {
                            this.removeUserWithIdInternal(authInfo.userId);
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        return this.doLogin(credential, false);
    };
    CoreStitchAuth.prototype.linkUserWithCredentialInternal = function (user, credential) {
        if (this.currentUser !== undefined && user.id !== this.currentUser.id) {
            return Promise.reject(new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNoLongerValid));
        }
        return this.doLogin(credential, true);
    };
    CoreStitchAuth.prototype.logoutInternal = function () {
        if (!this.isLoggedIn || !this.currentUser) {
            return Promise.resolve();
        }
        return this.logoutUserWithIdInternal(this.currentUser.id);
    };
    CoreStitchAuth.prototype.logoutUserWithIdInternal = function (userId) {
        var _this = this;
        var authInfo = this.allUsersAuthInfo.get(userId);
        if (authInfo === undefined) {
            return Promise.reject(new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNotFound));
        }
        if (!authInfo.isLoggedIn) {
            return Promise.resolve();
        }
        var clearAuthBlock = function () {
            _this.clearUserAuthTokens(authInfo.userId);
            if (authInfo.loggedInProviderType === AnonymousAuthProvider_1.default.TYPE) {
                _this.removeUserWithIdInternal(authInfo.userId);
            }
        };
        return this.doLogout(authInfo)
            .then(function () {
            clearAuthBlock();
        })
            .catch(function () {
            clearAuthBlock();
        });
    };
    CoreStitchAuth.prototype.removeUserInternal = function () {
        if (!this.isLoggedIn || this.currentUser === undefined) {
            return Promise.resolve();
        }
        return this.removeUserWithIdInternal(this.currentUser.id);
    };
    CoreStitchAuth.prototype.removeUserWithIdInternal = function (userId) {
        var _this = this;
        var authInfo = this.allUsersAuthInfo.get(userId);
        if (authInfo === undefined) {
            return Promise.reject(new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNotFound));
        }
        var removeBlock = function () {
            _this.clearUserAuthTokens(authInfo.userId);
            _this.allUsersAuthInfo.delete(userId);
            StoreAuthInfo_1.writeAllUsersAuthInfoToStorage(_this.allUsersAuthInfo, _this.storage);
            var removedUser = _this.prepUser(authInfo.loggedOut());
            _this.onAuthEvent();
            _this.dispatchAuthEvent({
                kind: AuthEvent_1.AuthEventKind.UserRemoved,
                removedUser: removedUser
            });
        };
        if (authInfo.isLoggedIn) {
            return this.doLogout(authInfo).then(function () {
                removeBlock();
            }).catch(function (err) {
                removeBlock();
            });
        }
        removeBlock();
        return Promise.resolve();
    };
    CoreStitchAuth.prototype.close = function () {
        if (this.accessTokenRefresher) {
            this.accessTokenRefresher.stop();
        }
    };
    CoreStitchAuth.prototype.prepareAuthRequest = function (stitchReq, authInfo) {
        if (!authInfo.isLoggedIn) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.MustAuthenticateFirst);
        }
        var newReq = stitchReq.builder;
        var newHeaders = newReq.headers || {};
        if (stitchReq.useRefreshToken) {
            newHeaders[Headers_1.default.AUTHORIZATION] = Headers_1.default.getAuthorizationBearer(authInfo.refreshToken);
        }
        else {
            newHeaders[Headers_1.default.AUTHORIZATION] = Headers_1.default.getAuthorizationBearer(authInfo.accessToken);
        }
        newReq.withHeaders(newHeaders);
        return newReq.build();
    };
    CoreStitchAuth.prototype.handleAuthFailureForEventStream = function (ex, req, open) {
        var _this = this;
        if (open === void 0) { open = true; }
        if (!(ex instanceof StitchServiceError_1.default) ||
            ex.errorCode !== StitchServiceErrorCode_1.StitchServiceErrorCode.InvalidSession) {
            throw ex;
        }
        if (req.useRefreshToken || !req.shouldRefreshOnFailure) {
            this.clearActiveUserAuth();
            throw ex;
        }
        return this.tryRefreshAccessToken(req.startedAt).then(function () {
            return _this.openAuthenticatedEventStream(req.builder.withShouldRefreshOnFailure(false).build(), open);
        });
    };
    CoreStitchAuth.prototype.handleAuthFailure = function (ex, req) {
        var _this = this;
        if (!(ex instanceof StitchServiceError_1.default) ||
            ex.errorCode !== StitchServiceErrorCode_1.StitchServiceErrorCode.InvalidSession) {
            throw ex;
        }
        if (req.useRefreshToken || !req.shouldRefreshOnFailure) {
            this.clearActiveUserAuth();
            throw ex;
        }
        return this.tryRefreshAccessToken(req.startedAt).then(function () {
            return _this.doAuthenticatedRequest(req.builder.withShouldRefreshOnFailure(false).build());
        });
    };
    CoreStitchAuth.prototype.tryRefreshAccessToken = function (reqStartedAt) {
        if (!this.isLoggedIn) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.LoggedOutDuringRequest);
        }
        try {
            var jwt = JWT_1.default.fromEncoded(this.activeUserAuthInfo.accessToken);
            if (jwt.issuedAt >= reqStartedAt) {
                return Promise.resolve();
            }
        }
        catch (e) {
        }
        return this.refreshAccessToken();
    };
    CoreStitchAuth.prototype.prepUser = function (authInfo) {
        return this.userFactory.makeUser(authInfo.userId, authInfo.loggedInProviderType, authInfo.loggedInProviderName, authInfo.isLoggedIn, authInfo.lastAuthActivity, authInfo.userProfile);
    };
    CoreStitchAuth.prototype.attachAuthOptions = function (authBody) {
        var options = {};
        options[DEVICE] = this.deviceInfo;
        authBody[OPTIONS] = options;
    };
    CoreStitchAuth.prototype.doLogin = function (credential, asLinkRequest) {
        var _this = this;
        var previousActiveUser = this.currentUser;
        return this.doLoginRequest(credential, asLinkRequest)
            .then(function (response) { return _this.processLoginResponse(credential, response, asLinkRequest); })
            .then(function (user) {
            _this.onAuthEvent();
            if (asLinkRequest) {
                _this.dispatchAuthEvent({
                    kind: AuthEvent_1.AuthEventKind.UserLinked,
                    linkedUser: user
                });
            }
            else {
                _this.dispatchAuthEvent({
                    kind: AuthEvent_1.AuthEventKind.UserLoggedIn,
                    loggedInUser: user,
                });
                _this.dispatchAuthEvent({
                    currentActiveUser: user,
                    kind: AuthEvent_1.AuthEventKind.ActiveUserChanged,
                    previousActiveUser: previousActiveUser
                });
            }
            return user;
        });
    };
    CoreStitchAuth.prototype.doLoginRequest = function (credential, asLinkRequest) {
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder.withMethod(Method_1.default.POST);
        if (asLinkRequest) {
            reqBuilder.withPath(this.authRoutes.getAuthProviderLinkRoute(credential.providerName));
        }
        else {
            reqBuilder.withPath(this.authRoutes.getAuthProviderLoginRoute(credential.providerName));
        }
        var material = credential.material;
        this.attachAuthOptions(material);
        reqBuilder.withDocument(material);
        if (!asLinkRequest) {
            return this.requestClient.doRequest(reqBuilder.build());
        }
        var linkRequest = new StitchAuthDocRequest_1.StitchAuthDocRequest(reqBuilder.build(), reqBuilder.document);
        return this.doAuthenticatedRequest(linkRequest);
    };
    CoreStitchAuth.prototype.processLogin = function (credential, newAuthInfo, asLinkRequest) {
        var _this = this;
        var oldActiveUserInfo = this.activeUserAuthInfo;
        var oldActiveUser = this.currentUser;
        newAuthInfo = this.activeUserAuthInfo.merge(new AuthInfo_1.default(newAuthInfo.userId, newAuthInfo.deviceId, newAuthInfo.accessToken, newAuthInfo.refreshToken, credential.providerType, credential.providerName, undefined, undefined));
        this.activeUserAuthInfo = newAuthInfo;
        this.currentUser = this.userFactory.makeUser(this.activeUserAuthInfo.userId, credential.providerType, credential.providerName, this.activeUserAuthInfo.isLoggedIn, new Date(), undefined, JWT_1.default.fromEncoded(newAuthInfo.accessToken).userData);
        return this.doGetUserProfile()
            .then(function (profile) {
            if (oldActiveUserInfo.hasUser) {
                _this.allUsersAuthInfo.set(oldActiveUserInfo.userId, oldActiveUserInfo.withNewAuthActivityTime());
            }
            newAuthInfo = newAuthInfo.merge(new AuthInfo_1.default(newAuthInfo.userId, newAuthInfo.deviceId, newAuthInfo.accessToken, newAuthInfo.refreshToken, credential.providerType, credential.providerName, new Date(), profile));
            var newUserAdded = !_this.allUsersAuthInfo.has(newAuthInfo.userId);
            try {
                StoreAuthInfo_1.writeActiveUserAuthInfoToStorage(newAuthInfo, _this.storage);
                _this.allUsersAuthInfo.set(newAuthInfo.userId, newAuthInfo);
                StoreAuthInfo_1.writeAllUsersAuthInfoToStorage(_this.allUsersAuthInfo, _this.storage);
            }
            catch (err) {
                _this.activeUserAuthInfo = oldActiveUserInfo;
                _this.currentUser = oldActiveUser;
                if (newAuthInfo.userId !== oldActiveUserInfo.userId && newAuthInfo.userId) {
                    _this.allUsersAuthInfo.delete(newAuthInfo.userId);
                }
                throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotPersistAuthInfo);
            }
            _this.activeUserAuthInfo = newAuthInfo;
            _this.currentUser = _this.userFactory.makeUser(_this.activeUserAuthInfo.userId, credential.providerType, credential.providerName, _this.activeUserAuthInfo.isLoggedIn, _this.activeUserAuthInfo.lastAuthActivity, profile, JWT_1.default.fromEncoded(newAuthInfo.accessToken).userData);
            if (newUserAdded) {
                _this.onAuthEvent();
                _this.dispatchAuthEvent({
                    addedUser: _this.currentUser,
                    kind: AuthEvent_1.AuthEventKind.UserAdded
                });
            }
            return _this.currentUser;
        })
            .catch(function (err) {
            if (err instanceof StitchClientError_1.default) {
                throw err;
            }
            if (asLinkRequest || oldActiveUserInfo.hasUser) {
                var linkedAuthInfo = _this.activeUserAuthInfo;
                _this.activeUserAuthInfo = oldActiveUserInfo;
                _this.currentUser = oldActiveUser;
                if (asLinkRequest) {
                    _this.activeUserAuthInfo = _this.activeUserAuthInfo.withAuthProvider(linkedAuthInfo.loggedInProviderType, linkedAuthInfo.loggedInProviderName);
                }
            }
            else {
                _this.clearActiveUserAuth();
            }
            throw err;
        });
    };
    CoreStitchAuth.prototype.processLoginResponse = function (credential, response, asLinkRequest) {
        try {
            if (!response) {
                throw new StitchServiceError_1.default("the login response could not be processed for credential: " + credential + ";" +
                    "response was undefined");
            }
            if (!response.body) {
                throw new StitchServiceError_1.default("response with status code " + response.statusCode + " has empty body");
            }
            return this.processLogin(credential, ApiAuthInfo_1.default.fromJSON(JSON.parse(response.body)), asLinkRequest);
        }
        catch (err) {
            throw new StitchRequestError_1.default(err, StitchRequestErrorCode_1.StitchRequestErrorCode.DECODING_ERROR);
        }
    };
    CoreStitchAuth.prototype.doGetUserProfile = function () {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder.withMethod(Method_1.default.GET).withPath(this.authRoutes.profileRoute);
        return this.doAuthenticatedRequest(reqBuilder.build())
            .then(function (response) { return ApiCoreUserProfile_1.default.fromJSON(JSON.parse(response.body)); })
            .catch(function (err) {
            if (err instanceof StitchError_1.default) {
                throw err;
            }
            else {
                throw new StitchRequestError_1.default(err, StitchRequestErrorCode_1.StitchRequestErrorCode.DECODING_ERROR);
            }
        });
    };
    CoreStitchAuth.prototype.doLogout = function (authInfo) {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withRefreshToken()
            .withPath(this.authRoutes.sessionRoute)
            .withMethod(Method_1.default.DELETE);
        return this.doAuthenticatedRequest(reqBuilder.build(), authInfo).then(function () {
            return;
        });
    };
    CoreStitchAuth.prototype.clearActiveUserAuth = function () {
        if (!this.isLoggedIn) {
            return;
        }
        this.clearUserAuthTokens(this.activeUserAuthInfo.userId);
    };
    CoreStitchAuth.prototype.clearUserAuthTokens = function (userId) {
        var unclearedAuthInfo = this.allUsersAuthInfo.get(userId);
        if (unclearedAuthInfo === undefined) {
            if (this.activeUserAuthInfo.userId !== userId) {
                throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.UserNotFound);
            }
        }
        else if (!unclearedAuthInfo.isLoggedIn) {
            return;
        }
        try {
            var loggedOutUser = void 0;
            if (unclearedAuthInfo) {
                var loggedOutAuthInfo = unclearedAuthInfo.loggedOut();
                this.allUsersAuthInfo.set(userId, loggedOutAuthInfo);
                StoreAuthInfo_1.writeAllUsersAuthInfoToStorage(this.allUsersAuthInfo, this.storage);
                loggedOutUser = this.userFactory.makeUser(loggedOutAuthInfo.userId, loggedOutAuthInfo.loggedInProviderType, loggedOutAuthInfo.loggedInProviderName, loggedOutAuthInfo.isLoggedIn, loggedOutAuthInfo.lastAuthActivity, loggedOutAuthInfo.userProfile);
            }
            var wasActiveUser = false;
            if (this.activeUserAuthInfo.hasUser && this.activeUserAuthInfo.userId === userId) {
                wasActiveUser = true;
                this.activeUserAuthInfo = this.activeUserAuthInfo.withClearedUser();
                this.currentUser = undefined;
                StoreAuthInfo_1.writeActiveUserAuthInfoToStorage(this.activeUserAuthInfo, this.storage);
            }
            if (loggedOutUser) {
                this.onAuthEvent();
                this.dispatchAuthEvent({
                    kind: AuthEvent_1.AuthEventKind.UserLoggedOut,
                    loggedOutUser: loggedOutUser,
                });
                if (wasActiveUser) {
                    this.dispatchAuthEvent({
                        currentActiveUser: undefined,
                        kind: AuthEvent_1.AuthEventKind.ActiveUserChanged,
                        previousActiveUser: loggedOutUser
                    });
                }
            }
        }
        catch (err) {
            throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotPersistAuthInfo);
        }
    };
    return CoreStitchAuth;
}());
exports.default = CoreStitchAuth;

},{"../../StitchClientError":44,"../../StitchClientErrorCode":45,"../../StitchError":46,"../../StitchRequestError":47,"../../StitchRequestErrorCode":48,"../../StitchServiceError":49,"../../StitchServiceErrorCode":50,"../../Stream":51,"../../internal/common/StitchErrorUtils":94,"../../internal/net/Headers":102,"../../internal/net/Method":103,"../../internal/net/StitchAuthDocRequest":108,"../../internal/net/StitchAuthRequest":109,"../../internal/net/StitchDocRequest":110,"../internal/CoreStitchUserImpl":59,"../providers/anonymous/AnonymousAuthProvider":69,"../providers/internal/StitchAuthResponseCredential":80,"./AccessTokenRefresher":55,"./AuthEvent":56,"./AuthInfo":57,"./JWT":61,"./models/ApiAuthInfo":63,"./models/ApiCoreUserProfile":64,"./models/StoreAuthInfo":66,"bson":119}],59:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserProfileImpl_1 = __importDefault(require("./StitchUserProfileImpl"));
var CoreStitchUserImpl = (function () {
    function CoreStitchUserImpl(id, loggedInProviderType, loggedInProviderName, isLoggedIn, lastAuthActivity, profile, customData) {
        this.id = id;
        this.loggedInProviderType = loggedInProviderType;
        this.loggedInProviderName = loggedInProviderName;
        this.profile =
            profile === undefined ? StitchUserProfileImpl_1.default.empty() : profile;
        this.isLoggedIn = isLoggedIn;
        this.lastAuthActivity = lastAuthActivity;
        this.customData = customData === undefined ? {} : customData;
    }
    Object.defineProperty(CoreStitchUserImpl.prototype, "userType", {
        get: function () {
            return this.profile.userType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CoreStitchUserImpl.prototype, "identities", {
        get: function () {
            return this.profile.identities;
        },
        enumerable: true,
        configurable: true
    });
    CoreStitchUserImpl.prototype.equals = function (other) {
        return this.id === other.id
            && JSON.stringify(this.identities) === JSON.stringify(other.identities)
            && this.isLoggedIn === other.isLoggedIn
            && this.loggedInProviderName === other.loggedInProviderName
            && this.loggedInProviderType === other.loggedInProviderType
            && JSON.stringify(this.profile) === JSON.stringify(other.profile);
    };
    return CoreStitchUserImpl;
}());
exports.default = CoreStitchUserImpl;

},{"./StitchUserProfileImpl":62}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DeviceFields;
(function (DeviceFields) {
    DeviceFields["DEVICE_ID"] = "deviceId";
    DeviceFields["APP_ID"] = "appId";
    DeviceFields["APP_VERSION"] = "appVersion";
    DeviceFields["PLATFORM"] = "platform";
    DeviceFields["PLATFORM_VERSION"] = "platformVersion";
    DeviceFields["SDK_VERSION"] = "sdkVersion";
})(DeviceFields || (DeviceFields = {}));
exports.default = DeviceFields;

},{}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Base64_1 = require("../../internal/common/Base64");
var EXPIRES = "exp";
var ISSUED_AT = "iat";
var USER_DATA = "user_data";
var JWT = (function () {
    function JWT(expires, issuedAt, userData) {
        this.expires = expires;
        this.issuedAt = issuedAt;
        this.userData = userData;
    }
    JWT.fromEncoded = function (encodedJWT) {
        var parts = JWT.splitToken(encodedJWT);
        var json = JSON.parse(Base64_1.base64Decode(parts[1]));
        var expires = json[EXPIRES];
        var iat = json[ISSUED_AT];
        var userData = json[USER_DATA];
        return new JWT(expires, iat, userData);
    };
    JWT.splitToken = function (jwt) {
        var parts = jwt.split(".");
        if (parts.length !== 3) {
            throw new Error("Malformed JWT token. The string " + jwt + " should have 3 parts.");
        }
        return parts;
    };
    return JWT;
}());
exports.default = JWT;

},{"../../internal/common/Base64":93}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NAME = "name";
var EMAIL = "email";
var PICTURE_URL = "picture";
var FIRST_NAME = "first_name";
var LAST_NAME = "last_name";
var GENDER = "gender";
var BIRTHDAY = "birthday";
var MIN_AGE = "min_age";
var MAX_AGE = "max_age";
var StitchUserProfileImpl = (function () {
    function StitchUserProfileImpl(userType, data, identities) {
        if (data === void 0) { data = {}; }
        if (identities === void 0) { identities = []; }
        this.userType = userType;
        this.data = data;
        this.identities = identities;
    }
    StitchUserProfileImpl.empty = function () {
        return new StitchUserProfileImpl();
    };
    Object.defineProperty(StitchUserProfileImpl.prototype, "name", {
        get: function () {
            return this.data[NAME];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "email", {
        get: function () {
            return this.data[EMAIL];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "pictureUrl", {
        get: function () {
            return this.data[PICTURE_URL];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "firstName", {
        get: function () {
            return this.data[FIRST_NAME];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "lastName", {
        get: function () {
            return this.data[LAST_NAME];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "gender", {
        get: function () {
            return this.data[GENDER];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "birthday", {
        get: function () {
            return this.data[BIRTHDAY];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "minAge", {
        get: function () {
            var age = this.data[MIN_AGE];
            if (age === undefined) {
                return undefined;
            }
            return age;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StitchUserProfileImpl.prototype, "maxAge", {
        get: function () {
            var age = this.data[MAX_AGE];
            if (age === undefined) {
                return undefined;
            }
            return age;
        },
        enumerable: true,
        configurable: true
    });
    return StitchUserProfileImpl;
}());
exports.default = StitchUserProfileImpl;

},{}],63:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AuthInfo_1 = __importDefault(require("../AuthInfo"));
var Fields;
(function (Fields) {
    Fields["USER_ID"] = "user_id";
    Fields["DEVICE_ID"] = "device_id";
    Fields["ACCESS_TOKEN"] = "access_token";
    Fields["REFRESH_TOKEN"] = "refresh_token";
})(Fields || (Fields = {}));
var ApiAuthInfo = (function (_super) {
    __extends(ApiAuthInfo, _super);
    function ApiAuthInfo(userId, deviceId, accessToken, refreshToken) {
        return _super.call(this, userId, deviceId, accessToken, refreshToken) || this;
    }
    ApiAuthInfo.fromJSON = function (json) {
        return new ApiAuthInfo(json[Fields.USER_ID], json[Fields.DEVICE_ID], json[Fields.ACCESS_TOKEN], json[Fields.REFRESH_TOKEN]);
    };
    ApiAuthInfo.prototype.toJSON = function () {
        var _a;
        return _a = {},
            _a[Fields.USER_ID] = this.userId,
            _a[Fields.DEVICE_ID] = this.deviceId,
            _a[Fields.ACCESS_TOKEN] = this.accessToken,
            _a[Fields.REFRESH_TOKEN] = this.refreshToken,
            _a;
    };
    return ApiAuthInfo;
}(AuthInfo_1.default));
exports.default = ApiAuthInfo;

},{"../AuthInfo":57}],64:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Assertions_1 = __importDefault(require("../../../internal/common/Assertions"));
var StitchUserProfileImpl_1 = __importDefault(require("../StitchUserProfileImpl"));
var ApiStitchUserIdentity_1 = __importDefault(require("./ApiStitchUserIdentity"));
var Fields;
(function (Fields) {
    Fields["DATA"] = "data";
    Fields["USER_TYPE"] = "type";
    Fields["IDENTITIES"] = "identities";
})(Fields || (Fields = {}));
var ApiCoreUserProfile = (function (_super) {
    __extends(ApiCoreUserProfile, _super);
    function ApiCoreUserProfile(userType, data, identities) {
        return _super.call(this, userType, data, identities) || this;
    }
    ApiCoreUserProfile.fromJSON = function (json) {
        Assertions_1.default.keyPresent(Fields.USER_TYPE, json);
        Assertions_1.default.keyPresent(Fields.DATA, json);
        Assertions_1.default.keyPresent(Fields.IDENTITIES, json);
        return new ApiCoreUserProfile(json[Fields.USER_TYPE], json[Fields.DATA], json[Fields.IDENTITIES].map(ApiStitchUserIdentity_1.default.fromJSON));
    };
    ApiCoreUserProfile.prototype.toJSON = function () {
        var _a;
        return _a = {},
            _a[Fields.DATA] = this.data,
            _a[Fields.USER_TYPE] = this.userType,
            _a[Fields.IDENTITIES] = this.identities,
            _a;
    };
    return ApiCoreUserProfile;
}(StitchUserProfileImpl_1.default));
exports.default = ApiCoreUserProfile;

},{"../../../internal/common/Assertions":92,"../StitchUserProfileImpl":62,"./ApiStitchUserIdentity":65}],65:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserIdentity_1 = __importDefault(require("../../StitchUserIdentity"));
var Fields;
(function (Fields) {
    Fields["ID"] = "id";
    Fields["PROVIDER_TYPE"] = "provider_type";
})(Fields || (Fields = {}));
var ApiStitchUserIdentity = (function (_super) {
    __extends(ApiStitchUserIdentity, _super);
    function ApiStitchUserIdentity(id, providerType) {
        return _super.call(this, id, providerType) || this;
    }
    ApiStitchUserIdentity.fromJSON = function (json) {
        return new ApiStitchUserIdentity(json[Fields.ID], json[Fields.PROVIDER_TYPE]);
    };
    ApiStitchUserIdentity.prototype.toJSON = function () {
        var _a;
        return _a = {},
            _a[Fields.ID] = this.id,
            _a[Fields.PROVIDER_TYPE] = this.providerType,
            _a;
    };
    return ApiStitchUserIdentity;
}(StitchUserIdentity_1.default));
exports.default = ApiStitchUserIdentity;

},{"../../StitchUserIdentity":53}],66:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchClientError_1 = __importDefault(require("../../../StitchClientError"));
var StitchClientErrorCode_1 = require("../../../StitchClientErrorCode");
var AuthInfo_1 = __importDefault(require("../AuthInfo"));
var StoreCoreUserProfile_1 = __importDefault(require("./StoreCoreUserProfile"));
var StoreStitchUserIdentity_1 = __importDefault(require("./StoreStitchUserIdentity"));
var Fields;
(function (Fields) {
    Fields["USER_ID"] = "user_id";
    Fields["DEVICE_ID"] = "device_id";
    Fields["ACCESS_TOKEN"] = "access_token";
    Fields["REFRESH_TOKEN"] = "refresh_token";
    Fields["LAST_AUTH_ACTIVITY"] = "last_auth_activity";
    Fields["LOGGED_IN_PROVIDER_TYPE"] = "logged_in_provider_type";
    Fields["LOGGED_IN_PROVIDER_NAME"] = "logged_in_provider_name";
    Fields["USER_PROFILE"] = "user_profile";
})(Fields || (Fields = {}));
function readActiveUserFromStorage(storage) {
    var rawInfo = storage.get(StoreAuthInfo.ACTIVE_USER_STORAGE_NAME);
    if (!rawInfo) {
        return undefined;
    }
    return StoreAuthInfo.decode(JSON.parse(rawInfo));
}
exports.readActiveUserFromStorage = readActiveUserFromStorage;
function readCurrentUsersFromStorage(storage) {
    var rawInfo = storage.get(StoreAuthInfo.ALL_USERS_STORAGE_NAME);
    if (!rawInfo) {
        return new Map();
    }
    var rawArray = JSON.parse(rawInfo);
    if (!Array.isArray(rawArray)) {
        throw new StitchClientError_1.default(StitchClientErrorCode_1.StitchClientErrorCode.CouldNotLoadPersistedAuthInfo);
    }
    var userIdToAuthInfoMap = new Map();
    rawArray.forEach(function (rawEntry) {
        var authInfo = StoreAuthInfo.decode(rawEntry);
        userIdToAuthInfoMap.set(authInfo.userId, authInfo);
    });
    return userIdToAuthInfoMap;
}
exports.readCurrentUsersFromStorage = readCurrentUsersFromStorage;
function writeActiveUserAuthInfoToStorage(authInfo, storage) {
    if (authInfo.isEmpty) {
        storage.remove(StoreAuthInfo.ACTIVE_USER_STORAGE_NAME);
        return;
    }
    var info = new StoreAuthInfo(authInfo.userId, authInfo.deviceId, authInfo.accessToken, authInfo.refreshToken, authInfo.loggedInProviderType, authInfo.loggedInProviderName, authInfo.lastAuthActivity, authInfo.userProfile
        ? new StoreCoreUserProfile_1.default(authInfo.userProfile.userType, authInfo.userProfile.data, authInfo.userProfile.identities.map(function (identity) {
            return new StoreStitchUserIdentity_1.default(identity.id, identity.providerType);
        }))
        : undefined);
    storage.set(StoreAuthInfo.ACTIVE_USER_STORAGE_NAME, JSON.stringify(info.encode()));
}
exports.writeActiveUserAuthInfoToStorage = writeActiveUserAuthInfoToStorage;
function writeAllUsersAuthInfoToStorage(currentUsersAuthInfo, storage) {
    var encodedStoreInfos = [];
    currentUsersAuthInfo.forEach(function (authInfo, userId) {
        var storeInfo = new StoreAuthInfo(userId, authInfo.deviceId, authInfo.accessToken, authInfo.refreshToken, authInfo.loggedInProviderType, authInfo.loggedInProviderName, authInfo.lastAuthActivity, authInfo.userProfile
            ? new StoreCoreUserProfile_1.default(authInfo.userProfile.userType, authInfo.userProfile.data, authInfo.userProfile.identities.map(function (identity) {
                return new StoreStitchUserIdentity_1.default(identity.id, identity.providerType);
            }))
            : undefined);
        encodedStoreInfos.push(storeInfo.encode());
    });
    storage.set(StoreAuthInfo.ALL_USERS_STORAGE_NAME, JSON.stringify(encodedStoreInfos));
}
exports.writeAllUsersAuthInfoToStorage = writeAllUsersAuthInfoToStorage;
var StoreAuthInfo = (function (_super) {
    __extends(StoreAuthInfo, _super);
    function StoreAuthInfo(userId, deviceId, accessToken, refreshToken, loggedInProviderType, loggedInProviderName, lastAuthActivity, userProfile) {
        var _this = _super.call(this, userId, deviceId, accessToken, refreshToken, loggedInProviderType, loggedInProviderName, lastAuthActivity, userProfile) || this;
        _this.userProfile = userProfile;
        return _this;
    }
    StoreAuthInfo.decode = function (from) {
        var userId = from[Fields.USER_ID];
        var deviceId = from[Fields.DEVICE_ID];
        var accessToken = from[Fields.ACCESS_TOKEN];
        var refreshToken = from[Fields.REFRESH_TOKEN];
        var loggedInProviderType = from[Fields.LOGGED_IN_PROVIDER_TYPE];
        var loggedInProviderName = from[Fields.LOGGED_IN_PROVIDER_NAME];
        var userProfile = from[Fields.USER_PROFILE];
        var lastAuthActivityMillisSinceEpoch = from[Fields.LAST_AUTH_ACTIVITY];
        return new StoreAuthInfo(userId, deviceId, accessToken, refreshToken, loggedInProviderType, loggedInProviderName, new Date(lastAuthActivityMillisSinceEpoch), StoreCoreUserProfile_1.default.decode(userProfile));
    };
    StoreAuthInfo.prototype.encode = function () {
        var to = {};
        to[Fields.USER_ID] = this.userId;
        to[Fields.ACCESS_TOKEN] = this.accessToken;
        to[Fields.REFRESH_TOKEN] = this.refreshToken;
        to[Fields.DEVICE_ID] = this.deviceId;
        to[Fields.LOGGED_IN_PROVIDER_NAME] = this.loggedInProviderName;
        to[Fields.LOGGED_IN_PROVIDER_TYPE] = this.loggedInProviderType;
        to[Fields.LAST_AUTH_ACTIVITY] = this.lastAuthActivity
            ? this.lastAuthActivity.getTime()
            : undefined;
        to[Fields.USER_PROFILE] = this.userProfile
            ? this.userProfile.encode()
            : undefined;
        return to;
    };
    StoreAuthInfo.ACTIVE_USER_STORAGE_NAME = "auth_info";
    StoreAuthInfo.ALL_USERS_STORAGE_NAME = "all_auth_infos";
    return StoreAuthInfo;
}(AuthInfo_1.default));
exports.StoreAuthInfo = StoreAuthInfo;

},{"../../../StitchClientError":44,"../../../StitchClientErrorCode":45,"../AuthInfo":57,"./StoreCoreUserProfile":67,"./StoreStitchUserIdentity":68}],67:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserProfileImpl_1 = __importDefault(require("../StitchUserProfileImpl"));
var StoreStitchUserIdentity_1 = __importDefault(require("./StoreStitchUserIdentity"));
var Fields;
(function (Fields) {
    Fields["DATA"] = "data";
    Fields["USER_TYPE"] = "type";
    Fields["IDENTITIES"] = "identities";
})(Fields || (Fields = {}));
var StoreCoreUserProfile = (function (_super) {
    __extends(StoreCoreUserProfile, _super);
    function StoreCoreUserProfile(userType, data, identities) {
        var _this = _super.call(this, userType, data, identities) || this;
        _this.userType = userType;
        _this.data = data;
        _this.identities = identities;
        return _this;
    }
    StoreCoreUserProfile.decode = function (from) {
        return from
            ? new StoreCoreUserProfile(from[Fields.USER_TYPE], from[Fields.DATA], from[Fields.IDENTITIES].map(function (identity) {
                return StoreStitchUserIdentity_1.default.decode(identity);
            }))
            : undefined;
    };
    StoreCoreUserProfile.prototype.encode = function () {
        var _a;
        return _a = {},
            _a[Fields.DATA] = this.data,
            _a[Fields.USER_TYPE] = this.userType,
            _a[Fields.IDENTITIES] = this.identities.map(function (identity) { return identity.encode(); }),
            _a;
    };
    return StoreCoreUserProfile;
}(StitchUserProfileImpl_1.default));
exports.default = StoreCoreUserProfile;

},{"../StitchUserProfileImpl":62,"./StoreStitchUserIdentity":68}],68:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchUserIdentity_1 = __importDefault(require("../../StitchUserIdentity"));
var Fields;
(function (Fields) {
    Fields["ID"] = "id";
    Fields["PROVIDER_TYPE"] = "provider_type";
})(Fields || (Fields = {}));
var StoreStitchUserIdentity = (function (_super) {
    __extends(StoreStitchUserIdentity, _super);
    function StoreStitchUserIdentity(id, providerType) {
        return _super.call(this, id, providerType) || this;
    }
    StoreStitchUserIdentity.decode = function (from) {
        return new StoreStitchUserIdentity(from[Fields.ID], from[Fields.PROVIDER_TYPE]);
    };
    StoreStitchUserIdentity.prototype.encode = function () {
        var _a;
        return _a = {},
            _a[Fields.ID] = this.id,
            _a[Fields.PROVIDER_TYPE] = this.providerType,
            _a;
    };
    return StoreStitchUserIdentity;
}(StitchUserIdentity_1.default));
exports.default = StoreStitchUserIdentity;

},{"../../StitchUserIdentity":53}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AnonymousAuthProvider = (function () {
    function AnonymousAuthProvider() {
    }
    AnonymousAuthProvider.TYPE = "anon-user";
    AnonymousAuthProvider.DEFAULT_NAME = "anon-user";
    return AnonymousAuthProvider;
}());
exports.default = AnonymousAuthProvider;

},{}],70:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var AnonymousAuthProvider_1 = __importDefault(require("./AnonymousAuthProvider"));
var AnonymousCredential = (function () {
    function AnonymousCredential(providerName) {
        if (providerName === void 0) { providerName = AnonymousAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = AnonymousAuthProvider_1.default.TYPE;
        this.material = {};
        this.providerCapabilities = new ProviderCapabilities_1.default(true);
        this.providerName = providerName;
    }
    return AnonymousCredential;
}());
exports.default = AnonymousCredential;

},{"../../ProviderCapabilities":52,"./AnonymousAuthProvider":69}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CustomAuthProvider = (function () {
    function CustomAuthProvider() {
    }
    CustomAuthProvider.TYPE = "custom-token";
    CustomAuthProvider.DEFAULT_NAME = "custom-token";
    return CustomAuthProvider;
}());
exports.default = CustomAuthProvider;

},{}],72:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var CustomAuthProvider_1 = __importDefault(require("./CustomAuthProvider"));
var Fields;
(function (Fields) {
    Fields["TOKEN"] = "token";
})(Fields || (Fields = {}));
var CustomCredential = (function () {
    function CustomCredential(token, providerName) {
        var _a;
        if (providerName === void 0) { providerName = CustomAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = CustomAuthProvider_1.default.TYPE;
        this.providerCapabilities = new ProviderCapabilities_1.default(false);
        this.providerName = providerName;
        this.token = token;
        this.material = (_a = {}, _a[Fields.TOKEN] = this.token, _a);
    }
    return CustomCredential;
}());
exports.default = CustomCredential;

},{"../../ProviderCapabilities":52,"./CustomAuthProvider":71}],73:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FacebookAuthProvider = (function () {
    function FacebookAuthProvider() {
    }
    FacebookAuthProvider.TYPE = "oauth2-facebook";
    FacebookAuthProvider.DEFAULT_NAME = "oauth2-facebook";
    return FacebookAuthProvider;
}());
exports.default = FacebookAuthProvider;

},{}],74:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var FacebookAuthProvider_1 = __importDefault(require("./FacebookAuthProvider"));
var Fields;
(function (Fields) {
    Fields["ACCESS_TOKEN"] = "accessToken";
})(Fields || (Fields = {}));
var FacebookCredential = (function () {
    function FacebookCredential(accessToken, providerName) {
        var _a;
        if (providerName === void 0) { providerName = FacebookAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = FacebookAuthProvider_1.default.TYPE;
        this.providerName = providerName;
        this.accessToken = accessToken;
        this.material = (_a = {}, _a[Fields.ACCESS_TOKEN] = this.accessToken, _a);
    }
    Object.defineProperty(FacebookCredential.prototype, "providerCapabilities", {
        get: function () {
            return new ProviderCapabilities_1.default(false);
        },
        enumerable: true,
        configurable: true
    });
    return FacebookCredential;
}());
exports.default = FacebookCredential;

},{"../../ProviderCapabilities":52,"./FacebookAuthProvider":73}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FunctionAuthProvider = (function () {
    function FunctionAuthProvider() {
    }
    FunctionAuthProvider.TYPE = "custom-function";
    FunctionAuthProvider.DEFAULT_NAME = "custom-function";
    return FunctionAuthProvider;
}());
exports.default = FunctionAuthProvider;

},{}],76:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var FunctionAuthProvider_1 = __importDefault(require("./FunctionAuthProvider"));
var FunctionCredential = (function () {
    function FunctionCredential(payload, providerName) {
        if (providerName === void 0) { providerName = FunctionAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = FunctionAuthProvider_1.default.TYPE;
        this.providerName = providerName;
        this.material = payload;
    }
    Object.defineProperty(FunctionCredential.prototype, "providerCapabilities", {
        get: function () {
            return new ProviderCapabilities_1.default(false);
        },
        enumerable: true,
        configurable: true
    });
    return FunctionCredential;
}());
exports.default = FunctionCredential;

},{"../../ProviderCapabilities":52,"./FunctionAuthProvider":75}],77:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GoogleAuthProvider = (function () {
    function GoogleAuthProvider() {
    }
    GoogleAuthProvider.TYPE = "oauth2-google";
    GoogleAuthProvider.DEFAULT_NAME = "oauth2-google";
    return GoogleAuthProvider;
}());
exports.default = GoogleAuthProvider;

},{}],78:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var GoogleAuthProvider_1 = __importDefault(require("./GoogleAuthProvider"));
var Fields;
(function (Fields) {
    Fields["AUTH_CODE"] = "authCode";
})(Fields || (Fields = {}));
var GoogleCredential = (function () {
    function GoogleCredential(authCode, providerName) {
        var _a;
        if (providerName === void 0) { providerName = GoogleAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = GoogleAuthProvider_1.default.TYPE;
        this.providerCapabilities = new ProviderCapabilities_1.default(false);
        this.providerName = providerName;
        this.authCode = authCode;
        this.material = (_a = {}, _a[Fields.AUTH_CODE] = this.authCode, _a);
    }
    return GoogleCredential;
}());
exports.default = GoogleCredential;

},{"../../ProviderCapabilities":52,"./GoogleAuthProvider":77}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CoreAuthProviderClient = (function () {
    function CoreAuthProviderClient(providerName, requestClient, baseRoute) {
        this.providerName = providerName;
        this.requestClient = requestClient;
        this.baseRoute = baseRoute;
    }
    return CoreAuthProviderClient;
}());
exports.default = CoreAuthProviderClient;

},{}],80:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchAuthResponseCredential = (function () {
    function StitchAuthResponseCredential(authInfo, providerType, providerName, asLink) {
        this.authInfo = authInfo;
        this.providerType = providerType;
        this.providerName = providerName;
        this.asLink = asLink;
    }
    return StitchAuthResponseCredential;
}());
exports.default = StitchAuthResponseCredential;

},{}],81:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ServerApiKeyAuthProvider = (function () {
    function ServerApiKeyAuthProvider() {
    }
    ServerApiKeyAuthProvider.TYPE = "api-key";
    ServerApiKeyAuthProvider.DEFAULT_NAME = "api-key";
    return ServerApiKeyAuthProvider;
}());
exports.default = ServerApiKeyAuthProvider;

},{}],82:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var ServerApiKeyAuthProvider_1 = __importDefault(require("./ServerApiKeyAuthProvider"));
var Fields;
(function (Fields) {
    Fields["KEY"] = "key";
})(Fields || (Fields = {}));
var ServerApiKeyCredential = (function () {
    function ServerApiKeyCredential(key, providerName) {
        var _a;
        if (providerName === void 0) { providerName = ServerApiKeyAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = ServerApiKeyAuthProvider_1.default.TYPE;
        this.providerCapabilities = new ProviderCapabilities_1.default(false);
        this.providerName = providerName;
        this.key = key;
        this.material = (_a = {}, _a[Fields.KEY] = this.key, _a);
    }
    return ServerApiKeyCredential;
}());
exports.default = ServerApiKeyCredential;

},{"../../ProviderCapabilities":52,"./ServerApiKeyAuthProvider":81}],83:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchErrorUtils_1 = require("../../../internal/common/StitchErrorUtils");
var Method_1 = __importDefault(require("../../../internal/net/Method"));
var StitchAuthDocRequest_1 = require("../../../internal/net/StitchAuthDocRequest");
var StitchAuthRequest_1 = require("../../../internal/net/StitchAuthRequest");
var StitchRequestError_1 = __importDefault(require("../../../StitchRequestError"));
var StitchRequestErrorCode_1 = require("../../../StitchRequestErrorCode");
var CoreAuthProviderClient_1 = __importDefault(require("../internal/CoreAuthProviderClient"));
var UserApiKey_1 = __importDefault(require("./models/UserApiKey"));
var UserApiKeyAuthProvider_1 = __importDefault(require("./UserApiKeyAuthProvider"));
var ApiKeyFields;
(function (ApiKeyFields) {
    ApiKeyFields["NAME"] = "name";
})(ApiKeyFields || (ApiKeyFields = {}));
var CoreUserApiKeyAuthProviderClient = (function (_super) {
    __extends(CoreUserApiKeyAuthProviderClient, _super);
    function CoreUserApiKeyAuthProviderClient(requestClient, authRoutes) {
        var _this = this;
        var baseRoute = authRoutes.baseAuthRoute + "/api_keys";
        var name = UserApiKeyAuthProvider_1.default.DEFAULT_NAME;
        _this = _super.call(this, name, requestClient, baseRoute) || this;
        return _this;
    }
    CoreUserApiKeyAuthProviderClient.prototype.createApiKey = function (name) {
        var _a;
        var reqBuilder = new StitchAuthDocRequest_1.StitchAuthDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.baseRoute)
            .withDocument((_a = {},
            _a[ApiKeyFields.NAME] = name,
            _a))
            .withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function (response) {
            return UserApiKey_1.default.readFromApi(response.body);
        })
            .catch(function (err) {
            throw StitchErrorUtils_1.wrapDecodingError(err);
        });
    };
    CoreUserApiKeyAuthProviderClient.prototype.fetchApiKey = function (keyId) {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.GET)
            .withPath(this.getApiKeyRoute(keyId.toHexString()));
        reqBuilder.withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function (response) {
            return UserApiKey_1.default.readFromApi(response.body);
        })
            .catch(function (err) {
            throw StitchErrorUtils_1.wrapDecodingError(err);
        });
    };
    CoreUserApiKeyAuthProviderClient.prototype.fetchApiKeys = function () {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder.withMethod(Method_1.default.GET).withPath(this.baseRoute);
        reqBuilder.withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function (response) {
            var json = JSON.parse(response.body);
            if (Array.isArray(json)) {
                return json.map(function (value) { return UserApiKey_1.default.readFromApi(value); });
            }
            throw new StitchRequestError_1.default(new Error("unexpected non-array response from server"), StitchRequestErrorCode_1.StitchRequestErrorCode.DECODING_ERROR);
        })
            .catch(function (err) {
            throw StitchErrorUtils_1.wrapDecodingError(err);
        });
    };
    CoreUserApiKeyAuthProviderClient.prototype.deleteApiKey = function (keyId) {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.DELETE)
            .withPath(this.getApiKeyRoute(keyId.toHexString()));
        reqBuilder.withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function () { });
    };
    CoreUserApiKeyAuthProviderClient.prototype.enableApiKey = function (keyId) {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.PUT)
            .withPath(this.getApiKeyEnableRoute(keyId.toHexString()));
        reqBuilder.withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function () { });
    };
    CoreUserApiKeyAuthProviderClient.prototype.disableApiKey = function (keyId) {
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.PUT)
            .withPath(this.getApiKeyDisableRoute(keyId.toHexString()));
        reqBuilder.withRefreshToken();
        return this.requestClient
            .doAuthenticatedRequest(reqBuilder.build())
            .then(function () { });
    };
    CoreUserApiKeyAuthProviderClient.prototype.getApiKeyRoute = function (keyId) {
        return this.baseRoute + "/" + keyId;
    };
    CoreUserApiKeyAuthProviderClient.prototype.getApiKeyEnableRoute = function (keyId) {
        return this.getApiKeyRoute(keyId) + "/enable";
    };
    CoreUserApiKeyAuthProviderClient.prototype.getApiKeyDisableRoute = function (keyId) {
        return this.getApiKeyRoute(keyId) + "/disable";
    };
    return CoreUserApiKeyAuthProviderClient;
}(CoreAuthProviderClient_1.default));
exports.default = CoreUserApiKeyAuthProviderClient;

},{"../../../StitchRequestError":47,"../../../StitchRequestErrorCode":48,"../../../internal/common/StitchErrorUtils":94,"../../../internal/net/Method":103,"../../../internal/net/StitchAuthDocRequest":108,"../../../internal/net/StitchAuthRequest":109,"../internal/CoreAuthProviderClient":79,"./UserApiKeyAuthProvider":84,"./models/UserApiKey":86}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UserApiKeyAuthProvider = (function () {
    function UserApiKeyAuthProvider() {
    }
    UserApiKeyAuthProvider.TYPE = "api-key";
    UserApiKeyAuthProvider.DEFAULT_NAME = "api-key";
    return UserApiKeyAuthProvider;
}());
exports.default = UserApiKeyAuthProvider;

},{}],85:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var UserApiKeyAuthProvider_1 = __importDefault(require("./UserApiKeyAuthProvider"));
var Fields;
(function (Fields) {
    Fields["KEY"] = "key";
})(Fields || (Fields = {}));
var UserApiKeyCredential = (function () {
    function UserApiKeyCredential(key, providerName) {
        var _a;
        if (providerName === void 0) { providerName = UserApiKeyAuthProvider_1.default.DEFAULT_NAME; }
        this.providerType = UserApiKeyAuthProvider_1.default.TYPE;
        this.providerCapabilities = new ProviderCapabilities_1.default(false);
        this.providerName = providerName;
        this.key = key;
        this.material = (_a = {},
            _a[Fields.KEY] = this.key,
            _a);
    }
    return UserApiKeyCredential;
}());
exports.default = UserApiKeyCredential;

},{"../../ProviderCapabilities":52,"./UserApiKeyAuthProvider":84}],86:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = __importDefault(require("bson"));
var Assertions_1 = __importDefault(require("../../../../internal/common/Assertions"));
var Fields;
(function (Fields) {
    Fields["ID"] = "_id";
    Fields["KEY"] = "key";
    Fields["NAME"] = "name";
    Fields["DISABLED"] = "disabled";
})(Fields || (Fields = {}));
var UserApiKey = (function () {
    function UserApiKey(id, key, name, disabled) {
        this.id = bson_1.default.ObjectID.createFromHexString(id);
        this.key = key;
        this.name = name;
        this.disabled = disabled;
    }
    UserApiKey.readFromApi = function (json) {
        var body = typeof json === "string" ? JSON.parse(json) : json;
        Assertions_1.default.keyPresent(Fields.ID, body);
        Assertions_1.default.keyPresent(Fields.NAME, body);
        Assertions_1.default.keyPresent(Fields.DISABLED, body);
        return new UserApiKey(body[Fields.ID], body[Fields.KEY], body[Fields.NAME], body[Fields.DISABLED]);
    };
    UserApiKey.prototype.toJSON = function () {
        var _a;
        return _a = {},
            _a[Fields.ID] = this.id,
            _a[Fields.KEY] = this.key,
            _a[Fields.NAME] = this.name,
            _a[Fields.DISABLED] = this.disabled,
            _a;
    };
    return UserApiKey;
}());
exports.default = UserApiKey;

},{"../../../../internal/common/Assertions":92,"bson":119}],87:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Method_1 = __importDefault(require("../../../internal/net/Method"));
var StitchDocRequest_1 = require("../../../internal/net/StitchDocRequest");
var CoreAuthProviderClient_1 = __importDefault(require("../internal/CoreAuthProviderClient"));
var UserPasswordAuthProvider_1 = __importDefault(require("./UserPasswordAuthProvider"));
var RegistrationFields;
(function (RegistrationFields) {
    RegistrationFields["EMAIL"] = "email";
    RegistrationFields["PASSWORD"] = "password";
})(RegistrationFields || (RegistrationFields = {}));
var ActionFields;
(function (ActionFields) {
    ActionFields["EMAIL"] = "email";
    ActionFields["PASSWORD"] = "password";
    ActionFields["TOKEN"] = "token";
    ActionFields["TOKEN_ID"] = "tokenId";
    ActionFields["ARGS"] = "arguments";
})(ActionFields || (ActionFields = {}));
var CoreUserPasswordAuthProviderClient = (function (_super) {
    __extends(CoreUserPasswordAuthProviderClient, _super);
    function CoreUserPasswordAuthProviderClient(providerName, requestClient, authRoutes) {
        if (providerName === void 0) { providerName = UserPasswordAuthProvider_1.default.DEFAULT_NAME; }
        var _this = this;
        var baseRoute = authRoutes.getAuthProviderRoute(providerName);
        _this = _super.call(this, providerName, requestClient, baseRoute) || this;
        return _this;
    }
    CoreUserPasswordAuthProviderClient.prototype.registerWithEmailInternal = function (email, password) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.getRegisterWithEmailRoute());
        reqBuilder.withDocument((_a = {},
            _a[RegistrationFields.EMAIL] = email,
            _a[RegistrationFields.PASSWORD] = password,
            _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.confirmUserInternal = function (token, tokenId) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder.withMethod(Method_1.default.POST).withPath(this.getConfirmUserRoute());
        reqBuilder.withDocument((_a = {},
            _a[ActionFields.TOKEN] = token,
            _a[ActionFields.TOKEN_ID] = tokenId,
            _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.resendConfirmationEmailInternal = function (email) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.getResendConfirmationEmailRoute());
        reqBuilder.withDocument((_a = {}, _a[ActionFields.EMAIL] = email, _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.resetPasswordInternal = function (token, tokenId, password) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder.withMethod(Method_1.default.POST).withPath(this.getResetPasswordRoute());
        reqBuilder.withDocument((_a = {},
            _a[ActionFields.TOKEN] = token,
            _a[ActionFields.TOKEN_ID] = tokenId,
            _a[ActionFields.PASSWORD] = password,
            _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.sendResetPasswordEmailInternal = function (email) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.getSendResetPasswordEmailRoute());
        reqBuilder.withDocument((_a = {}, _a[ActionFields.EMAIL] = email, _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.callResetPasswordFunctionInternal = function (email, password, args) {
        var _a;
        var reqBuilder = new StitchDocRequest_1.StitchDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.getCallResetPasswordFunctionRoute());
        reqBuilder.withDocument((_a = {},
            _a[ActionFields.EMAIL] = email,
            _a[ActionFields.PASSWORD] = password,
            _a[ActionFields.ARGS] = args,
            _a));
        return this.requestClient.doRequest(reqBuilder.build()).then(function () { });
    };
    CoreUserPasswordAuthProviderClient.prototype.getRegisterWithEmailRoute = function () {
        return this.getExtensionRoute("register");
    };
    CoreUserPasswordAuthProviderClient.prototype.getConfirmUserRoute = function () {
        return this.getExtensionRoute("confirm");
    };
    CoreUserPasswordAuthProviderClient.prototype.getResendConfirmationEmailRoute = function () {
        return this.getExtensionRoute("confirm/send");
    };
    CoreUserPasswordAuthProviderClient.prototype.getResetPasswordRoute = function () {
        return this.getExtensionRoute("reset");
    };
    CoreUserPasswordAuthProviderClient.prototype.getSendResetPasswordEmailRoute = function () {
        return this.getExtensionRoute("reset/send");
    };
    CoreUserPasswordAuthProviderClient.prototype.getCallResetPasswordFunctionRoute = function () {
        return this.getExtensionRoute("reset/call");
    };
    CoreUserPasswordAuthProviderClient.prototype.getExtensionRoute = function (path) {
        return this.baseRoute + "/" + path;
    };
    return CoreUserPasswordAuthProviderClient;
}(CoreAuthProviderClient_1.default));
exports.default = CoreUserPasswordAuthProviderClient;

},{"../../../internal/net/Method":103,"../../../internal/net/StitchDocRequest":110,"../internal/CoreAuthProviderClient":79,"./UserPasswordAuthProvider":88}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UserPasswordAuthProvider = (function () {
    function UserPasswordAuthProvider() {
    }
    UserPasswordAuthProvider.TYPE = "local-userpass";
    UserPasswordAuthProvider.DEFAULT_NAME = "local-userpass";
    return UserPasswordAuthProvider;
}());
exports.default = UserPasswordAuthProvider;

},{}],89:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ProviderCapabilities_1 = __importDefault(require("../../ProviderCapabilities"));
var UserPasswordAuthProvider_1 = __importDefault(require("./UserPasswordAuthProvider"));
var Fields;
(function (Fields) {
    Fields["USERNAME"] = "username";
    Fields["PASSWORD"] = "password";
})(Fields || (Fields = {}));
var UserPasswordCredential = (function () {
    function UserPasswordCredential(username, password, providerName) {
        var _a;
        if (providerName === void 0) { providerName = UserPasswordAuthProvider_1.default.DEFAULT_NAME; }
        this.username = username;
        this.password = password;
        this.providerName = providerName;
        this.providerType = UserPasswordAuthProvider_1.default.TYPE;
        this.providerCapabilities = new ProviderCapabilities_1.default(false);
        this.material = (_a = {},
            _a[Fields.USERNAME] = this.username,
            _a[Fields.PASSWORD] = this.password,
            _a);
    }
    return UserPasswordCredential;
}());
exports.default = UserPasswordCredential;

},{"../../ProviderCapabilities":52,"./UserPasswordAuthProvider":88}],90:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = __importDefault(require("bson"));
exports.BSON = bson_1.default;
var AuthEvent_1 = require("./auth/internal/AuthEvent");
exports.AuthEventKind = AuthEvent_1.AuthEventKind;
var AuthInfo_1 = __importDefault(require("./auth/internal/AuthInfo"));
exports.AuthInfo = AuthInfo_1.default;
var CoreStitchAuth_1 = __importDefault(require("./auth/internal/CoreStitchAuth"));
exports.CoreStitchAuth = CoreStitchAuth_1.default;
var CoreStitchUserImpl_1 = __importDefault(require("./auth/internal/CoreStitchUserImpl"));
exports.CoreStitchUserImpl = CoreStitchUserImpl_1.default;
var DeviceFields_1 = __importDefault(require("./auth/internal/DeviceFields"));
exports.DeviceFields = DeviceFields_1.default;
var ApiStitchUserIdentity_1 = __importDefault(require("./auth/internal/models/ApiStitchUserIdentity"));
exports.ApiStitchUserIdentity = ApiStitchUserIdentity_1.default;
var StitchUserProfileImpl_1 = __importDefault(require("./auth/internal/StitchUserProfileImpl"));
exports.StitchUserProfileImpl = StitchUserProfileImpl_1.default;
var AnonymousAuthProvider_1 = __importDefault(require("./auth/providers/anonymous/AnonymousAuthProvider"));
exports.AnonymousAuthProvider = AnonymousAuthProvider_1.default;
var AnonymousCredential_1 = __importDefault(require("./auth/providers/anonymous/AnonymousCredential"));
exports.AnonymousCredential = AnonymousCredential_1.default;
var CustomAuthProvider_1 = __importDefault(require("./auth/providers/custom/CustomAuthProvider"));
exports.CustomAuthProvider = CustomAuthProvider_1.default;
var CustomCredential_1 = __importDefault(require("./auth/providers/custom/CustomCredential"));
exports.CustomCredential = CustomCredential_1.default;
var FacebookAuthProvider_1 = __importDefault(require("./auth/providers/facebook/FacebookAuthProvider"));
exports.FacebookAuthProvider = FacebookAuthProvider_1.default;
var FacebookCredential_1 = __importDefault(require("./auth/providers/facebook/FacebookCredential"));
exports.FacebookCredential = FacebookCredential_1.default;
var FunctionAuthProvider_1 = __importDefault(require("./auth/providers/function/FunctionAuthProvider"));
exports.FunctionAuthProvider = FunctionAuthProvider_1.default;
var FunctionCredential_1 = __importDefault(require("./auth/providers/function/FunctionCredential"));
exports.FunctionCredential = FunctionCredential_1.default;
var GoogleAuthProvider_1 = __importDefault(require("./auth/providers/google/GoogleAuthProvider"));
exports.GoogleAuthProvider = GoogleAuthProvider_1.default;
var GoogleCredential_1 = __importDefault(require("./auth/providers/google/GoogleCredential"));
exports.GoogleCredential = GoogleCredential_1.default;
var StitchAuthResponseCredential_1 = __importDefault(require("./auth/providers/internal/StitchAuthResponseCredential"));
exports.StitchAuthResponseCredential = StitchAuthResponseCredential_1.default;
var ServerApiKeyAuthProvider_1 = __importDefault(require("./auth/providers/serverapikey/ServerApiKeyAuthProvider"));
exports.ServerApiKeyAuthProvider = ServerApiKeyAuthProvider_1.default;
var ServerApiKeyCredential_1 = __importDefault(require("./auth/providers/serverapikey/ServerApiKeyCredential"));
exports.ServerApiKeyCredential = ServerApiKeyCredential_1.default;
var CoreUserApiKeyAuthProviderClient_1 = __importDefault(require("./auth/providers/userapikey/CoreUserApiKeyAuthProviderClient"));
exports.CoreUserApiKeyAuthProviderClient = CoreUserApiKeyAuthProviderClient_1.default;
var UserApiKey_1 = __importDefault(require("./auth/providers/userapikey/models/UserApiKey"));
exports.UserApiKey = UserApiKey_1.default;
var UserApiKeyAuthProvider_1 = __importDefault(require("./auth/providers/userapikey/UserApiKeyAuthProvider"));
exports.UserApiKeyAuthProvider = UserApiKeyAuthProvider_1.default;
var UserApiKeyCredential_1 = __importDefault(require("./auth/providers/userapikey/UserApiKeyCredential"));
exports.UserApiKeyCredential = UserApiKeyCredential_1.default;
var CoreUserPasswordAuthProviderClient_1 = __importDefault(require("./auth/providers/userpass/CoreUserPasswordAuthProviderClient"));
exports.CoreUserPassAuthProviderClient = CoreUserPasswordAuthProviderClient_1.default;
var UserPasswordAuthProvider_1 = __importDefault(require("./auth/providers/userpass/UserPasswordAuthProvider"));
exports.UserPasswordAuthProvider = UserPasswordAuthProvider_1.default;
var UserPasswordCredential_1 = __importDefault(require("./auth/providers/userpass/UserPasswordCredential"));
exports.UserPasswordCredential = UserPasswordCredential_1.default;
var StitchUserIdentity_1 = __importDefault(require("./auth/StitchUserIdentity"));
exports.StitchUserIdentity = StitchUserIdentity_1.default;
var UserType_1 = __importDefault(require("./auth/UserType"));
exports.UserType = UserType_1.default;
var Assertions_1 = __importDefault(require("./internal/common/Assertions"));
exports.Assertions = Assertions_1.default;
var Base64_1 = require("./internal/common/Base64");
exports.base64Decode = Base64_1.base64Decode;
exports.base64Encode = Base64_1.base64Encode;
exports.utf8Slice = Base64_1.utf8Slice;
var StitchErrorUtils_1 = require("./internal/common/StitchErrorUtils");
exports.handleRequestError = StitchErrorUtils_1.handleRequestError;
var Storage_1 = require("./internal/common/Storage");
exports.MemoryStorage = Storage_1.MemoryStorage;
var CoreStitchAppClient_1 = __importDefault(require("./internal/CoreStitchAppClient"));
exports.CoreStitchAppClient = CoreStitchAppClient_1.default;
var BaseEventStream_1 = __importDefault(require("./internal/net/BaseEventStream"));
exports.BaseEventStream = BaseEventStream_1.default;
var BasicRequest_1 = require("./internal/net/BasicRequest");
exports.BasicRequest = BasicRequest_1.BasicRequest;
var ContentTypes_1 = __importDefault(require("./internal/net/ContentTypes"));
exports.ContentTypes = ContentTypes_1.default;
var Event_1 = __importDefault(require("./internal/net/Event"));
exports.Event = Event_1.default;
var Headers_1 = __importDefault(require("./internal/net/Headers"));
exports.Headers = Headers_1.default;
var Method_1 = __importDefault(require("./internal/net/Method"));
exports.Method = Method_1.default;
var Response_1 = __importDefault(require("./internal/net/Response"));
exports.Response = Response_1.default;
var StitchAppAuthRoutes_1 = __importDefault(require("./internal/net/StitchAppAuthRoutes"));
exports.StitchAppAuthRoutes = StitchAppAuthRoutes_1.default;
var StitchAppRequestClient_1 = __importDefault(require("./internal/net/StitchAppRequestClient"));
exports.StitchAppRequestClient = StitchAppRequestClient_1.default;
var StitchAppRoutes_1 = __importDefault(require("./internal/net/StitchAppRoutes"));
exports.StitchAppRoutes = StitchAppRoutes_1.default;
var StitchAuthRequest_1 = require("./internal/net/StitchAuthRequest");
exports.StitchAuthRequest = StitchAuthRequest_1.StitchAuthRequest;
var StitchEvent_1 = __importDefault(require("./internal/net/StitchEvent"));
exports.StitchEvent = StitchEvent_1.default;
var StitchRequestClient_1 = __importDefault(require("./internal/net/StitchRequestClient"));
exports.StitchRequestClient = StitchRequestClient_1.default;
var AuthRebindEvent_1 = __importDefault(require("./services/internal/AuthRebindEvent"));
exports.AuthRebindEvent = AuthRebindEvent_1.default;
var CoreStitchServiceClientImpl_1 = __importDefault(require("./services/internal/CoreStitchServiceClientImpl"));
exports.CoreStitchServiceClientImpl = CoreStitchServiceClientImpl_1.default;
var RebindEvent_1 = require("./services/internal/RebindEvent");
exports.RebindEvent = RebindEvent_1.RebindEvent;
var StitchServiceRoutes_1 = __importDefault(require("./services/internal/StitchServiceRoutes"));
exports.StitchServiceRoutes = StitchServiceRoutes_1.default;
var StitchAppClientConfiguration_1 = require("./StitchAppClientConfiguration");
exports.StitchAppClientConfiguration = StitchAppClientConfiguration_1.StitchAppClientConfiguration;
var StitchAppClientInfo_1 = __importDefault(require("./StitchAppClientInfo"));
exports.StitchAppClientInfo = StitchAppClientInfo_1.default;
var StitchClientError_1 = __importDefault(require("./StitchClientError"));
exports.StitchClientError = StitchClientError_1.default;
var StitchClientErrorCode_1 = require("./StitchClientErrorCode");
exports.StitchClientErrorCode = StitchClientErrorCode_1.StitchClientErrorCode;
var StitchError_1 = __importDefault(require("./StitchError"));
exports.StitchError = StitchError_1.default;
var StitchRequestError_1 = __importDefault(require("./StitchRequestError"));
exports.StitchRequestError = StitchRequestError_1.default;
var StitchRequestErrorCode_1 = require("./StitchRequestErrorCode");
exports.StitchRequestErrorCode = StitchRequestErrorCode_1.StitchRequestErrorCode;
var StitchServiceError_1 = __importDefault(require("./StitchServiceError"));
exports.StitchServiceError = StitchServiceError_1.default;
var StitchServiceErrorCode_1 = require("./StitchServiceErrorCode");
exports.StitchServiceErrorCode = StitchServiceErrorCode_1.StitchServiceErrorCode;
var Stream_1 = __importDefault(require("./Stream"));
exports.Stream = Stream_1.default;

},{"./StitchAppClientConfiguration":41,"./StitchAppClientInfo":42,"./StitchClientError":44,"./StitchClientErrorCode":45,"./StitchError":46,"./StitchRequestError":47,"./StitchRequestErrorCode":48,"./StitchServiceError":49,"./StitchServiceErrorCode":50,"./Stream":51,"./auth/StitchUserIdentity":53,"./auth/UserType":54,"./auth/internal/AuthEvent":56,"./auth/internal/AuthInfo":57,"./auth/internal/CoreStitchAuth":58,"./auth/internal/CoreStitchUserImpl":59,"./auth/internal/DeviceFields":60,"./auth/internal/StitchUserProfileImpl":62,"./auth/internal/models/ApiStitchUserIdentity":65,"./auth/providers/anonymous/AnonymousAuthProvider":69,"./auth/providers/anonymous/AnonymousCredential":70,"./auth/providers/custom/CustomAuthProvider":71,"./auth/providers/custom/CustomCredential":72,"./auth/providers/facebook/FacebookAuthProvider":73,"./auth/providers/facebook/FacebookCredential":74,"./auth/providers/function/FunctionAuthProvider":75,"./auth/providers/function/FunctionCredential":76,"./auth/providers/google/GoogleAuthProvider":77,"./auth/providers/google/GoogleCredential":78,"./auth/providers/internal/StitchAuthResponseCredential":80,"./auth/providers/serverapikey/ServerApiKeyAuthProvider":81,"./auth/providers/serverapikey/ServerApiKeyCredential":82,"./auth/providers/userapikey/CoreUserApiKeyAuthProviderClient":83,"./auth/providers/userapikey/UserApiKeyAuthProvider":84,"./auth/providers/userapikey/UserApiKeyCredential":85,"./auth/providers/userapikey/models/UserApiKey":86,"./auth/providers/userpass/CoreUserPasswordAuthProviderClient":87,"./auth/providers/userpass/UserPasswordAuthProvider":88,"./auth/providers/userpass/UserPasswordCredential":89,"./internal/CoreStitchAppClient":91,"./internal/common/Assertions":92,"./internal/common/Base64":93,"./internal/common/StitchErrorUtils":94,"./internal/common/Storage":95,"./internal/net/BaseEventStream":97,"./internal/net/BasicRequest":99,"./internal/net/ContentTypes":100,"./internal/net/Event":101,"./internal/net/Headers":102,"./internal/net/Method":103,"./internal/net/Response":104,"./internal/net/StitchAppAuthRoutes":105,"./internal/net/StitchAppRequestClient":106,"./internal/net/StitchAppRoutes":107,"./internal/net/StitchAuthRequest":109,"./internal/net/StitchEvent":111,"./internal/net/StitchRequestClient":113,"./services/internal/AuthRebindEvent":115,"./services/internal/CoreStitchServiceClientImpl":116,"./services/internal/RebindEvent":117,"./services/internal/StitchServiceRoutes":118,"bson":119}],91:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CoreStitchServiceClientImpl_1 = __importDefault(require("../services/internal/CoreStitchServiceClientImpl"));
var CoreStitchAppClient = (function () {
    function CoreStitchAppClient(authRequestClient, routes) {
        this.functionService =
            new CoreStitchServiceClientImpl_1.default(authRequestClient, routes.serviceRoutes);
    }
    CoreStitchAppClient.prototype.callFunction = function (name, args, decoder) {
        return this.functionService.callFunction(name, args, decoder);
    };
    return CoreStitchAppClient;
}());
exports.default = CoreStitchAppClient;

},{"../services/internal/CoreStitchServiceClientImpl":116}],92:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Assertions = (function () {
    function Assertions() {
    }
    Assertions.keyPresent = function (key, object) {
        if (object[key] === undefined) {
            throw new Error("expected " + key + " to be present");
        }
    };
    return Assertions;
}());
exports.default = Assertions;

},{}],93:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var base64_js_1 = require("base64-js");
function base64Decode(str) {
    var unevenBytes = str.length % 4;
    var strToDecode;
    if (unevenBytes != 0) {
        var paddingNeeded = 4 - unevenBytes;
        strToDecode = str + "=".repeat(paddingNeeded);
    }
    else {
        strToDecode = str;
    }
    var bytes = base64_js_1.toByteArray(strToDecode);
    return utf8Slice(bytes, 0, bytes.length);
}
exports.base64Decode = base64Decode;
function base64Encode(str) {
    var result;
    if ("undefined" === typeof Uint8Array) {
        result = utf8ToBytes(str);
    }
    result = new Uint8Array(utf8ToBytes(str));
    return base64_js_1.fromByteArray(result);
}
exports.base64Encode = base64Encode;
function utf8ToBytes(string) {
    var units = Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];
    var i = 0;
    for (; i < length; i++) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 0xd7ff && codePoint < 0xe000) {
            if (leadSurrogate) {
                if (codePoint < 0xdc00) {
                    if ((units -= 3) > -1) {
                        bytes.push(0xef, 0xbf, 0xbd);
                    }
                    leadSurrogate = codePoint;
                    continue;
                }
                else {
                    codePoint =
                        ((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00) | 0x10000;
                    leadSurrogate = null;
                }
            }
            else {
                if (codePoint > 0xdbff) {
                    if ((units -= 3) > -1) {
                        bytes.push(0xef, 0xbf, 0xbd);
                    }
                    continue;
                }
                else if (i + 1 === length) {
                    if ((units -= 3) > -1) {
                        bytes.push(0xef, 0xbf, 0xbd);
                    }
                    continue;
                }
                else {
                    leadSurrogate = codePoint;
                    continue;
                }
            }
        }
        else if (leadSurrogate) {
            if ((units -= 3) > -1) {
                bytes.push(0xef, 0xbf, 0xbd);
            }
            leadSurrogate = null;
        }
        if (codePoint < 0x80) {
            if ((units -= 1) < 0) {
                break;
            }
            bytes.push(codePoint);
        }
        else if (codePoint < 0x800) {
            if ((units -= 2) < 0) {
                break;
            }
            bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80);
        }
        else if (codePoint < 0x10000) {
            if ((units -= 3) < 0) {
                break;
            }
            bytes.push((codePoint >> 0xc) | 0xe0, ((codePoint >> 0x6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
        }
        else if (codePoint < 0x200000) {
            if ((units -= 4) < 0) {
                break;
            }
            bytes.push((codePoint >> 0x12) | 0xf0, ((codePoint >> 0xc) & 0x3f) | 0x80, ((codePoint >> 0x6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
        }
        else {
            throw new Error("Invalid code point");
        }
    }
    return bytes;
}
function utf8Slice(buf, start, end) {
    var res = "";
    var tmp = "";
    end = Math.min(buf.length, end || Infinity);
    start = start || 0;
    for (var i = start; i < end; i++) {
        if (buf[i] <= 0x7f) {
            res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i]);
            tmp = "";
        }
        else {
            tmp += "%" + buf[i].toString(16);
        }
    }
    return res + decodeUtf8Char(tmp);
}
exports.utf8Slice = utf8Slice;
function decodeUtf8Char(str) {
    try {
        return decodeURIComponent(str);
    }
    catch (err) {
        return String.fromCharCode(0xfffd);
    }
}

},{"base64-js":2}],94:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchError_1 = __importDefault(require("../../StitchError"));
var StitchRequestError_1 = __importDefault(require("../../StitchRequestError"));
var StitchRequestErrorCode_1 = require("../../StitchRequestErrorCode");
var StitchServiceError_1 = __importDefault(require("../../StitchServiceError"));
var StitchServiceErrorCode_1 = require("../../StitchServiceErrorCode");
var ContentTypes_1 = __importDefault(require("../net/ContentTypes"));
var Headers_1 = __importDefault(require("../net/Headers"));
var Fields;
(function (Fields) {
    Fields["ERROR"] = "error";
    Fields["ERROR_CODE"] = "error_code";
})(Fields || (Fields = {}));
function wrapDecodingError(err) {
    if (err instanceof StitchError_1.default) {
        return err;
    }
    return new StitchRequestError_1.default(err, StitchRequestErrorCode_1.StitchRequestErrorCode.DECODING_ERROR);
}
exports.wrapDecodingError = wrapDecodingError;
function handleRequestError(response) {
    if (response.body === undefined) {
        throw new StitchServiceError_1.default("received unexpected status code " + response.statusCode, StitchServiceErrorCode_1.StitchServiceErrorCode.Unknown);
    }
    var body;
    try {
        body = response.body;
    }
    catch (e) {
        throw new StitchServiceError_1.default("received unexpected status code " + response.statusCode, StitchServiceErrorCode_1.StitchServiceErrorCode.Unknown);
    }
    var errorMsg = handleRichError(response, body);
    throw new StitchServiceError_1.default(errorMsg, StitchServiceErrorCode_1.StitchServiceErrorCode.Unknown);
}
exports.handleRequestError = handleRequestError;
function handleRichError(response, body) {
    if (response.headers[Headers_1.default.CONTENT_TYPE] === undefined ||
        (response.headers[Headers_1.default.CONTENT_TYPE] !== undefined &&
            response.headers[Headers_1.default.CONTENT_TYPE] !== ContentTypes_1.default.APPLICATION_JSON)) {
        return body;
    }
    var bsonObj = JSON.parse(body);
    if (!(bsonObj instanceof Object)) {
        return body;
    }
    var doc = bsonObj;
    if (doc[Fields.ERROR] === undefined) {
        return body;
    }
    var errorMsg = doc[Fields.ERROR];
    if (doc[Fields.ERROR_CODE] === undefined) {
        return errorMsg;
    }
    var errorCode = doc[Fields.ERROR_CODE];
    throw new StitchServiceError_1.default(errorMsg, StitchServiceErrorCode_1.stitchServiceErrorCodeFromApi(errorCode));
}

},{"../../StitchError":46,"../../StitchRequestError":47,"../../StitchRequestErrorCode":48,"../../StitchServiceError":49,"../../StitchServiceErrorCode":50,"../net/ContentTypes":100,"../net/Headers":102}],95:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MemoryStorage = (function () {
    function MemoryStorage(suiteName) {
        this.suiteName = suiteName;
        this.storage = {};
    }
    MemoryStorage.prototype.get = function (key) {
        return this.storage[this.suiteName + "." + key];
    };
    MemoryStorage.prototype.set = function (key, value) {
        this.storage[this.suiteName + "." + key] = value;
    };
    MemoryStorage.prototype.remove = function (key) {
        delete this.storage[this.suiteName + "." + key];
    };
    return MemoryStorage;
}());
exports.MemoryStorage = MemoryStorage;

},{}],96:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Fields;
(function (Fields) {
    Fields["DEPLOYMENT_MODEL"] = "deployment_model";
    Fields["LOCATION"] = "location";
    Fields["HOSTNAME"] = "hostname";
})(Fields || (Fields = {}));
var ApiAppMetadata = (function () {
    function ApiAppMetadata(deploymentModel, location, hostname) {
        this.deploymentModel = deploymentModel;
        this.location = location;
        this.hostname = hostname;
    }
    ApiAppMetadata.fromJSON = function (json) {
        return new ApiAppMetadata(json[Fields.DEPLOYMENT_MODEL], json[Fields.LOCATION], json[Fields.HOSTNAME]);
    };
    ApiAppMetadata.prototype.toJSON = function () {
        var _a;
        return _a = {},
            _a[Fields.DEPLOYMENT_MODEL] = this.deploymentModel,
            _a[Fields.LOCATION] = this.location,
            _a[Fields.HOSTNAME] = this.hostname,
            _a;
    };
    return ApiAppMetadata;
}());
exports.default = ApiAppMetadata;

},{}],97:[function(require,module,exports){
"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchError_1 = __importDefault(require("../../StitchError"));
var StitchRequestError_1 = __importDefault(require("../../StitchRequestError"));
var Event_1 = __importDefault(require("./Event"));
var StitchEvent_1 = __importDefault(require("./StitchEvent"));
var BaseEventStream = (function () {
    function BaseEventStream(reconnecter) {
        this.reconnecter = reconnecter;
        this.closed = false;
        this.events = [];
        this.listeners = [];
        this.lastErr = undefined;
    }
    BaseEventStream.prototype.isOpen = function () {
        return !this.closed;
    };
    BaseEventStream.prototype.addListener = function (listener) {
        var _this = this;
        if (this.closed) {
            setTimeout(function () { return listener.onEvent(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, "stream closed")); }, 0);
            return;
        }
        if (this.lastErr !== undefined) {
            setTimeout(function () { return listener.onEvent(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, _this.lastErr)); }, 0);
            return;
        }
        this.listeners.push(listener);
        this.poll();
    };
    BaseEventStream.prototype.removeListener = function (listener) {
        var index = this.listeners.indexOf(listener);
        if (index === -1) {
            return;
        }
        this.listeners.splice(index, 1);
    };
    BaseEventStream.prototype.nextEvent = function () {
        var _this = this;
        if (this.closed) {
            return Promise.reject(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, "stream closed"));
        }
        if (this.lastErr !== undefined) {
            return Promise.reject(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, this.lastErr));
        }
        return new Promise(function (resolve, reject) {
            _this.listenOnce({
                onEvent: function (e) {
                    resolve(e);
                }
            });
        });
    };
    BaseEventStream.prototype.close = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.afterClose();
    };
    BaseEventStream.prototype.reconnect = function (error) {
        var _this = this;
        if (!this.reconnecter) {
            if (!this.closed) {
                this.closed = true;
                this.events.push(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, "stream closed: " + error));
                this.poll();
            }
            return;
        }
        this.reconnecter()
            .then(function (next) {
            _this.onReconnect(next);
        })
            .catch(function (e) {
            if (!(e instanceof StitchError_1.default) || !(e instanceof StitchRequestError_1.default)) {
                _this.closed = true;
                _this.events.push(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, "stream closed: " + error));
                _this.poll();
                return;
            }
            setTimeout(function () { return _this.reconnect(e); }, BaseEventStream.RETRY_TIMEOUT_MILLIS);
        });
    };
    BaseEventStream.prototype.poll = function () {
        var e_1, _a;
        while (this.events.length !== 0) {
            var event_1 = this.events.pop();
            try {
                for (var _b = __values(this.listeners), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var listener = _c.value;
                    if (listener.onEvent) {
                        listener.onEvent(event_1);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    BaseEventStream.prototype.listenOnce = function (listener) {
        var _this = this;
        if (this.closed) {
            setTimeout(function () { return listener.onEvent(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, "stream closed")); }, 0);
            return;
        }
        if (this.lastErr !== undefined) {
            setTimeout(function () { return listener.onEvent(new Event_1.default(StitchEvent_1.default.ERROR_EVENT_NAME, _this.lastErr)); }, 0);
            return;
        }
        var wrapper = {
            onEvent: function (e) {
                _this.removeListener(wrapper);
                listener.onEvent(e);
            }
        };
        this.addListener(wrapper);
    };
    BaseEventStream.RETRY_TIMEOUT_MILLIS = 5000;
    return BaseEventStream;
}());
exports.default = BaseEventStream;

},{"../../StitchError":46,"../../StitchRequestError":47,"./Event":101,"./StitchEvent":111}],98:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchErrorUtils_1 = require("../../internal/common/StitchErrorUtils");
var StitchError_1 = __importDefault(require("../../StitchError"));
var StitchRequestError_1 = __importDefault(require("../../StitchRequestError"));
var StitchRequestErrorCode_1 = require("../../StitchRequestErrorCode");
var BasicRequest_1 = require("./BasicRequest");
function inspectResponse(request, url, response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
    }
    return StitchErrorUtils_1.handleRequestError(response);
}
var BaseStitchRequestClient = (function () {
    function BaseStitchRequestClient(baseUrl, transport) {
        this.baseUrl = baseUrl;
        this.transport = transport;
    }
    BaseStitchRequestClient.prototype.doRequestToURL = function (stitchReq, url) {
        return this.transport
            .roundTrip(this.buildRequest(stitchReq, url))
            .catch(function (error) {
            throw new StitchRequestError_1.default(error, StitchRequestErrorCode_1.StitchRequestErrorCode.TRANSPORT_ERROR);
        })
            .then(function (resp) { return inspectResponse(stitchReq, url, resp); });
    };
    BaseStitchRequestClient.prototype.doStreamRequestToURL = function (stitchReq, url, open, retryRequest) {
        if (open === void 0) { open = true; }
        return this.transport
            .stream(this.buildRequest(stitchReq, url), open, retryRequest)
            .catch(function (error) {
            if (error instanceof StitchError_1.default) {
                throw error;
            }
            throw new StitchRequestError_1.default(error, StitchRequestErrorCode_1.StitchRequestErrorCode.TRANSPORT_ERROR);
        });
    };
    BaseStitchRequestClient.prototype.buildRequest = function (stitchReq, url) {
        return new BasicRequest_1.BasicRequest.Builder()
            .withMethod(stitchReq.method)
            .withUrl("" + url + stitchReq.path)
            .withHeaders(stitchReq.headers)
            .withBody(stitchReq.body)
            .build();
    };
    return BaseStitchRequestClient;
}());
exports.default = BaseStitchRequestClient;

},{"../../StitchError":46,"../../StitchRequestError":47,"../../StitchRequestErrorCode":48,"../../internal/common/StitchErrorUtils":94,"./BasicRequest":99}],99:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BasicRequest = (function () {
    function BasicRequest(method, url, headers, body) {
        this.method = method;
        this.url = url;
        this.headers = headers;
        this.body = body;
    }
    return BasicRequest;
}());
exports.BasicRequest = BasicRequest;
(function (BasicRequest) {
    var Builder = (function () {
        function Builder(request) {
            if (!request) {
                return;
            }
            this.method = request.method;
            this.url = request.url;
            this.headers = request.headers;
            this.body = request.body;
        }
        Builder.prototype.withMethod = function (method) {
            this.method = method;
            return this;
        };
        Builder.prototype.withUrl = function (url) {
            this.url = url;
            return this;
        };
        Builder.prototype.withHeaders = function (headers) {
            this.headers = headers;
            return this;
        };
        Builder.prototype.withBody = function (body) {
            this.body = body;
            return this;
        };
        Builder.prototype.build = function () {
            if (this.method === undefined) {
                throw new Error("must set method");
            }
            if (this.url === undefined) {
                throw new Error("must set non-empty url");
            }
            return new BasicRequest(this.method, this.url, this.headers === undefined ? {} : this.headers, this.body);
        };
        return Builder;
    }());
    BasicRequest.Builder = Builder;
})(BasicRequest = exports.BasicRequest || (exports.BasicRequest = {}));
exports.BasicRequest = BasicRequest;

},{}],100:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ContentTypes = (function () {
    function ContentTypes() {
    }
    ContentTypes.APPLICATION_JSON = "application/json";
    ContentTypes.TEXT_EVENT_STREAM = "text/event-stream";
    return ContentTypes;
}());
exports.default = ContentTypes;

},{}],101:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Event = (function () {
    function Event(eventName, data) {
        this.eventName = eventName;
        this.data = data;
    }
    Event.MESSAGE_EVENT = "message";
    return Event;
}());
exports.default = Event;

},{}],102:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Headers = (function () {
    function Headers() {
    }
    Headers.getAuthorizationBearer = function (value) {
        return Headers.AUTHORIZATION_BEARER + " " + value;
    };
    Headers.CONTENT_TYPE_CANON = "Content-Type";
    Headers.CONTENT_TYPE = Headers.CONTENT_TYPE_CANON.toLocaleLowerCase();
    Headers.AUTHORIZATION_CANON = "Authorization";
    Headers.AUTHORIZATION = Headers.AUTHORIZATION_CANON.toLocaleLowerCase();
    Headers.ACCEPT_CANON = "Accept";
    Headers.ACCEPT = Headers.ACCEPT_CANON.toLocaleLowerCase();
    Headers.AUTHORIZATION_BEARER = "Bearer";
    return Headers;
}());
exports.default = Headers;

},{}],103:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PUT"] = "PUT";
    Method["DELETE"] = "DELETE";
    Method["HEAD"] = "HEAD";
    Method["OPTIONS"] = "OPTIONS";
    Method["TRACE"] = "TRACE";
    Method["PATCH"] = "PATCH";
})(Method || (Method = {}));
exports.default = Method;

},{}],104:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Response = (function () {
    function Response(headers, statusCode, body) {
        var _this = this;
        this.statusCode = statusCode;
        this.body = body;
        this.headers = {};
        Object.keys(headers).map(function (key, index) {
            _this.headers[key.toLocaleLowerCase()] = headers[key];
        });
    }
    return Response;
}());
exports.default = Response;

},{}],105:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchRoutes_1 = require("./StitchRoutes");
function getAuthProviderRoute(clientAppId, providerName) {
    return StitchRoutes_1.getAppRoute(clientAppId) + ("/auth/providers/" + providerName);
}
function getAuthProviderLoginRoute(clientAppId, providerName) {
    return getAuthProviderRoute(clientAppId, providerName) + "/login";
}
function getAuthProviderLinkRoute(clientAppId, providerName) {
    return getAuthProviderLoginRoute(clientAppId, providerName) + "?link=true";
}
var StitchAppAuthRoutes = (function () {
    function StitchAppAuthRoutes(clientAppId) {
        var _this = this;
        this.baseAuthRoute = StitchRoutes_1.BASE_ROUTE + "/auth";
        this.sessionRoute = (function () {
            return _this.baseAuthRoute + "/session";
        })();
        this.profileRoute = (function () {
            return _this.baseAuthRoute + "/profile";
        })();
        this.clientAppId = clientAppId;
    }
    StitchAppAuthRoutes.prototype.getAuthProviderRoute = function (providerName) {
        return getAuthProviderRoute(this.clientAppId, providerName);
    };
    StitchAppAuthRoutes.prototype.getAuthProviderLoginRoute = function (providerName) {
        return getAuthProviderLoginRoute(this.clientAppId, providerName);
    };
    StitchAppAuthRoutes.prototype.getAuthProviderLinkRoute = function (providerName) {
        return getAuthProviderLinkRoute(this.clientAppId, providerName);
    };
    StitchAppAuthRoutes.prototype.getAuthProviderExtensionRoute = function (providerName, path) {
        return this.getAuthProviderRoute(providerName) + "/" + path;
    };
    return StitchAppAuthRoutes;
}());
exports.default = StitchAppAuthRoutes;

},{"./StitchRoutes":114}],106:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var ApiAppMetadata_1 = __importDefault(require("./ApiAppMetadata"));
var BaseStitchRequestClient_1 = __importDefault(require("./BaseStitchRequestClient"));
var Method_1 = __importDefault(require("./Method"));
var StitchAppRoutes_1 = __importDefault(require("./StitchAppRoutes"));
var StitchRequest_1 = require("./StitchRequest");
var StitchAppRequestClient = (function (_super) {
    __extends(StitchAppRequestClient, _super);
    function StitchAppRequestClient(clientAppId, baseUrl, transport) {
        var _this = _super.call(this, baseUrl, transport) || this;
        _this.clientAppId = clientAppId;
        _this.routes = new StitchAppRoutes_1.default(clientAppId);
        return _this;
    }
    StitchAppRequestClient.prototype.doRequest = function (stitchReq) {
        var _this = this;
        return this.initAppMetadata()
            .then(function (metadata) { return _super.prototype.doRequestToURL.call(_this, stitchReq, metadata.hostname); });
    };
    StitchAppRequestClient.prototype.doStreamRequest = function (stitchReq, open, retryRequest) {
        var _this = this;
        if (open === void 0) { open = true; }
        return this.initAppMetadata()
            .then(function (metadata) { return _super.prototype.doStreamRequestToURL.call(_this, stitchReq, metadata.hostname, open, retryRequest); });
    };
    StitchAppRequestClient.prototype.getBaseURL = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.initAppMetadata().then(function (metadata) { return metadata.hostname; })];
            });
        });
    };
    StitchAppRequestClient.prototype.initAppMetadata = function () {
        var _this = this;
        if (this.appMetadata) {
            return Promise.resolve(this.appMetadata);
        }
        var request = new StitchRequest_1.StitchRequest.Builder()
            .withMethod(Method_1.default.GET)
            .withPath(this.routes.appMetadataRoute)
            .build();
        return _super.prototype.doRequestToURL.call(this, request, this.baseUrl)
            .then(function (resp) {
            _this.appMetadata = ApiAppMetadata_1.default.fromJSON(bson_1.EJSON.parse(resp.body));
            return _this.appMetadata;
        });
    };
    return StitchAppRequestClient;
}(BaseStitchRequestClient_1.default));
exports.default = StitchAppRequestClient;

},{"./ApiAppMetadata":96,"./BaseStitchRequestClient":98,"./Method":103,"./StitchAppRoutes":107,"./StitchRequest":112,"bson":119}],107:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var StitchServiceRoutes_1 = __importDefault(require("../../services/internal/StitchServiceRoutes"));
var StitchAppAuthRoutes_1 = __importDefault(require("./StitchAppAuthRoutes"));
var StitchRoutes_1 = require("./StitchRoutes");
var StitchAppRoutes = (function () {
    function StitchAppRoutes(clientAppId) {
        this.clientAppId = clientAppId;
        this.authRoutes = new StitchAppAuthRoutes_1.default(clientAppId);
        this.serviceRoutes = new StitchServiceRoutes_1.default(clientAppId);
        this.appMetadataRoute = StitchRoutes_1.getAppMetadataRoute(clientAppId);
        this.functionCallRoute = StitchRoutes_1.getFunctionCallRoute(clientAppId);
    }
    return StitchAppRoutes;
}());
exports.default = StitchAppRoutes;

},{"../../services/internal/StitchServiceRoutes":118,"./StitchAppAuthRoutes":105,"./StitchRoutes":114}],108:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var ContentTypes_1 = __importDefault(require("./ContentTypes"));
var Headers_1 = __importDefault(require("./Headers"));
var StitchAuthRequest_1 = require("./StitchAuthRequest");
var StitchAuthDocRequest = (function (_super) {
    __extends(StitchAuthDocRequest, _super);
    function StitchAuthDocRequest(request, document) {
        var _this = this;
        request instanceof StitchAuthRequest_1.StitchAuthRequest
            ? _this = _super.call(this, request, request.useRefreshToken, request.shouldRefreshOnFailure) || this : _this = _super.call(this, request) || this;
        _this.document = document;
        return _this;
    }
    Object.defineProperty(StitchAuthDocRequest.prototype, "builder", {
        get: function () {
            return new StitchAuthDocRequest.Builder(this);
        },
        enumerable: true,
        configurable: true
    });
    return StitchAuthDocRequest;
}(StitchAuthRequest_1.StitchAuthRequest));
exports.StitchAuthDocRequest = StitchAuthDocRequest;
(function (StitchAuthDocRequest) {
    var Builder = (function (_super) {
        __extends(Builder, _super);
        function Builder(request) {
            var _this = _super.call(this, request) || this;
            if (request !== undefined) {
                _this.document = request.document;
                _this.useRefreshToken = request.useRefreshToken;
            }
            return _this;
        }
        Builder.prototype.withDocument = function (document) {
            this.document = document;
            return this;
        };
        Builder.prototype.withAccessToken = function () {
            this.useRefreshToken = false;
            return this;
        };
        Builder.prototype.build = function () {
            if (this.document === undefined || !(this.document instanceof Object)) {
                throw new Error("document must be set: " + this.document);
            }
            if (this.headers === undefined) {
                this.withHeaders({});
            }
            this.headers[Headers_1.default.CONTENT_TYPE] = ContentTypes_1.default.APPLICATION_JSON;
            this.withBody(bson_1.EJSON.stringify(this.document, { relaxed: false }));
            return new StitchAuthDocRequest(_super.prototype.build.call(this), this.document);
        };
        return Builder;
    }(StitchAuthRequest_1.StitchAuthRequest.Builder));
    StitchAuthDocRequest.Builder = Builder;
})(StitchAuthDocRequest = exports.StitchAuthDocRequest || (exports.StitchAuthDocRequest = {}));
exports.StitchAuthDocRequest = StitchAuthDocRequest;

},{"./ContentTypes":100,"./Headers":102,"./StitchAuthRequest":109,"bson":119}],109:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var StitchRequest_1 = require("./StitchRequest");
var StitchAuthRequest = (function (_super) {
    __extends(StitchAuthRequest, _super);
    function StitchAuthRequest(request, useRefreshToken, shouldRefreshOnFailure) {
        if (useRefreshToken === void 0) { useRefreshToken = false; }
        if (shouldRefreshOnFailure === void 0) { shouldRefreshOnFailure = true; }
        var _this = _super.call(this, request.method, request.path, request.headers, request.startedAt, request.body) || this;
        _this.useRefreshToken = useRefreshToken;
        _this.shouldRefreshOnFailure = shouldRefreshOnFailure;
        return _this;
    }
    Object.defineProperty(StitchAuthRequest.prototype, "builder", {
        get: function () {
            return new StitchAuthRequest.Builder(this);
        },
        enumerable: true,
        configurable: true
    });
    return StitchAuthRequest;
}(StitchRequest_1.StitchRequest));
exports.StitchAuthRequest = StitchAuthRequest;
(function (StitchAuthRequest) {
    var Builder = (function (_super) {
        __extends(Builder, _super);
        function Builder(request) {
            return _super.call(this, request) || this;
        }
        Builder.prototype.withAccessToken = function () {
            this.useRefreshToken = false;
            return this;
        };
        Builder.prototype.withRefreshToken = function () {
            this.useRefreshToken = true;
            return this;
        };
        Builder.prototype.withShouldRefreshOnFailure = function (shouldRefreshOnFailure) {
            this.shouldRefreshOnFailure = shouldRefreshOnFailure;
            return this;
        };
        Builder.prototype.build = function () {
            if (this.useRefreshToken) {
                this.shouldRefreshOnFailure = false;
            }
            return new StitchAuthRequest(_super.prototype.build.call(this), this.useRefreshToken, this.shouldRefreshOnFailure);
        };
        return Builder;
    }(StitchRequest_1.StitchRequest.Builder));
    StitchAuthRequest.Builder = Builder;
})(StitchAuthRequest = exports.StitchAuthRequest || (exports.StitchAuthRequest = {}));
exports.StitchAuthRequest = StitchAuthRequest;

},{"./StitchRequest":112}],110:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var ContentTypes_1 = __importDefault(require("./ContentTypes"));
var Headers_1 = __importDefault(require("./Headers"));
var StitchRequest_1 = require("./StitchRequest");
var StitchDocRequest = (function (_super) {
    __extends(StitchDocRequest, _super);
    function StitchDocRequest(request, document) {
        var _this = _super.call(this, request.method, request.path, request.headers, request.startedAt, request.body) || this;
        _this.document = document;
        return _this;
    }
    Object.defineProperty(StitchDocRequest.prototype, "builder", {
        get: function () {
            return new StitchDocRequest.Builder(this);
        },
        enumerable: true,
        configurable: true
    });
    return StitchDocRequest;
}(StitchRequest_1.StitchRequest));
exports.StitchDocRequest = StitchDocRequest;
(function (StitchDocRequest) {
    var Builder = (function (_super) {
        __extends(Builder, _super);
        function Builder(request) {
            var _this = _super.call(this, request) || this;
            if (request !== undefined) {
                _this.document = request.document;
            }
            return _this;
        }
        Builder.prototype.withDocument = function (document) {
            this.document = document;
            return this;
        };
        Builder.prototype.build = function () {
            if (this.document === undefined || !(this.document instanceof Object)) {
                throw new Error("document must be set");
            }
            if (this.headers === undefined) {
                this.withHeaders({});
            }
            this.headers[Headers_1.default.CONTENT_TYPE] = ContentTypes_1.default.APPLICATION_JSON;
            this.withBody(bson_1.EJSON.stringify(this.document, { relaxed: false }));
            return new StitchDocRequest(_super.prototype.build.call(this), this.document);
        };
        return Builder;
    }(StitchRequest_1.StitchRequest.Builder));
    StitchDocRequest.Builder = Builder;
})(StitchDocRequest = exports.StitchDocRequest || (exports.StitchDocRequest = {}));
exports.StitchDocRequest = StitchDocRequest;

},{"./ContentTypes":100,"./Headers":102,"./StitchRequest":112,"bson":119}],111:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var StitchServiceError_1 = __importDefault(require("../../StitchServiceError"));
var StitchServiceErrorCode_1 = require("../../StitchServiceErrorCode");
var Event_1 = __importDefault(require("./Event"));
var StitchEvent = (function () {
    function StitchEvent(eventName, data, decoder) {
        this.eventName = eventName;
        data = data ? data : "";
        var decodedStringBuffer = [];
        for (var chIdx = 0; chIdx < data.length; chIdx++) {
            var c = data[chIdx];
            switch (c) {
                case '%':
                    if (chIdx + 2 >= data.length) {
                        break;
                    }
                    var code = data.substring(chIdx + 1, chIdx + 3);
                    var found = void 0;
                    switch (code) {
                        case "25":
                            found = true;
                            decodedStringBuffer.push("%");
                            break;
                        case "0A":
                            found = true;
                            decodedStringBuffer.push("\n");
                            break;
                        case "0D":
                            found = true;
                            decodedStringBuffer.push("\r");
                            break;
                        default:
                            found = false;
                    }
                    if (found) {
                        chIdx += 2;
                        continue;
                    }
                    break;
                default:
                    break;
            }
            decodedStringBuffer.push(c);
        }
        var decodedData = decodedStringBuffer.join('');
        switch (this.eventName) {
            case StitchEvent.ERROR_EVENT_NAME:
                var errorMsg = void 0;
                var errorCode = void 0;
                try {
                    var errorDoc = bson_1.EJSON.parse(decodedData, { strict: false });
                    errorMsg = errorDoc[ErrorFields.Error];
                    errorCode = StitchServiceErrorCode_1.stitchServiceErrorCodeFromApi(errorDoc[ErrorFields.ErrorCode]);
                }
                catch (error) {
                    errorMsg = decodedData;
                    errorCode = StitchServiceErrorCode_1.StitchServiceErrorCode.Unknown;
                }
                this.error = new StitchServiceError_1.default(errorMsg, errorCode);
                break;
            case Event_1.default.MESSAGE_EVENT:
                this.data = bson_1.EJSON.parse(decodedData, { strict: false });
                if (decoder) {
                    this.data = decoder.decode(this.data);
                }
                break;
        }
    }
    StitchEvent.fromEvent = function (event, decoder) {
        return new StitchEvent(event.eventName, event.data, decoder);
    };
    StitchEvent.ERROR_EVENT_NAME = "error";
    return StitchEvent;
}());
exports.default = StitchEvent;
var ErrorFields;
(function (ErrorFields) {
    ErrorFields["Error"] = "error";
    ErrorFields["ErrorCode"] = "error_code";
})(ErrorFields || (ErrorFields = {}));

},{"../../StitchServiceError":49,"../../StitchServiceErrorCode":50,"./Event":101,"bson":119}],112:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchRequest = (function () {
    function StitchRequest(method, path, headers, startedAt, body) {
        this.method = method;
        this.path = path;
        this.headers = headers;
        this.body = body;
        this.startedAt = startedAt;
    }
    Object.defineProperty(StitchRequest.prototype, "builder", {
        get: function () {
            return new StitchRequest.Builder(this);
        },
        enumerable: true,
        configurable: true
    });
    return StitchRequest;
}());
exports.StitchRequest = StitchRequest;
(function (StitchRequest) {
    var Builder = (function () {
        function Builder(request) {
            if (request !== undefined) {
                this.method = request.method;
                this.path = request.path;
                this.headers = request.headers;
                this.body = request.body;
                this.startedAt = request.startedAt;
            }
        }
        Builder.prototype.withMethod = function (method) {
            this.method = method;
            return this;
        };
        Builder.prototype.withPath = function (path) {
            this.path = path;
            return this;
        };
        Builder.prototype.withHeaders = function (headers) {
            this.headers = headers;
            return this;
        };
        Builder.prototype.withBody = function (body) {
            this.body = body;
            return this;
        };
        Builder.prototype.build = function () {
            if (this.method === undefined) {
                throw Error("must set method");
            }
            if (this.path === undefined) {
                throw Error("must set non-empty path");
            }
            if (this.startedAt === undefined) {
                this.startedAt = Date.now() / 1000;
            }
            return new StitchRequest(this.method, this.path, this.headers === undefined ? {} : this.headers, this.startedAt, this.body);
        };
        return Builder;
    }());
    StitchRequest.Builder = Builder;
})(StitchRequest = exports.StitchRequest || (exports.StitchRequest = {}));
exports.StitchRequest = StitchRequest;

},{}],113:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BaseStitchRequestClient_1 = __importDefault(require("./BaseStitchRequestClient"));
var StitchRequestClient = (function (_super) {
    __extends(StitchRequestClient, _super);
    function StitchRequestClient(baseUrl, transport) {
        return _super.call(this, baseUrl, transport) || this;
    }
    StitchRequestClient.prototype.doRequest = function (stitchReq) {
        return _super.prototype.doRequestToURL.call(this, stitchReq, this.baseUrl);
    };
    StitchRequestClient.prototype.doStreamRequest = function (stitchReq, open, retryRequest) {
        if (open === void 0) { open = true; }
        return _super.prototype.doStreamRequestToURL.call(this, stitchReq, this.baseUrl, open, retryRequest);
    };
    StitchRequestClient.prototype.getBaseURL = function () {
        return Promise.resolve(this.baseUrl);
    };
    return StitchRequestClient;
}(BaseStitchRequestClient_1.default));
exports.default = StitchRequestClient;

},{"./BaseStitchRequestClient":98}],114:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BASE_ROUTE = "/api/client/v2.0";
exports.BASE_ROUTE = BASE_ROUTE;
function getAppRoute(clientAppId) {
    return BASE_ROUTE + ("/app/" + clientAppId);
}
exports.getAppRoute = getAppRoute;
function getFunctionCallRoute(clientAppId) {
    return getAppRoute(clientAppId) + "/functions/call";
}
exports.getFunctionCallRoute = getFunctionCallRoute;
function getAppMetadataRoute(clientAppId) {
    return getAppRoute(clientAppId) + "/location";
}
exports.getAppMetadataRoute = getAppMetadataRoute;

},{}],115:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var RebindEvent_1 = require("./RebindEvent");
var AuthRebindEvent = (function (_super) {
    __extends(AuthRebindEvent, _super);
    function AuthRebindEvent(event) {
        var _this = _super.call(this) || this;
        _this.type = RebindEvent_1.RebindEventType.AUTH_EVENT;
        _this.event = event;
        return _this;
    }
    return AuthRebindEvent;
}(RebindEvent_1.RebindEvent));
exports.default = AuthRebindEvent;

},{"./RebindEvent":117}],116:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var AuthEvent_1 = require("../../auth/internal/AuthEvent");
var Base64_1 = require("../../internal/common/Base64");
var Method_1 = __importDefault(require("../../internal/net/Method"));
var StitchAuthDocRequest_1 = require("../../internal/net/StitchAuthDocRequest");
var StitchAuthRequest_1 = require("../../internal/net/StitchAuthRequest");
var RebindEvent_1 = require("./RebindEvent");
var CoreStitchServiceClientImpl = (function () {
    function CoreStitchServiceClientImpl(requestClient, routes, name) {
        this.serviceField = "service";
        this.argumentsField = "arguments";
        this.requestClient = requestClient;
        this.serviceRoutes = routes;
        this.serviceName = name;
        this.serviceBinders = [];
        this.allocatedStreams = [];
    }
    CoreStitchServiceClientImpl.prototype.callFunction = function (name, args, decoder) {
        return this.requestClient.doAuthenticatedRequestWithDecoder(this.getCallServiceFunctionRequest(name, args), decoder);
    };
    CoreStitchServiceClientImpl.prototype.streamFunction = function (name, args, decoder) {
        var _this = this;
        return this.requestClient.openAuthenticatedStreamWithDecoder(this.getStreamServiceFunctionRequest(name, args), decoder).then(function (newStream) {
            _this.allocatedStreams.push(newStream);
            return newStream;
        });
    };
    CoreStitchServiceClientImpl.prototype.bind = function (binder) {
        this.serviceBinders.push(binder);
    };
    CoreStitchServiceClientImpl.prototype.onRebindEvent = function (rebindEvent) {
        switch (rebindEvent.type) {
            case RebindEvent_1.RebindEventType.AUTH_EVENT:
                var authRebindEvent = rebindEvent;
                if (authRebindEvent.event.kind === AuthEvent_1.AuthEventKind.ActiveUserChanged) {
                    this.closeAllocatedStreams();
                }
                break;
            default:
                break;
        }
        this.serviceBinders.forEach(function (binder) {
            binder.onRebindEvent(rebindEvent);
        });
    };
    CoreStitchServiceClientImpl.prototype.getStreamServiceFunctionRequest = function (name, args) {
        var body = { name: name };
        if (this.serviceName !== undefined) {
            body[this.serviceField] = this.serviceName;
        }
        body[this.argumentsField] = args;
        var reqBuilder = new StitchAuthRequest_1.StitchAuthRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.GET)
            .withPath(this.serviceRoutes.functionCallRoute +
            ("?stitch_request=" + encodeURIComponent(Base64_1.base64Encode(bson_1.EJSON.stringify(body)))));
        return reqBuilder.build();
    };
    CoreStitchServiceClientImpl.prototype.getCallServiceFunctionRequest = function (name, args) {
        var body = { name: name };
        if (this.serviceName !== undefined) {
            body[this.serviceField] = this.serviceName;
        }
        body[this.argumentsField] = args;
        var reqBuilder = new StitchAuthDocRequest_1.StitchAuthDocRequest.Builder();
        reqBuilder
            .withMethod(Method_1.default.POST)
            .withPath(this.serviceRoutes.functionCallRoute);
        reqBuilder.withDocument(body);
        return reqBuilder.build();
    };
    CoreStitchServiceClientImpl.prototype.closeAllocatedStreams = function () {
        this.allocatedStreams.forEach(function (stream) {
            if (stream.isOpen()) {
                stream.close();
            }
        });
        this.allocatedStreams = [];
    };
    return CoreStitchServiceClientImpl;
}());
exports.default = CoreStitchServiceClientImpl;

},{"../../auth/internal/AuthEvent":56,"../../internal/common/Base64":93,"../../internal/net/Method":103,"../../internal/net/StitchAuthDocRequest":108,"../../internal/net/StitchAuthRequest":109,"./RebindEvent":117,"bson":119}],117:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RebindEvent = (function () {
    function RebindEvent() {
    }
    return RebindEvent;
}());
exports.RebindEvent = RebindEvent;
var RebindEventType;
(function (RebindEventType) {
    RebindEventType[RebindEventType["AUTH_EVENT"] = 0] = "AUTH_EVENT";
})(RebindEventType = exports.RebindEventType || (exports.RebindEventType = {}));

},{}],118:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StitchRoutes_1 = require("../../internal/net/StitchRoutes");
var StitchServiceRoutes = (function () {
    function StitchServiceRoutes(clientAppId) {
        this.clientAppId = clientAppId;
        this.functionCallRoute = StitchRoutes_1.getFunctionCallRoute(clientAppId);
    }
    return StitchServiceRoutes;
}());
exports.default = StitchServiceRoutes;

},{"../../internal/net/StitchRoutes":114}],119:[function(require,module,exports){
(function (Buffer,global){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('long'), require('buffer')) :
	typeof define === 'function' && define.amd ? define(['exports', 'long', 'buffer'], factory) :
	(factory((global.BSON = {}),global.long,global.Buffer));
}(this, (function (exports,long,buffer) { 'use strict';

	long = long && long.hasOwnProperty('default') ? long['default'] : long;
	buffer = buffer && buffer.hasOwnProperty('default') ? buffer['default'] : buffer;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	function getCjsExportFromNamespace (n) {
		return n && n.default || n;
	}

	var map = createCommonjsModule(function (module) {

	  if (typeof commonjsGlobal.Map !== 'undefined') {
	    module.exports = commonjsGlobal.Map;
	    module.exports.Map = commonjsGlobal.Map;
	  } else {
	    // We will return a polyfill
	    var Map = function Map(array) {
	      this._keys = [];
	      this._values = {};

	      for (var i = 0; i < array.length; i++) {
	        if (array[i] == null) continue; // skip null and undefined

	        var entry = array[i];
	        var key = entry[0];
	        var value = entry[1]; // Add the key to the list of keys in order

	        this._keys.push(key); // Add the key and value to the values dictionary with a point
	        // to the location in the ordered keys list


	        this._values[key] = {
	          v: value,
	          i: this._keys.length - 1
	        };
	      }
	    };

	    Map.prototype.clear = function () {
	      this._keys = [];
	      this._values = {};
	    };

	    Map.prototype.delete = function (key) {
	      var value = this._values[key];
	      if (value == null) return false; // Delete entry

	      delete this._values[key]; // Remove the key from the ordered keys list

	      this._keys.splice(value.i, 1);

	      return true;
	    };

	    Map.prototype.entries = function () {
	      var self = this;
	      var index = 0;
	      return {
	        next: function next() {
	          var key = self._keys[index++];
	          return {
	            value: key !== undefined ? [key, self._values[key].v] : undefined,
	            done: key !== undefined ? false : true
	          };
	        }
	      };
	    };

	    Map.prototype.forEach = function (callback, self) {
	      self = self || this;

	      for (var i = 0; i < this._keys.length; i++) {
	        var key = this._keys[i]; // Call the forEach callback

	        callback.call(self, this._values[key].v, key, self);
	      }
	    };

	    Map.prototype.get = function (key) {
	      return this._values[key] ? this._values[key].v : undefined;
	    };

	    Map.prototype.has = function (key) {
	      return this._values[key] != null;
	    };

	    Map.prototype.keys = function () {
	      var self = this;
	      var index = 0;
	      return {
	        next: function next() {
	          var key = self._keys[index++];
	          return {
	            value: key !== undefined ? key : undefined,
	            done: key !== undefined ? false : true
	          };
	        }
	      };
	    };

	    Map.prototype.set = function (key, value) {
	      if (this._values[key]) {
	        this._values[key].v = value;
	        return this;
	      } // Add the key to the list of keys in order


	      this._keys.push(key); // Add the key and value to the values dictionary with a point
	      // to the location in the ordered keys list


	      this._values[key] = {
	        v: value,
	        i: this._keys.length - 1
	      };
	      return this;
	    };

	    Map.prototype.values = function () {
	      var self = this;
	      var index = 0;
	      return {
	        next: function next() {
	          var key = self._keys[index++];
	          return {
	            value: key !== undefined ? self._values[key].v : undefined,
	            done: key !== undefined ? false : true
	          };
	        }
	      };
	    }; // Last ismaster


	    Object.defineProperty(Map.prototype, 'size', {
	      enumerable: true,
	      get: function get() {
	        return this._keys.length;
	      }
	    });
	    module.exports = Map;
	  }
	});
	var map_1 = map.Map;

	/**
	 * @ignore
	 */


	long.prototype.toExtendedJSON = function (options) {
	  if (options && options.relaxed) return this.toNumber();
	  return {
	    $numberLong: this.toString()
	  };
	};
	/**
	 * @ignore
	 */


	long.fromExtendedJSON = function (doc, options) {
	  var result = long.fromString(doc.$numberLong);
	  return options && options.relaxed ? result.toNumber() : result;
	};

	Object.defineProperty(long.prototype, '_bsontype', {
	  value: 'Long'
	});
	var long_1 = long;

	/**
	 * A class representation of the BSON Double type.
	 */

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

	var Double =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a Double type
	   *
	   * @param {number} value the number we want to represent as a double.
	   * @return {Double}
	   */
	  function Double(value) {
	    _classCallCheck(this, Double);

	    this.value = value;
	  }
	  /**
	   * Access the number value.
	   *
	   * @method
	   * @return {number} returns the wrapped double number.
	   */


	  _createClass(Double, [{
	    key: "valueOf",
	    value: function valueOf() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toJSON",
	    value: function toJSON() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON(options) {
	      if (options && options.relaxed && isFinite(this.value)) return this.value;
	      return {
	        $numberDouble: this.value.toString()
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc, options) {
	      return options && options.relaxed ? parseFloat(doc.$numberDouble) : new Double(parseFloat(doc.$numberDouble));
	    }
	  }]);

	  return Double;
	}();

	Object.defineProperty(Double.prototype, '_bsontype', {
	  value: 'Double'
	});
	var double_1 = Double;

	function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

	function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
	/**
	 * @class
	 * @param {number} low  the low (signed) 32 bits of the Timestamp.
	 * @param {number} high the high (signed) 32 bits of the Timestamp.
	 * @return {Timestamp}
	 */


	var Timestamp =
	/*#__PURE__*/
	function (_Long) {
	  _inherits(Timestamp, _Long);

	  function Timestamp(low, high) {
	    var _this;

	    _classCallCheck$1(this, Timestamp);

	    if (long_1.isLong(low)) {
	      _this = _possibleConstructorReturn(this, _getPrototypeOf(Timestamp).call(this, low.low, low.high));
	    } else {
	      _this = _possibleConstructorReturn(this, _getPrototypeOf(Timestamp).call(this, low, high));
	    }

	    return _possibleConstructorReturn(_this);
	  }
	  /**
	   * Return the JSON value.
	   *
	   * @method
	   * @return {String} the JSON representation.
	   */


	  _createClass$1(Timestamp, [{
	    key: "toJSON",
	    value: function toJSON() {
	      return {
	        $timestamp: this.toString()
	      };
	    }
	    /**
	     * Returns a Timestamp represented by the given (32-bit) integer value.
	     *
	     * @method
	     * @param {number} value the 32-bit integer in question.
	     * @return {Timestamp} the timestamp.
	     */

	  }, {
	    key: "toExtendedJSON",

	    /**
	     * @ignore
	     */
	    value: function toExtendedJSON() {
	      return {
	        $timestamp: {
	          t: this.high,
	          i: this.low
	        }
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromInt",
	    value: function fromInt(value) {
	      return new Timestamp(long_1.fromInt(value));
	    }
	    /**
	     * Returns a Timestamp representing the given number value, provided that it is a finite number. Otherwise, zero is returned.
	     *
	     * @method
	     * @param {number} value the number in question.
	     * @return {Timestamp} the timestamp.
	     */

	  }, {
	    key: "fromNumber",
	    value: function fromNumber(value) {
	      return new Timestamp(long_1.fromNumber(value));
	    }
	    /**
	     * Returns a Timestamp for the given high and low bits. Each is assumed to use 32 bits.
	     *
	     * @method
	     * @param {number} lowBits the low 32-bits.
	     * @param {number} highBits the high 32-bits.
	     * @return {Timestamp} the timestamp.
	     */

	  }, {
	    key: "fromBits",
	    value: function fromBits(lowBits, highBits) {
	      return new Timestamp(lowBits, highBits);
	    }
	    /**
	     * Returns a Timestamp from the given string, optionally using the given radix.
	     *
	     * @method
	     * @param {String} str the textual representation of the Timestamp.
	     * @param {number} [opt_radix] the radix in which the text is written.
	     * @return {Timestamp} the timestamp.
	     */

	  }, {
	    key: "fromString",
	    value: function fromString(str, opt_radix) {
	      return new Timestamp(long_1.fromString(str, opt_radix));
	    }
	  }, {
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      return new Timestamp(doc.$timestamp.i, doc.$timestamp.t);
	    }
	  }]);

	  return Timestamp;
	}(long_1);

	Object.defineProperty(Timestamp.prototype, '_bsontype', {
	  value: 'Timestamp'
	});
	var timestamp = Timestamp;

	var empty = {};

	var empty$1 = /*#__PURE__*/Object.freeze({
		default: empty
	});

	var require$$0 = getCjsExportFromNamespace(empty$1);

	/* global window */

	/**
	 * Normalizes our expected stringified form of a function across versions of node
	 * @param {Function} fn The function to stringify
	 */


	function normalizedFunctionString(fn) {
	  return fn.toString().replace('function(', 'function (');
	}

	function insecureRandomBytes(size) {
	  var result = new Uint8Array(size);

	  for (var i = 0; i < size; ++i) {
	    result[i] = Math.floor(Math.random() * 256);
	  }

	  return result;
	}

	var randomBytes = insecureRandomBytes;

	if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
	  randomBytes = function randomBytes(size) {
	    return window.crypto.getRandomValues(new Uint8Array(size));
	  };
	} else {
	  try {
	    randomBytes = require$$0.randomBytes;
	  } catch (e) {} // keep the fallback
	  // NOTE: in transpiled cases the above require might return null/undefined


	  if (randomBytes == null) {
	    randomBytes = insecureRandomBytes;
	  }
	}

	var utils = {
	  normalizedFunctionString: normalizedFunctionString,
	  randomBytes: randomBytes
	};

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js
	function defaultSetTimout() {
	  throw new Error('setTimeout has not been defined');
	}

	function defaultClearTimeout() {
	  throw new Error('clearTimeout has not been defined');
	}

	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;

	if (typeof global.setTimeout === 'function') {
	  cachedSetTimeout = setTimeout;
	}

	if (typeof global.clearTimeout === 'function') {
	  cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	  if (cachedSetTimeout === setTimeout) {
	    //normal enviroments in sane situations
	    return setTimeout(fun, 0);
	  } // if setTimeout wasn't available but was latter defined


	  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	    cachedSetTimeout = setTimeout;
	    return setTimeout(fun, 0);
	  }

	  try {
	    // when when somebody has screwed with setTimeout but no I.E. maddness
	    return cachedSetTimeout(fun, 0);
	  } catch (e) {
	    try {
	      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	      return cachedSetTimeout.call(null, fun, 0);
	    } catch (e) {
	      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	      return cachedSetTimeout.call(this, fun, 0);
	    }
	  }
	}

	function runClearTimeout(marker) {
	  if (cachedClearTimeout === clearTimeout) {
	    //normal enviroments in sane situations
	    return clearTimeout(marker);
	  } // if clearTimeout wasn't available but was latter defined


	  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	    cachedClearTimeout = clearTimeout;
	    return clearTimeout(marker);
	  }

	  try {
	    // when when somebody has screwed with setTimeout but no I.E. maddness
	    return cachedClearTimeout(marker);
	  } catch (e) {
	    try {
	      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	      return cachedClearTimeout.call(null, marker);
	    } catch (e) {
	      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	      return cachedClearTimeout.call(this, marker);
	    }
	  }
	}

	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	  if (!draining || !currentQueue) {
	    return;
	  }

	  draining = false;

	  if (currentQueue.length) {
	    queue = currentQueue.concat(queue);
	  } else {
	    queueIndex = -1;
	  }

	  if (queue.length) {
	    drainQueue();
	  }
	}

	function drainQueue() {
	  if (draining) {
	    return;
	  }

	  var timeout = runTimeout(cleanUpNextTick);
	  draining = true;
	  var len = queue.length;

	  while (len) {
	    currentQueue = queue;
	    queue = [];

	    while (++queueIndex < len) {
	      if (currentQueue) {
	        currentQueue[queueIndex].run();
	      }
	    }

	    queueIndex = -1;
	    len = queue.length;
	  }

	  currentQueue = null;
	  draining = false;
	  runClearTimeout(timeout);
	}

	function nextTick(fun) {
	  var args = new Array(arguments.length - 1);

	  if (arguments.length > 1) {
	    for (var i = 1; i < arguments.length; i++) {
	      args[i - 1] = arguments[i];
	    }
	  }

	  queue.push(new Item(fun, args));

	  if (queue.length === 1 && !draining) {
	    runTimeout(drainQueue);
	  }
	} // v8 likes predictible objects

	function Item(fun, array) {
	  this.fun = fun;
	  this.array = array;
	}

	Item.prototype.run = function () {
	  this.fun.apply(null, this.array);
	};

	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues

	var versions = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;
	function binding(name) {
	  throw new Error('process.binding is not supported');
	}
	function cwd() {
	  return '/';
	}
	function chdir(dir) {
	  throw new Error('process.chdir is not supported');
	}
	function umask() {
	  return 0;
	} // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js

	var performance = global.performance || {};

	var performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function () {
	  return new Date().getTime();
	}; // generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime


	function hrtime(previousTimestamp) {
	  var clocktime = performanceNow.call(performance) * 1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor(clocktime % 1 * 1e9);

	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];

	    if (nanoseconds < 0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }

	  return [seconds, nanoseconds];
	}
	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}
	var process = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	var inherits;

	if (typeof Object.create === 'function') {
	  inherits = function inherits(ctor, superCtor) {
	    // implementation from standard node.js 'util' module
	    ctor.super_ = superCtor;
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  inherits = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor;

	    var TempCtor = function TempCtor() {};

	    TempCtor.prototype = superCtor.prototype;
	    ctor.prototype = new TempCtor();
	    ctor.prototype.constructor = ctor;
	  };
	}

	var inherits$1 = inherits;

	function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }
	var formatRegExp = /%[sdj%]/g;
	function format(f) {
	  if (!isString(f)) {
	    var objects = [];

	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }

	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function (x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;

	    switch (x) {
	      case '%s':
	        return String(args[i++]);

	      case '%d':
	        return Number(args[i++]);

	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }

	      default:
	        return x;
	    }
	  });

	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }

	  return str;
	}
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.

	function deprecate(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function () {
	      return deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  var warned = false;

	  function deprecated() {
	    if (!warned) {
	      {
	        console.error(msg);
	      }

	      warned = true;
	    }

	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	}
	var debugs = {};
	var debugEnviron;
	function debuglog(set) {
	  if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();

	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = 0;

	      debugs[set] = function () {
	        var msg = format.apply(null, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function () {};
	    }
	  }

	  return debugs[set];
	}
	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */

	/* legacy: obj, showHidden, depth, colors*/

	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  }; // legacy...

	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];

	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    _extend(ctx, opts);
	  } // set default options


	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	} // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics

	inspect.colors = {
	  'bold': [1, 22],
	  'italic': [3, 23],
	  'underline': [4, 24],
	  'inverse': [7, 27],
	  'white': [37, 39],
	  'grey': [90, 39],
	  'black': [30, 39],
	  'blue': [34, 39],
	  'cyan': [36, 39],
	  'green': [32, 39],
	  'magenta': [35, 39],
	  'red': [31, 39],
	  'yellow': [33, 39]
	}; // Don't use 'blue' not visible on cmd.exe

	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};

	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}

	function stylizeNoColor(str, styleType) {
	  return str;
	}

	function arrayToHash(array) {
	  var hash = {};
	  array.forEach(function (val, idx) {
	    hash[val] = true;
	  });
	  return hash;
	}

	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
	  value.inspect !== inspect && // Also filter out any prototype objects using the circular check.
	  !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);

	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }

	    return ret;
	  } // Primitive types cannot have properties


	  var primitive = formatPrimitive(ctx, value);

	  if (primitive) {
	    return primitive;
	  } // Look up the keys of the object.


	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  } // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx


	  if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  } // Some type of object without properties can be shortcutted.


	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }

	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }

	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }

	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '',
	      array = false,
	      braces = ['{', '}']; // Make Array say that they are Array

	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  } // Make functions say that they are functions


	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  } // Make RegExps say that they are RegExps


	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  } // Make dates with properties first say the date


	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  } // Make error with message first say the error


	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);
	  var output;

	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function (key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();
	  return reduceToSingleString(output, base, braces);
	}

	function formatPrimitive(ctx, value) {
	  if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');

	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }

	  if (isNumber(value)) return ctx.stylize('' + value, 'number');
	  if (isBoolean(value)) return ctx.stylize('' + value, 'boolean'); // For some reason typeof null is "object", so special case here.

	  if (isNull(value)) return ctx.stylize('null', 'null');
	}

	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}

	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];

	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
	    } else {
	      output.push('');
	    }
	  }

	  keys.forEach(function (key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
	    }
	  });
	  return output;
	}

	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || {
	    value: value[key]
	  };

	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }

	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }

	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }

	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function (line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function (line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }

	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }

	    name = JSON.stringify('' + key);

	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}

	function reduceToSingleString(output, base, braces) {
	  var length = output.reduce(function (prev, cur) {
	    if (cur.indexOf('\n') >= 0) ;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	} // NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.


	function isArray(ar) {
	  return Array.isArray(ar);
	}
	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	function isNull(arg) {
	  return arg === null;
	}
	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	function isString(arg) {
	  return typeof arg === 'string';
	}
	function isSymbol(arg) {
	  return _typeof$1(arg) === 'symbol';
	}
	function isUndefined(arg) {
	  return arg === void 0;
	}
	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	function isObject(arg) {
	  return _typeof$1(arg) === 'object' && arg !== null;
	}
	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	function isError(e) {
	  return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	function isPrimitive(arg) {
	  return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || _typeof$1(arg) === 'symbol' || // ES6 symbol
	  typeof arg === 'undefined';
	}
	function isBuffer(maybeBuf) {
	  return Buffer.isBuffer(maybeBuf);
	}

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}

	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // 26 Feb 16:19:34

	function timestamp$1() {
	  var d = new Date();
	  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	} // log is just a thin wrapper to console.log that prepends a timestamp


	function log() {
	  console.log('%s - %s', timestamp$1(), format.apply(null, arguments));
	}
	function _extend(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;
	  var keys = Object.keys(add);
	  var i = keys.length;

	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }

	  return origin;
	}

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	var util = {
	  inherits: inherits$1,
	  _extend: _extend,
	  log: log,
	  isBuffer: isBuffer,
	  isPrimitive: isPrimitive,
	  isFunction: isFunction,
	  isError: isError,
	  isDate: isDate,
	  isObject: isObject,
	  isRegExp: isRegExp,
	  isUndefined: isUndefined,
	  isSymbol: isSymbol,
	  isString: isString,
	  isNumber: isNumber,
	  isNullOrUndefined: isNullOrUndefined,
	  isNull: isNull,
	  isBoolean: isBoolean,
	  isArray: isArray,
	  inspect: inspect,
	  deprecate: deprecate,
	  format: format,
	  debuglog: debuglog
	};

	var util$1 = /*#__PURE__*/Object.freeze({
		format: format,
		deprecate: deprecate,
		debuglog: debuglog,
		inspect: inspect,
		isArray: isArray,
		isBoolean: isBoolean,
		isNull: isNull,
		isNullOrUndefined: isNullOrUndefined,
		isNumber: isNumber,
		isString: isString,
		isSymbol: isSymbol,
		isUndefined: isUndefined,
		isRegExp: isRegExp,
		isObject: isObject,
		isDate: isDate,
		isError: isError,
		isFunction: isFunction,
		isPrimitive: isPrimitive,
		isBuffer: isBuffer,
		log: log,
		inherits: inherits$1,
		_extend: _extend,
		default: util
	});

	var util$2 = getCjsExportFromNamespace(util$1);

	function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$2(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$2(Constructor.prototype, protoProps); if (staticProps) _defineProperties$2(Constructor, staticProps); return Constructor; }

	var Buffer$1 = buffer.Buffer;
	var randomBytes$1 = utils.randomBytes;
	var deprecate$1 = util$2.deprecate; // constants

	var PROCESS_UNIQUE = randomBytes$1(5); // Regular expression that checks for hex value

	var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
	var hasBufferType = false; // Check if buffer exists

	try {
	  if (Buffer$1 && Buffer$1.from) hasBufferType = true;
	} catch (err) {
	  hasBufferType = false;
	} // Precomputed hex table enables speedy hex string conversion


	var hexTable = [];

	for (var _i = 0; _i < 256; _i++) {
	  hexTable[_i] = (_i <= 15 ? '0' : '') + _i.toString(16);
	} // Lookup tables


	var decodeLookup = [];
	var i = 0;

	while (i < 10) {
	  decodeLookup[0x30 + i] = i++;
	}

	while (i < 16) {
	  decodeLookup[0x41 - 10 + i] = decodeLookup[0x61 - 10 + i] = i++;
	}

	var _Buffer = Buffer$1;

	function convertToHex(bytes) {
	  return bytes.toString('hex');
	}

	function makeObjectIdError(invalidString, index) {
	  var invalidCharacter = invalidString[index];
	  return new TypeError("ObjectId string \"".concat(invalidString, "\" contains invalid character \"").concat(invalidCharacter, "\" with character code (").concat(invalidString.charCodeAt(index), "). All character codes for a non-hex string must be less than 256."));
	}
	/**
	 * A class representation of the BSON ObjectId type.
	 */


	var ObjectId =
	/*#__PURE__*/
	function () {
	  /**
	   * Create an ObjectId type
	   *
	   * @param {(string|Buffer|number)} id Can be a 24 byte hex string, 12 byte binary Buffer, or a Number.
	   * @property {number} generationTime The generation time of this ObjectId instance
	   * @return {ObjectId} instance of ObjectId.
	   */
	  function ObjectId(id) {
	    _classCallCheck$2(this, ObjectId);

	    // Duck-typing to support ObjectId from different npm packages
	    if (id instanceof ObjectId) return id; // The most common usecase (blank id, new objectId instance)

	    if (id == null || typeof id === 'number') {
	      // Generate a new id
	      this.id = ObjectId.generate(id); // If we are caching the hex string

	      if (ObjectId.cacheHexString) this.__id = this.toString('hex'); // Return the object

	      return;
	    } // Check if the passed in id is valid


	    var valid = ObjectId.isValid(id); // Throw an error if it's not a valid setup

	    if (!valid && id != null) {
	      throw new TypeError('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
	    } else if (valid && typeof id === 'string' && id.length === 24 && hasBufferType) {
	      return new ObjectId(Buffer$1.from(id, 'hex'));
	    } else if (valid && typeof id === 'string' && id.length === 24) {
	      return ObjectId.createFromHexString(id);
	    } else if (id != null && id.length === 12) {
	      // assume 12 byte string
	      this.id = id;
	    } else if (id != null && id.toHexString) {
	      // Duck-typing to support ObjectId from different npm packages
	      return ObjectId.createFromHexString(id.toHexString());
	    } else {
	      throw new TypeError('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
	    }

	    if (ObjectId.cacheHexString) this.__id = this.toString('hex');
	  }
	  /**
	   * Return the ObjectId id as a 24 byte hex string representation
	   *
	   * @method
	   * @return {string} return the 24 byte hex string representation.
	   */


	  _createClass$2(ObjectId, [{
	    key: "toHexString",
	    value: function toHexString() {
	      if (ObjectId.cacheHexString && this.__id) return this.__id;
	      var hexString = '';

	      if (!this.id || !this.id.length) {
	        throw new TypeError('invalid ObjectId, ObjectId.id must be either a string or a Buffer, but is [' + JSON.stringify(this.id) + ']');
	      }

	      if (this.id instanceof _Buffer) {
	        hexString = convertToHex(this.id);
	        if (ObjectId.cacheHexString) this.__id = hexString;
	        return hexString;
	      }

	      for (var _i2 = 0; _i2 < this.id.length; _i2++) {
	        var hexChar = hexTable[this.id.charCodeAt(_i2)];

	        if (typeof hexChar !== 'string') {
	          throw makeObjectIdError(this.id, _i2);
	        }

	        hexString += hexChar;
	      }

	      if (ObjectId.cacheHexString) this.__id = hexString;
	      return hexString;
	    }
	    /**
	     * Update the ObjectId index used in generating new ObjectId's on the driver
	     *
	     * @method
	     * @return {number} returns next index value.
	     * @ignore
	     */

	  }, {
	    key: "toString",

	    /**
	     * Converts the id into a 24 byte hex string for printing
	     *
	     * @param {String} format The Buffer toString format parameter.
	     * @return {String} return the 24 byte hex string representation.
	     * @ignore
	     */
	    value: function toString(format) {
	      // Is the id a buffer then use the buffer toString method to return the format
	      if (this.id && this.id.copy) {
	        return this.id.toString(typeof format === 'string' ? format : 'hex');
	      }

	      return this.toHexString();
	    }
	    /**
	     * Converts to its JSON representation.
	     *
	     * @return {String} return the 24 byte hex string representation.
	     * @ignore
	     */

	  }, {
	    key: "toJSON",
	    value: function toJSON() {
	      return this.toHexString();
	    }
	    /**
	     * Compares the equality of this ObjectId with `otherID`.
	     *
	     * @method
	     * @param {object} otherId ObjectId instance to compare against.
	     * @return {boolean} the result of comparing two ObjectId's
	     */

	  }, {
	    key: "equals",
	    value: function equals(otherId) {
	      if (otherId instanceof ObjectId) {
	        return this.toString() === otherId.toString();
	      }

	      if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 12 && this.id instanceof _Buffer) {
	        return otherId === this.id.toString('binary');
	      }

	      if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 24) {
	        return otherId.toLowerCase() === this.toHexString();
	      }

	      if (typeof otherId === 'string' && ObjectId.isValid(otherId) && otherId.length === 12) {
	        return otherId === this.id;
	      }

	      if (otherId != null && (otherId instanceof ObjectId || otherId.toHexString)) {
	        return otherId.toHexString() === this.toHexString();
	      }

	      return false;
	    }
	    /**
	     * Returns the generation date (accurate up to the second) that this ID was generated.
	     *
	     * @method
	     * @return {Date} the generation date
	     */

	  }, {
	    key: "getTimestamp",
	    value: function getTimestamp() {
	      var timestamp = new Date();
	      var time = this.id.readUInt32BE(0);
	      timestamp.setTime(Math.floor(time) * 1000);
	      return timestamp;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",

	    /**
	     * @ignore
	     */
	    value: function toExtendedJSON() {
	      if (this.toHexString) return {
	        $oid: this.toHexString()
	      };
	      return {
	        $oid: this.toString('hex')
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "getInc",
	    value: function getInc() {
	      return ObjectId.index = (ObjectId.index + 1) % 0xffffff;
	    }
	    /**
	     * Generate a 12 byte id buffer used in ObjectId's
	     *
	     * @method
	     * @param {number} [time] optional parameter allowing to pass in a second based timestamp.
	     * @return {Buffer} return the 12 byte id buffer string.
	     */

	  }, {
	    key: "generate",
	    value: function generate(time) {
	      if ('number' !== typeof time) {
	        time = ~~(Date.now() / 1000);
	      }

	      var inc = ObjectId.getInc();
	      var buffer$$1 = Buffer$1.alloc(12); // 4-byte timestamp

	      buffer$$1[3] = time & 0xff;
	      buffer$$1[2] = time >> 8 & 0xff;
	      buffer$$1[1] = time >> 16 & 0xff;
	      buffer$$1[0] = time >> 24 & 0xff; // 5-byte process unique

	      buffer$$1[4] = PROCESS_UNIQUE[0];
	      buffer$$1[5] = PROCESS_UNIQUE[1];
	      buffer$$1[6] = PROCESS_UNIQUE[2];
	      buffer$$1[7] = PROCESS_UNIQUE[3];
	      buffer$$1[8] = PROCESS_UNIQUE[4]; // 3-byte counter

	      buffer$$1[11] = inc & 0xff;
	      buffer$$1[10] = inc >> 8 & 0xff;
	      buffer$$1[9] = inc >> 16 & 0xff;
	      return buffer$$1;
	    }
	  }, {
	    key: "createPk",
	    value: function createPk() {
	      return new ObjectId();
	    }
	    /**
	     * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
	     *
	     * @method
	     * @param {number} time an integer number representing a number of seconds.
	     * @return {ObjectId} return the created ObjectId
	     */

	  }, {
	    key: "createFromTime",
	    value: function createFromTime(time) {
	      var buffer$$1 = Buffer$1.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Encode time into first 4 bytes

	      buffer$$1[3] = time & 0xff;
	      buffer$$1[2] = time >> 8 & 0xff;
	      buffer$$1[1] = time >> 16 & 0xff;
	      buffer$$1[0] = time >> 24 & 0xff; // Return the new objectId

	      return new ObjectId(buffer$$1);
	    }
	    /**
	     * Creates an ObjectId from a hex string representation of an ObjectId.
	     *
	     * @method
	     * @param {string} hexString create a ObjectId from a passed in 24 byte hexstring.
	     * @return {ObjectId} return the created ObjectId
	     */

	  }, {
	    key: "createFromHexString",
	    value: function createFromHexString(string) {
	      // Throw an error if it's not a valid setup
	      if (typeof string === 'undefined' || string != null && string.length !== 24) {
	        throw new TypeError('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
	      } // Use Buffer.from method if available


	      if (hasBufferType) return new ObjectId(Buffer$1.from(string, 'hex')); // Calculate lengths

	      var array = new _Buffer(12);
	      var n = 0;
	      var i = 0;

	      while (i < 24) {
	        array[n++] = decodeLookup[string.charCodeAt(i++)] << 4 | decodeLookup[string.charCodeAt(i++)];
	      }

	      return new ObjectId(array);
	    }
	    /**
	     * Checks if a value is a valid bson ObjectId
	     *
	     * @method
	     * @return {boolean} return true if the value is a valid bson ObjectId, return false otherwise.
	     */

	  }, {
	    key: "isValid",
	    value: function isValid(id) {
	      if (id == null) return false;

	      if (typeof id === 'number') {
	        return true;
	      }

	      if (typeof id === 'string') {
	        return id.length === 12 || id.length === 24 && checkForHexRegExp.test(id);
	      }

	      if (id instanceof ObjectId) {
	        return true;
	      }

	      if (id instanceof _Buffer && id.length === 12) {
	        return true;
	      } // Duck-Typing detection of ObjectId like objects


	      if (id.toHexString) {
	        return id.id.length === 12 || id.id.length === 24 && checkForHexRegExp.test(id.id);
	      }

	      return false;
	    }
	  }, {
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      return new ObjectId(doc.$oid);
	    }
	  }]);

	  return ObjectId;
	}(); // Deprecated methods


	ObjectId.get_inc = deprecate$1(function () {
	  return ObjectId.getInc();
	}, 'Please use the static `ObjectId.getInc()` instead');
	ObjectId.prototype.get_inc = deprecate$1(function () {
	  return ObjectId.getInc();
	}, 'Please use the static `ObjectId.getInc()` instead');
	ObjectId.prototype.getInc = deprecate$1(function () {
	  return ObjectId.getInc();
	}, 'Please use the static `ObjectId.getInc()` instead');
	ObjectId.prototype.generate = deprecate$1(function (time) {
	  return ObjectId.generate(time);
	}, 'Please use the static `ObjectId.generate(time)` instead');
	/**
	 * @ignore
	 */

	Object.defineProperty(ObjectId.prototype, 'generationTime', {
	  enumerable: true,
	  get: function get() {
	    return this.id[3] | this.id[2] << 8 | this.id[1] << 16 | this.id[0] << 24;
	  },
	  set: function set(value) {
	    // Encode time into first 4 bytes
	    this.id[3] = value & 0xff;
	    this.id[2] = value >> 8 & 0xff;
	    this.id[1] = value >> 16 & 0xff;
	    this.id[0] = value >> 24 & 0xff;
	  }
	});
	/**
	 * Converts to a string representation of this Id.
	 *
	 * @return {String} return the 24 byte hex string representation.
	 * @ignore
	 */

	ObjectId.prototype[util$2.inspect.custom || 'inspect'] = ObjectId.prototype.toString;
	/**
	 * @ignore
	 */

	ObjectId.index = ~~(Math.random() * 0xffffff); // In 4.0.0 and 4.0.1, this property name was changed to ObjectId to match the class name.
	// This caused interoperability problems with previous versions of the library, so in
	// later builds we changed it back to ObjectID (capital D) to match legacy implementations.

	Object.defineProperty(ObjectId.prototype, '_bsontype', {
	  value: 'ObjectID'
	});
	var objectid = ObjectId;

	function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$3(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$3(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$3(Constructor.prototype, protoProps); if (staticProps) _defineProperties$3(Constructor, staticProps); return Constructor; }

	function alphabetize(str) {
	  return str.split('').sort().join('');
	}
	/**
	 * A class representation of the BSON RegExp type.
	 */


	var BSONRegExp =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a RegExp type
	   *
	   * @param {string} pattern The regular expression pattern to match
	   * @param {string} options The regular expression options
	   */
	  function BSONRegExp(pattern, options) {
	    _classCallCheck$3(this, BSONRegExp);

	    // Execute
	    this.pattern = pattern || '';
	    this.options = options ? alphabetize(options) : ''; // Validate options

	    for (var i = 0; i < this.options.length; i++) {
	      if (!(this.options[i] === 'i' || this.options[i] === 'm' || this.options[i] === 'x' || this.options[i] === 'l' || this.options[i] === 's' || this.options[i] === 'u')) {
	        throw new Error("The regular expression option [".concat(this.options[i], "] is not supported"));
	      }
	    }
	  }
	  /**
	   * @ignore
	   */


	  _createClass$3(BSONRegExp, [{
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      return {
	        $regularExpression: {
	          pattern: this.pattern,
	          options: this.options
	        }
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      return new BSONRegExp(doc.$regularExpression.pattern, doc.$regularExpression.options.split('').sort().join(''));
	    }
	  }]);

	  return BSONRegExp;
	}();

	Object.defineProperty(BSONRegExp.prototype, '_bsontype', {
	  value: 'BSONRegExp'
	});
	var regexp = BSONRegExp;

	/**
	 * A class representation of the BSON Symbol type.
	 */

	function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$4(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$4(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$4(Constructor.prototype, protoProps); if (staticProps) _defineProperties$4(Constructor, staticProps); return Constructor; }

	var BSONSymbol =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a Symbol type
	   *
	   * @param {string} value the string representing the symbol.
	   */
	  function BSONSymbol(value) {
	    _classCallCheck$4(this, BSONSymbol);

	    this.value = value;
	  }
	  /**
	   * Access the wrapped string value.
	   *
	   * @method
	   * @return {String} returns the wrapped string.
	   */


	  _createClass$4(BSONSymbol, [{
	    key: "valueOf",
	    value: function valueOf() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toString",
	    value: function toString() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "inspect",
	    value: function inspect() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toJSON",
	    value: function toJSON() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      return {
	        $symbol: this.value
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      return new BSONSymbol(doc.$symbol);
	    }
	  }]);

	  return BSONSymbol;
	}();

	Object.defineProperty(BSONSymbol.prototype, '_bsontype', {
	  value: 'Symbol'
	});
	var symbol = BSONSymbol;

	/**
	 * A class representation of a BSON Int32 type.
	 */

	function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$5(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$5(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$5(Constructor.prototype, protoProps); if (staticProps) _defineProperties$5(Constructor, staticProps); return Constructor; }

	var Int32 =
	/*#__PURE__*/
	function () {
	  /**
	   * Create an Int32 type
	   *
	   * @param {number} value the number we want to represent as an int32.
	   * @return {Int32}
	   */
	  function Int32(value) {
	    _classCallCheck$5(this, Int32);

	    this.value = value;
	  }
	  /**
	   * Access the number value.
	   *
	   * @method
	   * @return {number} returns the wrapped int32 number.
	   */


	  _createClass$5(Int32, [{
	    key: "valueOf",
	    value: function valueOf() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toJSON",
	    value: function toJSON() {
	      return this.value;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON(options) {
	      if (options && options.relaxed) return this.value;
	      return {
	        $numberInt: this.value.toString()
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc, options) {
	      return options && options.relaxed ? parseInt(doc.$numberInt, 10) : new Int32(doc.$numberInt);
	    }
	  }]);

	  return Int32;
	}();

	Object.defineProperty(Int32.prototype, '_bsontype', {
	  value: 'Int32'
	});
	var int_32 = Int32;

	/**
	 * A class representation of the BSON Code type.
	 */

	function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$6(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$6(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$6(Constructor.prototype, protoProps); if (staticProps) _defineProperties$6(Constructor, staticProps); return Constructor; }

	var Code =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a Code type
	   *
	   * @param {(string|function)} code a string or function.
	   * @param {Object} [scope] an optional scope for the function.
	   * @return {Code}
	   */
	  function Code(code, scope) {
	    _classCallCheck$6(this, Code);

	    this.code = code;
	    this.scope = scope;
	  }
	  /**
	   * @ignore
	   */


	  _createClass$6(Code, [{
	    key: "toJSON",
	    value: function toJSON() {
	      return {
	        scope: this.scope,
	        code: this.code
	      };
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      if (this.scope) {
	        return {
	          $code: this.code,
	          $scope: this.scope
	        };
	      }

	      return {
	        $code: this.code
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      return new Code(doc.$code, doc.$scope);
	    }
	  }]);

	  return Code;
	}();

	Object.defineProperty(Code.prototype, '_bsontype', {
	  value: 'Code'
	});
	var code = Code;

	var Buffer$2 = buffer.Buffer;
	var PARSE_STRING_REGEXP = /^(\+|-)?(\d+|(\d*\.\d*))?(E|e)?([-+])?(\d+)?$/;
	var PARSE_INF_REGEXP = /^(\+|-)?(Infinity|inf)$/i;
	var PARSE_NAN_REGEXP = /^(\+|-)?NaN$/i;
	var EXPONENT_MAX = 6111;
	var EXPONENT_MIN = -6176;
	var EXPONENT_BIAS = 6176;
	var MAX_DIGITS = 34; // Nan value bits as 32 bit values (due to lack of longs)

	var NAN_BUFFER = [0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse(); // Infinity value bits 32 bit values (due to lack of longs)

	var INF_NEGATIVE_BUFFER = [0xf8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse();
	var INF_POSITIVE_BUFFER = [0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse();
	var EXPONENT_REGEX = /^([-+])?(\d+)?$/; // Detect if the value is a digit

	function isDigit(value) {
	  return !isNaN(parseInt(value, 10));
	} // Divide two uint128 values


	function divideu128(value) {
	  var DIVISOR = long_1.fromNumber(1000 * 1000 * 1000);

	  var _rem = long_1.fromNumber(0);

	  if (!value.parts[0] && !value.parts[1] && !value.parts[2] && !value.parts[3]) {
	    return {
	      quotient: value,
	      rem: _rem
	    };
	  }

	  for (var i = 0; i <= 3; i++) {
	    // Adjust remainder to match value of next dividend
	    _rem = _rem.shiftLeft(32); // Add the divided to _rem

	    _rem = _rem.add(new long_1(value.parts[i], 0));
	    value.parts[i] = _rem.div(DIVISOR).low;
	    _rem = _rem.modulo(DIVISOR);
	  }

	  return {
	    quotient: value,
	    rem: _rem
	  };
	} // Multiply two Long values and return the 128 bit value


	function multiply64x2(left, right) {
	  if (!left && !right) {
	    return {
	      high: long_1.fromNumber(0),
	      low: long_1.fromNumber(0)
	    };
	  }

	  var leftHigh = left.shiftRightUnsigned(32);
	  var leftLow = new long_1(left.getLowBits(), 0);
	  var rightHigh = right.shiftRightUnsigned(32);
	  var rightLow = new long_1(right.getLowBits(), 0);
	  var productHigh = leftHigh.multiply(rightHigh);
	  var productMid = leftHigh.multiply(rightLow);
	  var productMid2 = leftLow.multiply(rightHigh);
	  var productLow = leftLow.multiply(rightLow);
	  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
	  productMid = new long_1(productMid.getLowBits(), 0).add(productMid2).add(productLow.shiftRightUnsigned(32));
	  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
	  productLow = productMid.shiftLeft(32).add(new long_1(productLow.getLowBits(), 0)); // Return the 128 bit result

	  return {
	    high: productHigh,
	    low: productLow
	  };
	}

	function lessThan(left, right) {
	  // Make values unsigned
	  var uhleft = left.high >>> 0;
	  var uhright = right.high >>> 0; // Compare high bits first

	  if (uhleft < uhright) {
	    return true;
	  } else if (uhleft === uhright) {
	    var ulleft = left.low >>> 0;
	    var ulright = right.low >>> 0;
	    if (ulleft < ulright) return true;
	  }

	  return false;
	}

	function invalidErr(string, message) {
	  throw new TypeError("\"".concat(string, "\" is not a valid Decimal128 string - ").concat(message));
	}
	/**
	 * A class representation of the BSON Decimal128 type.
	 *
	 * @class
	 * @param {Buffer} bytes a buffer containing the raw Decimal128 bytes.
	 * @return {Double}
	 */


	function Decimal128(bytes) {
	  this.bytes = bytes;
	}
	/**
	 * Create a Decimal128 instance from a string representation
	 *
	 * @method
	 * @param {string} string a numeric string representation.
	 * @return {Decimal128} returns a Decimal128 instance.
	 */


	Decimal128.fromString = function (string) {
	  // Parse state tracking
	  var isNegative = false;
	  var sawRadix = false;
	  var foundNonZero = false; // Total number of significant digits (no leading or trailing zero)

	  var significantDigits = 0; // Total number of significand digits read

	  var nDigitsRead = 0; // Total number of digits (no leading zeros)

	  var nDigits = 0; // The number of the digits after radix

	  var radixPosition = 0; // The index of the first non-zero in *str*

	  var firstNonZero = 0; // Digits Array

	  var digits = [0]; // The number of digits in digits

	  var nDigitsStored = 0; // Insertion pointer for digits

	  var digitsInsert = 0; // The index of the first non-zero digit

	  var firstDigit = 0; // The index of the last digit

	  var lastDigit = 0; // Exponent

	  var exponent = 0; // loop index over array

	  var i = 0; // The high 17 digits of the significand

	  var significandHigh = [0, 0]; // The low 17 digits of the significand

	  var significandLow = [0, 0]; // The biased exponent

	  var biasedExponent = 0; // Read index

	  var index = 0; // Naively prevent against REDOS attacks.
	  // TODO: implementing a custom parsing for this, or refactoring the regex would yield
	  //       further gains.

	  if (string.length >= 7000) {
	    throw new TypeError('' + string + ' not a valid Decimal128 string');
	  } // Results


	  var stringMatch = string.match(PARSE_STRING_REGEXP);
	  var infMatch = string.match(PARSE_INF_REGEXP);
	  var nanMatch = string.match(PARSE_NAN_REGEXP); // Validate the string

	  if (!stringMatch && !infMatch && !nanMatch || string.length === 0) {
	    throw new TypeError('' + string + ' not a valid Decimal128 string');
	  }

	  if (stringMatch) {
	    // full_match = stringMatch[0]
	    // sign = stringMatch[1]
	    var unsignedNumber = stringMatch[2]; // stringMatch[3] is undefined if a whole number (ex "1", 12")
	    // but defined if a number w/ decimal in it (ex "1.0, 12.2")

	    var e = stringMatch[4];
	    var expSign = stringMatch[5];
	    var expNumber = stringMatch[6]; // they provided e, but didn't give an exponent number. for ex "1e"

	    if (e && expNumber === undefined) invalidErr(string, 'missing exponent power'); // they provided e, but didn't give a number before it. for ex "e1"

	    if (e && unsignedNumber === undefined) invalidErr(string, 'missing exponent base');

	    if (e === undefined && (expSign || expNumber)) {
	      invalidErr(string, 'missing e before exponent');
	    }
	  } // Get the negative or positive sign


	  if (string[index] === '+' || string[index] === '-') {
	    isNegative = string[index++] === '-';
	  } // Check if user passed Infinity or NaN


	  if (!isDigit(string[index]) && string[index] !== '.') {
	    if (string[index] === 'i' || string[index] === 'I') {
	      return new Decimal128(Buffer$2.from(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
	    } else if (string[index] === 'N') {
	      return new Decimal128(Buffer$2.from(NAN_BUFFER));
	    }
	  } // Read all the digits


	  while (isDigit(string[index]) || string[index] === '.') {
	    if (string[index] === '.') {
	      if (sawRadix) invalidErr(string, 'contains multiple periods');
	      sawRadix = true;
	      index = index + 1;
	      continue;
	    }

	    if (nDigitsStored < 34) {
	      if (string[index] !== '0' || foundNonZero) {
	        if (!foundNonZero) {
	          firstNonZero = nDigitsRead;
	        }

	        foundNonZero = true; // Only store 34 digits

	        digits[digitsInsert++] = parseInt(string[index], 10);
	        nDigitsStored = nDigitsStored + 1;
	      }
	    }

	    if (foundNonZero) nDigits = nDigits + 1;
	    if (sawRadix) radixPosition = radixPosition + 1;
	    nDigitsRead = nDigitsRead + 1;
	    index = index + 1;
	  }

	  if (sawRadix && !nDigitsRead) throw new TypeError('' + string + ' not a valid Decimal128 string'); // Read exponent if exists

	  if (string[index] === 'e' || string[index] === 'E') {
	    // Read exponent digits
	    var match = string.substr(++index).match(EXPONENT_REGEX); // No digits read

	    if (!match || !match[2]) return new Decimal128(Buffer$2.from(NAN_BUFFER)); // Get exponent

	    exponent = parseInt(match[0], 10); // Adjust the index

	    index = index + match[0].length;
	  } // Return not a number


	  if (string[index]) return new Decimal128(Buffer$2.from(NAN_BUFFER)); // Done reading input
	  // Find first non-zero digit in digits

	  firstDigit = 0;

	  if (!nDigitsStored) {
	    firstDigit = 0;
	    lastDigit = 0;
	    digits[0] = 0;
	    nDigits = 1;
	    nDigitsStored = 1;
	    significantDigits = 0;
	  } else {
	    lastDigit = nDigitsStored - 1;
	    significantDigits = nDigits;

	    if (significantDigits !== 1) {
	      while (string[firstNonZero + significantDigits - 1] === '0') {
	        significantDigits = significantDigits - 1;
	      }
	    }
	  } // Normalization of exponent
	  // Correct exponent based on radix position, and shift significand as needed
	  // to represent user input
	  // Overflow prevention


	  if (exponent <= radixPosition && radixPosition - exponent > 1 << 14) {
	    exponent = EXPONENT_MIN;
	  } else {
	    exponent = exponent - radixPosition;
	  } // Attempt to normalize the exponent


	  while (exponent > EXPONENT_MAX) {
	    // Shift exponent to significand and decrease
	    lastDigit = lastDigit + 1;

	    if (lastDigit - firstDigit > MAX_DIGITS) {
	      // Check if we have a zero then just hard clamp, otherwise fail
	      var digitsString = digits.join('');

	      if (digitsString.match(/^0+$/)) {
	        exponent = EXPONENT_MAX;
	        break;
	      }

	      invalidErr(string, 'overflow');
	    }

	    exponent = exponent - 1;
	  }

	  while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
	    // Shift last digit. can only do this if < significant digits than # stored.
	    if (lastDigit === 0 && significantDigits < nDigitsStored) {
	      exponent = EXPONENT_MIN;
	      significantDigits = 0;
	      break;
	    }

	    if (nDigitsStored < nDigits) {
	      // adjust to match digits not stored
	      nDigits = nDigits - 1;
	    } else {
	      // adjust to round
	      lastDigit = lastDigit - 1;
	    }

	    if (exponent < EXPONENT_MAX) {
	      exponent = exponent + 1;
	    } else {
	      // Check if we have a zero then just hard clamp, otherwise fail
	      var _digitsString = digits.join('');

	      if (_digitsString.match(/^0+$/)) {
	        exponent = EXPONENT_MAX;
	        break;
	      }

	      invalidErr(string, 'overflow');
	    }
	  } // Round
	  // We've normalized the exponent, but might still need to round.


	  if (lastDigit - firstDigit + 1 < significantDigits) {
	    var endOfString = nDigitsRead; // If we have seen a radix point, 'string' is 1 longer than we have
	    // documented with ndigits_read, so inc the position of the first nonzero
	    // digit and the position that digits are read to.

	    if (sawRadix) {
	      firstNonZero = firstNonZero + 1;
	      endOfString = endOfString + 1;
	    } // if negative, we need to increment again to account for - sign at start.


	    if (isNegative) {
	      firstNonZero = firstNonZero + 1;
	      endOfString = endOfString + 1;
	    }

	    var roundDigit = parseInt(string[firstNonZero + lastDigit + 1], 10);
	    var roundBit = 0;

	    if (roundDigit >= 5) {
	      roundBit = 1;

	      if (roundDigit === 5) {
	        roundBit = digits[lastDigit] % 2 === 1;

	        for (i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
	          if (parseInt(string[i], 10)) {
	            roundBit = 1;
	            break;
	          }
	        }
	      }
	    }

	    if (roundBit) {
	      var dIdx = lastDigit;

	      for (; dIdx >= 0; dIdx--) {
	        if (++digits[dIdx] > 9) {
	          digits[dIdx] = 0; // overflowed most significant digit

	          if (dIdx === 0) {
	            if (exponent < EXPONENT_MAX) {
	              exponent = exponent + 1;
	              digits[dIdx] = 1;
	            } else {
	              return new Decimal128(Buffer$2.from(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
	            }
	          }
	        }
	      }
	    }
	  } // Encode significand
	  // The high 17 digits of the significand


	  significandHigh = long_1.fromNumber(0); // The low 17 digits of the significand

	  significandLow = long_1.fromNumber(0); // read a zero

	  if (significantDigits === 0) {
	    significandHigh = long_1.fromNumber(0);
	    significandLow = long_1.fromNumber(0);
	  } else if (lastDigit - firstDigit < 17) {
	    var _dIdx = firstDigit;
	    significandLow = long_1.fromNumber(digits[_dIdx++]);
	    significandHigh = new long_1(0, 0);

	    for (; _dIdx <= lastDigit; _dIdx++) {
	      significandLow = significandLow.multiply(long_1.fromNumber(10));
	      significandLow = significandLow.add(long_1.fromNumber(digits[_dIdx]));
	    }
	  } else {
	    var _dIdx2 = firstDigit;
	    significandHigh = long_1.fromNumber(digits[_dIdx2++]);

	    for (; _dIdx2 <= lastDigit - 17; _dIdx2++) {
	      significandHigh = significandHigh.multiply(long_1.fromNumber(10));
	      significandHigh = significandHigh.add(long_1.fromNumber(digits[_dIdx2]));
	    }

	    significandLow = long_1.fromNumber(digits[_dIdx2++]);

	    for (; _dIdx2 <= lastDigit; _dIdx2++) {
	      significandLow = significandLow.multiply(long_1.fromNumber(10));
	      significandLow = significandLow.add(long_1.fromNumber(digits[_dIdx2]));
	    }
	  }

	  var significand = multiply64x2(significandHigh, long_1.fromString('100000000000000000'));
	  significand.low = significand.low.add(significandLow);

	  if (lessThan(significand.low, significandLow)) {
	    significand.high = significand.high.add(long_1.fromNumber(1));
	  } // Biased exponent


	  biasedExponent = exponent + EXPONENT_BIAS;
	  var dec = {
	    low: long_1.fromNumber(0),
	    high: long_1.fromNumber(0)
	  }; // Encode combination, exponent, and significand.

	  if (significand.high.shiftRightUnsigned(49).and(long_1.fromNumber(1)).equals(long_1.fromNumber(1))) {
	    // Encode '11' into bits 1 to 3
	    dec.high = dec.high.or(long_1.fromNumber(0x3).shiftLeft(61));
	    dec.high = dec.high.or(long_1.fromNumber(biasedExponent).and(long_1.fromNumber(0x3fff).shiftLeft(47)));
	    dec.high = dec.high.or(significand.high.and(long_1.fromNumber(0x7fffffffffff)));
	  } else {
	    dec.high = dec.high.or(long_1.fromNumber(biasedExponent & 0x3fff).shiftLeft(49));
	    dec.high = dec.high.or(significand.high.and(long_1.fromNumber(0x1ffffffffffff)));
	  }

	  dec.low = significand.low; // Encode sign

	  if (isNegative) {
	    dec.high = dec.high.or(long_1.fromString('9223372036854775808'));
	  } // Encode into a buffer


	  var buffer$$1 = Buffer$2.alloc(16);
	  index = 0; // Encode the low 64 bits of the decimal
	  // Encode low bits

	  buffer$$1[index++] = dec.low.low & 0xff;
	  buffer$$1[index++] = dec.low.low >> 8 & 0xff;
	  buffer$$1[index++] = dec.low.low >> 16 & 0xff;
	  buffer$$1[index++] = dec.low.low >> 24 & 0xff; // Encode high bits

	  buffer$$1[index++] = dec.low.high & 0xff;
	  buffer$$1[index++] = dec.low.high >> 8 & 0xff;
	  buffer$$1[index++] = dec.low.high >> 16 & 0xff;
	  buffer$$1[index++] = dec.low.high >> 24 & 0xff; // Encode the high 64 bits of the decimal
	  // Encode low bits

	  buffer$$1[index++] = dec.high.low & 0xff;
	  buffer$$1[index++] = dec.high.low >> 8 & 0xff;
	  buffer$$1[index++] = dec.high.low >> 16 & 0xff;
	  buffer$$1[index++] = dec.high.low >> 24 & 0xff; // Encode high bits

	  buffer$$1[index++] = dec.high.high & 0xff;
	  buffer$$1[index++] = dec.high.high >> 8 & 0xff;
	  buffer$$1[index++] = dec.high.high >> 16 & 0xff;
	  buffer$$1[index++] = dec.high.high >> 24 & 0xff; // Return the new Decimal128

	  return new Decimal128(buffer$$1);
	}; // Extract least significant 5 bits


	var COMBINATION_MASK = 0x1f; // Extract least significant 14 bits

	var EXPONENT_MASK = 0x3fff; // Value of combination field for Inf

	var COMBINATION_INFINITY = 30; // Value of combination field for NaN

	var COMBINATION_NAN = 31;
	/**
	 * Create a string representation of the raw Decimal128 value
	 *
	 * @method
	 * @return {string} returns a Decimal128 string representation.
	 */

	Decimal128.prototype.toString = function () {
	  // Note: bits in this routine are referred to starting at 0,
	  // from the sign bit, towards the coefficient.
	  // bits 0 - 31
	  var high; // bits 32 - 63

	  var midh; // bits 64 - 95

	  var midl; // bits 96 - 127

	  var low; // bits 1 - 5

	  var combination; // decoded biased exponent (14 bits)

	  var biased_exponent; // the number of significand digits

	  var significand_digits = 0; // the base-10 digits in the significand

	  var significand = new Array(36);

	  for (var i = 0; i < significand.length; i++) {
	    significand[i] = 0;
	  } // read pointer into significand


	  var index = 0; // unbiased exponent

	  var exponent; // the exponent if scientific notation is used

	  var scientific_exponent; // true if the number is zero

	  var is_zero = false; // the most signifcant significand bits (50-46)

	  var significand_msb; // temporary storage for significand decoding

	  var significand128 = {
	    parts: new Array(4)
	  }; // indexing variables

	  var j, k; // Output string

	  var string = []; // Unpack index

	  index = 0; // Buffer reference

	  var buffer$$1 = this.bytes; // Unpack the low 64bits into a long

	  low = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	  midl = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Unpack the high 64bits into a long

	  midh = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	  high = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Unpack index

	  index = 0; // Create the state of the decimal

	  var dec = {
	    low: new long_1(low, midl),
	    high: new long_1(midh, high)
	  };

	  if (dec.high.lessThan(long_1.ZERO)) {
	    string.push('-');
	  } // Decode combination field and exponent


	  combination = high >> 26 & COMBINATION_MASK;

	  if (combination >> 3 === 3) {
	    // Check for 'special' values
	    if (combination === COMBINATION_INFINITY) {
	      return string.join('') + 'Infinity';
	    } else if (combination === COMBINATION_NAN) {
	      return 'NaN';
	    } else {
	      biased_exponent = high >> 15 & EXPONENT_MASK;
	      significand_msb = 0x08 + (high >> 14 & 0x01);
	    }
	  } else {
	    significand_msb = high >> 14 & 0x07;
	    biased_exponent = high >> 17 & EXPONENT_MASK;
	  }

	  exponent = biased_exponent - EXPONENT_BIAS; // Create string of significand digits
	  // Convert the 114-bit binary number represented by
	  // (significand_high, significand_low) to at most 34 decimal
	  // digits through modulo and division.

	  significand128.parts[0] = (high & 0x3fff) + ((significand_msb & 0xf) << 14);
	  significand128.parts[1] = midh;
	  significand128.parts[2] = midl;
	  significand128.parts[3] = low;

	  if (significand128.parts[0] === 0 && significand128.parts[1] === 0 && significand128.parts[2] === 0 && significand128.parts[3] === 0) {
	    is_zero = true;
	  } else {
	    for (k = 3; k >= 0; k--) {
	      var least_digits = 0; // Peform the divide

	      var result = divideu128(significand128);
	      significand128 = result.quotient;
	      least_digits = result.rem.low; // We now have the 9 least significant digits (in base 2).
	      // Convert and output to string.

	      if (!least_digits) continue;

	      for (j = 8; j >= 0; j--) {
	        // significand[k * 9 + j] = Math.round(least_digits % 10);
	        significand[k * 9 + j] = least_digits % 10; // least_digits = Math.round(least_digits / 10);

	        least_digits = Math.floor(least_digits / 10);
	      }
	    }
	  } // Output format options:
	  // Scientific - [-]d.dddE(+/-)dd or [-]dE(+/-)dd
	  // Regular    - ddd.ddd


	  if (is_zero) {
	    significand_digits = 1;
	    significand[index] = 0;
	  } else {
	    significand_digits = 36;

	    while (!significand[index]) {
	      significand_digits = significand_digits - 1;
	      index = index + 1;
	    }
	  }

	  scientific_exponent = significand_digits - 1 + exponent; // The scientific exponent checks are dictated by the string conversion
	  // specification and are somewhat arbitrary cutoffs.
	  //
	  // We must check exponent > 0, because if this is the case, the number
	  // has trailing zeros.  However, we *cannot* output these trailing zeros,
	  // because doing so would change the precision of the value, and would
	  // change stored data if the string converted number is round tripped.

	  if (scientific_exponent >= 34 || scientific_exponent <= -7 || exponent > 0) {
	    // Scientific format
	    // if there are too many significant digits, we should just be treating numbers
	    // as + or - 0 and using the non-scientific exponent (this is for the "invalid
	    // representation should be treated as 0/-0" spec cases in decimal128-1.json)
	    if (significand_digits > 34) {
	      string.push(0);
	      if (exponent > 0) string.push('E+' + exponent);else if (exponent < 0) string.push('E' + exponent);
	      return string.join('');
	    }

	    string.push(significand[index++]);
	    significand_digits = significand_digits - 1;

	    if (significand_digits) {
	      string.push('.');
	    }

	    for (var _i = 0; _i < significand_digits; _i++) {
	      string.push(significand[index++]);
	    } // Exponent


	    string.push('E');

	    if (scientific_exponent > 0) {
	      string.push('+' + scientific_exponent);
	    } else {
	      string.push(scientific_exponent);
	    }
	  } else {
	    // Regular format with no decimal place
	    if (exponent >= 0) {
	      for (var _i2 = 0; _i2 < significand_digits; _i2++) {
	        string.push(significand[index++]);
	      }
	    } else {
	      var radix_position = significand_digits + exponent; // non-zero digits before radix

	      if (radix_position > 0) {
	        for (var _i3 = 0; _i3 < radix_position; _i3++) {
	          string.push(significand[index++]);
	        }
	      } else {
	        string.push('0');
	      }

	      string.push('.'); // add leading zeros after radix

	      while (radix_position++ < 0) {
	        string.push('0');
	      }

	      for (var _i4 = 0; _i4 < significand_digits - Math.max(radix_position - 1, 0); _i4++) {
	        string.push(significand[index++]);
	      }
	    }
	  }

	  return string.join('');
	};

	Decimal128.prototype.toJSON = function () {
	  return {
	    $numberDecimal: this.toString()
	  };
	};
	/**
	 * @ignore
	 */


	Decimal128.prototype.toExtendedJSON = function () {
	  return {
	    $numberDecimal: this.toString()
	  };
	};
	/**
	 * @ignore
	 */


	Decimal128.fromExtendedJSON = function (doc) {
	  return Decimal128.fromString(doc.$numberDecimal);
	};

	Object.defineProperty(Decimal128.prototype, '_bsontype', {
	  value: 'Decimal128'
	});
	var decimal128 = Decimal128;

	/**
	 * A class representation of the BSON MinKey type.
	 */

	function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$7(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$7(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$7(Constructor.prototype, protoProps); if (staticProps) _defineProperties$7(Constructor, staticProps); return Constructor; }

	var MinKey =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a MinKey type
	   *
	   * @return {MinKey} A MinKey instance
	   */
	  function MinKey() {
	    _classCallCheck$7(this, MinKey);
	  }
	  /**
	   * @ignore
	   */


	  _createClass$7(MinKey, [{
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      return {
	        $minKey: 1
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON() {
	      return new MinKey();
	    }
	  }]);

	  return MinKey;
	}();

	Object.defineProperty(MinKey.prototype, '_bsontype', {
	  value: 'MinKey'
	});
	var min_key = MinKey;

	/**
	 * A class representation of the BSON MaxKey type.
	 */

	function _classCallCheck$8(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$8(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$8(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$8(Constructor.prototype, protoProps); if (staticProps) _defineProperties$8(Constructor, staticProps); return Constructor; }

	var MaxKey =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a MaxKey type
	   *
	   * @return {MaxKey} A MaxKey instance
	   */
	  function MaxKey() {
	    _classCallCheck$8(this, MaxKey);
	  }
	  /**
	   * @ignore
	   */


	  _createClass$8(MaxKey, [{
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      return {
	        $maxKey: 1
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON() {
	      return new MaxKey();
	    }
	  }]);

	  return MaxKey;
	}();

	Object.defineProperty(MaxKey.prototype, '_bsontype', {
	  value: 'MaxKey'
	});
	var max_key = MaxKey;

	/**
	 * A class representation of the BSON DBRef type.
	 */

	function _classCallCheck$9(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$9(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$9(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$9(Constructor.prototype, protoProps); if (staticProps) _defineProperties$9(Constructor, staticProps); return Constructor; }

	var DBRef =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a DBRef type
	   *
	   * @param {string} collection the collection name.
	   * @param {ObjectId} oid the reference ObjectId.
	   * @param {string} [db] optional db name, if omitted the reference is local to the current db.
	   * @return {DBRef}
	   */
	  function DBRef(collection, oid, db, fields) {
	    _classCallCheck$9(this, DBRef);

	    // check if namespace has been provided
	    var parts = collection.split('.');

	    if (parts.length === 2) {
	      db = parts.shift();
	      collection = parts.shift();
	    }

	    this.collection = collection;
	    this.oid = oid;
	    this.db = db;
	    this.fields = fields || {};
	  }
	  /**
	   * @ignore
	   * @api private
	   */


	  _createClass$9(DBRef, [{
	    key: "toJSON",
	    value: function toJSON() {
	      var o = Object.assign({
	        $ref: this.collection,
	        $id: this.oid
	      }, this.fields);
	      if (this.db != null) o.$db = this.db;
	      return o;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      var o = {
	        $ref: this.collection,
	        $id: this.oid
	      };
	      if (this.db) o.$db = this.db;
	      o = Object.assign(o, this.fields);
	      return o;
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      var copy = Object.assign({}, doc);
	      ['$ref', '$id', '$db'].forEach(function (k) {
	        return delete copy[k];
	      });
	      return new DBRef(doc.$ref, doc.$id, doc.$db, copy);
	    }
	  }]);

	  return DBRef;
	}();

	Object.defineProperty(DBRef.prototype, '_bsontype', {
	  value: 'DBRef'
	}); // the 1.x parser used a "namespace" property, while 4.x uses "collection". To ensure backwards
	// compatibility, let's expose "namespace"

	Object.defineProperty(DBRef.prototype, 'namespace', {
	  get: function get() {
	    return this.collection;
	  },
	  set: function set(val) {
	    this.collection = val;
	  },
	  configurable: false
	});
	var db_ref = DBRef;

	function _classCallCheck$a(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties$a(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass$a(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$a(Constructor.prototype, protoProps); if (staticProps) _defineProperties$a(Constructor, staticProps); return Constructor; }

	var Buffer$3 = buffer.Buffer;
	/**
	 * A class representation of the BSON Binary type.
	 */

	var Binary =
	/*#__PURE__*/
	function () {
	  /**
	   * Create a Binary type
	   *
	   * Sub types
	   *  - **BSON.BSON_BINARY_SUBTYPE_DEFAULT**, default BSON type.
	   *  - **BSON.BSON_BINARY_SUBTYPE_FUNCTION**, BSON function type.
	   *  - **BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY**, BSON byte array type.
	   *  - **BSON.BSON_BINARY_SUBTYPE_UUID**, BSON uuid type.
	   *  - **BSON.BSON_BINARY_SUBTYPE_MD5**, BSON md5 type.
	   *  - **BSON.BSON_BINARY_SUBTYPE_USER_DEFINED**, BSON user defined type.
	   *
	   * @param {Buffer} buffer a buffer object containing the binary data.
	   * @param {Number} [subType] the option binary type.
	   * @return {Binary}
	   */
	  function Binary(buffer$$1, subType) {
	    _classCallCheck$a(this, Binary);

	    if (buffer$$1 != null && !(typeof buffer$$1 === 'string') && !Buffer$3.isBuffer(buffer$$1) && !(buffer$$1 instanceof Uint8Array) && !Array.isArray(buffer$$1)) {
	      throw new TypeError('only String, Buffer, Uint8Array or Array accepted');
	    }

	    this.sub_type = subType == null ? BSON_BINARY_SUBTYPE_DEFAULT : subType;
	    this.position = 0;

	    if (buffer$$1 != null && !(buffer$$1 instanceof Number)) {
	      // Only accept Buffer, Uint8Array or Arrays
	      if (typeof buffer$$1 === 'string') {
	        // Different ways of writing the length of the string for the different types
	        if (typeof Buffer$3 !== 'undefined') {
	          this.buffer = Buffer$3.from(buffer$$1);
	        } else if (typeof Uint8Array !== 'undefined' || Array.isArray(buffer$$1)) {
	          this.buffer = writeStringToArray(buffer$$1);
	        } else {
	          throw new TypeError('only String, Buffer, Uint8Array or Array accepted');
	        }
	      } else {
	        this.buffer = buffer$$1;
	      }

	      this.position = buffer$$1.length;
	    } else {
	      if (typeof Buffer$3 !== 'undefined') {
	        this.buffer = Buffer$3.alloc(Binary.BUFFER_SIZE);
	      } else if (typeof Uint8Array !== 'undefined') {
	        this.buffer = new Uint8Array(new ArrayBuffer(Binary.BUFFER_SIZE));
	      } else {
	        this.buffer = new Array(Binary.BUFFER_SIZE);
	      }
	    }
	  }
	  /**
	   * Updates this binary with byte_value.
	   *
	   * @method
	   * @param {string} byte_value a single byte we wish to write.
	   */


	  _createClass$a(Binary, [{
	    key: "put",
	    value: function put(byte_value) {
	      // If it's a string and a has more than one character throw an error
	      if (byte_value['length'] != null && typeof byte_value !== 'number' && byte_value.length !== 1) throw new TypeError('only accepts single character String, Uint8Array or Array');
	      if (typeof byte_value !== 'number' && byte_value < 0 || byte_value > 255) throw new TypeError('only accepts number in a valid unsigned byte range 0-255'); // Decode the byte value once

	      var decoded_byte = null;

	      if (typeof byte_value === 'string') {
	        decoded_byte = byte_value.charCodeAt(0);
	      } else if (byte_value['length'] != null) {
	        decoded_byte = byte_value[0];
	      } else {
	        decoded_byte = byte_value;
	      }

	      if (this.buffer.length > this.position) {
	        this.buffer[this.position++] = decoded_byte;
	      } else {
	        if (typeof Buffer$3 !== 'undefined' && Buffer$3.isBuffer(this.buffer)) {
	          // Create additional overflow buffer
	          var buffer$$1 = Buffer$3.alloc(Binary.BUFFER_SIZE + this.buffer.length); // Combine the two buffers together

	          this.buffer.copy(buffer$$1, 0, 0, this.buffer.length);
	          this.buffer = buffer$$1;
	          this.buffer[this.position++] = decoded_byte;
	        } else {
	          var _buffer = null; // Create a new buffer (typed or normal array)

	          if (isUint8Array(this.buffer)) {
	            _buffer = new Uint8Array(new ArrayBuffer(Binary.BUFFER_SIZE + this.buffer.length));
	          } else {
	            _buffer = new Array(Binary.BUFFER_SIZE + this.buffer.length);
	          } // We need to copy all the content to the new array


	          for (var i = 0; i < this.buffer.length; i++) {
	            _buffer[i] = this.buffer[i];
	          } // Reassign the buffer


	          this.buffer = _buffer; // Write the byte

	          this.buffer[this.position++] = decoded_byte;
	        }
	      }
	    }
	    /**
	     * Writes a buffer or string to the binary.
	     *
	     * @method
	     * @param {(Buffer|string)} string a string or buffer to be written to the Binary BSON object.
	     * @param {number} offset specify the binary of where to write the content.
	     * @return {null}
	     */

	  }, {
	    key: "write",
	    value: function write(string, offset) {
	      offset = typeof offset === 'number' ? offset : this.position; // If the buffer is to small let's extend the buffer

	      if (this.buffer.length < offset + string.length) {
	        var buffer$$1 = null; // If we are in node.js

	        if (typeof Buffer$3 !== 'undefined' && Buffer$3.isBuffer(this.buffer)) {
	          buffer$$1 = Buffer$3.alloc(this.buffer.length + string.length);
	          this.buffer.copy(buffer$$1, 0, 0, this.buffer.length);
	        } else if (isUint8Array(this.buffer)) {
	          // Create a new buffer
	          buffer$$1 = new Uint8Array(new ArrayBuffer(this.buffer.length + string.length)); // Copy the content

	          for (var i = 0; i < this.position; i++) {
	            buffer$$1[i] = this.buffer[i];
	          }
	        } // Assign the new buffer


	        this.buffer = buffer$$1;
	      }

	      if (typeof Buffer$3 !== 'undefined' && Buffer$3.isBuffer(string) && Buffer$3.isBuffer(this.buffer)) {
	        string.copy(this.buffer, offset, 0, string.length);
	        this.position = offset + string.length > this.position ? offset + string.length : this.position; // offset = string.length
	      } else if (typeof Buffer$3 !== 'undefined' && typeof string === 'string' && Buffer$3.isBuffer(this.buffer)) {
	        this.buffer.write(string, offset, 'binary');
	        this.position = offset + string.length > this.position ? offset + string.length : this.position; // offset = string.length;
	      } else if (isUint8Array(string) || Array.isArray(string) && typeof string !== 'string') {
	        for (var _i = 0; _i < string.length; _i++) {
	          this.buffer[offset++] = string[_i];
	        }

	        this.position = offset > this.position ? offset : this.position;
	      } else if (typeof string === 'string') {
	        for (var _i2 = 0; _i2 < string.length; _i2++) {
	          this.buffer[offset++] = string.charCodeAt(_i2);
	        }

	        this.position = offset > this.position ? offset : this.position;
	      }
	    }
	    /**
	     * Reads **length** bytes starting at **position**.
	     *
	     * @method
	     * @param {number} position read from the given position in the Binary.
	     * @param {number} length the number of bytes to read.
	     * @return {Buffer}
	     */

	  }, {
	    key: "read",
	    value: function read(position, length) {
	      length = length && length > 0 ? length : this.position; // Let's return the data based on the type we have

	      if (this.buffer['slice']) {
	        return this.buffer.slice(position, position + length);
	      } // Create a buffer to keep the result


	      var buffer$$1 = typeof Uint8Array !== 'undefined' ? new Uint8Array(new ArrayBuffer(length)) : new Array(length);

	      for (var i = 0; i < length; i++) {
	        buffer$$1[i] = this.buffer[position++];
	      } // Return the buffer


	      return buffer$$1;
	    }
	    /**
	     * Returns the value of this binary as a string.
	     *
	     * @method
	     * @return {string}
	     */

	  }, {
	    key: "value",
	    value: function value(asRaw) {
	      asRaw = asRaw == null ? false : asRaw; // Optimize to serialize for the situation where the data == size of buffer

	      if (asRaw && typeof Buffer$3 !== 'undefined' && Buffer$3.isBuffer(this.buffer) && this.buffer.length === this.position) return this.buffer; // If it's a node.js buffer object

	      if (typeof Buffer$3 !== 'undefined' && Buffer$3.isBuffer(this.buffer)) {
	        return asRaw ? this.buffer.slice(0, this.position) : this.buffer.toString('binary', 0, this.position);
	      } else {
	        if (asRaw) {
	          // we support the slice command use it
	          if (this.buffer['slice'] != null) {
	            return this.buffer.slice(0, this.position);
	          } else {
	            // Create a new buffer to copy content to
	            var newBuffer = isUint8Array(this.buffer) ? new Uint8Array(new ArrayBuffer(this.position)) : new Array(this.position); // Copy content

	            for (var i = 0; i < this.position; i++) {
	              newBuffer[i] = this.buffer[i];
	            } // Return the buffer


	            return newBuffer;
	          }
	        } else {
	          return convertArraytoUtf8BinaryString(this.buffer, 0, this.position);
	        }
	      }
	    }
	    /**
	     * Length.
	     *
	     * @method
	     * @return {number} the length of the binary.
	     */

	  }, {
	    key: "length",
	    value: function length() {
	      return this.position;
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toJSON",
	    value: function toJSON() {
	      return this.buffer != null ? this.buffer.toString('base64') : '';
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toString",
	    value: function toString(format) {
	      return this.buffer != null ? this.buffer.slice(0, this.position).toString(format) : '';
	    }
	    /**
	     * @ignore
	     */

	  }, {
	    key: "toExtendedJSON",
	    value: function toExtendedJSON() {
	      var base64String = Buffer$3.isBuffer(this.buffer) ? this.buffer.toString('base64') : Buffer$3.from(this.buffer).toString('base64');
	      var subType = Number(this.sub_type).toString(16);
	      return {
	        $binary: {
	          base64: base64String,
	          subType: subType.length === 1 ? '0' + subType : subType
	        }
	      };
	    }
	    /**
	     * @ignore
	     */

	  }], [{
	    key: "fromExtendedJSON",
	    value: function fromExtendedJSON(doc) {
	      var type = doc.$binary.subType ? parseInt(doc.$binary.subType, 16) : 0;
	      var data = Buffer$3.from(doc.$binary.base64, 'base64');
	      return new Binary(data, type);
	    }
	  }]);

	  return Binary;
	}();
	/**
	 * Binary default subtype
	 * @ignore
	 */


	var BSON_BINARY_SUBTYPE_DEFAULT = 0;

	function isUint8Array(obj) {
	  return Object.prototype.toString.call(obj) === '[object Uint8Array]';
	}
	/**
	 * @ignore
	 */


	function writeStringToArray(data) {
	  // Create a buffer
	  var buffer$$1 = typeof Uint8Array !== 'undefined' ? new Uint8Array(new ArrayBuffer(data.length)) : new Array(data.length); // Write the content to the buffer

	  for (var i = 0; i < data.length; i++) {
	    buffer$$1[i] = data.charCodeAt(i);
	  } // Write the string to the buffer


	  return buffer$$1;
	}
	/**
	 * Convert Array ot Uint8Array to Binary String
	 *
	 * @ignore
	 */


	function convertArraytoUtf8BinaryString(byteArray, startIndex, endIndex) {
	  var result = '';

	  for (var i = startIndex; i < endIndex; i++) {
	    result = result + String.fromCharCode(byteArray[i]);
	  }

	  return result;
	}

	Binary.BUFFER_SIZE = 256;
	/**
	 * Default BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_DEFAULT = 0;
	/**
	 * Function BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_FUNCTION = 1;
	/**
	 * Byte Array BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_BYTE_ARRAY = 2;
	/**
	 * OLD UUID BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_UUID_OLD = 3;
	/**
	 * UUID BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_UUID = 4;
	/**
	 * MD5 BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_MD5 = 5;
	/**
	 * User BSON type
	 *
	 * @classconstant SUBTYPE_DEFAULT
	 **/

	Binary.SUBTYPE_USER_DEFINED = 128;
	Object.defineProperty(Binary.prototype, '_bsontype', {
	  value: 'Binary'
	});
	var binary = Binary;

	var constants = {
	  // BSON MAX VALUES
	  BSON_INT32_MAX: 0x7fffffff,
	  BSON_INT32_MIN: -0x80000000,
	  BSON_INT64_MAX: Math.pow(2, 63) - 1,
	  BSON_INT64_MIN: -Math.pow(2, 63),
	  // JS MAX PRECISE VALUES
	  JS_INT_MAX: 0x20000000000000,
	  // Any integer up to 2^53 can be precisely represented by a double.
	  JS_INT_MIN: -0x20000000000000,
	  // Any integer down to -2^53 can be precisely represented by a double.

	  /**
	   * Number BSON Type
	   *
	   * @classconstant BSON_DATA_NUMBER
	   **/
	  BSON_DATA_NUMBER: 1,

	  /**
	   * String BSON Type
	   *
	   * @classconstant BSON_DATA_STRING
	   **/
	  BSON_DATA_STRING: 2,

	  /**
	   * Object BSON Type
	   *
	   * @classconstant BSON_DATA_OBJECT
	   **/
	  BSON_DATA_OBJECT: 3,

	  /**
	   * Array BSON Type
	   *
	   * @classconstant BSON_DATA_ARRAY
	   **/
	  BSON_DATA_ARRAY: 4,

	  /**
	   * Binary BSON Type
	   *
	   * @classconstant BSON_DATA_BINARY
	   **/
	  BSON_DATA_BINARY: 5,

	  /**
	   * Binary BSON Type
	   *
	   * @classconstant BSON_DATA_UNDEFINED
	   **/
	  BSON_DATA_UNDEFINED: 6,

	  /**
	   * ObjectId BSON Type
	   *
	   * @classconstant BSON_DATA_OID
	   **/
	  BSON_DATA_OID: 7,

	  /**
	   * Boolean BSON Type
	   *
	   * @classconstant BSON_DATA_BOOLEAN
	   **/
	  BSON_DATA_BOOLEAN: 8,

	  /**
	   * Date BSON Type
	   *
	   * @classconstant BSON_DATA_DATE
	   **/
	  BSON_DATA_DATE: 9,

	  /**
	   * null BSON Type
	   *
	   * @classconstant BSON_DATA_NULL
	   **/
	  BSON_DATA_NULL: 10,

	  /**
	   * RegExp BSON Type
	   *
	   * @classconstant BSON_DATA_REGEXP
	   **/
	  BSON_DATA_REGEXP: 11,

	  /**
	   * Code BSON Type
	   *
	   * @classconstant BSON_DATA_DBPOINTER
	   **/
	  BSON_DATA_DBPOINTER: 12,

	  /**
	   * Code BSON Type
	   *
	   * @classconstant BSON_DATA_CODE
	   **/
	  BSON_DATA_CODE: 13,

	  /**
	   * Symbol BSON Type
	   *
	   * @classconstant BSON_DATA_SYMBOL
	   **/
	  BSON_DATA_SYMBOL: 14,

	  /**
	   * Code with Scope BSON Type
	   *
	   * @classconstant BSON_DATA_CODE_W_SCOPE
	   **/
	  BSON_DATA_CODE_W_SCOPE: 15,

	  /**
	   * 32 bit Integer BSON Type
	   *
	   * @classconstant BSON_DATA_INT
	   **/
	  BSON_DATA_INT: 16,

	  /**
	   * Timestamp BSON Type
	   *
	   * @classconstant BSON_DATA_TIMESTAMP
	   **/
	  BSON_DATA_TIMESTAMP: 17,

	  /**
	   * Long BSON Type
	   *
	   * @classconstant BSON_DATA_LONG
	   **/
	  BSON_DATA_LONG: 18,

	  /**
	   * Long BSON Type
	   *
	   * @classconstant BSON_DATA_DECIMAL128
	   **/
	  BSON_DATA_DECIMAL128: 19,

	  /**
	   * MinKey BSON Type
	   *
	   * @classconstant BSON_DATA_MIN_KEY
	   **/
	  BSON_DATA_MIN_KEY: 0xff,

	  /**
	   * MaxKey BSON Type
	   *
	   * @classconstant BSON_DATA_MAX_KEY
	   **/
	  BSON_DATA_MAX_KEY: 0x7f,

	  /**
	   * Binary Default Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_DEFAULT
	   **/
	  BSON_BINARY_SUBTYPE_DEFAULT: 0,

	  /**
	   * Binary Function Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_FUNCTION
	   **/
	  BSON_BINARY_SUBTYPE_FUNCTION: 1,

	  /**
	   * Binary Byte Array Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_BYTE_ARRAY
	   **/
	  BSON_BINARY_SUBTYPE_BYTE_ARRAY: 2,

	  /**
	   * Binary UUID Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_UUID
	   **/
	  BSON_BINARY_SUBTYPE_UUID: 3,

	  /**
	   * Binary MD5 Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_MD5
	   **/
	  BSON_BINARY_SUBTYPE_MD5: 4,

	  /**
	   * Binary User Defined Type
	   *
	   * @classconstant BSON_BINARY_SUBTYPE_USER_DEFINED
	   **/
	  BSON_BINARY_SUBTYPE_USER_DEFINED: 128
	};

	function _typeof$2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$2 = function _typeof(obj) { return typeof obj; }; } else { _typeof$2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$2(obj); }
	// const Map = require('./map');

	/**
	 * @namespace EJSON
	 */
	// all the types where we don't need to do any special processing and can just pass the EJSON
	//straight to type.fromExtendedJSON


	var keysToCodecs = {
	  $oid: objectid,
	  $binary: binary,
	  $symbol: symbol,
	  $numberInt: int_32,
	  $numberDecimal: decimal128,
	  $numberDouble: double_1,
	  $numberLong: long_1,
	  $minKey: min_key,
	  $maxKey: max_key,
	  $regularExpression: regexp,
	  $timestamp: timestamp
	};

	function deserializeValue(self, key, value, options) {
	  if (typeof value === 'number') {
	    if (options.relaxed) {
	      return value;
	    } // if it's an integer, should interpret as smallest BSON integer
	    // that can represent it exactly. (if out of range, interpret as double.)


	    if (Math.floor(value) === value) {
	      if (value >= BSON_INT32_MIN && value <= BSON_INT32_MAX) return new int_32(value);
	      if (value >= BSON_INT64_MIN && value <= BSON_INT64_MAX) return new long_1.fromNumber(value);
	    } // If the number is a non-integer or out of integer range, should interpret as BSON Double.


	    return new double_1(value);
	  } // from here on out we're looking for bson types, so bail if its not an object


	  if (value == null || _typeof$2(value) !== 'object') return value; // upgrade deprecated undefined to null

	  if (value.$undefined) return null;
	  var keys = Object.keys(value).filter(function (k) {
	    return k.startsWith('$') && value[k] != null;
	  });

	  for (var i = 0; i < keys.length; i++) {
	    var c = keysToCodecs[keys[i]];
	    if (c) return c.fromExtendedJSON(value, options);
	  }

	  if (value.$date != null) {
	    var d = value.$date;
	    var date = new Date();
	    if (typeof d === 'string') date.setTime(Date.parse(d));else if (long_1.isLong(d)) date.setTime(d.toNumber());else if (typeof d === 'number' && options.relaxed) date.setTime(d);
	    return date;
	  }

	  if (value.$code != null) {
	    var copy = Object.assign({}, value);

	    if (value.$scope) {
	      copy.$scope = deserializeValue(self, null, value.$scope);
	    }

	    return code.fromExtendedJSON(value);
	  }

	  if (value.$ref != null || value.$dbPointer != null) {
	    var v = value.$ref ? value : value.$dbPointer; // we run into this in a "degenerate EJSON" case (with $id and $ref order flipped)
	    // because of the order JSON.parse goes through the document

	    if (v instanceof db_ref) return v;
	    var dollarKeys = Object.keys(v).filter(function (k) {
	      return k.startsWith('$');
	    });
	    var valid = true;
	    dollarKeys.forEach(function (k) {
	      if (['$ref', '$id', '$db'].indexOf(k) === -1) valid = false;
	    }); // only make DBRef if $ keys are all valid

	    if (valid) return db_ref.fromExtendedJSON(v);
	  }

	  return value;
	}
	/**
	 * Parse an Extended JSON string, constructing the JavaScript value or object described by that
	 * string.
	 *
	 * @memberof EJSON
	 * @param {string} text
	 * @param {object} [options] Optional settings
	 * @param {boolean} [options.relaxed=true] Attempt to return native JS types where possible, rather than BSON types (if true)
	 * @return {object}
	 *
	 * @example
	 * const { EJSON } = require('bson');
	 * const text = '{ "int32": { "$numberInt": "10" } }';
	 *
	 * // prints { int32: { [String: '10'] _bsontype: 'Int32', value: '10' } }
	 * console.log(EJSON.parse(text, { relaxed: false }));
	 *
	 * // prints { int32: 10 }
	 * console.log(EJSON.parse(text));
	 */


	function parse(text, options) {
	  var _this = this;

	  options = Object.assign({}, {
	    relaxed: true
	  }, options); // relaxed implies not strict

	  if (typeof options.relaxed === 'boolean') options.strict = !options.relaxed;
	  if (typeof options.strict === 'boolean') options.relaxed = !options.strict;
	  return JSON.parse(text, function (key, value) {
	    return deserializeValue(_this, key, value, options);
	  });
	} //
	// Serializer
	//
	// MAX INT32 boundaries


	var BSON_INT32_MAX = 0x7fffffff,
	    BSON_INT32_MIN = -0x80000000,
	    BSON_INT64_MAX = 0x7fffffffffffffff,
	    BSON_INT64_MIN = -0x8000000000000000;
	/**
	 * Converts a BSON document to an Extended JSON string, optionally replacing values if a replacer
	 * function is specified or optionally including only the specified properties if a replacer array
	 * is specified.
	 *
	 * @memberof EJSON
	 * @param {object} value The value to convert to extended JSON
	 * @param {function|array} [replacer] A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string. If this value is null or not provided, all properties of the object are included in the resulting JSON string
	 * @param {string|number} [space] A String or Number object that's used to insert white space into the output JSON string for readability purposes.
	 * @param {object} [options] Optional settings
	 * @param {boolean} [options.relaxed=true] Enabled Extended JSON's `relaxed` mode
	 * @returns {string}
	 *
	 * @example
	 * const { EJSON } = require('bson');
	 * const Int32 = require('mongodb').Int32;
	 * const doc = { int32: new Int32(10) };
	 *
	 * // prints '{"int32":{"$numberInt":"10"}}'
	 * console.log(EJSON.stringify(doc, { relaxed: false }));
	 *
	 * // prints '{"int32":10}'
	 * console.log(EJSON.stringify(doc));
	 */

	function stringify(value, replacer, space, options) {
	  if (space != null && _typeof$2(space) === 'object') {
	    options = space;
	    space = 0;
	  }

	  if (replacer != null && _typeof$2(replacer) === 'object' && !Array.isArray(replacer)) {
	    options = replacer;
	    replacer = null;
	    space = 0;
	  }

	  options = Object.assign({}, {
	    relaxed: true
	  }, options);
	  var doc = Array.isArray(value) ? serializeArray(value, options) : serializeDocument(value, options);
	  return JSON.stringify(doc, replacer, space);
	}
	/**
	 * Serializes an object to an Extended JSON string, and reparse it as a JavaScript object.
	 *
	 * @memberof EJSON
	 * @param {object} bson The object to serialize
	 * @param {object} [options] Optional settings passed to the `stringify` function
	 * @return {object}
	 */


	function serialize(bson, options) {
	  options = options || {};
	  return JSON.parse(stringify(bson, options));
	}
	/**
	 * Deserializes an Extended JSON object into a plain JavaScript object with native/BSON types
	 *
	 * @memberof EJSON
	 * @param {object} ejson The Extended JSON object to deserialize
	 * @param {object} [options] Optional settings passed to the parse method
	 * @return {object}
	 */


	function deserialize(ejson, options) {
	  options = options || {};
	  return parse(JSON.stringify(ejson), options);
	}

	function serializeArray(array, options) {
	  return array.map(function (v) {
	    return serializeValue(v, options);
	  });
	}

	function getISOString(date) {
	  var isoStr = date.toISOString(); // we should only show milliseconds in timestamp if they're non-zero

	  return date.getUTCMilliseconds() !== 0 ? isoStr : isoStr.slice(0, -5) + 'Z';
	}

	function serializeValue(value, options) {
	  if (Array.isArray(value)) return serializeArray(value, options);
	  if (value === undefined) return null;

	  if (value instanceof Date) {
	    var dateNum = value.getTime(),
	        // is it in year range 1970-9999?
	    inRange = dateNum > -1 && dateNum < 253402318800000;
	    return options.relaxed && inRange ? {
	      $date: getISOString(value)
	    } : {
	      $date: {
	        $numberLong: value.getTime().toString()
	      }
	    };
	  }

	  if (typeof value === 'number' && !options.relaxed) {
	    // it's an integer
	    if (Math.floor(value) === value) {
	      var int32Range = value >= BSON_INT32_MIN && value <= BSON_INT32_MAX,
	          int64Range = value >= BSON_INT64_MIN && value <= BSON_INT64_MAX; // interpret as being of the smallest BSON integer type that can represent the number exactly

	      if (int32Range) return {
	        $numberInt: value.toString()
	      };
	      if (int64Range) return {
	        $numberLong: value.toString()
	      };
	    }

	    return {
	      $numberDouble: value.toString()
	    };
	  }

	  if (value instanceof RegExp) {
	    var flags = value.flags;

	    if (flags === undefined) {
	      flags = value.toString().match(/[gimuy]*$/)[0];
	    }

	    var rx = new regexp(value.source, flags);
	    return rx.toExtendedJSON();
	  }

	  if (value != null && _typeof$2(value) === 'object') return serializeDocument(value, options);
	  return value;
	}

	var BSON_TYPE_MAPPINGS = {
	  Binary: function Binary(o) {
	    return new binary(o.value(), o.subtype);
	  },
	  Code: function Code(o) {
	    return new code(o.code, o.scope);
	  },
	  DBRef: function DBRef(o) {
	    return new db_ref(o.collection || o.namespace, o.oid, o.db, o.fields);
	  },
	  // "namespace" for 1.x library backwards compat
	  Decimal128: function Decimal128(o) {
	    return new decimal128(o.bytes);
	  },
	  Double: function Double(o) {
	    return new double_1(o.value);
	  },
	  Int32: function Int32(o) {
	    return new int_32(o.value);
	  },
	  Long: function Long(o) {
	    return long_1.fromBits( // underscore variants for 1.x backwards compatibility
	    o.low != null ? o.low : o.low_, o.low != null ? o.high : o.high_, o.low != null ? o.unsigned : o.unsigned_);
	  },
	  MaxKey: function MaxKey() {
	    return new max_key();
	  },
	  MinKey: function MinKey() {
	    return new min_key();
	  },
	  ObjectID: function ObjectID(o) {
	    return new objectid(o);
	  },
	  ObjectId: function ObjectId(o) {
	    return new objectid(o);
	  },
	  // support 4.0.0/4.0.1 before _bsontype was reverted back to ObjectID
	  BSONRegExp: function BSONRegExp(o) {
	    return new regexp(o.pattern, o.options);
	  },
	  Symbol: function Symbol(o) {
	    return new symbol(o.value);
	  },
	  Timestamp: function Timestamp(o) {
	    return timestamp.fromBits(o.low, o.high);
	  }
	};

	function serializeDocument(doc, options) {
	  if (doc == null || _typeof$2(doc) !== 'object') throw new Error('not an object instance');
	  var bsontype = doc._bsontype;

	  if (typeof bsontype === 'undefined') {
	    // It's a regular object. Recursively serialize its property values.
	    var _doc = {};

	    for (var name in doc) {
	      _doc[name] = serializeValue(doc[name], options);
	    }

	    return _doc;
	  } else if (typeof bsontype === 'string') {
	    // the "document" is really just a BSON type object
	    var _doc2 = doc;

	    if (typeof _doc2.toExtendedJSON !== 'function') {
	      // There's no EJSON serialization function on the object. It's probably an
	      // object created by a previous version of this library (or another library)
	      // that's duck-typing objects to look like they were generated by this library).
	      // Copy the object into this library's version of that type.
	      var mapper = BSON_TYPE_MAPPINGS[bsontype];

	      if (!mapper) {
	        throw new TypeError('Unrecognized or invalid _bsontype: ' + bsontype);
	      }

	      _doc2 = mapper(_doc2);
	    } // Two BSON types may have nested objects that may need to be serialized too


	    if (bsontype === 'Code' && _doc2.scope) {
	      _doc2 = new code(_doc2.code, serializeValue(_doc2.scope, options));
	    } else if (bsontype === 'DBRef' && _doc2.oid) {
	      _doc2 = new db_ref(_doc2.collection, serializeValue(_doc2.oid, options), _doc2.db, _doc2.fields);
	    }

	    return _doc2.toExtendedJSON(options);
	  } else {
	    throw new Error('_bsontype must be a string, but was: ' + _typeof$2(bsontype));
	  }
	}

	var extended_json = {
	  parse: parse,
	  deserialize: deserialize,
	  serialize: serialize,
	  stringify: stringify
	};

	var FIRST_BIT = 0x80;
	var FIRST_TWO_BITS = 0xc0;
	var FIRST_THREE_BITS = 0xe0;
	var FIRST_FOUR_BITS = 0xf0;
	var FIRST_FIVE_BITS = 0xf8;
	var TWO_BIT_CHAR = 0xc0;
	var THREE_BIT_CHAR = 0xe0;
	var FOUR_BIT_CHAR = 0xf0;
	var CONTINUING_CHAR = 0x80;
	/**
	 * Determines if the passed in bytes are valid utf8
	 * @param {Buffer|Uint8Array} bytes An array of 8-bit bytes. Must be indexable and have length property
	 * @param {Number} start The index to start validating
	 * @param {Number} end The index to end validating
	 * @returns {boolean} True if valid utf8
	 */

	function validateUtf8(bytes, start, end) {
	  var continuation = 0;

	  for (var i = start; i < end; i += 1) {
	    var byte = bytes[i];

	    if (continuation) {
	      if ((byte & FIRST_TWO_BITS) !== CONTINUING_CHAR) {
	        return false;
	      }

	      continuation -= 1;
	    } else if (byte & FIRST_BIT) {
	      if ((byte & FIRST_THREE_BITS) === TWO_BIT_CHAR) {
	        continuation = 1;
	      } else if ((byte & FIRST_FOUR_BITS) === THREE_BIT_CHAR) {
	        continuation = 2;
	      } else if ((byte & FIRST_FIVE_BITS) === FOUR_BIT_CHAR) {
	        continuation = 3;
	      } else {
	        return false;
	      }
	    }
	  }

	  return !continuation;
	}

	var validateUtf8_1 = validateUtf8;
	var validate_utf8 = {
	  validateUtf8: validateUtf8_1
	};

	var Buffer$4 = buffer.Buffer;
	var validateUtf8$1 = validate_utf8.validateUtf8; // Internal long versions

	var JS_INT_MAX_LONG = long_1.fromNumber(constants.JS_INT_MAX);
	var JS_INT_MIN_LONG = long_1.fromNumber(constants.JS_INT_MIN);
	var functionCache = {};

	function deserialize$1(buffer$$1, options, isArray) {
	  options = options == null ? {} : options;
	  var index = options && options.index ? options.index : 0; // Read the document size

	  var size = buffer$$1[index] | buffer$$1[index + 1] << 8 | buffer$$1[index + 2] << 16 | buffer$$1[index + 3] << 24;

	  if (size < 5) {
	    throw new Error("bson size must be >= 5, is ".concat(size));
	  }

	  if (options.allowObjectSmallerThanBufferSize && buffer$$1.length < size) {
	    throw new Error("buffer length ".concat(buffer$$1.length, " must be >= bson size ").concat(size));
	  }

	  if (!options.allowObjectSmallerThanBufferSize && buffer$$1.length !== size) {
	    throw new Error("buffer length ".concat(buffer$$1.length, " must === bson size ").concat(size));
	  }

	  if (size + index > buffer$$1.length) {
	    throw new Error("(bson size ".concat(size, " + options.index ").concat(index, " must be <= buffer length ").concat(Buffer$4.byteLength(buffer$$1), ")"));
	  } // Illegal end value


	  if (buffer$$1[index + size - 1] !== 0) {
	    throw new Error("One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00");
	  } // Start deserializtion


	  return deserializeObject(buffer$$1, index, options, isArray);
	}

	function deserializeObject(buffer$$1, index, options, isArray) {
	  var evalFunctions = options['evalFunctions'] == null ? false : options['evalFunctions'];
	  var cacheFunctions = options['cacheFunctions'] == null ? false : options['cacheFunctions'];
	  var cacheFunctionsCrc32 = options['cacheFunctionsCrc32'] == null ? false : options['cacheFunctionsCrc32'];
	  if (!cacheFunctionsCrc32) var crc32 = null;
	  var fieldsAsRaw = options['fieldsAsRaw'] == null ? null : options['fieldsAsRaw']; // Return raw bson buffer instead of parsing it

	  var raw = options['raw'] == null ? false : options['raw']; // Return BSONRegExp objects instead of native regular expressions

	  var bsonRegExp = typeof options['bsonRegExp'] === 'boolean' ? options['bsonRegExp'] : false; // Controls the promotion of values vs wrapper classes

	  var promoteBuffers = options['promoteBuffers'] == null ? false : options['promoteBuffers'];
	  var promoteLongs = options['promoteLongs'] == null ? true : options['promoteLongs'];
	  var promoteValues = options['promoteValues'] == null ? true : options['promoteValues']; // Set the start index

	  var startIndex = index; // Validate that we have at least 4 bytes of buffer

	  if (buffer$$1.length < 5) throw new Error('corrupt bson message < 5 bytes long'); // Read the document size

	  var size = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Ensure buffer is valid size

	  if (size < 5 || size > buffer$$1.length) throw new Error('corrupt bson message'); // Create holding object

	  var object = isArray ? [] : {}; // Used for arrays to skip having to perform utf8 decoding

	  var arrayIndex = 0;
	  var done = false; // While we have more left data left keep parsing

	  while (!done) {
	    // Read the type
	    var elementType = buffer$$1[index++]; // If we get a zero it's the last byte, exit

	    if (elementType === 0) break; // Get the start search index

	    var i = index; // Locate the end of the c string

	    while (buffer$$1[i] !== 0x00 && i < buffer$$1.length) {
	      i++;
	    } // If are at the end of the buffer there is a problem with the document


	    if (i >= Buffer$4.byteLength(buffer$$1)) throw new Error('Bad BSON Document: illegal CString');
	    var name = isArray ? arrayIndex++ : buffer$$1.toString('utf8', index, i);
	    index = i + 1;

	    if (elementType === constants.BSON_DATA_STRING) {
	      var stringSize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	      if (stringSize <= 0 || stringSize > buffer$$1.length - index || buffer$$1[index + stringSize - 1] !== 0) throw new Error('bad string length in bson');

	      if (!validateUtf8$1(buffer$$1, index, index + stringSize - 1)) {
	        throw new Error('Invalid UTF-8 string in BSON document');
	      }

	      var s = buffer$$1.toString('utf8', index, index + stringSize - 1);
	      object[name] = s;
	      index = index + stringSize;
	    } else if (elementType === constants.BSON_DATA_OID) {
	      var oid = Buffer$4.alloc(12);
	      buffer$$1.copy(oid, 0, index, index + 12);
	      object[name] = new objectid(oid);
	      index = index + 12;
	    } else if (elementType === constants.BSON_DATA_INT && promoteValues === false) {
	      object[name] = new int_32(buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24);
	    } else if (elementType === constants.BSON_DATA_INT) {
	      object[name] = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	    } else if (elementType === constants.BSON_DATA_NUMBER && promoteValues === false) {
	      object[name] = new double_1(buffer$$1.readDoubleLE(index));
	      index = index + 8;
	    } else if (elementType === constants.BSON_DATA_NUMBER) {
	      object[name] = buffer$$1.readDoubleLE(index);
	      index = index + 8;
	    } else if (elementType === constants.BSON_DATA_DATE) {
	      var lowBits = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	      var highBits = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	      object[name] = new Date(new long_1(lowBits, highBits).toNumber());
	    } else if (elementType === constants.BSON_DATA_BOOLEAN) {
	      if (buffer$$1[index] !== 0 && buffer$$1[index] !== 1) throw new Error('illegal boolean type value');
	      object[name] = buffer$$1[index++] === 1;
	    } else if (elementType === constants.BSON_DATA_OBJECT) {
	      var _index = index;
	      var objectSize = buffer$$1[index] | buffer$$1[index + 1] << 8 | buffer$$1[index + 2] << 16 | buffer$$1[index + 3] << 24;
	      if (objectSize <= 0 || objectSize > buffer$$1.length - index) throw new Error('bad embedded document length in bson'); // We have a raw value

	      if (raw) {
	        object[name] = buffer$$1.slice(index, index + objectSize);
	      } else {
	        object[name] = deserializeObject(buffer$$1, _index, options, false);
	      }

	      index = index + objectSize;
	    } else if (elementType === constants.BSON_DATA_ARRAY) {
	      var _index2 = index;

	      var _objectSize = buffer$$1[index] | buffer$$1[index + 1] << 8 | buffer$$1[index + 2] << 16 | buffer$$1[index + 3] << 24;

	      var arrayOptions = options; // Stop index

	      var stopIndex = index + _objectSize; // All elements of array to be returned as raw bson

	      if (fieldsAsRaw && fieldsAsRaw[name]) {
	        arrayOptions = {};

	        for (var n in options) {
	          arrayOptions[n] = options[n];
	        }

	        arrayOptions['raw'] = true;
	      }

	      object[name] = deserializeObject(buffer$$1, _index2, arrayOptions, true);
	      index = index + _objectSize;
	      if (buffer$$1[index - 1] !== 0) throw new Error('invalid array terminator byte');
	      if (index !== stopIndex) throw new Error('corrupted array bson');
	    } else if (elementType === constants.BSON_DATA_UNDEFINED) {
	      object[name] = undefined;
	    } else if (elementType === constants.BSON_DATA_NULL) {
	      object[name] = null;
	    } else if (elementType === constants.BSON_DATA_LONG) {
	      // Unpack the low and high bits
	      var _lowBits = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      var _highBits = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      var long$$1 = new long_1(_lowBits, _highBits); // Promote the long if possible

	      if (promoteLongs && promoteValues === true) {
	        object[name] = long$$1.lessThanOrEqual(JS_INT_MAX_LONG) && long$$1.greaterThanOrEqual(JS_INT_MIN_LONG) ? long$$1.toNumber() : long$$1;
	      } else {
	        object[name] = long$$1;
	      }
	    } else if (elementType === constants.BSON_DATA_DECIMAL128) {
	      // Buffer to contain the decimal bytes
	      var bytes = Buffer$4.alloc(16); // Copy the next 16 bytes into the bytes buffer

	      buffer$$1.copy(bytes, 0, index, index + 16); // Update index

	      index = index + 16; // Assign the new Decimal128 value

	      var decimal128$$1 = new decimal128(bytes); // If we have an alternative mapper use that

	      object[name] = decimal128$$1.toObject ? decimal128$$1.toObject() : decimal128$$1;
	    } else if (elementType === constants.BSON_DATA_BINARY) {
	      var binarySize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	      var totalBinarySize = binarySize;
	      var subType = buffer$$1[index++]; // Did we have a negative binary size, throw

	      if (binarySize < 0) throw new Error('Negative binary type element size found'); // Is the length longer than the document

	      if (binarySize > Buffer$4.byteLength(buffer$$1)) throw new Error('Binary type size larger than document size'); // Decode as raw Buffer object if options specifies it

	      if (buffer$$1['slice'] != null) {
	        // If we have subtype 2 skip the 4 bytes for the size
	        if (subType === binary.SUBTYPE_BYTE_ARRAY) {
	          binarySize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	          if (binarySize < 0) throw new Error('Negative binary type element size found for subtype 0x02');
	          if (binarySize > totalBinarySize - 4) throw new Error('Binary type with subtype 0x02 contains to long binary size');
	          if (binarySize < totalBinarySize - 4) throw new Error('Binary type with subtype 0x02 contains to short binary size');
	        }

	        if (promoteBuffers && promoteValues) {
	          object[name] = buffer$$1.slice(index, index + binarySize);
	        } else {
	          object[name] = new binary(buffer$$1.slice(index, index + binarySize), subType);
	        }
	      } else {
	        var _buffer = typeof Uint8Array !== 'undefined' ? new Uint8Array(new ArrayBuffer(binarySize)) : new Array(binarySize); // If we have subtype 2 skip the 4 bytes for the size


	        if (subType === binary.SUBTYPE_BYTE_ARRAY) {
	          binarySize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;
	          if (binarySize < 0) throw new Error('Negative binary type element size found for subtype 0x02');
	          if (binarySize > totalBinarySize - 4) throw new Error('Binary type with subtype 0x02 contains to long binary size');
	          if (binarySize < totalBinarySize - 4) throw new Error('Binary type with subtype 0x02 contains to short binary size');
	        } // Copy the data


	        for (i = 0; i < binarySize; i++) {
	          _buffer[i] = buffer$$1[index + i];
	        }

	        if (promoteBuffers && promoteValues) {
	          object[name] = _buffer;
	        } else {
	          object[name] = new binary(_buffer, subType);
	        }
	      } // Update the index


	      index = index + binarySize;
	    } else if (elementType === constants.BSON_DATA_REGEXP && bsonRegExp === false) {
	      // Get the start search index
	      i = index; // Locate the end of the c string

	      while (buffer$$1[i] !== 0x00 && i < buffer$$1.length) {
	        i++;
	      } // If are at the end of the buffer there is a problem with the document


	      if (i >= buffer$$1.length) throw new Error('Bad BSON Document: illegal CString'); // Return the C string

	      var source = buffer$$1.toString('utf8', index, i); // Create the regexp

	      index = i + 1; // Get the start search index

	      i = index; // Locate the end of the c string

	      while (buffer$$1[i] !== 0x00 && i < buffer$$1.length) {
	        i++;
	      } // If are at the end of the buffer there is a problem with the document


	      if (i >= buffer$$1.length) throw new Error('Bad BSON Document: illegal CString'); // Return the C string

	      var regExpOptions = buffer$$1.toString('utf8', index, i);
	      index = i + 1; // For each option add the corresponding one for javascript

	      var optionsArray = new Array(regExpOptions.length); // Parse options

	      for (i = 0; i < regExpOptions.length; i++) {
	        switch (regExpOptions[i]) {
	          case 'm':
	            optionsArray[i] = 'm';
	            break;

	          case 's':
	            optionsArray[i] = 'g';
	            break;

	          case 'i':
	            optionsArray[i] = 'i';
	            break;
	        }
	      }

	      object[name] = new RegExp(source, optionsArray.join(''));
	    } else if (elementType === constants.BSON_DATA_REGEXP && bsonRegExp === true) {
	      // Get the start search index
	      i = index; // Locate the end of the c string

	      while (buffer$$1[i] !== 0x00 && i < buffer$$1.length) {
	        i++;
	      } // If are at the end of the buffer there is a problem with the document


	      if (i >= buffer$$1.length) throw new Error('Bad BSON Document: illegal CString'); // Return the C string

	      var _source = buffer$$1.toString('utf8', index, i);

	      index = i + 1; // Get the start search index

	      i = index; // Locate the end of the c string

	      while (buffer$$1[i] !== 0x00 && i < buffer$$1.length) {
	        i++;
	      } // If are at the end of the buffer there is a problem with the document


	      if (i >= buffer$$1.length) throw new Error('Bad BSON Document: illegal CString'); // Return the C string

	      var _regExpOptions = buffer$$1.toString('utf8', index, i);

	      index = i + 1; // Set the object

	      object[name] = new regexp(_source, _regExpOptions);
	    } else if (elementType === constants.BSON_DATA_SYMBOL) {
	      var _stringSize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      if (_stringSize <= 0 || _stringSize > buffer$$1.length - index || buffer$$1[index + _stringSize - 1] !== 0) throw new Error('bad string length in bson'); // symbol is deprecated - upgrade to string.

	      object[name] = buffer$$1.toString('utf8', index, index + _stringSize - 1);
	      index = index + _stringSize;
	    } else if (elementType === constants.BSON_DATA_TIMESTAMP) {
	      var _lowBits2 = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      var _highBits2 = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      object[name] = new timestamp(_lowBits2, _highBits2);
	    } else if (elementType === constants.BSON_DATA_MIN_KEY) {
	      object[name] = new min_key();
	    } else if (elementType === constants.BSON_DATA_MAX_KEY) {
	      object[name] = new max_key();
	    } else if (elementType === constants.BSON_DATA_CODE) {
	      var _stringSize2 = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24;

	      if (_stringSize2 <= 0 || _stringSize2 > buffer$$1.length - index || buffer$$1[index + _stringSize2 - 1] !== 0) throw new Error('bad string length in bson');
	      var functionString = buffer$$1.toString('utf8', index, index + _stringSize2 - 1); // If we are evaluating the functions

	      if (evalFunctions) {
	        // If we have cache enabled let's look for the md5 of the function in the cache
	        if (cacheFunctions) {
	          var hash = cacheFunctionsCrc32 ? crc32(functionString) : functionString; // Got to do this to avoid V8 deoptimizing the call due to finding eval

	          object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
	        } else {
	          object[name] = isolateEval(functionString);
	        }
	      } else {
	        object[name] = new code(functionString);
	      } // Update parse index position


	      index = index + _stringSize2;
	    } else if (elementType === constants.BSON_DATA_CODE_W_SCOPE) {
	      var totalSize = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Element cannot be shorter than totalSize + stringSize + documentSize + terminator

	      if (totalSize < 4 + 4 + 4 + 1) {
	        throw new Error('code_w_scope total size shorter minimum expected length');
	      } // Get the code string size


	      var _stringSize3 = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Check if we have a valid string


	      if (_stringSize3 <= 0 || _stringSize3 > buffer$$1.length - index || buffer$$1[index + _stringSize3 - 1] !== 0) throw new Error('bad string length in bson'); // Javascript function

	      var _functionString = buffer$$1.toString('utf8', index, index + _stringSize3 - 1); // Update parse index position


	      index = index + _stringSize3; // Parse the element

	      var _index3 = index; // Decode the size of the object document

	      var _objectSize2 = buffer$$1[index] | buffer$$1[index + 1] << 8 | buffer$$1[index + 2] << 16 | buffer$$1[index + 3] << 24; // Decode the scope object


	      var scopeObject = deserializeObject(buffer$$1, _index3, options, false); // Adjust the index

	      index = index + _objectSize2; // Check if field length is to short

	      if (totalSize < 4 + 4 + _objectSize2 + _stringSize3) {
	        throw new Error('code_w_scope total size is to short, truncating scope');
	      } // Check if totalSize field is to long


	      if (totalSize > 4 + 4 + _objectSize2 + _stringSize3) {
	        throw new Error('code_w_scope total size is to long, clips outer document');
	      } // If we are evaluating the functions


	      if (evalFunctions) {
	        // If we have cache enabled let's look for the md5 of the function in the cache
	        if (cacheFunctions) {
	          var _hash = cacheFunctionsCrc32 ? crc32(_functionString) : _functionString; // Got to do this to avoid V8 deoptimizing the call due to finding eval


	          object[name] = isolateEvalWithHash(functionCache, _hash, _functionString, object);
	        } else {
	          object[name] = isolateEval(_functionString);
	        }

	        object[name].scope = scopeObject;
	      } else {
	        object[name] = new code(_functionString, scopeObject);
	      }
	    } else if (elementType === constants.BSON_DATA_DBPOINTER) {
	      // Get the code string size
	      var _stringSize4 = buffer$$1[index++] | buffer$$1[index++] << 8 | buffer$$1[index++] << 16 | buffer$$1[index++] << 24; // Check if we have a valid string


	      if (_stringSize4 <= 0 || _stringSize4 > buffer$$1.length - index || buffer$$1[index + _stringSize4 - 1] !== 0) throw new Error('bad string length in bson'); // Namespace

	      if (!validateUtf8$1(buffer$$1, index, index + _stringSize4 - 1)) {
	        throw new Error('Invalid UTF-8 string in BSON document');
	      }

	      var namespace = buffer$$1.toString('utf8', index, index + _stringSize4 - 1); // Update parse index position

	      index = index + _stringSize4; // Read the oid

	      var oidBuffer = Buffer$4.alloc(12);
	      buffer$$1.copy(oidBuffer, 0, index, index + 12);

	      var _oid = new objectid(oidBuffer); // Update the index


	      index = index + 12; // Upgrade to DBRef type

	      object[name] = new db_ref(namespace, _oid);
	    } else {
	      throw new Error('Detected unknown BSON type ' + elementType.toString(16) + ' for fieldname "' + name + '", are you using the latest BSON parser?');
	    }
	  } // Check if the deserialization was against a valid array/object


	  if (size !== index - startIndex) {
	    if (isArray) throw new Error('corrupt array bson');
	    throw new Error('corrupt object bson');
	  } // check if object's $ keys are those of a DBRef


	  var dollarKeys = Object.keys(object).filter(function (k) {
	    return k.startsWith('$');
	  });
	  var valid = true;
	  dollarKeys.forEach(function (k) {
	    if (['$ref', '$id', '$db'].indexOf(k) === -1) valid = false;
	  }); // if a $key not in "$ref", "$id", "$db", don't make a DBRef

	  if (!valid) return object;

	  if (object['$id'] != null && object['$ref'] != null) {
	    var copy = Object.assign({}, object);
	    delete copy.$ref;
	    delete copy.$id;
	    delete copy.$db;
	    return new db_ref(object.$ref, object.$id, object.$db || null, copy);
	  }

	  return object;
	}
	/**
	 * Ensure eval is isolated.
	 *
	 * @ignore
	 * @api private
	 */


	function isolateEvalWithHash(functionCache, hash, functionString, object) {
	  // Contains the value we are going to set
	  var value = null; // Check for cache hit, eval if missing and return cached function

	  if (functionCache[hash] == null) {
	    eval('value = ' + functionString);
	    functionCache[hash] = value;
	  } // Set the object


	  return functionCache[hash].bind(object);
	}
	/**
	 * Ensure eval is isolated.
	 *
	 * @ignore
	 * @api private
	 */


	function isolateEval(functionString) {
	  // Contains the value we are going to set
	  var value = null; // Eval the function

	  eval('value = ' + functionString);
	  return value;
	}

	var deserializer = deserialize$1;

	// All rights reserved.
	//
	// Redistribution and use in source and binary forms, with or without
	// modification, are permitted provided that the following conditions are met:
	//
	//  * Redistributions of source code must retain the above copyright notice,
	//    this list of conditions and the following disclaimer.
	//
	//  * Redistributions in binary form must reproduce the above copyright notice,
	//    this list of conditions and the following disclaimer in the documentation
	//    and/or other materials provided with the distribution.
	//
	//  * Neither the name of Fair Oaks Labs, Inc. nor the names of its contributors
	//    may be used to endorse or promote products derived from this software
	//    without specific prior written permission.
	//
	// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	// ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
	// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
	// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
	// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
	// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
	// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	// POSSIBILITY OF SUCH DAMAGE.
	//
	//
	// Modifications to writeIEEE754 to support negative zeroes made by Brian White

	function readIEEE754(buffer$$1, offset, endian, mLen, nBytes) {
	  var e,
	      m,
	      bBE = endian === 'big',
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      nBits = -7,
	      i = bBE ? 0 : nBytes - 1,
	      d = bBE ? 1 : -1,
	      s = buffer$$1[offset + i];
	  i += d;
	  e = s & (1 << -nBits) - 1;
	  s >>= -nBits;
	  nBits += eLen;

	  for (; nBits > 0; e = e * 256 + buffer$$1[offset + i], i += d, nBits -= 8) {
	  }

	  m = e & (1 << -nBits) - 1;
	  e >>= -nBits;
	  nBits += mLen;

	  for (; nBits > 0; m = m * 256 + buffer$$1[offset + i], i += d, nBits -= 8) {
	  }

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : (s ? -1 : 1) * Infinity;
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }

	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
	}

	function writeIEEE754(buffer$$1, value, offset, endian, mLen, nBytes) {
	  var e,
	      m,
	      c,
	      bBE = endian === 'big',
	      eLen = nBytes * 8 - mLen - 1,
	      eMax = (1 << eLen) - 1,
	      eBias = eMax >> 1,
	      rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
	      i = bBE ? nBytes - 1 : 0,
	      d = bBE ? -1 : 1,
	      s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);

	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }

	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }

	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  if (isNaN(value)) m = 0;

	  while (mLen >= 8) {
	    buffer$$1[offset + i] = m & 0xff;
	    i += d;
	    m /= 256;
	    mLen -= 8;
	  }

	  e = e << mLen | m;
	  if (isNaN(value)) e += 8;
	  eLen += mLen;

	  while (eLen > 0) {
	    buffer$$1[offset + i] = e & 0xff;
	    i += d;
	    e /= 256;
	    eLen -= 8;
	  }

	  buffer$$1[offset + i - d] |= s * 128;
	}

	var float_parser = {
	  readIEEE754: readIEEE754,
	  writeIEEE754: writeIEEE754
	};

	function _typeof$3(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$3 = function _typeof(obj) { return typeof obj; }; } else { _typeof$3 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$3(obj); }

	var Buffer$5 = buffer.Buffer;
	var writeIEEE754$1 = float_parser.writeIEEE754;
	var normalizedFunctionString$1 = utils.normalizedFunctionString;
	var regexp$1 = /\x00/; // eslint-disable-line no-control-regex

	var ignoreKeys = new Set(['$db', '$ref', '$id', '$clusterTime']); // To ensure that 0.4 of node works correctly

	var isDate$1 = function isDate(d) {
	  return _typeof$3(d) === 'object' && Object.prototype.toString.call(d) === '[object Date]';
	};

	var isRegExp$1 = function isRegExp(d) {
	  return Object.prototype.toString.call(d) === '[object RegExp]';
	};

	function serializeString(buffer$$1, key, value, index, isArray) {
	  // Encode String type
	  buffer$$1[index++] = constants.BSON_DATA_STRING; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes + 1;
	  buffer$$1[index - 1] = 0; // Write the string

	  var size = buffer$$1.write(value, index + 4, 'utf8'); // Write the size of the string to buffer

	  buffer$$1[index + 3] = size + 1 >> 24 & 0xff;
	  buffer$$1[index + 2] = size + 1 >> 16 & 0xff;
	  buffer$$1[index + 1] = size + 1 >> 8 & 0xff;
	  buffer$$1[index] = size + 1 & 0xff; // Update index

	  index = index + 4 + size; // Write zero

	  buffer$$1[index++] = 0;
	  return index;
	}

	function serializeNumber(buffer$$1, key, value, index, isArray) {
	  // We have an integer value
	  if (Math.floor(value) === value && value >= constants.JS_INT_MIN && value <= constants.JS_INT_MAX) {
	    // If the value fits in 32 bits encode as int, if it fits in a double
	    // encode it as a double, otherwise long
	    if (value >= constants.BSON_INT32_MIN && value <= constants.BSON_INT32_MAX) {
	      // Set int type 32 bits or less
	      buffer$$1[index++] = constants.BSON_DATA_INT; // Number of written bytes

	      var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	      index = index + numberOfWrittenBytes;
	      buffer$$1[index++] = 0; // Write the int value

	      buffer$$1[index++] = value & 0xff;
	      buffer$$1[index++] = value >> 8 & 0xff;
	      buffer$$1[index++] = value >> 16 & 0xff;
	      buffer$$1[index++] = value >> 24 & 0xff;
	    } else if (value >= constants.JS_INT_MIN && value <= constants.JS_INT_MAX) {
	      // Encode as double
	      buffer$$1[index++] = constants.BSON_DATA_NUMBER; // Number of written bytes

	      var _numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name


	      index = index + _numberOfWrittenBytes;
	      buffer$$1[index++] = 0; // Write float

	      writeIEEE754$1(buffer$$1, value, index, 'little', 52, 8); // Ajust index

	      index = index + 8;
	    } else {
	      // Set long type
	      buffer$$1[index++] = constants.BSON_DATA_LONG; // Number of written bytes

	      var _numberOfWrittenBytes2 = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name


	      index = index + _numberOfWrittenBytes2;
	      buffer$$1[index++] = 0;
	      var longVal = long_1.fromNumber(value);
	      var lowBits = longVal.getLowBits();
	      var highBits = longVal.getHighBits(); // Encode low bits

	      buffer$$1[index++] = lowBits & 0xff;
	      buffer$$1[index++] = lowBits >> 8 & 0xff;
	      buffer$$1[index++] = lowBits >> 16 & 0xff;
	      buffer$$1[index++] = lowBits >> 24 & 0xff; // Encode high bits

	      buffer$$1[index++] = highBits & 0xff;
	      buffer$$1[index++] = highBits >> 8 & 0xff;
	      buffer$$1[index++] = highBits >> 16 & 0xff;
	      buffer$$1[index++] = highBits >> 24 & 0xff;
	    }
	  } else {
	    // Encode as double
	    buffer$$1[index++] = constants.BSON_DATA_NUMBER; // Number of written bytes

	    var _numberOfWrittenBytes3 = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name


	    index = index + _numberOfWrittenBytes3;
	    buffer$$1[index++] = 0; // Write float

	    writeIEEE754$1(buffer$$1, value, index, 'little', 52, 8); // Ajust index

	    index = index + 8;
	  }

	  return index;
	}

	function serializeNull(buffer$$1, key, value, index, isArray) {
	  // Set long type
	  buffer$$1[index++] = constants.BSON_DATA_NULL; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0;
	  return index;
	}

	function serializeBoolean(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_BOOLEAN; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Encode the boolean value

	  buffer$$1[index++] = value ? 1 : 0;
	  return index;
	}

	function serializeDate(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_DATE; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the date

	  var dateInMilis = long_1.fromNumber(value.getTime());
	  var lowBits = dateInMilis.getLowBits();
	  var highBits = dateInMilis.getHighBits(); // Encode low bits

	  buffer$$1[index++] = lowBits & 0xff;
	  buffer$$1[index++] = lowBits >> 8 & 0xff;
	  buffer$$1[index++] = lowBits >> 16 & 0xff;
	  buffer$$1[index++] = lowBits >> 24 & 0xff; // Encode high bits

	  buffer$$1[index++] = highBits & 0xff;
	  buffer$$1[index++] = highBits >> 8 & 0xff;
	  buffer$$1[index++] = highBits >> 16 & 0xff;
	  buffer$$1[index++] = highBits >> 24 & 0xff;
	  return index;
	}

	function serializeRegExp(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_REGEXP; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0;

	  if (value.source && value.source.match(regexp$1) != null) {
	    throw Error('value ' + value.source + ' must not contain null bytes');
	  } // Adjust the index


	  index = index + buffer$$1.write(value.source, index, 'utf8'); // Write zero

	  buffer$$1[index++] = 0x00; // Write the parameters

	  if (value.ignoreCase) buffer$$1[index++] = 0x69; // i

	  if (value.global) buffer$$1[index++] = 0x73; // s

	  if (value.multiline) buffer$$1[index++] = 0x6d; // m
	  // Add ending zero

	  buffer$$1[index++] = 0x00;
	  return index;
	}

	function serializeBSONRegExp(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_REGEXP; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Check the pattern for 0 bytes

	  if (value.pattern.match(regexp$1) != null) {
	    // The BSON spec doesn't allow keys with null bytes because keys are
	    // null-terminated.
	    throw Error('pattern ' + value.pattern + ' must not contain null bytes');
	  } // Adjust the index


	  index = index + buffer$$1.write(value.pattern, index, 'utf8'); // Write zero

	  buffer$$1[index++] = 0x00; // Write the options

	  index = index + buffer$$1.write(value.options.split('').sort().join(''), index, 'utf8'); // Add ending zero

	  buffer$$1[index++] = 0x00;
	  return index;
	}

	function serializeMinMax(buffer$$1, key, value, index, isArray) {
	  // Write the type of either min or max key
	  if (value === null) {
	    buffer$$1[index++] = constants.BSON_DATA_NULL;
	  } else if (value._bsontype === 'MinKey') {
	    buffer$$1[index++] = constants.BSON_DATA_MIN_KEY;
	  } else {
	    buffer$$1[index++] = constants.BSON_DATA_MAX_KEY;
	  } // Number of written bytes


	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0;
	  return index;
	}

	function serializeObjectId(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_OID; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the objectId into the shared buffer

	  if (typeof value.id === 'string') {
	    buffer$$1.write(value.id, index, 'binary');
	  } else if (value.id && value.id.copy) {
	    value.id.copy(buffer$$1, index, 0, 12);
	  } else {
	    throw new TypeError('object [' + JSON.stringify(value) + '] is not a valid ObjectId');
	  } // Ajust index


	  return index + 12;
	}

	function serializeBuffer(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_BINARY; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Get size of the buffer (current write point)

	  var size = value.length; // Write the size of the string to buffer

	  buffer$$1[index++] = size & 0xff;
	  buffer$$1[index++] = size >> 8 & 0xff;
	  buffer$$1[index++] = size >> 16 & 0xff;
	  buffer$$1[index++] = size >> 24 & 0xff; // Write the default subtype

	  buffer$$1[index++] = constants.BSON_BINARY_SUBTYPE_DEFAULT; // Copy the content form the binary field to the buffer

	  value.copy(buffer$$1, index, 0, size); // Adjust the index

	  index = index + size;
	  return index;
	}

	function serializeObject(buffer$$1, key, value, index, checkKeys, depth, serializeFunctions, ignoreUndefined, isArray, path) {
	  for (var i = 0; i < path.length; i++) {
	    if (path[i] === value) throw new Error('cyclic dependency detected');
	  } // Push value to stack


	  path.push(value); // Write the type

	  buffer$$1[index++] = Array.isArray(value) ? constants.BSON_DATA_ARRAY : constants.BSON_DATA_OBJECT; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0;
	  var endIndex = serializeInto(buffer$$1, value, checkKeys, index, depth + 1, serializeFunctions, ignoreUndefined, path); // Pop stack

	  path.pop();
	  return endIndex;
	}

	function serializeDecimal128(buffer$$1, key, value, index, isArray) {
	  buffer$$1[index++] = constants.BSON_DATA_DECIMAL128; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the data from the value

	  value.bytes.copy(buffer$$1, index, 0, 16);
	  return index + 16;
	}

	function serializeLong(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = value._bsontype === 'Long' ? constants.BSON_DATA_LONG : constants.BSON_DATA_TIMESTAMP; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the date

	  var lowBits = value.getLowBits();
	  var highBits = value.getHighBits(); // Encode low bits

	  buffer$$1[index++] = lowBits & 0xff;
	  buffer$$1[index++] = lowBits >> 8 & 0xff;
	  buffer$$1[index++] = lowBits >> 16 & 0xff;
	  buffer$$1[index++] = lowBits >> 24 & 0xff; // Encode high bits

	  buffer$$1[index++] = highBits & 0xff;
	  buffer$$1[index++] = highBits >> 8 & 0xff;
	  buffer$$1[index++] = highBits >> 16 & 0xff;
	  buffer$$1[index++] = highBits >> 24 & 0xff;
	  return index;
	}

	function serializeInt32(buffer$$1, key, value, index, isArray) {
	  // Set int type 32 bits or less
	  buffer$$1[index++] = constants.BSON_DATA_INT; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the int value

	  buffer$$1[index++] = value & 0xff;
	  buffer$$1[index++] = value >> 8 & 0xff;
	  buffer$$1[index++] = value >> 16 & 0xff;
	  buffer$$1[index++] = value >> 24 & 0xff;
	  return index;
	}

	function serializeDouble(buffer$$1, key, value, index, isArray) {
	  // Encode as double
	  buffer$$1[index++] = constants.BSON_DATA_NUMBER; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write float

	  writeIEEE754$1(buffer$$1, value.value, index, 'little', 52, 8); // Adjust index

	  index = index + 8;
	  return index;
	}

	function serializeFunction(buffer$$1, key, value, index, checkKeys, depth, isArray) {
	  buffer$$1[index++] = constants.BSON_DATA_CODE; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Function string

	  var functionString = normalizedFunctionString$1(value); // Write the string

	  var size = buffer$$1.write(functionString, index + 4, 'utf8') + 1; // Write the size of the string to buffer

	  buffer$$1[index] = size & 0xff;
	  buffer$$1[index + 1] = size >> 8 & 0xff;
	  buffer$$1[index + 2] = size >> 16 & 0xff;
	  buffer$$1[index + 3] = size >> 24 & 0xff; // Update index

	  index = index + 4 + size - 1; // Write zero

	  buffer$$1[index++] = 0;
	  return index;
	}

	function serializeCode(buffer$$1, key, value, index, checkKeys, depth, serializeFunctions, ignoreUndefined, isArray) {
	  if (value.scope && _typeof$3(value.scope) === 'object') {
	    // Write the type
	    buffer$$1[index++] = constants.BSON_DATA_CODE_W_SCOPE; // Number of written bytes

	    var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	    index = index + numberOfWrittenBytes;
	    buffer$$1[index++] = 0; // Starting index

	    var startIndex = index; // Serialize the function
	    // Get the function string

	    var functionString = typeof value.code === 'string' ? value.code : value.code.toString(); // Index adjustment

	    index = index + 4; // Write string into buffer

	    var codeSize = buffer$$1.write(functionString, index + 4, 'utf8') + 1; // Write the size of the string to buffer

	    buffer$$1[index] = codeSize & 0xff;
	    buffer$$1[index + 1] = codeSize >> 8 & 0xff;
	    buffer$$1[index + 2] = codeSize >> 16 & 0xff;
	    buffer$$1[index + 3] = codeSize >> 24 & 0xff; // Write end 0

	    buffer$$1[index + 4 + codeSize - 1] = 0; // Write the

	    index = index + codeSize + 4; //
	    // Serialize the scope value

	    var endIndex = serializeInto(buffer$$1, value.scope, checkKeys, index, depth + 1, serializeFunctions, ignoreUndefined);
	    index = endIndex - 1; // Writ the total

	    var totalSize = endIndex - startIndex; // Write the total size of the object

	    buffer$$1[startIndex++] = totalSize & 0xff;
	    buffer$$1[startIndex++] = totalSize >> 8 & 0xff;
	    buffer$$1[startIndex++] = totalSize >> 16 & 0xff;
	    buffer$$1[startIndex++] = totalSize >> 24 & 0xff; // Write trailing zero

	    buffer$$1[index++] = 0;
	  } else {
	    buffer$$1[index++] = constants.BSON_DATA_CODE; // Number of written bytes

	    var _numberOfWrittenBytes4 = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name


	    index = index + _numberOfWrittenBytes4;
	    buffer$$1[index++] = 0; // Function string

	    var _functionString = value.code.toString(); // Write the string


	    var size = buffer$$1.write(_functionString, index + 4, 'utf8') + 1; // Write the size of the string to buffer

	    buffer$$1[index] = size & 0xff;
	    buffer$$1[index + 1] = size >> 8 & 0xff;
	    buffer$$1[index + 2] = size >> 16 & 0xff;
	    buffer$$1[index + 3] = size >> 24 & 0xff; // Update index

	    index = index + 4 + size - 1; // Write zero

	    buffer$$1[index++] = 0;
	  }

	  return index;
	}

	function serializeBinary(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_BINARY; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Extract the buffer

	  var data = value.value(true); // Calculate size

	  var size = value.position; // Add the deprecated 02 type 4 bytes of size to total

	  if (value.sub_type === binary.SUBTYPE_BYTE_ARRAY) size = size + 4; // Write the size of the string to buffer

	  buffer$$1[index++] = size & 0xff;
	  buffer$$1[index++] = size >> 8 & 0xff;
	  buffer$$1[index++] = size >> 16 & 0xff;
	  buffer$$1[index++] = size >> 24 & 0xff; // Write the subtype to the buffer

	  buffer$$1[index++] = value.sub_type; // If we have binary type 2 the 4 first bytes are the size

	  if (value.sub_type === binary.SUBTYPE_BYTE_ARRAY) {
	    size = size - 4;
	    buffer$$1[index++] = size & 0xff;
	    buffer$$1[index++] = size >> 8 & 0xff;
	    buffer$$1[index++] = size >> 16 & 0xff;
	    buffer$$1[index++] = size >> 24 & 0xff;
	  } // Write the data to the object


	  data.copy(buffer$$1, index, 0, value.position); // Adjust the index

	  index = index + value.position;
	  return index;
	}

	function serializeSymbol(buffer$$1, key, value, index, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_SYMBOL; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0; // Write the string

	  var size = buffer$$1.write(value.value, index + 4, 'utf8') + 1; // Write the size of the string to buffer

	  buffer$$1[index] = size & 0xff;
	  buffer$$1[index + 1] = size >> 8 & 0xff;
	  buffer$$1[index + 2] = size >> 16 & 0xff;
	  buffer$$1[index + 3] = size >> 24 & 0xff; // Update index

	  index = index + 4 + size - 1; // Write zero

	  buffer$$1[index++] = 0x00;
	  return index;
	}

	function serializeDBRef(buffer$$1, key, value, index, depth, serializeFunctions, isArray) {
	  // Write the type
	  buffer$$1[index++] = constants.BSON_DATA_OBJECT; // Number of written bytes

	  var numberOfWrittenBytes = !isArray ? buffer$$1.write(key, index, 'utf8') : buffer$$1.write(key, index, 'ascii'); // Encode the name

	  index = index + numberOfWrittenBytes;
	  buffer$$1[index++] = 0;
	  var startIndex = index;
	  var endIndex;
	  var output = {
	    $ref: value.collection || value.namespace,
	    // "namespace" was what library 1.x called "collection"
	    $id: value.oid
	  };
	  if (value.db != null) output.$db = value.db;
	  output = Object.assign(output, value.fields);
	  endIndex = serializeInto(buffer$$1, output, false, index, depth + 1, serializeFunctions); // Calculate object size

	  var size = endIndex - startIndex; // Write the size

	  buffer$$1[startIndex++] = size & 0xff;
	  buffer$$1[startIndex++] = size >> 8 & 0xff;
	  buffer$$1[startIndex++] = size >> 16 & 0xff;
	  buffer$$1[startIndex++] = size >> 24 & 0xff; // Set index

	  return endIndex;
	}

	function serializeInto(buffer$$1, object, checkKeys, startingIndex, depth, serializeFunctions, ignoreUndefined, path) {
	  startingIndex = startingIndex || 0;
	  path = path || []; // Push the object to the path

	  path.push(object); // Start place to serialize into

	  var index = startingIndex + 4; // Special case isArray

	  if (Array.isArray(object)) {
	    // Get object keys
	    for (var i = 0; i < object.length; i++) {
	      var key = '' + i;
	      var value = object[i]; // Is there an override value

	      if (value && value.toBSON) {
	        if (typeof value.toBSON !== 'function') throw new TypeError('toBSON is not a function');
	        value = value.toBSON();
	      }

	      var type = _typeof$3(value);

	      if (type === 'string') {
	        index = serializeString(buffer$$1, key, value, index, true);
	      } else if (type === 'number') {
	        index = serializeNumber(buffer$$1, key, value, index, true);
	      } else if (type === 'boolean') {
	        index = serializeBoolean(buffer$$1, key, value, index, true);
	      } else if (value instanceof Date || isDate$1(value)) {
	        index = serializeDate(buffer$$1, key, value, index, true);
	      } else if (value === undefined) {
	        index = serializeNull(buffer$$1, key, value, index, true);
	      } else if (value === null) {
	        index = serializeNull(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'ObjectId' || value['_bsontype'] === 'ObjectID') {
	        index = serializeObjectId(buffer$$1, key, value, index, true);
	      } else if (Buffer$5.isBuffer(value)) {
	        index = serializeBuffer(buffer$$1, key, value, index, true);
	      } else if (value instanceof RegExp || isRegExp$1(value)) {
	        index = serializeRegExp(buffer$$1, key, value, index, true);
	      } else if (type === 'object' && value['_bsontype'] == null) {
	        index = serializeObject(buffer$$1, key, value, index, checkKeys, depth, serializeFunctions, ignoreUndefined, true, path);
	      } else if (type === 'object' && value['_bsontype'] === 'Decimal128') {
	        index = serializeDecimal128(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'Long' || value['_bsontype'] === 'Timestamp') {
	        index = serializeLong(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'Double') {
	        index = serializeDouble(buffer$$1, key, value, index, true);
	      } else if (typeof value === 'function' && serializeFunctions) {
	        index = serializeFunction(buffer$$1, key, value, index, checkKeys, depth, serializeFunctions, true);
	      } else if (value['_bsontype'] === 'Code') {
	        index = serializeCode(buffer$$1, key, value, index, checkKeys, depth, serializeFunctions, ignoreUndefined, true);
	      } else if (value['_bsontype'] === 'Binary') {
	        index = serializeBinary(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'Symbol') {
	        index = serializeSymbol(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'DBRef') {
	        index = serializeDBRef(buffer$$1, key, value, index, depth, serializeFunctions, true);
	      } else if (value['_bsontype'] === 'BSONRegExp') {
	        index = serializeBSONRegExp(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'Int32') {
	        index = serializeInt32(buffer$$1, key, value, index, true);
	      } else if (value['_bsontype'] === 'MinKey' || value['_bsontype'] === 'MaxKey') {
	        index = serializeMinMax(buffer$$1, key, value, index, true);
	      } else if (typeof value['_bsontype'] !== 'undefined') {
	        throw new TypeError('Unrecognized or invalid _bsontype: ' + value['_bsontype']);
	      }
	    }
	  } else if (object instanceof map) {
	    var iterator = object.entries();
	    var done = false;

	    while (!done) {
	      // Unpack the next entry
	      var entry = iterator.next();
	      done = entry.done; // Are we done, then skip and terminate

	      if (done) continue; // Get the entry values

	      var _key = entry.value[0];
	      var _value = entry.value[1]; // Check the type of the value

	      var _type = _typeof$3(_value); // Check the key and throw error if it's illegal


	      if (typeof _key === 'string' && !ignoreKeys.has(_key)) {
	        if (_key.match(regexp$1) != null) {
	          // The BSON spec doesn't allow keys with null bytes because keys are
	          // null-terminated.
	          throw Error('key ' + _key + ' must not contain null bytes');
	        }

	        if (checkKeys) {
	          if ('$' === _key[0]) {
	            throw Error('key ' + _key + " must not start with '$'");
	          } else if (~_key.indexOf('.')) {
	            throw Error('key ' + _key + " must not contain '.'");
	          }
	        }
	      }

	      if (_type === 'string') {
	        index = serializeString(buffer$$1, _key, _value, index);
	      } else if (_type === 'number') {
	        index = serializeNumber(buffer$$1, _key, _value, index);
	      } else if (_type === 'boolean') {
	        index = serializeBoolean(buffer$$1, _key, _value, index);
	      } else if (_value instanceof Date || isDate$1(_value)) {
	        index = serializeDate(buffer$$1, _key, _value, index);
	      } else if (_value === null || _value === undefined && ignoreUndefined === false) {
	        index = serializeNull(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'ObjectId' || _value['_bsontype'] === 'ObjectID') {
	        index = serializeObjectId(buffer$$1, _key, _value, index);
	      } else if (Buffer$5.isBuffer(_value)) {
	        index = serializeBuffer(buffer$$1, _key, _value, index);
	      } else if (_value instanceof RegExp || isRegExp$1(_value)) {
	        index = serializeRegExp(buffer$$1, _key, _value, index);
	      } else if (_type === 'object' && _value['_bsontype'] == null) {
	        index = serializeObject(buffer$$1, _key, _value, index, checkKeys, depth, serializeFunctions, ignoreUndefined, false, path);
	      } else if (_type === 'object' && _value['_bsontype'] === 'Decimal128') {
	        index = serializeDecimal128(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'Long' || _value['_bsontype'] === 'Timestamp') {
	        index = serializeLong(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'Double') {
	        index = serializeDouble(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'Code') {
	        index = serializeCode(buffer$$1, _key, _value, index, checkKeys, depth, serializeFunctions, ignoreUndefined);
	      } else if (typeof _value === 'function' && serializeFunctions) {
	        index = serializeFunction(buffer$$1, _key, _value, index, checkKeys, depth, serializeFunctions);
	      } else if (_value['_bsontype'] === 'Binary') {
	        index = serializeBinary(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'Symbol') {
	        index = serializeSymbol(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'DBRef') {
	        index = serializeDBRef(buffer$$1, _key, _value, index, depth, serializeFunctions);
	      } else if (_value['_bsontype'] === 'BSONRegExp') {
	        index = serializeBSONRegExp(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'Int32') {
	        index = serializeInt32(buffer$$1, _key, _value, index);
	      } else if (_value['_bsontype'] === 'MinKey' || _value['_bsontype'] === 'MaxKey') {
	        index = serializeMinMax(buffer$$1, _key, _value, index);
	      } else if (typeof _value['_bsontype'] !== 'undefined') {
	        throw new TypeError('Unrecognized or invalid _bsontype: ' + _value['_bsontype']);
	      }
	    }
	  } else {
	    // Did we provide a custom serialization method
	    if (object.toBSON) {
	      if (typeof object.toBSON !== 'function') throw new TypeError('toBSON is not a function');
	      object = object.toBSON();
	      if (object != null && _typeof$3(object) !== 'object') throw new TypeError('toBSON function did not return an object');
	    } // Iterate over all the keys


	    for (var _key2 in object) {
	      var _value2 = object[_key2]; // Is there an override value

	      if (_value2 && _value2.toBSON) {
	        if (typeof _value2.toBSON !== 'function') throw new TypeError('toBSON is not a function');
	        _value2 = _value2.toBSON();
	      } // Check the type of the value


	      var _type2 = _typeof$3(_value2); // Check the key and throw error if it's illegal


	      if (typeof _key2 === 'string' && !ignoreKeys.has(_key2)) {
	        if (_key2.match(regexp$1) != null) {
	          // The BSON spec doesn't allow keys with null bytes because keys are
	          // null-terminated.
	          throw Error('key ' + _key2 + ' must not contain null bytes');
	        }

	        if (checkKeys) {
	          if ('$' === _key2[0]) {
	            throw Error('key ' + _key2 + " must not start with '$'");
	          } else if (~_key2.indexOf('.')) {
	            throw Error('key ' + _key2 + " must not contain '.'");
	          }
	        }
	      }

	      if (_type2 === 'string') {
	        index = serializeString(buffer$$1, _key2, _value2, index);
	      } else if (_type2 === 'number') {
	        index = serializeNumber(buffer$$1, _key2, _value2, index);
	      } else if (_type2 === 'boolean') {
	        index = serializeBoolean(buffer$$1, _key2, _value2, index);
	      } else if (_value2 instanceof Date || isDate$1(_value2)) {
	        index = serializeDate(buffer$$1, _key2, _value2, index);
	      } else if (_value2 === undefined) {
	        if (ignoreUndefined === false) index = serializeNull(buffer$$1, _key2, _value2, index);
	      } else if (_value2 === null) {
	        index = serializeNull(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'ObjectId' || _value2['_bsontype'] === 'ObjectID') {
	        index = serializeObjectId(buffer$$1, _key2, _value2, index);
	      } else if (Buffer$5.isBuffer(_value2)) {
	        index = serializeBuffer(buffer$$1, _key2, _value2, index);
	      } else if (_value2 instanceof RegExp || isRegExp$1(_value2)) {
	        index = serializeRegExp(buffer$$1, _key2, _value2, index);
	      } else if (_type2 === 'object' && _value2['_bsontype'] == null) {
	        index = serializeObject(buffer$$1, _key2, _value2, index, checkKeys, depth, serializeFunctions, ignoreUndefined, false, path);
	      } else if (_type2 === 'object' && _value2['_bsontype'] === 'Decimal128') {
	        index = serializeDecimal128(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'Long' || _value2['_bsontype'] === 'Timestamp') {
	        index = serializeLong(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'Double') {
	        index = serializeDouble(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'Code') {
	        index = serializeCode(buffer$$1, _key2, _value2, index, checkKeys, depth, serializeFunctions, ignoreUndefined);
	      } else if (typeof _value2 === 'function' && serializeFunctions) {
	        index = serializeFunction(buffer$$1, _key2, _value2, index, checkKeys, depth, serializeFunctions);
	      } else if (_value2['_bsontype'] === 'Binary') {
	        index = serializeBinary(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'Symbol') {
	        index = serializeSymbol(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'DBRef') {
	        index = serializeDBRef(buffer$$1, _key2, _value2, index, depth, serializeFunctions);
	      } else if (_value2['_bsontype'] === 'BSONRegExp') {
	        index = serializeBSONRegExp(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'Int32') {
	        index = serializeInt32(buffer$$1, _key2, _value2, index);
	      } else if (_value2['_bsontype'] === 'MinKey' || _value2['_bsontype'] === 'MaxKey') {
	        index = serializeMinMax(buffer$$1, _key2, _value2, index);
	      } else if (typeof _value2['_bsontype'] !== 'undefined') {
	        throw new TypeError('Unrecognized or invalid _bsontype: ' + _value2['_bsontype']);
	      }
	    }
	  } // Remove the path


	  path.pop(); // Final padding byte for object

	  buffer$$1[index++] = 0x00; // Final size

	  var size = index - startingIndex; // Write the size of the object

	  buffer$$1[startingIndex++] = size & 0xff;
	  buffer$$1[startingIndex++] = size >> 8 & 0xff;
	  buffer$$1[startingIndex++] = size >> 16 & 0xff;
	  buffer$$1[startingIndex++] = size >> 24 & 0xff;
	  return index;
	}

	var serializer = serializeInto;

	function _typeof$4(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$4 = function _typeof(obj) { return typeof obj; }; } else { _typeof$4 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$4(obj); }

	var Buffer$6 = buffer.Buffer;
	var normalizedFunctionString$2 = utils.normalizedFunctionString; // To ensure that 0.4 of node works correctly

	function isDate$2(d) {
	  return _typeof$4(d) === 'object' && Object.prototype.toString.call(d) === '[object Date]';
	}

	function calculateObjectSize(object, serializeFunctions, ignoreUndefined) {
	  var totalLength = 4 + 1;

	  if (Array.isArray(object)) {
	    for (var i = 0; i < object.length; i++) {
	      totalLength += calculateElement(i.toString(), object[i], serializeFunctions, true, ignoreUndefined);
	    }
	  } else {
	    // If we have toBSON defined, override the current object
	    if (object.toBSON) {
	      object = object.toBSON();
	    } // Calculate size


	    for (var key in object) {
	      totalLength += calculateElement(key, object[key], serializeFunctions, false, ignoreUndefined);
	    }
	  }

	  return totalLength;
	}
	/**
	 * @ignore
	 * @api private
	 */


	function calculateElement(name, value, serializeFunctions, isArray, ignoreUndefined) {
	  // If we have toBSON defined, override the current object
	  if (value && value.toBSON) {
	    value = value.toBSON();
	  }

	  switch (_typeof$4(value)) {
	    case 'string':
	      return 1 + Buffer$6.byteLength(name, 'utf8') + 1 + 4 + Buffer$6.byteLength(value, 'utf8') + 1;

	    case 'number':
	      if (Math.floor(value) === value && value >= constants.JS_INT_MIN && value <= constants.JS_INT_MAX) {
	        if (value >= constants.BSON_INT32_MIN && value <= constants.BSON_INT32_MAX) {
	          // 32 bit
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (4 + 1);
	        } else {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (8 + 1);
	        }
	      } else {
	        // 64 bit
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (8 + 1);
	      }

	    case 'undefined':
	      if (isArray || !ignoreUndefined) return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1;
	      return 0;

	    case 'boolean':
	      return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (1 + 1);

	    case 'object':
	      if (value == null || value['_bsontype'] === 'MinKey' || value['_bsontype'] === 'MaxKey') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1;
	      } else if (value['_bsontype'] === 'ObjectId' || value['_bsontype'] === 'ObjectID') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (12 + 1);
	      } else if (value instanceof Date || isDate$2(value)) {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (8 + 1);
	      } else if (typeof Buffer$6 !== 'undefined' && Buffer$6.isBuffer(value)) {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (1 + 4 + 1) + value.length;
	      } else if (value['_bsontype'] === 'Long' || value['_bsontype'] === 'Double' || value['_bsontype'] === 'Timestamp') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (8 + 1);
	      } else if (value['_bsontype'] === 'Decimal128') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (16 + 1);
	      } else if (value['_bsontype'] === 'Code') {
	        // Calculate size depending on the availability of a scope
	        if (value.scope != null && Object.keys(value.scope).length > 0) {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + 4 + 4 + Buffer$6.byteLength(value.code.toString(), 'utf8') + 1 + calculateObjectSize(value.scope, serializeFunctions, ignoreUndefined);
	        } else {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + 4 + Buffer$6.byteLength(value.code.toString(), 'utf8') + 1;
	        }
	      } else if (value['_bsontype'] === 'Binary') {
	        // Check what kind of subtype we have
	        if (value.sub_type === binary.SUBTYPE_BYTE_ARRAY) {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (value.position + 1 + 4 + 1 + 4);
	        } else {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + (value.position + 1 + 4 + 1);
	        }
	      } else if (value['_bsontype'] === 'Symbol') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + Buffer$6.byteLength(value.value, 'utf8') + 4 + 1 + 1;
	      } else if (value['_bsontype'] === 'DBRef') {
	        // Set up correct object for serialization
	        var ordered_values = Object.assign({
	          $ref: value.collection,
	          $id: value.oid
	        }, value.fields); // Add db reference if it exists

	        if (value.db != null) {
	          ordered_values['$db'] = value.db;
	        }

	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + calculateObjectSize(ordered_values, serializeFunctions, ignoreUndefined);
	      } else if (value instanceof RegExp || Object.prototype.toString.call(value) === '[object RegExp]') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + Buffer$6.byteLength(value.source, 'utf8') + 1 + (value.global ? 1 : 0) + (value.ignoreCase ? 1 : 0) + (value.multiline ? 1 : 0) + 1;
	      } else if (value['_bsontype'] === 'BSONRegExp') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + Buffer$6.byteLength(value.pattern, 'utf8') + 1 + Buffer$6.byteLength(value.options, 'utf8') + 1;
	      } else {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + calculateObjectSize(value, serializeFunctions, ignoreUndefined) + 1;
	      }

	    case 'function':
	      // WTF for 0.4.X where typeof /someregexp/ === 'function'
	      if (value instanceof RegExp || Object.prototype.toString.call(value) === '[object RegExp]' || String.call(value) === '[object RegExp]') {
	        return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + Buffer$6.byteLength(value.source, 'utf8') + 1 + (value.global ? 1 : 0) + (value.ignoreCase ? 1 : 0) + (value.multiline ? 1 : 0) + 1;
	      } else {
	        if (serializeFunctions && value.scope != null && Object.keys(value.scope).length > 0) {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + 4 + 4 + Buffer$6.byteLength(normalizedFunctionString$2(value), 'utf8') + 1 + calculateObjectSize(value.scope, serializeFunctions, ignoreUndefined);
	        } else if (serializeFunctions) {
	          return (name != null ? Buffer$6.byteLength(name, 'utf8') + 1 : 0) + 1 + 4 + Buffer$6.byteLength(normalizedFunctionString$2(value), 'utf8') + 1;
	        }
	      }

	  }

	  return 0;
	}

	var calculate_size = calculateObjectSize;

	var Buffer$7 = buffer.Buffer;
	/**
	 * Makes sure that, if a Uint8Array is passed in, it is wrapped in a Buffer.
	 *
	 * @param {Buffer|Uint8Array} potentialBuffer The potential buffer
	 * @returns {Buffer} the input if potentialBuffer is a buffer, or a buffer that
	 * wraps a passed in Uint8Array
	 * @throws {TypeError} If anything other than a Buffer or Uint8Array is passed in
	 */

	var ensure_buffer = function ensureBuffer(potentialBuffer) {
	  if (potentialBuffer instanceof Buffer$7) {
	    return potentialBuffer;
	  }

	  if (potentialBuffer instanceof Uint8Array) {
	    return Buffer$7.from(potentialBuffer.buffer);
	  }

	  throw new TypeError('Must use either Buffer or Uint8Array');
	};

	var Buffer$8 = buffer.Buffer; // Parts of the parser

	/**
	 * @ignore
	 */
	// Default Max Size

	var MAXSIZE = 1024 * 1024 * 17; // Current Internal Temporary Serialization Buffer

	var buffer$1 = Buffer$8.alloc(MAXSIZE);
	/**
	 * Sets the size of the internal serialization buffer.
	 *
	 * @method
	 * @param {number} size The desired size for the internal serialization buffer
	 */

	function setInternalBufferSize(size) {
	  // Resize the internal serialization buffer if needed
	  if (buffer$1.length < size) {
	    buffer$1 = Buffer$8.alloc(size);
	  }
	}
	/**
	 * Serialize a Javascript object.
	 *
	 * @param {Object} object the Javascript object to serialize.
	 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
	 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
	 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
	 * @return {Buffer} returns the Buffer object containing the serialized object.
	 */


	function serialize$1(object, options) {
	  options = options || {}; // Unpack the options

	  var checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
	  var serializeFunctions = typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
	  var ignoreUndefined = typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
	  var minInternalBufferSize = typeof options.minInternalBufferSize === 'number' ? options.minInternalBufferSize : MAXSIZE; // Resize the internal serialization buffer if needed

	  if (buffer$1.length < minInternalBufferSize) {
	    buffer$1 = Buffer$8.alloc(minInternalBufferSize);
	  } // Attempt to serialize


	  var serializationIndex = serializer(buffer$1, object, checkKeys, 0, 0, serializeFunctions, ignoreUndefined, []); // Create the final buffer

	  var finishedBuffer = Buffer$8.alloc(serializationIndex); // Copy into the finished buffer

	  buffer$1.copy(finishedBuffer, 0, 0, finishedBuffer.length); // Return the buffer

	  return finishedBuffer;
	}
	/**
	 * Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.
	 *
	 * @param {Object} object the Javascript object to serialize.
	 * @param {Buffer} buffer the Buffer you pre-allocated to store the serialized BSON object.
	 * @param {Boolean} [options.checkKeys] the serializer will check if keys are valid.
	 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
	 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
	 * @param {Number} [options.index] the index in the buffer where we wish to start serializing into.
	 * @return {Number} returns the index pointing to the last written byte in the buffer.
	 */


	function serializeWithBufferAndIndex(object, finalBuffer, options) {
	  options = options || {}; // Unpack the options

	  var checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
	  var serializeFunctions = typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
	  var ignoreUndefined = typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
	  var startIndex = typeof options.index === 'number' ? options.index : 0; // Attempt to serialize

	  var serializationIndex = serializer(buffer$1, object, checkKeys, 0, 0, serializeFunctions, ignoreUndefined);
	  buffer$1.copy(finalBuffer, startIndex, 0, serializationIndex); // Return the index

	  return startIndex + serializationIndex - 1;
	}
	/**
	 * Deserialize data as BSON.
	 *
	 * @param {Buffer} buffer the buffer containing the serialized set of BSON documents.
	 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
	 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
	 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
	 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
	 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
	 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
	 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
	 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
	 * @param {boolean} [options.allowObjectSmallerThanBufferSize=false] allows the buffer to be larger than the parsed BSON object
	 * @return {Object} returns the deserialized Javascript Object.
	 */


	function deserialize$2(buffer$$1, options) {
	  buffer$$1 = ensure_buffer(buffer$$1);
	  return deserializer(buffer$$1, options);
	}
	/**
	 * Calculate the bson size for a passed in Javascript object.
	 *
	 * @param {Object} object the Javascript object to calculate the BSON byte size for.
	 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
	 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
	 * @return {Number} returns the number of bytes the BSON object will take up.
	 */


	function calculateObjectSize$1(object, options) {
	  options = options || {};
	  var serializeFunctions = typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
	  var ignoreUndefined = typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
	  return calculate_size(object, serializeFunctions, ignoreUndefined);
	}
	/**
	 * Deserialize stream data as BSON documents.
	 *
	 * @param {Buffer} data the buffer containing the serialized set of BSON documents.
	 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
	 * @param {Number} numberOfDocuments number of documents to deserialize.
	 * @param {Array} documents an array where to store the deserialized documents.
	 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
	 * @param {Object} [options] additional options used for the deserialization.
	 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
	 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
	 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
	 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
	 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
	 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
	 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buffer.
	 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
	 * @return {Number} returns the next index in the buffer after deserialization **x** numbers of documents.
	 */


	function deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, options) {
	  options = Object.assign({
	    allowObjectSmallerThanBufferSize: true
	  }, options);
	  data = ensure_buffer(data);
	  var index = startIndex; // Loop over all documents

	  for (var i = 0; i < numberOfDocuments; i++) {
	    // Find size of the document
	    var size = data[index] | data[index + 1] << 8 | data[index + 2] << 16 | data[index + 3] << 24; // Update options with index

	    options.index = index; // Parse the document at this point

	    documents[docStartIndex + i] = deserializer(data, options); // Adjust index by the document size

	    index = index + size;
	  } // Return object containing end index of parsing and list of documents


	  return index;
	}

	var bson = {
	  // constants
	  // NOTE: this is done this way because rollup can't resolve an `Object.assign`ed export
	  BSON_INT32_MAX: constants.BSON_INT32_MAX,
	  BSON_INT32_MIN: constants.BSON_INT32_MIN,
	  BSON_INT64_MAX: constants.BSON_INT64_MAX,
	  BSON_INT64_MIN: constants.BSON_INT64_MIN,
	  JS_INT_MAX: constants.JS_INT_MAX,
	  JS_INT_MIN: constants.JS_INT_MIN,
	  BSON_DATA_NUMBER: constants.BSON_DATA_NUMBER,
	  BSON_DATA_STRING: constants.BSON_DATA_STRING,
	  BSON_DATA_OBJECT: constants.BSON_DATA_OBJECT,
	  BSON_DATA_ARRAY: constants.BSON_DATA_ARRAY,
	  BSON_DATA_BINARY: constants.BSON_DATA_BINARY,
	  BSON_DATA_UNDEFINED: constants.BSON_DATA_UNDEFINED,
	  BSON_DATA_OID: constants.BSON_DATA_OID,
	  BSON_DATA_BOOLEAN: constants.BSON_DATA_BOOLEAN,
	  BSON_DATA_DATE: constants.BSON_DATA_DATE,
	  BSON_DATA_NULL: constants.BSON_DATA_NULL,
	  BSON_DATA_REGEXP: constants.BSON_DATA_REGEXP,
	  BSON_DATA_DBPOINTER: constants.BSON_DATA_DBPOINTER,
	  BSON_DATA_CODE: constants.BSON_DATA_CODE,
	  BSON_DATA_SYMBOL: constants.BSON_DATA_SYMBOL,
	  BSON_DATA_CODE_W_SCOPE: constants.BSON_DATA_CODE_W_SCOPE,
	  BSON_DATA_INT: constants.BSON_DATA_INT,
	  BSON_DATA_TIMESTAMP: constants.BSON_DATA_TIMESTAMP,
	  BSON_DATA_LONG: constants.BSON_DATA_LONG,
	  BSON_DATA_DECIMAL128: constants.BSON_DATA_DECIMAL128,
	  BSON_DATA_MIN_KEY: constants.BSON_DATA_MIN_KEY,
	  BSON_DATA_MAX_KEY: constants.BSON_DATA_MAX_KEY,
	  BSON_BINARY_SUBTYPE_DEFAULT: constants.BSON_BINARY_SUBTYPE_DEFAULT,
	  BSON_BINARY_SUBTYPE_FUNCTION: constants.BSON_BINARY_SUBTYPE_FUNCTION,
	  BSON_BINARY_SUBTYPE_BYTE_ARRAY: constants.BSON_BINARY_SUBTYPE_BYTE_ARRAY,
	  BSON_BINARY_SUBTYPE_UUID: constants.BSON_BINARY_SUBTYPE_UUID,
	  BSON_BINARY_SUBTYPE_MD5: constants.BSON_BINARY_SUBTYPE_MD5,
	  BSON_BINARY_SUBTYPE_USER_DEFINED: constants.BSON_BINARY_SUBTYPE_USER_DEFINED,
	  // wrapped types
	  Code: code,
	  Map: map,
	  BSONSymbol: symbol,
	  DBRef: db_ref,
	  Binary: binary,
	  ObjectId: objectid,
	  Long: long_1,
	  Timestamp: timestamp,
	  Double: double_1,
	  Int32: int_32,
	  MinKey: min_key,
	  MaxKey: max_key,
	  BSONRegExp: regexp,
	  Decimal128: decimal128,
	  // methods
	  serialize: serialize$1,
	  serializeWithBufferAndIndex: serializeWithBufferAndIndex,
	  deserialize: deserialize$2,
	  calculateObjectSize: calculateObjectSize$1,
	  deserializeStream: deserializeStream,
	  setInternalBufferSize: setInternalBufferSize,
	  // legacy support
	  ObjectID: objectid,
	  // Extended JSON
	  EJSON: extended_json
	};
	var bson_1 = bson.BSON_INT32_MAX;
	var bson_2 = bson.BSON_INT32_MIN;
	var bson_3 = bson.BSON_INT64_MAX;
	var bson_4 = bson.BSON_INT64_MIN;
	var bson_5 = bson.JS_INT_MAX;
	var bson_6 = bson.JS_INT_MIN;
	var bson_7 = bson.BSON_DATA_NUMBER;
	var bson_8 = bson.BSON_DATA_STRING;
	var bson_9 = bson.BSON_DATA_OBJECT;
	var bson_10 = bson.BSON_DATA_ARRAY;
	var bson_11 = bson.BSON_DATA_BINARY;
	var bson_12 = bson.BSON_DATA_UNDEFINED;
	var bson_13 = bson.BSON_DATA_OID;
	var bson_14 = bson.BSON_DATA_BOOLEAN;
	var bson_15 = bson.BSON_DATA_DATE;
	var bson_16 = bson.BSON_DATA_NULL;
	var bson_17 = bson.BSON_DATA_REGEXP;
	var bson_18 = bson.BSON_DATA_DBPOINTER;
	var bson_19 = bson.BSON_DATA_CODE;
	var bson_20 = bson.BSON_DATA_SYMBOL;
	var bson_21 = bson.BSON_DATA_CODE_W_SCOPE;
	var bson_22 = bson.BSON_DATA_INT;
	var bson_23 = bson.BSON_DATA_TIMESTAMP;
	var bson_24 = bson.BSON_DATA_LONG;
	var bson_25 = bson.BSON_DATA_DECIMAL128;
	var bson_26 = bson.BSON_DATA_MIN_KEY;
	var bson_27 = bson.BSON_DATA_MAX_KEY;
	var bson_28 = bson.BSON_BINARY_SUBTYPE_DEFAULT;
	var bson_29 = bson.BSON_BINARY_SUBTYPE_FUNCTION;
	var bson_30 = bson.BSON_BINARY_SUBTYPE_BYTE_ARRAY;
	var bson_31 = bson.BSON_BINARY_SUBTYPE_UUID;
	var bson_32 = bson.BSON_BINARY_SUBTYPE_MD5;
	var bson_33 = bson.BSON_BINARY_SUBTYPE_USER_DEFINED;
	var bson_34 = bson.Code;
	var bson_35 = bson.BSONSymbol;
	var bson_36 = bson.DBRef;
	var bson_37 = bson.Binary;
	var bson_38 = bson.ObjectId;
	var bson_39 = bson.Long;
	var bson_40 = bson.Timestamp;
	var bson_41 = bson.Double;
	var bson_42 = bson.Int32;
	var bson_43 = bson.MinKey;
	var bson_44 = bson.MaxKey;
	var bson_45 = bson.BSONRegExp;
	var bson_46 = bson.Decimal128;
	var bson_47 = bson.serialize;
	var bson_48 = bson.serializeWithBufferAndIndex;
	var bson_49 = bson.deserialize;
	var bson_50 = bson.calculateObjectSize;
	var bson_51 = bson.deserializeStream;
	var bson_52 = bson.setInternalBufferSize;
	var bson_53 = bson.ObjectID;
	var bson_54 = bson.EJSON;

	exports.default = bson;
	exports.BSON_INT32_MAX = bson_1;
	exports.BSON_INT32_MIN = bson_2;
	exports.BSON_INT64_MAX = bson_3;
	exports.BSON_INT64_MIN = bson_4;
	exports.JS_INT_MAX = bson_5;
	exports.JS_INT_MIN = bson_6;
	exports.BSON_DATA_NUMBER = bson_7;
	exports.BSON_DATA_STRING = bson_8;
	exports.BSON_DATA_OBJECT = bson_9;
	exports.BSON_DATA_ARRAY = bson_10;
	exports.BSON_DATA_BINARY = bson_11;
	exports.BSON_DATA_UNDEFINED = bson_12;
	exports.BSON_DATA_OID = bson_13;
	exports.BSON_DATA_BOOLEAN = bson_14;
	exports.BSON_DATA_DATE = bson_15;
	exports.BSON_DATA_NULL = bson_16;
	exports.BSON_DATA_REGEXP = bson_17;
	exports.BSON_DATA_DBPOINTER = bson_18;
	exports.BSON_DATA_CODE = bson_19;
	exports.BSON_DATA_SYMBOL = bson_20;
	exports.BSON_DATA_CODE_W_SCOPE = bson_21;
	exports.BSON_DATA_INT = bson_22;
	exports.BSON_DATA_TIMESTAMP = bson_23;
	exports.BSON_DATA_LONG = bson_24;
	exports.BSON_DATA_DECIMAL128 = bson_25;
	exports.BSON_DATA_MIN_KEY = bson_26;
	exports.BSON_DATA_MAX_KEY = bson_27;
	exports.BSON_BINARY_SUBTYPE_DEFAULT = bson_28;
	exports.BSON_BINARY_SUBTYPE_FUNCTION = bson_29;
	exports.BSON_BINARY_SUBTYPE_BYTE_ARRAY = bson_30;
	exports.BSON_BINARY_SUBTYPE_UUID = bson_31;
	exports.BSON_BINARY_SUBTYPE_MD5 = bson_32;
	exports.BSON_BINARY_SUBTYPE_USER_DEFINED = bson_33;
	exports.Code = bson_34;
	exports.BSONSymbol = bson_35;
	exports.DBRef = bson_36;
	exports.Binary = bson_37;
	exports.ObjectId = bson_38;
	exports.Long = bson_39;
	exports.Timestamp = bson_40;
	exports.Double = bson_41;
	exports.Int32 = bson_42;
	exports.MinKey = bson_43;
	exports.MaxKey = bson_44;
	exports.BSONRegExp = bson_45;
	exports.Decimal128 = bson_46;
	exports.serialize = bson_47;
	exports.serializeWithBufferAndIndex = bson_48;
	exports.deserialize = bson_49;
	exports.calculateObjectSize = bson_50;
	exports.deserializeStream = bson_51;
	exports.setInternalBufferSize = bson_52;
	exports.ObjectID = bson_53;
	exports.EJSON = bson_54;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

}).call(this,{"isBuffer":require("../../../../is-buffer/index.js")},typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../../../is-buffer/index.js":8,"buffer":3,"long":9}],120:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OperationType;
(function (OperationType) {
    OperationType["Insert"] = "insert";
    OperationType["Delete"] = "delete";
    OperationType["Replace"] = "replace";
    OperationType["Update"] = "update";
    OperationType["Unknown"] = "unknown";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
function operationTypeFromRemote(type) {
    switch (type) {
        case "insert":
            return OperationType.Insert;
        case "delete":
            return OperationType.Delete;
        case "replace":
            return OperationType.Replace;
        case "update":
            return OperationType.Update;
        default:
            return OperationType.Unknown;
    }
}
exports.operationTypeFromRemote = operationTypeFromRemote;

},{}],121:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RemoteInsertManyResult = (function () {
    function RemoteInsertManyResult(arr) {
        var inserted = {};
        arr.forEach(function (value, index) {
            inserted[index] = value;
        });
        this.insertedIds = inserted;
    }
    return RemoteInsertManyResult;
}());
exports.default = RemoteInsertManyResult;

},{}],122:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CoreRemoteMongoClientImpl_1 = __importDefault(require("./internal/CoreRemoteMongoClientImpl"));
exports.CoreRemoteMongoClientImpl = CoreRemoteMongoClientImpl_1.default;
var CoreRemoteMongoCollectionImpl_1 = __importDefault(require("./internal/CoreRemoteMongoCollectionImpl"));
exports.CoreRemoteMongoCollectionImpl = CoreRemoteMongoCollectionImpl_1.default;
var CoreRemoteMongoDatabaseImpl_1 = __importDefault(require("./internal/CoreRemoteMongoDatabaseImpl"));
exports.CoreRemoteMongoDatabaseImpl = CoreRemoteMongoDatabaseImpl_1.default;
var CoreRemoteMongoReadOperation_1 = __importDefault(require("./internal/CoreRemoteMongoReadOperation"));
exports.CoreRemoteMongoReadOperation = CoreRemoteMongoReadOperation_1.default;
var OperationType_1 = require("./OperationType");
exports.OperationType = OperationType_1.OperationType;
var RemoteInsertManyResult_1 = __importDefault(require("./RemoteInsertManyResult"));
exports.RemoteInsertManyResult = RemoteInsertManyResult_1.default;

},{"./OperationType":120,"./RemoteInsertManyResult":121,"./internal/CoreRemoteMongoClientImpl":123,"./internal/CoreRemoteMongoCollectionImpl":124,"./internal/CoreRemoteMongoDatabaseImpl":125,"./internal/CoreRemoteMongoReadOperation":126}],123:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CoreRemoteMongoDatabaseImpl_1 = __importDefault(require("./CoreRemoteMongoDatabaseImpl"));
var CoreRemoteMongoClientImpl = (function () {
    function CoreRemoteMongoClientImpl(service) {
        this.service = service;
    }
    CoreRemoteMongoClientImpl.prototype.db = function (name) {
        return new CoreRemoteMongoDatabaseImpl_1.default(name, this.service);
    };
    return CoreRemoteMongoClientImpl;
}());
exports.default = CoreRemoteMongoClientImpl;

},{"./CoreRemoteMongoDatabaseImpl":125}],124:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = __importDefault(require("bson"));
var CoreRemoteMongoReadOperation_1 = __importDefault(require("./CoreRemoteMongoReadOperation"));
var ResultDecoders_1 = __importDefault(require("./ResultDecoders"));
var CoreRemoteMongoCollectionImpl = (function () {
    function CoreRemoteMongoCollectionImpl(name, databaseName, service, codec) {
        var _this = this;
        this.name = name;
        this.databaseName = databaseName;
        this.service = service;
        this.codec = codec;
        this.namespace = this.databaseName + "." + this.name;
        this.baseOperationArgs = (function () { return ({
            collection: _this.name,
            database: _this.databaseName
        }); })();
    }
    CoreRemoteMongoCollectionImpl.prototype.withCollectionType = function (codec) {
        return new CoreRemoteMongoCollectionImpl(this.name, this.databaseName, this.service, codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.find = function (filter, options) {
        if (filter === void 0) { filter = {}; }
        var args = __assign({}, this.baseOperationArgs);
        args.query = filter;
        if (options) {
            if (options.limit) {
                args.limit = options.limit;
            }
            if (options.projection) {
                args.project = options.projection;
            }
            if (options.sort) {
                args.sort = options.sort;
            }
        }
        return new CoreRemoteMongoReadOperation_1.default("find", args, this.service, this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.findOne = function (filter, options) {
        if (filter === void 0) { filter = {}; }
        var args = __assign({}, this.baseOperationArgs);
        args.query = filter;
        if (options) {
            if (options.projection) {
                args.project = options.projection;
            }
            if (options.sort) {
                args.sort = options.sort;
            }
        }
        return this.service.callFunction("findOne", [args], this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.findOneAndUpdate = function (filter, update, options) {
        var args = __assign({}, this.baseOperationArgs);
        args.filter = filter;
        args.update = update;
        if (options) {
            if (options.projection) {
                args.projection = options.projection;
            }
            if (options.sort) {
                args.sort = options.sort;
            }
            if (options.upsert) {
                args.upsert = true;
            }
            if (options.returnNewDocument) {
                args.returnNewDocument = true;
            }
        }
        return this.service.callFunction("findOneAndUpdate", [args], this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.findOneAndReplace = function (filter, replacement, options) {
        var args = __assign({}, this.baseOperationArgs);
        args.filter = filter;
        args.update = replacement;
        if (options) {
            if (options.projection) {
                args.projection = options.projection;
            }
            if (options.sort) {
                args.sort = options.sort;
            }
            if (options.upsert) {
                args.upsert = true;
            }
            if (options.returnNewDocument) {
                args.returnNewDocument = true;
            }
        }
        return this.service.callFunction("findOneAndReplace", [args], this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.findOneAndDelete = function (filter, options) {
        var args = __assign({}, this.baseOperationArgs);
        args.filter = filter;
        if (options) {
            if (options.projection) {
                args.projection = options.projection;
            }
            if (options.sort) {
                args.sort = options.sort;
            }
        }
        return this.service.callFunction("findOneAndDelete", [args], this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.aggregate = function (pipeline) {
        var args = __assign({}, this.baseOperationArgs);
        args.pipeline = pipeline;
        return new CoreRemoteMongoReadOperation_1.default("aggregate", args, this.service, this.codec);
    };
    CoreRemoteMongoCollectionImpl.prototype.count = function (query, options) {
        if (query === void 0) { query = {}; }
        var args = __assign({}, this.baseOperationArgs);
        args.query = query;
        if (options && options.limit) {
            args.limit = options.limit;
        }
        return this.service.callFunction("count", [args]);
    };
    CoreRemoteMongoCollectionImpl.prototype.insertOne = function (value) {
        var args = __assign({}, this.baseOperationArgs);
        args.document = this.generateObjectIdIfMissing(this.codec ? this.codec.encode(value) : value);
        return this.service.callFunction("insertOne", [args], ResultDecoders_1.default.remoteInsertOneResultDecoder);
    };
    CoreRemoteMongoCollectionImpl.prototype.insertMany = function (docs) {
        var _this = this;
        var args = __assign({}, this.baseOperationArgs);
        args.documents = docs.map(function (doc) {
            return _this.generateObjectIdIfMissing(_this.codec ? _this.codec.encode(doc) : doc);
        });
        return this.service.callFunction("insertMany", [args], ResultDecoders_1.default.remoteInsertManyResultDecoder);
    };
    CoreRemoteMongoCollectionImpl.prototype.deleteOne = function (query) {
        return this.executeDelete(query, false);
    };
    CoreRemoteMongoCollectionImpl.prototype.deleteMany = function (query) {
        return this.executeDelete(query, true);
    };
    CoreRemoteMongoCollectionImpl.prototype.updateOne = function (query, update, options) {
        return this.executeUpdate(query, update, options, false);
    };
    CoreRemoteMongoCollectionImpl.prototype.updateMany = function (query, update, options) {
        return this.executeUpdate(query, update, options, true);
    };
    CoreRemoteMongoCollectionImpl.prototype.watch = function (arg) {
        var args = __assign({}, this.baseOperationArgs);
        if (arg !== undefined) {
            if (arg instanceof Array) {
                if (arg.length !== 0) {
                    args.ids = arg;
                }
            }
            else if (arg instanceof Object) {
                args.filter = arg;
            }
        }
        args.useCompactEvents = false;
        return this.service.streamFunction("watch", [args], new ResultDecoders_1.default.ChangeEventDecoder(this.codec));
    };
    CoreRemoteMongoCollectionImpl.prototype.watchCompact = function (ids) {
        var args = __assign({}, this.baseOperationArgs);
        args.ids = ids;
        args.useCompactEvents = true;
        return this.service.streamFunction("watch", [args], new ResultDecoders_1.default.CompactChangeEventDecoder(this.codec));
    };
    CoreRemoteMongoCollectionImpl.prototype.executeDelete = function (query, multi) {
        var args = __assign({}, this.baseOperationArgs);
        args.query = query;
        return this.service.callFunction(multi ? "deleteMany" : "deleteOne", [args], ResultDecoders_1.default.remoteDeleteResultDecoder);
    };
    CoreRemoteMongoCollectionImpl.prototype.executeUpdate = function (query, update, options, multi) {
        if (multi === void 0) { multi = false; }
        var args = __assign({}, this.baseOperationArgs);
        args.query = query;
        args.update = update;
        if (options && options.upsert) {
            args.upsert = options.upsert;
        }
        return this.service.callFunction(multi ? "updateMany" : "updateOne", [args], ResultDecoders_1.default.remoteUpdateResultDecoder);
    };
    CoreRemoteMongoCollectionImpl.prototype.generateObjectIdIfMissing = function (doc) {
        if (!doc._id) {
            var newDoc = doc;
            newDoc._id = new bson_1.default.ObjectID();
            return newDoc;
        }
        return doc;
    };
    return CoreRemoteMongoCollectionImpl;
}());
exports.default = CoreRemoteMongoCollectionImpl;

},{"./CoreRemoteMongoReadOperation":126,"./ResultDecoders":127,"bson":128}],125:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CoreRemoteMongoCollectionImpl_1 = __importDefault(require("./CoreRemoteMongoCollectionImpl"));
var CoreRemoteMongoDatabaseImpl = (function () {
    function CoreRemoteMongoDatabaseImpl(name, service) {
        this.name = name;
        this.service = service;
    }
    CoreRemoteMongoDatabaseImpl.prototype.collection = function (name, codec) {
        return new CoreRemoteMongoCollectionImpl_1.default(name, this.name, this.service, codec);
    };
    return CoreRemoteMongoDatabaseImpl;
}());
exports.default = CoreRemoteMongoDatabaseImpl;

},{"./CoreRemoteMongoCollectionImpl":124}],126:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CoreRemoteMongoReadOperation = (function () {
    function CoreRemoteMongoReadOperation(command, args, service, decoder) {
        this.command = command;
        this.args = args;
        this.service = service;
        if (decoder) {
            this.collectionDecoder = new (function () {
                function class_1() {
                }
                class_1.prototype.decode = function (from) {
                    if (from instanceof Array) {
                        return from.map(function (t) { return decoder.decode(t); });
                    }
                    return [decoder.decode(from)];
                };
                return class_1;
            }())();
        }
    }
    CoreRemoteMongoReadOperation.prototype.iterator = function () {
        return this.executeRead().then(function (res) { return res[Symbol.iterator](); });
    };
    CoreRemoteMongoReadOperation.prototype.first = function () {
        return this.executeRead().then(function (res) { return res[0]; });
    };
    CoreRemoteMongoReadOperation.prototype.toArray = function () {
        return this.executeRead();
    };
    CoreRemoteMongoReadOperation.prototype.asArray = function () {
        return this.toArray();
    };
    CoreRemoteMongoReadOperation.prototype.executeRead = function () {
        return this.service.callFunction(this.command, [this.args], this.collectionDecoder);
    };
    return CoreRemoteMongoReadOperation;
}());
exports.default = CoreRemoteMongoReadOperation;

},{}],127:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_stitch_core_sdk_1 = require("mongodb-stitch-core-sdk");
var OperationType_1 = require("../OperationType");
var RemoteInsertManyResult_1 = __importDefault(require("../RemoteInsertManyResult"));
var RemoteInsertManyResultFields;
(function (RemoteInsertManyResultFields) {
    RemoteInsertManyResultFields["InsertedIds"] = "insertedIds";
})(RemoteInsertManyResultFields || (RemoteInsertManyResultFields = {}));
var RemoteInsertOneResultFields;
(function (RemoteInsertOneResultFields) {
    RemoteInsertOneResultFields["InsertedId"] = "insertedId";
})(RemoteInsertOneResultFields || (RemoteInsertOneResultFields = {}));
var RemoteUpdateResultFields;
(function (RemoteUpdateResultFields) {
    RemoteUpdateResultFields["MatchedCount"] = "matchedCount";
    RemoteUpdateResultFields["ModifiedCount"] = "modifiedCount";
    RemoteUpdateResultFields["UpsertedId"] = "upsertedId";
})(RemoteUpdateResultFields || (RemoteUpdateResultFields = {}));
var RemoteDeleteResultFields;
(function (RemoteDeleteResultFields) {
    RemoteDeleteResultFields["DeletedCount"] = "deletedCount";
})(RemoteDeleteResultFields || (RemoteDeleteResultFields = {}));
var UpdateDescriptionFields;
(function (UpdateDescriptionFields) {
    UpdateDescriptionFields["UpdatedFields"] = "updatedFields";
    UpdateDescriptionFields["RemovedFields"] = "removedFields";
})(UpdateDescriptionFields || (UpdateDescriptionFields = {}));
var ChangeEventFields;
(function (ChangeEventFields) {
    ChangeEventFields["Id"] = "_id";
    ChangeEventFields["OperationType"] = "operationType";
    ChangeEventFields["FullDocument"] = "fullDocument";
    ChangeEventFields["DocumentKey"] = "documentKey";
    ChangeEventFields["Namespace"] = "ns";
    ChangeEventFields["NamespaceDb"] = "db";
    ChangeEventFields["NamespaceColl"] = "coll";
    ChangeEventFields["UpdateDescription"] = "updateDescription";
})(ChangeEventFields || (ChangeEventFields = {}));
var CompactChangeEventFields;
(function (CompactChangeEventFields) {
    CompactChangeEventFields["OperationType"] = "ot";
    CompactChangeEventFields["FullDocument"] = "fd";
    CompactChangeEventFields["DocumentKey"] = "dk";
    CompactChangeEventFields["UpdateDescription"] = "ud";
    CompactChangeEventFields["StitchDocumentVersion"] = "sdv";
    CompactChangeEventFields["StitchDocumentHash"] = "sdh";
})(CompactChangeEventFields || (CompactChangeEventFields = {}));
var RemoteInsertManyResultDecoder = (function () {
    function RemoteInsertManyResultDecoder() {
    }
    RemoteInsertManyResultDecoder.prototype.decode = function (from) {
        return new RemoteInsertManyResult_1.default(from[RemoteInsertManyResultFields.InsertedIds]);
    };
    return RemoteInsertManyResultDecoder;
}());
var RemoteInsertOneResultDecoder = (function () {
    function RemoteInsertOneResultDecoder() {
    }
    RemoteInsertOneResultDecoder.prototype.decode = function (from) {
        return {
            insertedId: from[RemoteInsertOneResultFields.InsertedId]
        };
    };
    return RemoteInsertOneResultDecoder;
}());
var RemoteUpdateResultDecoder = (function () {
    function RemoteUpdateResultDecoder() {
    }
    RemoteUpdateResultDecoder.prototype.decode = function (from) {
        return {
            matchedCount: from[RemoteUpdateResultFields.MatchedCount],
            modifiedCount: from[RemoteUpdateResultFields.ModifiedCount],
            upsertedId: from[RemoteUpdateResultFields.UpsertedId]
        };
    };
    return RemoteUpdateResultDecoder;
}());
var RemoteDeleteResultDecoder = (function () {
    function RemoteDeleteResultDecoder() {
    }
    RemoteDeleteResultDecoder.prototype.decode = function (from) {
        return {
            deletedCount: from[RemoteDeleteResultFields.DeletedCount]
        };
    };
    return RemoteDeleteResultDecoder;
}());
var UpdateDescriptionDecoder = (function () {
    function UpdateDescriptionDecoder() {
    }
    UpdateDescriptionDecoder.prototype.decode = function (from) {
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(UpdateDescriptionFields.UpdatedFields, from);
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(UpdateDescriptionFields.RemovedFields, from);
        return {
            removedFields: from[UpdateDescriptionFields.RemovedFields],
            updatedFields: from[UpdateDescriptionFields.UpdatedFields],
        };
    };
    return UpdateDescriptionDecoder;
}());
function decodeBaseChangeEventFields(from, updateDescriptionField, fullDocumentField, decoder) {
    var updateDescription;
    if (updateDescriptionField in from) {
        updateDescription = ResultDecoders.updateDescriptionDecoder.decode(from[updateDescriptionField]);
    }
    else {
        updateDescription = undefined;
    }
    var fullDocument;
    if (fullDocumentField in from) {
        fullDocument = from[fullDocumentField];
        if (decoder) {
            fullDocument = decoder.decode(fullDocument);
        }
    }
    else {
        fullDocument = undefined;
    }
    return { updateDescription: updateDescription, fullDocument: fullDocument };
}
var ChangeEventDecoder = (function () {
    function ChangeEventDecoder(decoder) {
        this.decoder = decoder;
    }
    ChangeEventDecoder.prototype.decode = function (from) {
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(ChangeEventFields.Id, from);
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(ChangeEventFields.OperationType, from);
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(ChangeEventFields.Namespace, from);
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(ChangeEventFields.DocumentKey, from);
        var nsDoc = from[ChangeEventFields.Namespace];
        var _a = decodeBaseChangeEventFields(from, ChangeEventFields.UpdateDescription, ChangeEventFields.FullDocument, this.decoder), updateDescription = _a.updateDescription, fullDocument = _a.fullDocument;
        return {
            documentKey: from[ChangeEventFields.DocumentKey],
            fullDocument: fullDocument,
            id: from[ChangeEventFields.Id],
            namespace: {
                collection: nsDoc[ChangeEventFields.NamespaceColl],
                database: nsDoc[ChangeEventFields.NamespaceDb]
            },
            operationType: OperationType_1.operationTypeFromRemote(from[ChangeEventFields.OperationType]),
            updateDescription: updateDescription
        };
    };
    return ChangeEventDecoder;
}());
var CompactChangeEventDecoder = (function () {
    function CompactChangeEventDecoder(decoder) {
        this.decoder = decoder;
    }
    CompactChangeEventDecoder.prototype.decode = function (from) {
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(CompactChangeEventFields.OperationType, from);
        mongodb_stitch_core_sdk_1.Assertions.keyPresent(CompactChangeEventFields.DocumentKey, from);
        var _a = decodeBaseChangeEventFields(from, CompactChangeEventFields.UpdateDescription, CompactChangeEventFields.FullDocument, this.decoder), updateDescription = _a.updateDescription, fullDocument = _a.fullDocument;
        var stitchDocumentVersion;
        if (CompactChangeEventFields.StitchDocumentVersion in from) {
            stitchDocumentVersion = from[CompactChangeEventFields.StitchDocumentVersion];
        }
        else {
            stitchDocumentVersion = undefined;
        }
        var stitchDocumentHash;
        if (CompactChangeEventFields.StitchDocumentHash in from) {
            stitchDocumentHash = from[CompactChangeEventFields.StitchDocumentHash];
        }
        else {
            stitchDocumentHash = undefined;
        }
        return {
            documentKey: from[CompactChangeEventFields.DocumentKey],
            fullDocument: fullDocument,
            operationType: OperationType_1.operationTypeFromRemote(from[CompactChangeEventFields.OperationType]),
            stitchDocumentHash: stitchDocumentHash,
            stitchDocumentVersion: stitchDocumentVersion,
            updateDescription: updateDescription,
        };
    };
    return CompactChangeEventDecoder;
}());
var ResultDecoders = (function () {
    function ResultDecoders() {
    }
    ResultDecoders.remoteInsertManyResultDecoder = new RemoteInsertManyResultDecoder();
    ResultDecoders.remoteInsertOneResultDecoder = new RemoteInsertOneResultDecoder();
    ResultDecoders.remoteUpdateResultDecoder = new RemoteUpdateResultDecoder();
    ResultDecoders.remoteDeleteResultDecoder = new RemoteDeleteResultDecoder();
    ResultDecoders.updateDescriptionDecoder = new UpdateDescriptionDecoder();
    ResultDecoders.ChangeEventDecoder = ChangeEventDecoder;
    ResultDecoders.CompactChangeEventDecoder = CompactChangeEventDecoder;
    return ResultDecoders;
}());
exports.default = ResultDecoders;

},{"../OperationType":120,"../RemoteInsertManyResult":121,"mongodb-stitch-core-sdk":90}],128:[function(require,module,exports){
arguments[4][119][0].apply(exports,arguments)
},{"../../../../is-buffer/index.js":8,"buffer":3,"dup":119,"long":9}],129:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],130:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],131:[function(require,module,exports){
const s = require('mongodb-stitch-browser-sdk')
const auth = require('./mong_auth.js')
const sha = require('fast-sha256')
window.sha = sha

const client = s.Stitch.initializeDefaultAppClient(auth.app)
const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)

// usage:
// mong.db.collection(mong.auth.collections.test).insertOne({AAAA: 'llll'})
// db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
//
// const collectionName = 'nets'
// client.auth.loginWithCredential(new s.AnonymousCredential()).then(user =>
//   db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// ).then(() =>
//   db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
// ).then(docs => {
//   console.log('Found docs', docs)
//   console.log('[MongoDB Stitch] Connected to Stitch')
// }).catch(err => {
//   console.error(err)
// })

const writeIfNotThereReadIfThere = (astring, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('authenticated to mongo. User:', user)
    const hash = String(sha.hash(astring))
    db.collection(auth.collections.test).findOne({ hash }).then(res => {
      if (!res) { // insert
        console.log('not found', astring, hash)
        db.collection(auth.collections.test).insertOne({ AAAA: 'XXX', astring, date: new Date(Date.now()).toISOString(), hash })
      } else {
        console.log('found', res)
      }
    })
  })
}

const writeNetIfNotThereReadIfThere = (text, name, lastModified, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('authenticated to mongo. User:', user)
    const hash = String(sha.hash(text))
    db.collection(auth.collections.test).findOne({ hash }).then(res => {
      if (!res) { // insert
        console.log('not found', hash)
        db.collection(auth.collections.test).insertOne({ text, date: new Date(Date.now()).toISOString(), hash, name, lastModified })
      } else {
        console.log('found', res)
      }
    })
  })
}

const writeNet = (text, name, sid, nid, id, call) => {
  client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    const query = sid ? { sid } : { nid }
    db.collection(auth.collections.test).findOne(query).then(res => {
      if (!res) {
        const hash = String(sha.hash(text))
        db.collection(auth.collections.test).insertOne({ text, date: new Date(Date.now()).toISOString(), hash, name, sid, nid, id })
        console.log('new network written')
      } else {
        db.collection(auth.collections.test).updateOne(query, { $set: { text }, $currentDate: { lastModified: true } })
        console.log('network updated')
      }
      call()
    })
  })
}

const findAllNetworks = () => {
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('ALL NETs WOW')
    return db.collection(auth.collections.test).find({ hash: { $exists: true }, lastModified: { $exists: true } }).asArray()
  })
}

const findUserNetwork = (sid, nid) => {
  // todo: similar function to find nets by name (e.g. 'Flavio Parma')
  return client.auth.loginWithCredential(new s.AnonymousCredential()).then(user => {
    console.log('USER NET YEAH')
    let query
    if (sid) {
      query = { sid }
    } else {
      query = { nid }
    }
    return db.collection(auth.collections.test).find(query).asArray()
  })
}
const testCollection = db.collection(auth.collections.test)

module.exports = { client, db, auth, writeIfNotThereReadIfThere, writeNetIfNotThereReadIfThere, findAllNetworks, writeNet, testCollection, findUserNetwork, s }

},{"./mong_auth.js":132,"fast-sha256":5,"mongodb-stitch-browser-sdk":33}],132:[function(require,module,exports){
module.exports = {
  app: 'freene-gui-fzgxa',
  cluster: 'mongodb-atlas',
  db: 'freenet-all',
  collections: {
    test: 'test',
    nets: 'nets'
  }
}

},{}]},{},[1]);
