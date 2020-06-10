/* global chrome, alert, XPathResult */

// fixme: send data to mongo from the extension
//        make a better description of the extension data
//        better naming on manifest.json
//        var -> const or let
//        function -> arrow funtion
//        accept scrapping start not only in the friends and friends_mutual pages
//        put status updates on the extension popup, make it open while scrapping
//        scrape friends page, not friends_mutual
//        scrape other types of pages, such as groups, pages, timelines
//        implement scrapping bot directly in Hydra/OA page
//        allow for input info directly, may ask to human -> computer
//        allow scrapping the page of a single person here and there to yield net
//        open 3 taps to adjust the follosing values for scrolling:

const hitsCounterThreshold = 3 // Recommended:10
const initDelayInMilliseconds = 2000 // Recommended:5000
const scrollDelayInMilliSeconds = 500 // Recommended:1000
const scrollMagnitude = 1000 // Recommended:1000
const emailAddress = 'renato.fabbri@gmail.com'

const scrollTillEnd = (call = () => console.log('scrolling complete')) => {
  let x = 1; let y = -1
  let hitsCounter = 0
  const time = setInterval(function () {
    x = document.documentElement.scrollTop
    document.documentElement.scrollTop += scrollMagnitude
    y = document.documentElement.scrollTop
    if (x === y) {
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

const getElementsByXPath = (xpath, parent) => {
  const results = []
  const query = document.evaluate(xpath, parent || document,
    null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    results.push(query.snapshotItem(i))
  }
  return results
}

const getUserPageData = () => {
  const membername = getElementsByXPath('//*/h1').map(i => i.innerText)[0]
  let parts = membername.match(/[^\r\n]+/g)
  const name = parts[0]
  let codename
  if (parts.length > 1) {
    codename = parts[1]
  }
  // get potential id of the entity, if user page is loaded is ok:
  const path = window.location.href
  parts = path.split('/')
  const ind = parts.indexOf('www.facebook.com')
  const last = parts[ind + 1]
  const numericId = last.match(/^profile.php\?id=(\d+)/)
  let numeric
  let id
  if (numericId && /^\d+$/.test(numericId[1])) {
    numeric = true
    id = numericId[1]
  } else {
    numeric = false
    id = last
  }
  return {
    url: `${window.location.origin}/${last}`,
    id: id,
    name,
    codename,
    numeric: numeric
  }
}

// const getSeedFriendsUrl = () => {
//   const ud = getUserPageData()
//   if (ud.numeric) {
//     return `${ud.url}&sk=friends`
//   } else {
//     return `${ud.url}/friends`
//   }
// }

const htmlToFriendsProfiles = () => {
  const exp2 = getElementsByXPath('//*/body/div[2]/div[1]/div[1]/div[1]/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div')
  // get names (always), ids (if available), mutual friends (if available):
  const names = exp2.map(e => e.childNodes[1].childNodes[0].innerText)
  // mutual friends, perfectly (undefined if not given):
  const mutual = exp2.map(e => {
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
  const memberUrls = exp2.map(e => e.childNodes[1].childNodes[0].childNodes[0].href)

  const iids = memberUrls.map((i, ii) => {
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
    const numericId = last.match(/^profile.php\?id=(\d+)/)
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

const scrape = () => {
  setTimeout(() => {
    const pageUserData = getUserPageData()
    scrollTillEnd(() => {
      const profiles = htmlToFriendsProfiles()
      chrome.runtime.sendMessage({ message: 'open_new_tab', pageUserData, profiles })
    })
  }, initDelayInMilliseconds)
}

function saveText (filename, text) {
  if (this.executed === undefined) {
    this.executed = true
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
      // chrome.runtime.sendMessage({ message: 'open_new_tab', url: getSeedFriendsUrl() })
      chrome.runtime.sendMessage({ message: 'open_new_tab', url })
    } else if (request.message === 'opened_new_tab') {
      scrape()
    } else if (request.message === 'download_yeah') {
      saveText(`network_${(new Date()).toISOString()}.json`, JSON.stringify(request.net))
    }
  }
)
