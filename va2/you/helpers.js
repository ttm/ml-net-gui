/* global chrome */
const userNetwork = chrome.fnet = require('./fnetwork.js')
const e = module.exports

function monload (work) {
  if (document.readyState !== 'complete') {
    window.addEventListener('load', (event) => {
      work()
    })
  } else {
    work()
  }
}

e.getAttr = (dict, step) => e.steps[step].tidField.split('.').reduce((a, i) => a[i], dict)

e.steps = {
  authhh: {
    back: () => chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }),
    tidField: 'tabs.0.id',
    content: authFb
  },
  scrapeFriendsss: {
    back: openUserFriendsPageAsync, // add friends to graph, opens numeric page first, then the rest
    tidField: 'id',
    content: scrapeUserFriends_ // write friends
  },
  scrapeFriendshipsss: {
    back: structs => {
      console.log('the structs to build the network:', structs)
      userNetwork.absorb(structs)
      return openUserFriendshipsPageAsync()
    }, // add friendships to graph
    tidField: 'id',
    content: scrapeUserFriends_ // write friendships, detects end-of-line
  }
}

function authFb () {
  const curUrl = document.location.href
  let nid = curUrl.match(/\?uid=(\d+)/) || curUrl.match(/\/profile.php\?id=(\d+)/)
  let sid
  if (nid) {
    nid = nid[1]
  } else {
    sid = curUrl.match(/facebook.com\/(.*)\b/)[1]
  }
  let h1el
  const interval = setInterval(() => {
    const h1elements = getElementsByXPath('//*/h1')
    if (h1elements.length === 0) {
      h1el = getElementsByXPath('//*/h2/div')[0]
    } else {
      h1el = h1elements.length > 1 ? h1elements[1] : h1elements[0]
    }
    if (h1el) {
      clearInterval(interval)
      advance()
    }
  }, 200)
  function advance () {
    const membername = h1el.innerText
    const parts = membername.match(/[^\r\n]+/g)
    const name = parts[0]
    let codename
    if (parts.length > 1) {
      codename = parts[1]
    }
    const userDataaa = { name, codename, sid, nid, newfb: true }
    chrome.storage.sync.set({ userDataaa })
    chrome.runtime.sendMessage({ step: 'scrapeFriendsss', background: true })
  }
}

function getElementsByXPath (xpath, element) {
  const results = []
  const query = document.evaluate(xpath, element || document,
    null, window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    results.push(query.snapshotItem(i))
  }
  return results
}

function asyncget () {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get(['userDataaa', 'windowId'], resolve)
  })
}

function openUserFriendsPageAsync () {
  return asyncget().then(({ userDataaa, windowId }) => {
    console.log('UD:', userDataaa)
    const { sid, nid } = userDataaa
    let url
    if (sid) {
      url = `https://www.facebook.com/${sid}/friends`
    } else {
      url = `https://www.facebook.com/profile.php?id=${nid}&sk=friends`
    }
    console.log('WINDOW ID:', windowId)
    return chrome.tabs.create({ url, windowId })
  })
}

function openUserFriendshipsPageAsync () {
  return asyncget().then(({ windowId }) => {
    return chrome.tabs.create({ url: userNetwork.getNextURL(), windowId })
  })
}

function scrapeUserFriends_ () {
  scrollTillEnd(() => chrome.storage.sync.get(
    ['userDataaa'],
    ({ userDataaa }) => scrapeUserFriends(userDataaa))
  )
}

function scrapeUserFriends (userData) {
  // userData from storage
  // decide mode (friends/friendhips) from URL, if needed
  let elements = getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]') // mutual friends
  if (elements.length === 0) { // maybe users' friends:
    elements = getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]').filter(c => c.children[0] !== undefined) // new
  } else if (getElementsByXPath('//*/li/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/a').length === 0) { // not mutual friends page:
    elements = [] // bypassing!
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
  chrome.runtime.sendMessage({ step: 'scrapeFriendshipsss', background: true, structs })
  window.close()
}

const scrollDelayInMilliSeconds = 300
const scrollMagnitude = 1000
const scrollTillEnd = (call = () => console.log('scrolling complete')) => {
  const curUrl = document.location.href
  let criterion
  if (curUrl.match(/\?uid=(\d+)/)) { // special numeric mutual friends page:
    if (document.getElementsByClassName('UIStandardFrame_Container').length === 0) {
      return chrome.runtime.sendMessage({ message: 'client_numeric_mutual_friends_blocked' })
    }
    criterion = () => document.getElementsByClassName('morePager').length === 0
  } else {
    criterion = () => getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[@role="progressbar"]').length === 0
  }

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
