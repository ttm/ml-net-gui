/* global chrome, XPathResult */
console.log('client load ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'popup_msg') {
      console.log('client received popup msg, routed from background')
      scrapeNameId()
      chrome.runtime.sendMessage({ message: 'client_msg' }) // acts on popup
      chrome.runtime.sendMessage({ message: 'client_scrapped_user' })
      // todo: check if network in mongo, if it is, load it
    } else if (request.message === 'opened_user_friends_page') {
      // scroll till end (find out if end reached)
      // scrape friends
      scrollTillEnd(() => console.log(scrapeUserFriends(), 'SCRAPPED FRIENDS'))
    } else if (request.message === 'background_msg') {
      console.log('client received message from background')
    }
  }
)
const scrapeUserFriends = () => {
  const elements = getElementsByXPath('//*/div/div[1]/ul/li/div[1]/div[1]/div[2]/div[1]/div[2]') // classic
  const structs = elements.map(c => {
    const struct = { name: c.children[0].innerText }
    if (!c.children[0].children[0]) {
      return struct
    }
    const linkName = c.children[0].children[0].href
    if (!linkName) {
      return struct
    }
    const numericMatch = linkName.match(/\?uid=(\d+)/) || linkName.match(/\/profile.php\?id=(\d+)/)
    if (numericMatch) {
      struct.nid = numericMatch[1]
    } else {
      const stringMatch = linkName.match(/facebook.com\/([^?/]+)/)
      if (stringMatch) {
        struct.sid = stringMatch[1]
      }
    }
    if (c.children.length === 1) {
      return struct
    }
    let linkFriends = c.children[1].href
    if (!linkFriends) {
      try {
        linkFriends = c.children[1].children[0].children[0].children[0].children[0].href // fixme: when happends?
      } catch (err) {
        console.log('one friend href not obtained')
      }
    }
    if ((/^([.,\d]+)/).test(c.childNodes[1].innerText)) {
      const num = c.childNodes[1].innerText.match(/^([.,\d]+)/)[1]
      if ((/\?uid=(\d+)/).test(linkFriends)) {
        struct.nid = linkFriends.match(/\?uid=(\d+)/)[1]
        struct.mutual = num
      } else if ((/\/profile.php\?id=(\d+)/).test(linkFriends)) {
        struct.nid = linkFriends.match(/\/profile.php\?id=(\d+)/)[1]
        struct.nfriends = num
      } else if ((/\/friends_mutual$/).test(linkFriends)) {
        struct.sid = linkFriends.match(/facebook.com\/(.*)\/friends_mutual$/)[1]
        struct.mutual = num
      } else if ((/\/friends$/).test(linkFriends)) {
        struct.sid = linkFriends.match(/facebook.com\/(.*)\/friends$/)[1]
        struct.nfriends = num
      } else {
        console.log(linkFriends)
        throw new Error('friends link of a scrapped friend not understood')
      }
    }
    return struct
  })
  return structs
}

const scrapeNameId = () => {
  const e = getElementsByXPath('//*/h1/span[1]/a')[0]
  let name = e.innerText
  const url = e.href
  let nid = url.match(/\/profile.php\?id=(\d+)/)
  let sid = url.match(/facebook.com\/(.*)\b/)
  if (sid) {
    sid = sid[1]
  } else if (nid) {
    nid = nid[1]
  }
  const parts = name.match(/[^\r\n]+/g)
  name = parts[0]
  let codename
  if (parts.length > 1) {
    codename = parts[1]
  }
  console.log(nid, sid, name, url)
  chrome.storage.sync.set({ name, codename, sid, nid, url })
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

// const hitsCounterThreshold = 5 // Recommended:10
// const initDelayInMilliseconds = 1000 // Recommended:5000
const scrollDelayInMilliSeconds = 300 // Recommended:1000
const scrollMagnitude = 1000 // Recommended:1000
// const emailAddress = 'renato.fabbri@gmail.com'

const scrollTillEnd = (call = () => console.log('scrolling complete')) => {
  const time = setInterval(function () {
    document.documentElement.scrollTop += scrollMagnitude
    // y = document.documentElement.scrollTop
    // if (x === y) {
    //   hitsCounter += 1
    //   if (hitsCounter > hitsCounterThreshold) {
    //     clearInterval(time)
    //     console.log('finished scrolling')
    //     call()
    //   }
    // } else {
    //   hitsCounter = 0
    // }
    if (getElementsByXPath('//*/div[2]/div[1]/img').length === 0) {
      console.log('finished scrolling')
      clearInterval(time)
      call()
    }
  }, scrollDelayInMilliSeconds)
}
