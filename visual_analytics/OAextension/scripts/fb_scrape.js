/* global chrome, XPathResult, alert */
console.log('OA extension client load ok')

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const msg = request.message
    if (msg === 'popup_advance_msg') {
      scrapeNameId()
    } else if (msg === 'opened_user_friends_page' || msg === 'opened_mutual_friends_page') {
      scrollTillEnd(request.newfb, () => {
        scrapeUserFriends(request.userData, msg)
      })
    } else if (request.message === 'download_network') {
      saveText(request.filename, request.net)
    }
  }
)

const monload = work => {
  if (document.readyState !== 'complete') {
    window.addEventListener('load', (event) => {
      work()
    })
  } else {
    work()
  }
}

function saveText (filename, text) {
  if (this.executed === undefined) {
    this.executed = true
    const a = document.createElement('a')
    a.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text))
    a.setAttribute('download', filename)
    a.click()
    alert('you can now visit Gradus, Lycoreia, and Tithorea with your network using the extension.')
  }
}

const scrapeUserFriends = (userData, msg) => {
  let elements = getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]') // classic
  if (elements.length === 0) { // try new:
    // elements = getElementsByXPath('//*/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]') // new
    // elements = getElementsByXPath('//*/div[3]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]') // new
    elements = getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]') // new
  } else {
    if (getElementsByXPath('//*/li/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/a').length === 0) {
      // not mutual friends page:
      elements = []
    }
  }
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
      const nid = numericMatch[1]
      if (nid !== userData.nid) {
        struct.nid = nid
      }
    } else {
      const stringMatch = linkName.match(/facebook.com\/([^?/]+)/)
      if (stringMatch) {
        const sid = stringMatch[1]
        if (sid !== userData.sid) {
          console.log('sid sid', sid, userData.sid)
          struct.sid = sid
        }
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
    if (linkFriends && (/^([.,\d]+)/).test(c.childNodes[1].innerText)) {
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
        throw new Error('friends link of a scrapped friend not understood:', linkFriends)
      }
    }
    return struct
  })
  if (msg === 'opened_user_friends_page') {
    chrome.runtime.sendMessage({ message: 'client_scrapped_user_friends', structs })
  } else if (msg === 'opened_mutual_friends_page') {
    // match /uid=/, else issue mutual blocked
    const curUrl = document.location.href
    if (curUrl.match(/\?uid=(\d+)/)) {
      chrome.runtime.sendMessage({ message: 'client_scrapped_mutual_friends', structs })
    } else {
      chrome.runtime.sendMessage({ message: 'client_scrapped_mutual_friends_fallback', structs })
    }
  }
}

const newFbScrapeBio = () => {
  const e = getElementsByXPath('//*/div/div[1]/span[1]/span[1]')[0]
  let bio = ''
  for (let i = 0; i < e.childNodes.length; i++) {
    const ee = e.childNodes[i]
    if (ee.nodeType === 3) {
      bio += ee.nodeValue
    } else if (ee.nodeName === 'BR') {
      bio += '\n'
    }
  }
  return bio
}

window.newFbScrapeBio = newFbScrapeBio // fixme: add to DB or remove

const scrapeNameIdNewFb = () => {
  const curUrl = document.location.href
  let nid = curUrl.match(/\?uid=(\d+)/) || curUrl.match(/\/profile.php\?id=(\d+)/)
  let sid
  if (nid) {
    nid = nid[1]
  } else {
    sid = curUrl.match(/facebook.com\/(.*)\b/)[1]
  }
  console.log('DOC state:', document.readyState, 'YEAH')
  monload(() => {
    console.log('DOM fully loaded and parsed')
    setTimeout(() => {
      const h1elements = getElementsByXPath('//*/h1')
      let h1el
      if (h1elements.length === 0) {
        h1el = getElementsByXPath('//*/h2/div')[0]
      } else {
        h1el = h1elements.length > 1 ? h1elements[1] : h1elements[0]
      }
      const membername = h1el.innerText
      const parts = membername.match(/[^\r\n]+/g)
      const name = parts[0]
      let codename
      if (parts.length > 1) {
        codename = parts[1]
      }
      const userData = { name, codename, sid, nid, newfb: true }
      chrome.runtime.sendMessage({ message: 'scrapped_user', userData })
    }, 4000)
  })
}

const scrapeNameId = () => {
  const eTemp = getElementsByXPath('//*/h1/span[1]/a')
  if (eTemp.length === 0) {
    return scrapeNameIdNewFb()
  }
  const e = eTemp[0]
  let name = e.innerText
  const url = e.href
  let nid = url.match(/\/profile.php\?id=(\d+)/)
  let sid
  if (nid) {
    nid = nid[1]
  } else {
    sid = url.match(/facebook.com\/(.*)\b/)[1]
  }
  const parts = name.match(/[^\r\n]+/g)
  name = parts[0]
  let codename
  if (parts.length > 1) {
    codename = parts[1]
  }
  console.log(nid, sid, name, url)
  const userData = { name, codename, sid, nid, newfb: false }
  chrome.runtime.sendMessage({ message: 'scrapped_user', userData })
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

const scrollDelayInMilliSeconds = 300
const scrollMagnitude = 1000
// const emailAddress = 'sync.aquarium@gmail.com'

const scrollTillEnd = (newfb, call = () => console.log('scrolling complete')) => {
  console.log('NEW?:', newfb)
  const curUrl = document.location.href
  let criterion
  if (curUrl.match(/\?uid=(\d+)/)) { // special numeric mutual friends page:
    if (document.getElementsByClassName('UIStandardFrame_Container').length === 0) { // fixme: was made for classic
      // return chrome.runtime.sendMessage({ message: 'client_friends_blocked' })
      // fixme: re-enable components which does not have numeric ids, i.e. not found using special numeric page:
      return chrome.runtime.sendMessage({ message: 'client_numeric_mutual_friends_blocked' })
    }
    criterion = () => document.getElementsByClassName('morePager').length === 0
  } else { // usual mutual friends page:
    // only start if no other nid available in the network
    // fixme: use browser mutual friends page, at least for string ids at the end
    if (newfb) {
      // criterion = () => getElementsByXPath('//*/div[4]/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[@role]').length === 0
      criterion = () => getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[@role="progressbar"]').length === 0
    } else {
      const e = document.getElementById('pagelet_timeline_medley_friends') // this is for classic fb:
      if (e === null) {
        return chrome.runtime.sendMessage({ message: 'client_friends_blocked' })
      }
      criterion = () => e.getElementsByClassName('_359').length === 0
    }
  }

  // window.onload = () => {
  monload(() => {
    const time = setInterval(function () {
      document.documentElement.scrollTop += scrollMagnitude
      if (criterion()) {
        console.log('finished scrolling')
        clearInterval(time)
        call()
      }
    }, scrollDelayInMilliSeconds)
  })
}
