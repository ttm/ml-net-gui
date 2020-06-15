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
const hitsCounterThreshold = 5 // Recommended:10
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
  const curUrl = document.location.href
  const numericMatch = curUrl.match(/\?uid=(\d+)/) || curUrl.match(/\/profile.php\?id=(\d+)/)
  let url, membername, codename, idType, numericId, stringId, id, name
  if (numericMatch) {
    idType = 'number'
    id = numericMatch[1]
    numericId = id
    url = `https://www.facebook.com/profile.php?id=${numericId}`
  } else {
    const stringMatch = curUrl.match(/facebook.com\/(.*)\/friends/)
    if (stringMatch) {
      idType = 'string'
      id = stringMatch[1]
      stringId = id
      url = `https://www.facebook.com/${stringId}`
    }
  }
  if (!curUrl.match(/\?uid=(\d+)/)) {
    const h1elements = getElementsByXPath('//*/h1')
    let h1el
    if (h1elements.length === 0) {
      h1el = getElementsByXPath('//*/h2/div')[0]
    } else {
      h1el = h1elements.length > 1 ? h1elements[1] : h1elements[0]
    }
    membername = h1el.innerText
    const parts = membername.match(/[^\r\n]+/g)
    name = parts[0]
    if (parts.length > 1) {
      codename = parts[1]
    }
  }
  return {
    url,
    name,
    codename,
    id,
    idType,
    numericId,
    stringId
  }
}

// const getUserPageData = () => {
//   const membername = getElementsByXPath('//*/h1').map(i => i.innerText)[0]
//   let parts = membername.match(/[^\r\n]+/g)
//   const name = parts[0]
//   let codename
//   if (parts.length > 1) {
//     codename = parts[1]
//   }
//   // get potential id of the entity, if user page is loaded is ok:
//   const path = window.location.href
//   parts = path.split('/')
//   const ind = parts.indexOf('www.facebook.com')
//   const last = parts[ind + 1]
//   const numericId = last.match(/^profile.php\?id=(\d+)/)
//   let numeric = false
//   let id = last
//   if (numericId && /^\d+$/.test(numericId[1])) {
//     numeric = true
//     id = numericId[1]
//   }
//   return {
//     url: `${window.location.origin}/${last}`,
//     id,
//     name,
//     codename,
//     numeric: numeric
//   }
// }

// const getSeedFriendsUrl = () => {
//   const ud = getUserPageData()
//   if (ud.numeric) {
//     return `${ud.url}&sk=friends`
//   } else {
//     return `${ud.url}/friends`
//   }
// }

// const htmlToFriendsProfilesClassicBetter = () => {
//   return getElementsByXPath('//*/div[1]/ul/li/div[1]/div[1]/div[2]/div[1]/div[2]').map(c => {
//     const name = c.children[0].innerText
//     const nameUrl = c.children[0].children[0].href
//     const mutualUrl = c.children[1].href
//     const mutualString = c.children[1].innerText
//     return {
//       name,
//       nameUrl,
//       mutualUrl,
//       mutualString
//     }
//   })
// }

