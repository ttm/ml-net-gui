// fixme: come with a strategy for dealing with users with both string and numeric ids
const Graph = require('graphology')

let scrappedData
let counter
let graph
let anonString
let anonCount
let seed

const getMutualFriendsURL = (profile) => {
  if (profile.numericId === undefined) {
    return `${profile.url}/friends_mutual`
  } else {
    return `${profile.url}&sk=friends_mutual`
  }
}

const addNode = (profile) => {
  const i = profile
  let id = i.id
  if (id == undefined) {
    id = anonString + anonCount++
  }
  if (!graph.hasNode(id)) {
    graph.addNode(id, {
      idType: i.idType,
      id: i.id,
      stringId: i.stringId,
      numericId: i.numericId,
      url: i.url,
      name: i.name,
      codename: undefined,
      mutual: i.mutual
    })
  }
  return id
}

chrome.browserAction.onClicked.addListener(function (tab) {
  graph = new Graph()
  window.graph = graph
  anonString = 'unnactive-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '-'
  anonCount = 0
  seed = undefined
  counter = 0
  chrome.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' })
})

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'open_new_tab') {
      if (request.pageUserData !== undefined) {
        if (seed === undefined) { // seed arrived
          seed = {
            userInfo: request.pageUserData,
            profiles: request.profiles,
            date: (new Date()).toGMTString()
          }
          graph.setAttribute('seed', seed)
          seed.profiles.forEach(i => {
            addNode(i)
          })
        } else { // iterating
          // if (request.pageUserData.codename !== undefined) {
          //   graph.updateNodeAttribute(request.pageUserData.id, a => {
          //     a.codename = request.pageUserData.codename
          //     return a
          //   })
          // }
          console.log('request profiles for', request.pageUserData.name, ':', request.profiles, counter)
          request.profiles.forEach(i => {
            const id = addNode(i)
            if (!graph.hasEdge(request.pageUserData.id, id)) {
              graph.addUndirectedEdge(request.pageUserData.id, id)
            }
          })
        }
        let profile
        console.log('profiles, counter:', seed.profiles, counter)
        do {
          profile = seed.profiles[counter++]
        } while ((profile === undefined || profile.url === undefined) && counter < seed.profiles.length)
        if (profile === undefined) {
          console.log('finished scrapping iteration')
          chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendMessage(tab.id, { message: 'download_yeah', net: graph.toJSON() })
          })
        } else {
          chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id);
            console.log('profile, url:', profile, getMutualFriendsURL(profile))
            chrome.tabs.create({ url: getMutualFriendsURL(profile) }, function (tab) {
              chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape_ok.js' }, function () {
                chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
              })
            })
          })
        }
      } else { // just clicked, first page to scrape
        chrome.tabs.create({ url: request.url }, function (tab) {
          chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape_ok.js' }, function () {
            chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
          })
        })
      }
    }
  }
)
