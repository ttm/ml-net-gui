/* global chrome */
const Graph = require('graphology')
const transf = require('../../scripts/modules/transfer/mong.js')
window.transf = transf
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
    if (msg === 'popup_advance_msg') {
      setVars()
      chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }, function (win) {
        chrome.storage.sync.set({ windid: win.id })
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_advance_msg' })
        })
      })
    } else if (msg === 'popup_gradus_msg') {
      chrome.tabs.create({ url: 'http://localhost:8080/?page=ankh_' }, function (tab) {
        chrome.tabs.executeScript(tab.id, {
          code: '(' + function (graph) {
            window.postMessage({ type: 'FROM_OA_EXT', graph }, '*')
            return { success: true, response: 'This is from webpage.' }
          } + ')(' + JSON.stringify(graph ? graph.export() : {}) + ');'
        }, function (results) {
          // This is the callback response from webpage
          // window.theSage_ = results
          // console.log(results[0]) // logs in extension console
        })
        // chrome.tabs.sendMessage(tab.id, {
        //   message: 'the_network',
        //   graph: graph.export()
        // })
        // chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
        //   chrome.tabs.sendMessage(tab.id, {
        //     message: 'download_network',
        //     filename,
        //     net
        //   })
        // })
      })
    } else if (msg === 'client_scrapped_mutual_friends') { // close current tab if finished and open new
      const s = request.structs
      updateNodesFrom(s)
      openMutualFriendsPage()
    } else if (msg === 'client_scrapped_user_friends') { // close current tab, open new
      const s = request.structs
      graph.setAttribute('userFriends', s)
      addNodesFrom(s)
      openMutualFriendsPage()
    } else if (msg === 'client_numeric_mutual_friends_blocked') {
      const { iid } = graph.getAttribute('lastId')
      graph.setNodeAttribute(iid, 'scrapped', false)
      return openTabToDownload()
    } else if (request.message === 'scrapped_user') {
      const { sid, nid, newfb } = request.userData
      window.newfb = newfb
      const query = sid ? { sid } : { nid }
      transf.client.auth.loginWithCredential(new transf.s.AnonymousCredential()).then(user => {
        transf.testCollection.findOne(query).then(r => {
          if (r) {
            // load network
            console.log('network loaded')
            graph.import(JSON.parse(r.text))
            const { sid, nid, name } = graph.getAttribute('userData')
            let friendsVisited = 0
            graph.forEachNode((n, a) => {
              friendsVisited += Boolean(a.scrapped)
            })
            chrome.storage.sync.set({
              scrapeStatus: {
                name,
                sid,
                nid,
                nfriends: graph.order,
                friendsVisited,
                friendships: graph.size
              }
            })
            openMutualFriendsPage()
          } else {
            console.log('network started')
            graph.setAttribute('userData', request.userData) // { name, codename, sid, nid }
            openUserFriendsPage()
          }
        })
      })
    }
  }
)

const updateNodesFrom = structs => {
  const { sids, nids } = getIds()

  const lastId = graph.getAttribute('lastId')
  const id0 = lastId.iid

  structs.forEach(s => {
    const { name, sid, nid, mutual, nfriends } = s
    const id = findNode(name, sid, nid, sids, nids)
    if (id === undefined) {
      s.foundIn = { id0, lastId }
      let m = graph.getAttribute('membersNotFound')
      if (m !== undefined) {
        m.push(s)
      } else {
        m = [s]
      }
      graph.setAttribute('membersNotFound', m)
      return
    }
    const a = graph.getNodeAttributes(id)
    a.sid = a.sid || sid
    a.nid = a.nid || nid
    a.mutual = a.mutual || mutual
    a.nfriends = a.nfriends || nfriends
    if (!graph.hasEdge(id0, id)) {
      graph.addUndirectedEdge(id0, id)
    }
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
  // todo: try to use this Ajax call: https://www.facebook.com/ajax/browser/list/mutualfriends/?uid=781909429&view=list&location=other&infinitescroll=0&start=30&av=100035035968952
  const url = getNextURL()
  if (url === undefined) {
    // upload to mongo and give download dialog:
    openTabToDownload()
    return
  }
  newMutualTab(url)
}

const openTabToDownload = () => {
  let friendsVisited = 0
  graph.forEachNode((n, a) => {
    friendsVisited += Boolean(a.scrapped)
  })
  const { sid, nid, name } = graph.getAttribute('userData')
  chrome.storage.sync.set({
    scrapeStatus: {
      name,
      sid,
      nid,
      nfriends: graph.order,
      friendsVisited,
      friendships: graph.size
    }
  })
  const net = JSON.stringify(graph.toJSON())
  const id = sid || nid
  const filename = `${name} (${id}), ${(new Date()).toISOString().split('.')[0]}.json`
  // fixme: set 'Secure' because 'SameSite=None' (future versions of chrome will disallow this as is:
  transf.writeNet(net, filename, sid, nid, id, () => console.log('written net:', filename, name))
  chrome.tabs.create({ url: 'https://www.facebook.com' }, function (tab) {
    chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
      chrome.tabs.sendMessage(tab.id, {
        message: 'download_network',
        filename,
        net
      })
    })
  })
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
      graph.setAttribute('lastId', { id: i.nid, type: 'numeric', iid: i.id })
      return true
    }
  })
  return url
}

const mutualFriendsNumeric = id => {
  return `https://www.facebook.com/browse/mutual_friends/?uid=${id}`
}

const openUserFriendsPage = () => {
  const { sid, nid } = graph.getAttribute('userData')
  let url
  if (sid) {
    url = `https://www.facebook.com/${sid}/friends`
  } else {
    url = `https://www.facebook.com/profile.php?id=${nid}&sk=friends`
  }
  chrome.tabs.create({ url }, function (tab) {
    chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
      chrome.tabs.sendMessage(tab.id, { message: 'opened_user_friends_page', userData: graph.getAttribute('userData'), newfb: window.newfb })
    })
  })
}

const newMutualTab = url => {
  chrome.storage.sync.get(['winid'], function (r) {
    chrome.tabs.getAllInWindow(r.winid, tabs => {
      if (tabs.length > 2) chrome.tabs.remove(tabs[tabs.length - 1].id)
      chrome.tabs.create({ url, windowId: r.winid }, function (tab) {
        chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(tab.id, { message: 'opened_mutual_friends_page', userData: graph.getAttribute('userData'), newfb: window.newfb })
        })
      })
    })
  })
}
