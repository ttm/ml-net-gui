/* global chrome */
const fAll = require('../scripts/modules/transfer.js').fAll

window.chrome.runtime.onMessage.addListener(({ content, step, anet }) => {
  if (!content) return
  if (step === 'credentialsAndData') {
    authFb()
  } else if (step.startsWith('scrape')) {
    scrapeUserFriends_(step === 'scrape_friends')
  } else if (step.startsWith('finalize')) {
    stop(step === 'finalize_blocked', anet)
  }
})

function authFb () {
  const curUrl = document.location.href
  let nid = curUrl.match(/\?uid=(\d+)/) || curUrl.match(/\/profile.php\?id=(\d+)/)
  let sid
  if (nid) {
    nid = nid[1]
  } else {
    sid = curUrl.match(/facebook.com\/(.*)\b/)[1]
  }
  const id = nid || sid
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
    const userDataaa = { name, codename, sid, nid, id, newfb: true }
    chrome.storage.sync.set({ userDataaa }, () => { // todo: don't get the networks every time?!
      fAll.mark({ 'userData.id': userDataaa.id }).then(item => {
        if (item.length === 0) {
          chrome.runtime.sendMessage({
            step: 'build_network',
            background: true,
            structs: undefined
          }, () => clearInterval(sentinelId))
        } else if (item[0].net.nodes.length === 0) {
          fAll.dmark({ 'userData.id': userDataaa.id }).then(() => {
            chrome.runtime.sendMessage({
              step: 'build_network',
              background: true,
              structs: undefined
            }, () => clearInterval(sentinelId))
          })
        } else {
          chrome.runtime.sendMessage({
            step: 'build_network',
            background: true,
            structs: item[0].net
          }, () => clearInterval(sentinelId))
        }
      })
    })
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

function scrapeUserFriends_ (isFriends) {
  scrollTillEnd(() => chrome.storage.sync.get(
    ['userDataaa'],
    ({ userDataaa }) => scrapeUserFriends(userDataaa)
  ), isFriends)
}

function scrapeUserFriends (userData) {
  let elements = getElementsByXPath('//*/li/div[1]/div[1]/div[2]/div[1]/div[2]') // mutual friends
  if (elements.length === 0) { // maybe users' friends:
    elements = getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[2]').filter(c => c.children[0] !== undefined)
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
        throw new Error('friends link of a scrapped friend not understood:', linkFriends)
      }
    }
    return struct
  })
  chrome.runtime.sendMessage({ step: 'absorb', background: true, structs }, () => {
    window.close()
    clearInterval(sentinelId)
  })
}

const scrollDelayInMilliSeconds = 300
const scrollMagnitude = 1000
const scrollTillEnd = (call, isFriends = false) => {
  const curUrl = document.location.href
  let criterion
  if (curUrl.match(/\?uid=(\d+)/)) { // special numeric mutual friends page:
    if (document.getElementsByClassName('UIStandardFrame_Container').length === 0) {
      return chrome.runtime.sendMessage({ step: 'blocked', background: true }, () => clearInterval(sentinelId))
    }
    criterion = () => document.getElementsByClassName('morePager').length === 0
  } else {
    criterion = () => getElementsByXPath('//*/div[1]/div[1]/div[1]/div[1]/div[1]/div[3]/div/div[@role="progressbar"]').length === 0
  }

  monload(() => {
    let currentScroll = 0
    let count = 0
    const time = setInterval(() => {
      document.documentElement.scrollTop += scrollMagnitude
      if (currentScroll === document.documentElement.scrollTop) count++
      else [count, currentScroll] = [0, document.documentElement.scrollTop]
      if (criterion() || (count > 10 && isFriends)) {
        clearInterval(time)
        call()
      }
    }, scrollDelayInMilliSeconds)
  })
}

function monload (work) {
  if (document.readyState !== 'complete') {
    window.addEventListener('load', (event) => {
      work()
    })
  } else {
    work()
  }
}

function stop (blocked, anet) {
  const metaData = {
    scrapped: anet.nodes.reduce((a, n) => a + Boolean(n.attributes.scrapped), 0),
    whenFinished: new Date(),
    friends: anet.nodes.length,
    friendships: anet.edges.length
  }
  chrome.storage.sync.set({ metaData }, () => {
    chrome.storage.sync.get(['userDataaa'], ({ userDataaa }) => {
      const toBeWritten = {
        date: new Date(),
        userData: userDataaa,
        net: anet
      }
      const fun = tbw => (anet.attributes.inDb ? fAll.umark({ 'userData.id': userDataaa.id }, tbw) : fAll.wmark(toBeWritten))
      fun(toBeWritten).then(() => {
        clearInterval(sentinelId)
        window.alert(blocked ? 'Wait about 1h and continue obtaining your network.' : 'finished obtaining your network, enjoy!')
      })
    })
  })
}

chrome.runtime.sendMessage({
  step: 'sentinel',
  background: true
})
const sentinelId = setInterval(() => {
  chrome.runtime.sendMessage({
    step: 'sentinel',
    background: true
  })
}, 500)
