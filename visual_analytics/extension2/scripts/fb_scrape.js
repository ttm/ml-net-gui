/* global chrome, XPathResult, alert */
console.log('client load ok')

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const msg = request.message
    if (msg === 'popup_msg') {
      console.log('client received popup msg, routed from background')
      scrapeNameId()
    } else if (msg === 'opened_user_friends_page' || msg === 'opened_mutual_friends_page') {
      scrollTillEnd(() => {
        scrapeUserFriends(request.userData, msg)
      })
    } else if (request.message === 'download_network') {
      saveText(request.filename, request.net)
    } else if (request.message === 'background_msg') {
      console.log('client received message from background')
    }
  }
)

function saveText (filename, text) {
  if (this.executed === undefined) {
    this.executed = true
    const a = document.createElement('a')
    a.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text))
    a.setAttribute('download', filename)
    a.click()
    alert('E-mail the downloaded file to: ' + emailAddress)
  }
}

const scrapeUserFriends = (userData, msg) => {
  // const elements = getElementsByXPath('//*/div/div[1]/ul/li/div[1]/div[1]/div[2]/div[1]/div[2]') // classic
  const elements = getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]') // classic
  if (elements.length === 0) {
    if (document.getElementsByClassName('UIStandardFrame_Container').length === 0) {
      chrome.runtime.sendMessage({ message: 'client_numeric_mutual_friends_blocked' })
      return
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
    chrome.runtime.sendMessage({ message: 'client_scrapped_mutual_friends', structs })
  } else if (msg === 'login_msg_from_background') {
    console.log('mk login')
  }
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
  const userData = { name, codename, sid, nid }
  chrome.runtime.sendMessage({ message: 'client_scrapped_user', userData })
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
const emailAddress = 'renato.fabbri@gmail.com'

const scrollTillEnd = (call = () => console.log('scrolling complete')) => {
  const curUrl = document.location.href
  let criterion
  if (curUrl.match(/\?uid=(\d+)/)) { // special numeric mutual friends page:
    // criterion = () => getElementsByXPath('//*/div[1]/div[1]/span/img').length === 0
    criterion = () => document.getElementsByClassName('morePager').length === 0
  } else { // usual mutual friends page:
    // getElementsByXPath('//*/div[2]/div[3]/div[1]/div[3]').length > 0
    const e = document.getElementById('pagelet_timeline_medley_friends')
    if (e === null) {
      chrome.runtime.sendMessage({ message: 'client_friends_blocked' })
      return
    }
    criterion = () => e.getElementsByClassName('_359').length === 0
  }
  const time = setInterval(function () {
    document.documentElement.scrollTop += scrollMagnitude
    if (criterion()) {
      console.log('finished scrolling')
      clearInterval(time)
      call()
    }
  }, scrollDelayInMilliSeconds)
}

window.postMessage({ type: 'FROM_PAGE_TO_CONTENT_SCRIPT', text: 'Hello from the !' }, '*')

window.addEventListener('message', function (event) {
  // We only accept messages from this window to itself [i.e. not from any iframes]
  console.log('received message, but not qualified', event)
  if (event.source !== window) return

  if (event.data.type && (event.data.type === 'FROM_PAGE_TO_CONTENT_SCRIPT')) {
    // chrome.runtime.sendMessage(event.data); // broadcasts it to rest of extension, or could just broadcast event.data.payload...
    console.log('wow received using window broadcast')
  } // else ignore messages seemingly not sent to yourself
}, false)
