(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// fixme: send data to mongo from the extension
var hitsCounterThreshold = 3 // Recommended:10
var initDelayInMilliseconds = 2000 // Recommended:5000
var scrollDelayInMilliSeconds = 500 // Recommended:1000
var scrollMagnitude = 1000 // Recommended:1000
var emailAddress = 'renato.fabbri@gmail.com'

function scrollTillEnd (call = () => console.log('scrolling complete')) {
  var x = 1; var y = -1
  var hitsCounter = 0
  time = setInterval(function () {
    x = document.documentElement.scrollTop
    document.documentElement.scrollTop += scrollMagnitude
    y = document.documentElement.scrollTop
    if (x == y) {
      hitsCounter += 1
      if (hitsCounter > hitsCounterThreshold) {
        clearInterval(time)
        console.log('finished scrolling')
        call()
      }
    } else {
      hitsCounter = 0
    }
  }, scrollDelayInMilliSeconds)
}

function getElementsByXPath (xpath, parent) {
  var results = []
  var query = document.evaluate(xpath, parent || document,
    null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (var i = 0, length = query.snapshotLength; i < length; ++i) {
    results.push(query.snapshotItem(i))
  }
  return results
}

function getUserPageData () {
  var membername = getElementsByXPath('//*/h1').map(i => i.innerText)[0]
  var parts = membername.match(/[^\r\n]+/g)
  var name = parts[0]
  var codename = undefined
  if (parts.length > 1) {
    codename = parts[1]
  }
  // get potential id of the entity, if user page is loaded is ok:
  var path = window.location.pathname
  var potentialId = path.split('/')[1]
  return {
    url: `${window.location.origin}/${potentialId}`,
    id: potentialId,
    name,
    codename
  }
}

function htmlToFriendsProfiles () {
  var exp2 = getElementsByXPath('//*/body/div[2]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div')
  // get names (always), ids (if available), mutual friends (if available):
  var names = exp2.map(e => e.childNodes[1].childNodes[0].innerText)
  // mutual friends, perfectly (undefined if not given):
  var mutual = exp2.map(e => {
    const c = e.childNodes[1]
    if (c.childNodes.length < 2) {
      return undefined
    }
    const num = e.childNodes[1].childNodes[1].innerText.split(' ')[0]
    if (num.length === 0 || !/^\d+$/.test(num)) {
      return undefined
    }
    return parseInt(num)
  })
  // url to iterate and to get ids, perfectly (undefined for inactive users):
  var member_urls = exp2.map(e => e.childNodes[1].childNodes[0].childNodes[0].href)

  var iids = member_urls.map((i, ii) => {
    if (i === undefined) {
      return {
        idType: undefined,
        id: undefined,
        stringId: undefined,
        numericId: undefined,
        url: undefined,
        name: names[ii],
        mutual: mutual[ii]
      }
    }
    const parts = i.split('/')
    const last = parts[parts.length - 1]
    const numericId = last.match(/^profile.php\?id=(.*)/)
    if (numericId && /^\d+$/.test(numericId[1])) {
      return {
        idType: 'number',
        id: numericId[1],
        stringId: undefined,
        numericId: numericId[1],
        url: i,
        name: names[ii],
        mutual: mutual[ii]
      }
    } else {
      return {
        idType: 'string',
        id: last,
        stringId: last,
        numericId: undefined,
        url: i,
        name: names[ii],
        mutual: mutual[ii]
      }
    }
  })
  return iids
}

function scrape () {
  setTimeout(() => {
    var pageUserData = getUserPageData()
    scrollTillEnd(() => {
      var profiles = htmlToFriendsProfiles()
      chrome.runtime.sendMessage({ message: 'open_new_tab', pageUserData, profiles })
    })
  }, initDelayInMilliseconds)
}

function saveText (filename, text) {
  if (this.executed === undefined) {
    this.executed = true
    console.log('inside downloader')
    const tempElem = document.createElement('a')
    tempElem.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text))
    tempElem.setAttribute('download', filename)
    tempElem.click()
    console.log('Download attempt complete.')
    const raiseAlert = 'E-mail the downloaded file to: ' + emailAddress
    alert(raiseAlert)
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'clicked_browser_action') {
      const url = window.location.href // make url for mutual friends, both numeric and string id
      chrome.runtime.sendMessage({ message: 'open_new_tab', url })
    } else if (request.message === 'opened_new_tab') {
      scrape()
    } else if (request.message === 'download_yeah') {
      console.log('before downloader')
      saveText(`network_${(new Date()).toISOString()}`, JSON.stringify(request.net))
    }
  }
)

},{}]},{},[1]);
