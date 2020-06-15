/* global chrome */

// fixme: come with a strategy for dealing with users with both string and numeric ids
const Graph = require('graphology')

let graph
let numericIdsKeeper
let numericIds
let stringIds
let numericIdsCount
let stringIdsCount
let anonString
let anonCount
let seed
let fbblock
let blockCount
let blockIds

const getMutualFriendsURL2 = (id, type) => {
  if (fbblock) {
    if (type === 'string') {
      return `https://www.facebook.com/${id}/friends_mutual`
    } else {
      return `https://www.facebook.com/profile.php?id=${id}&sk=friends_mutual`
    }
  } else {
    if (type === 'number') {
      return `https://www.facebook.com/browse/mutual_friends/?uid=${id}`
    } else {
      return `https://www.facebook.com/${id}/friends_mutual`
    }
  }
}

// const getMutualFriendsURL = (profile) => {
//   let numericId = profile.numericId
//   const stringId = profile.stringId
//   if (numericId === undefined) {
//     numericId = Object.keys(numericIdsKeeper).find(key => numericIdsKeeper[key] === stringId)
//   }
//   if (numericId === undefined) {
//     return `https://www.facebook.com/${stringId}/friends_mutual`
//   }
//   return `https://www.facebook.com/browse/mutual_friends/?uid=${numericId}`
// }

const addNode = (profile) => {
  const i = profile
  let id = i.id
  // the graph id is always string if available, then number if available, the anon
  if (id === undefined) {
    id = anonString + anonCount++
  }
  let hasNode = false
  if (i.stringId) {
    if (graph.hasNode(i.stringId)) {
      hasNode = true
      if (i.numericId && !(i.numericId in numericIdsKeeper)) {
        graph.mergeNodeAttributes(id, { numericId: i.numericId })
        numericIdsKeeper[i.numericId] = i.stringId
      }
    }
  }
  if (i.numericId) {
    if (i.numericId in numericIdsKeeper) {
      hasNode = true
    } else if (graph.hasNode(i.numericId)) {
      hasNode = true
      if (i.stringId) {
        graph.mergeNodeAttributes(id, { stringId: i.stringId })
      }
    }
  }
  // first, check if graph has string or numeric node id, if has:
  // add numeric id if incomming profile has it
  // if not
  //    then check if numericIdsKeeper has the numeric id, if it has it is complete, has nothing else to add

  // user may be found by numeric id
  if (!hasNode) {
    if (i.numericId && i.stringId) {
      numericIdsKeeper[i.numericId] = i.stringId
    }
    graph.addNode(id, {
      idType: i.idType,
      id: i.id,
      stringId: i.stringId,
      numericId: i.numericId,
      url: i.url,
      name: i.name,
      codename: undefined,
      mutual: i.mutual,
      nfriends: i.nfriends
    })
  }
  return id
}

chrome.browserAction.onClicked.addListener(function (tab) {
  graph = new Graph()
  numericIdsKeeper = {}
  window.graph = graph
  window.numericIdsKeeper = numericIdsKeeper
  anonString = 'unnactive-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '-'
  anonCount = 0
  seed = undefined
  numericIdsCount = 0
  stringIdsCount = 0
  numericIds = []
  stringIds = []
  fbblock = false
  blockCount = {}
  blockIds = {}
  chrome.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' })
})