const htmlToFriendsProfilesClassic = () => {
// let hh = () => {
  // return getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]').map(c => {
  let elements = getElementsByXPath('//*/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]')
  // https://www.facebook.com/browse/mutual_friends/?uid=1537120300
  // https://www.facebook.com/browse/mutual_friends/?uid=100006942884068
  //   https://www.facebook.com/browse/mutual_friends/?uid=100004051628084
  //   https://www.facebook.com/profile.php?id=100004051628084&sk=friends_mutual
  //   https://www.facebook.com/profile.php?id=100006942884068&sk=friends_mutual
  //   https://www.facebook.com/profile.php?id=100006942884068&sk=friends_mutual
  //   https://www.facebook.com/alexandremagnovianasobreira.sobreira/friends_mutual
  //   https://www.facebook.com/profile.php?id=100000652826936&sk=friends_mutual
  //   https://www.facebook.com/browse/mutual_friends/?uid=100000652826936
  if (elements.length === 0) { // classic, not new fb
    elements = getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]')
  }
  if (elements.length === 0) { // classic, not new fb
    const els = getElementsByXPath('//*/div[1]/div[2]/h2')
    if (els.length === 0) {
      // issue new tab as usual
      chrome.runtime.sendMessage({ message: 'open_new_tab', pageUserData: getUserPageDataClassic(), profiles: [] })
    } else {
      const msg = els[0].innerText
      console.log('maybe block')
      if (msg.split(' ').length > 3) {
        console.log('issuing block')
        chrome.runtime.sendMessage({ message: 'open_new_tab', msg, fbblock: 'yes', pageUserData: getUserPageDataClassic(), profiles: [] })
      }
    }
    return 'dont'
  }
  return elements.map(c => {
    let mutual, idType, id, stringId, numericId, nfriends, url
    const name = c.children[0].innerText
    if (c.children[0].children[0]) {
      const linkName = c.children[0].children[0].href
      if (linkName) {
        const numericMatch = linkName.match(/\?uid=(\d+)/) || linkName.match(/\/profile.php\?id=(\d+)/)
        if (numericMatch) {
          numericId = numericMatch[1]
        } else {
          // const stringMatch = linkName.match(/facebook.com\/([^\?\/]+)/)
          const stringMatch = linkName.match(/facebook.com\/([^?/]+)/)
          if (stringMatch) {
            stringId = stringMatch[1]
          }
        }
      }
      if (c.children.length > 1) {
        let linkFriends = c.children[1].href
        if (!linkFriends) {
          try {
            linkFriends = c.children[1].children[0].children[0].children[0].children[0].href
          } catch (err) {
            console.log('one friend href not obtained')
          }
        }
        console.log('HERE', c.childNodes[1])
        window.ccc = c.childNodes[1]
        if ((/^([.,\d]+)/).test(c.childNodes[1].innerText)) {
          const num = c.childNodes[1].innerText.match(/^([.,\d]+)/)[1]
          if ((/\?uid=(\d+)/).test(linkFriends)) {
            numericId = linkFriends.match(/\?uid=(\d+)/)[1]
            mutual = num
          } else if ((/\/profile.php\?id=(\d+)/).test(linkFriends)) {
            numericId = linkFriends.match(/\/profile.php\?id=(\d+)/)[1]
            nfriends = num
          } else if ((/\/friends_mutual$/).test(linkFriends)) {
            stringId = linkFriends.match(/facebook.com\/(.*)\/friends_mutual$/)[1]
            mutual = num
          } else if ((/\/friends$/).test(linkFriends)) {
            stringId = linkFriends.match(/facebook.com\/(.*)\/friends$/)[1]
            nfriends = num
          } else {
            console.log(linkFriends)
            throw new Error('friends link of a scrapped friend not understood')
          }
        }
      }
      if (stringId) {
        id = stringId
        idType = 'string'
        url = `https://www.facebook.com/${stringId}`
      } else {
        id = numericId
        idType = 'number'
        url = `https://www.facebook.com/profile.php?id=${numericId}`
      }
    }
    return { idType, id, stringId, numericId, name, mutual, nfriends, url }
  })
}

// const htmlToFriendsProfiles = () => {
//   return getElementsByXPath('//*/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]').map(c => {
//     let mutual, idType, id, stringId, numericId, nfriends, url
//     const name = c.childNodes[0].innerText
//     const linkName = c.children[0].children[0].href
//     if (c.childNodes.length >= 2) {
//       const num = c.childNodes[1].innerText.split(' ')[0]
//       if (num.length !== 0 || /^[\d,]+$/.test(num)) {
//         mutual = parseInt(num)
//       }
//     }
//     url = c.childNodes[0].childNodes[0].href
//     if (url !== undefined) {
//       const parts = url.split('/')
//       const last = parts[parts.length - 1]
//       numericId = last.match(/^profile.php\?id=(\d+)/)
//       if (numericId) {
//         numericId = numericId[1]
//         id = numericId
//         idType = 'number'
//       } else {
//         stringId = last
//         id = last
//         idType = 'string'
//         numericId = undefined
//       }
//     }
//     return { idType, id, stringId, numericId, name, mutual, url, nfriends: undefined }
//   })
// }

// const scrapper = htmlToFriendsProfilesClassic
// const userScrapper = getUserPageDataClassic
const scrape = () => {
  setTimeout(() => {
    // let pageUserData = userScrapper()
    scrollTillEnd(() => {
      // let profiles = scrapper()
      // if (profiles.length === 0) {
      // userScrapper = getUserPageDataClassic
      const pageUserData = getUserPageDataClassic()
      // scrapper = htmlToFriendsProfilesClassic
      const profiles = htmlToFriendsProfilesClassic()
      // }
      if (profiles !== 'dont') {
        chrome.runtime.sendMessage({ message: 'open_new_tab', pageUserData, profiles })
      }
    })
  }, initDelayInMilliseconds)
}

function saveText (filename, text, partial) {
  if (this.executed === undefined) {
    this.executed = true
    const tempElem = document.createElement('a')
    tempElem.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text))
    tempElem.setAttribute('download', filename)
    tempElem.click()
    let msg = 'Download attempt complete.'
    if (partial) {
      msg += ' IMPORTANT: downloaded only a part of your netwok, try downloading the full network in the "new facebook" interface.'
    }
    console.log(msg)
    const raiseAlert = 'E-mail the downloaded file to: ' + emailAddress
    alert(raiseAlert)
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'clicked_browser_action') {
      // const url = window.location.href // make url for mutual friends, both numeric and string id
      scrape()
    } else if (request.message === 'opened_new_tab') {
      scrape()
    } else if (request.message === 'download_yeah') {
      saveText(`network_${(new Date()).toISOString()}.json`, JSON.stringify(request.net), request.partial)
    }
  }
)
