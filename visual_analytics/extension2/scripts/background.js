/* global chrome */
const Graph = require('graphology')
let graph
let anonString
let anonCount
// chrome.storage.clear()

const setVars = () => {
  anonString = 'unnactive-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '-'
  anonCount = 0
  graph = new Graph()
  window.graph = graph
}

console.log('server loaded ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'popup_msg') {
      console.log('background received popup msg')
      setVars()
      chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }, function (win) {
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_msg' })
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'background_msg' })
        })
      })
    } else if (request.message === 'client_msg') {
      console.log('background received client msg')
    } else if (request.message === 'client_scrapped_user') { // open new tab
      openUserFriendsPage()
    } else if (request.message === 'client_scrapped_user_friends') { // close current tab, open new
      chrome.storage.sync.get(['name', 'sid', 'nid', 'structs', 'codename'], function (r) {
        const { name, codename, sid, nid, structs } = r
        graph.setAttribute('user', { name, codename, sid, nid, friends: structs })
        addNodesFrom(structs)
        openMutualFriendsPage()
      })
    } else if (request.message === 'client_scrapped_mutual_friends') { // close current tab, open new
      openMutualFriendsPage()
    }
  }
)

const addNodesFrom = structs => {
  structs.forEach(s => {
    const { name, sid, nid, mutual, nfriends } = s
    let id = sid || nid
    let anon = false
    if (!id) {
      id = anonString + anonCount++
      anon = true
    }
    graph.addNode(id, { name, sid, nid, mutual, nfriends, anon })
  })
}

const openMutualFriendsPage = () => {
  // find a numeric id if any
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