const setFbBlocking = () => {
  // prioritize string ids
  blockCount = { numericIdsCount, stringIdsCount }
  const numericId = numericIds[numericIdsCount]
  let stringId
  if (numericId in numericIdsKeeper) {
    stringId = numericIdsKeeper[numericId]
  }
  blockIds = { numericId, stringId }
  numericIdsCount--
  fbblock = true
  const transfids = []
  for (let i = numericIdsCount; i < numericIds.length; i++) {
    const id = numericIds[i]
    if (id in numericIdsKeeper) {
      transfids.push(id)
      stringIds.push(numericIdsKeeper[id])
    }
  }
  for (let i = 0; i < transfids.length; i++) {
    numericIds.splice(numericIds.indexOf(transfids[i]), 1)
  }
}

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
          for (let i = 0; i < seed.profiles.length; i++) {
            const profile = seed.profiles[i]
            if (profile.numericId) {
              numericIds.push(profile.numericId)
            } else if (profile.stringId) {
              stringIds.push(profile.stringId)
            }
          }
        } else { // iteration input
          if (request.profiles) {
            let uid = request.pageUserData.id
            if (request.pageUserData.idType === 'number') {
              if (uid in numericIdsKeeper) {
                uid = numericIdsKeeper[uid]
              }
            }
            request.profiles.forEach(i => {
              if (fbblock) {
                if (i.numericId) {
                  if (i.stringId && stringIds.includes(i.stringId)) {
                    const index = stringIds.indexOf(i.stringId)
                    if (index >= stringIdsCount) {
                      stringIds.splice(index, 1)
                      if (!numericIds.includes(i.numericId)) {
                        numericIds.push(i.numericId)
                      }
                    }
                  }
                }
              } else {
                if (i.stringId) {
                  if (!stringIds.includes(i.stringId)) {
                    stringIds.push(i.stringId)
                  }
                  if (i.numericId) {
                    numericIdsKeeper[i.numericId] = i.stringId
                    if (numericIds.includes(i.numericId)) {
                      numericIds.splice(numericIds.indexOf(i.numericId), 1)
                    }
                  }
                } else if (i.numericId) {
                  if (i.numericId in numericIdsKeeper) {
                    const sid = numericIdsKeeper[i.numericId]
                    if (!stringIds.includes(sid)) {
                      stringIds.push(sid)
                    }
                    if (numericIds.includes(i.numericId)) {
                      numericIds.splice(numericIds.indexOf(i.numericId), 1)
                    }
                  } else {
                    if (!numericIds.includes(i.numericId)) {
                      numericIds.push(i.numericId)
                    }
                  }
                }
              }
              const id = addNode(i)
              // make function to check if req.id is in numericIdsKeeper, else us
              if (!graph.hasEdge(uid, id)) {
                graph.addUndirectedEdge(uid, id)
              }
            })
            if (request.pageUserData.codename !== undefined) {
              graph.mergeNodeAttributes(request.pageUserData.id, { codename: request.pageUserData.codename })
            }
          } else if (request.fbblock) {
            setFbBlocking()
          }
        }
        let targetId
        let targetIdType
        do {
          // profile = seed.profiles[counter++]
          if (fbblock) {
            if (stringIdsCount < stringIds.length) {
              targetId = stringIds[stringIdsCount++]
              targetIdType = 'string'
            } else {
              targetId = numericIds[numericIdsCount++]
              targetIdType = 'number'
            }
          } else {
            if (numericIdsCount < numericIds.length) {
              targetId = numericIds[numericIdsCount++]
              targetIdType = 'number'
            } else {
              targetId = stringIds[stringIdsCount++]
              targetIdType = 'string'
            }
          }
        } while (targetId === undefined && stringIdsCount < stringIds.length)
        if (targetId === undefined) {
          chrome.tabs.getSelected(null, function (tab) {
            graph.setAttribute('numericIdsKeeper', numericIdsKeeper)
            graph.setAttribute('numericIds', numericIds)
            graph.setAttribute('stringIds', stringIds)
            graph.setAttribute('numericIdsCount', numericIdsCount)
            graph.setAttribute('stringIdsCount', stringIdsCount)
            graph.setAttribute('fbblock', { fbblock, blockCount, blockIds })
            chrome.tabs.sendMessage(tab.id, { message: 'download_yeah', net: graph.toJSON() })
          })
        } else {
          chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.remove(tab.id)
            chrome.tabs.create({ url: getMutualFriendsURL2(targetId, targetIdType) }, function (tab) {
              chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
                chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
              })
            })
          })
        }
      } else { // just clicked, first page to scrape
        chrome.tabs.create({ url: request.url }, function (tab) {
          chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
            chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
          })
        })
      }
    }
  }
)
