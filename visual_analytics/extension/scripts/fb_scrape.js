/* global chrome, alert, XPathResult */

// fixme:
//   send data to mongo from the extension
//   make a better description of the extension data
//   better naming on manifest.json
//   accept scrapping start not only in the friends and friends_mutual pages
//   put status updates on the extension popup, make it open while scrapping
//   scrape friends page, not friends_mutual
//   scrape other types of pages, such as groups, pages, timelines
//   implement scrapping bot directly in Hydra/OA page
//   allow for input info directly, may ask to human -> computer
//   allow scrapping the page of a single person here and there to yield net
//   taking too long to scrape large networks, thus:
//     use multiple tabs to scrape, background absorbs profiles from time to time
//     keep track of profiles already scrapped to restart if a problem comes up OK
//     get friends from FB API, then visit each friend's page
//     don't close initial window because 4k friends takes long to load
//     partial net download
//     construct pieces (e.g. from a partial fetch of friends, or starting from a friend's mutual friends)
//     output the html in case no friends were found, so we can parse it
//     start/stop button in order to make net in days
//   allow for popup (or automated test) page to adjust the follosing values for scrolling:
const hitsCounterThreshold = 20 // Recommended:10
const initDelayInMilliseconds = 1000 // Recommended:5000
const scrollDelayInMilliSeconds = 300 // Recommended:1000
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

const getUserPageDataClassic = () => {
  const membername = getElementsByXPath('//*/h1').map(i => i.innerText)[1]
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
  let numeric = false
  let id = last
  if (numericId && /^\d+$/.test(numericId[1])) {
    numeric = true
    id = numericId[1]
  }
  return {
    url: `${window.location.origin}/${last}`,
    id: id,
    name,
    codename,
    numeric: numeric
  }
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
  let numeric = false
  let id = last
  if (numericId && /^\d+$/.test(numericId[1])) {
    numeric = true
    id = numericId[1]
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

let htmlToFriendsProfilesClassic = () => {
  return getElementsByXPath('//*/div[1]/ul/li/div[1]/div[1]/div[2]/div[1]/div[2]').map(c => {
    let mutual, idType, id, stringId, numericId, nfriends, url
    const name = c.firstChild.firstChild.innerText
    if (c.childNodes.length > 1) {
      const parts = c.childNodes[1].innerText.split(' ')
      if (/^[\d,]+$/.test(parts[0])) {
        if (parts.length === 3) {
          mutual = parts[0]
        } else {
          nfriends = parts[0]
        }
      }
    }
    const link = c.firstChild.firstChild.href
    numericId = link.match(/profile.php\?id=(\d+)/)
    if (numericId) {
      numericId = numericId[1]
      id = numericId
      idType = 'number'
      url = `https://www.facebook.com/profile.php?id=${numericId}`
    } else {
      stringId = link.match(/www.facebook.com\/(.+)\?/)
      if (stringId) {
        stringId = stringId[1]
        id = stringId
        idType = 'string'
        numericId = undefined
        url = `https://www.facebook.com/${stringId}`
      } else {
        stringId = undefined
      }
    }
    // return { idType, id, stringId, numericId, name, mutual, url, nfriends}
    return { idType, id, stringId, numericId, name, mutual, nfriends, url }
  })
}

let htmlToFriendsProfiles = () => {
  return getElementsByXPath('//*/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]').map(c => {
    let mutual, idType, id, stringId, numericId
    const name = c.childNodes[0].innerText
    if (c.childNodes.length >= 2) {
      const num = c.childNodes[1].innerText.split(' ')[0]
      if (num.length !== 0 || /^[\d,]+$/.test(num)) {
        mutual = parseInt(num)
      }
    }
    const url = c.childNodes[0].childNodes[0].href
    if (url !== undefined) {
      const parts = url.split('/')
      const last = parts[parts.length - 1]
      numericId = last.match(/^profile.php\?id=(\d+)/)
      if (numericId) {
        numericId = numericId[1]
        id = numericId
        idType = 'number'
      } else {
        stringId = last
        id = last
        idType = 'string'
        numericId = undefined
      }
    }
    return { idType, id, stringId, numericId, name, mutual, url, nfriends: undefined }
  })
}

let scrapper = htmlToFriendsProfiles
let userScrapper = getUserPageData
const scrape = () => {
  setTimeout(() => {
    let pageUserData = userScrapper()
    scrollTillEnd(() => {
      let profiles = scrapper()
      if (profiles.length === 0) {
        userScrapper = getUserPageDataClassic
        pageUserData = userScrapper()
        scrapper = htmlToFriendsProfilesClassic
        profiles = scrapper()
      }
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
      scrape()
    } else if (request.message === 'opened_new_tab') {
      scrape()
    } else if (request.message === 'download_yeah') {
      saveText(`network_${(new Date()).toISOString()}.json`, JSON.stringify(request.net))
    }
  }
)
