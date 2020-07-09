/* global chrome */
const Graph = require('graphology')
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
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_msg' })
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'background_msg' })
        })
      })
    } else if (msg === 'client_msg') {
      console.log('background received client msg')
    } else if (msg === 'client_scrapped_user') { // open new tab
      // todo: check if network in mongo, if it is, load it
      openUserFriendsPage()
    } else if (msg === 'client_scrapped_user_friends') { // close current tab, open new
      chrome.storage.sync.get(['name', 'codename', 'sid', 'nid', 'structs'], function (r) {
        const { name, codename, sid, nid, structs } = r
        graph.setAttribute('user', { name, codename, sid, nid, friends: structs })
        addNodesFrom(structs)
        openMutualFriendsPage(msg)
      })
    } else if (msg === 'client_scrapped_mutual_friends') { // close current tab if finished and open new
      chrome.storage.sync.get(['structs'], function (r) {
        updateNodesFrom(r.structs)
        openMutualFriendsPage(msg)
      })
    }
  }
)

const updateNodesFrom = structs => {
  const { sids, nids } = getIds()
  structs.forEach(s => {
    const { name, sid, nid, mutual, nfriends } = s
    const id = findNode(name, sid, nid, sids, nids)
    const a = graph.getNodeAttributes(id)
    a.sid = a.sid || sid
    a.nid = a.nid || nid
    a.mutual = a.mutual || mutual
    a.nfriends = a.nfriends || nfriends
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
  const url = getNextURL()
  if (url === undefined) {
    // todo: send to mongo (already browserfying background)
    // download:
    const ga = graph.getAttributes()
    const id = ga.sid || ga.nid
    const filename = `${ga.name} (${id}), ${(new Date()).toISOString().split('.')[0]}`
    chrome.tabs.create({ url: 'https://www.facebook.com' }, function (tab) {
      chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
        chrome.tabs.sendMessage(tab.id, {
          message: 'download_network',
          filename,
          net: JSON.stringify(graph.toJSON)
        })
      })
    })
    return
  }
  chrome.storage.sync.get(['tabid'), function (r) {
    if (r.tabid) {
      chrome.tabs.remove(r.tabid)
    }
    chrome.tabs.create({ url }, function (tab) {
      chrome.storage.sync.set({ tabid: tab.id })
      chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
        chrome.tabs.sendMessage(tab.id, { message: 'opened_mutual_friends_page' })
      })
    })
  }
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
      return true
    }
  })
  if (url === undefined) {
    nodeIds.some(i => {
      if (i.sid !== undefined && !i.scrapped) {
        graph.setNodeAttribute(i.id, 'scrapped', true)
        url = mutualFriendsString(i.sid)
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
  // if blocked: return `https://www.facebook.com/profile.php?id=${id}&sk=friends_mutual`
  return `https://www.facebook.com/browse/mutual_friends/?uid=${id}`
}

const openUserFriendsPage = () => {
  chrome.storage.sync.get(['sid', 'nid'], function (r) {
    let url
    if (r.sid) {
      url = `https://www.facebook.com/${r.sid}/friends`
    } else {
      url = `https://www.facebook.com/profile.php?id=${r.nid}&sk=friends`
    }
    chrome.tabs.create({ url }, function (tab) {
      chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
        chrome.tabs.sendMessage(tab.id, { message: 'opened_user_friends_page' })
      })
    })
  })
}
