/* global chrome */
// todo:
//  make a decent GUI
//    decent pop.html with updated data
//  update network with new friends
//  scrape group

const fnet = chrome.fnet = require('./fnetwork.js')

let currentTabId
let currentStep // sent to background
let step // of the background
let windowId
let tolerance = 0
let url, nid, sentinelId

function continueMutual () {
  [url, nid] = fnet.getNextURL()
  if (url === undefined) {
    chrome.tabs.create({ url: 'https://www.facebook.com/profile.php', windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'finalize_ended'
      tolerance = 0
    })
  } else {
    chrome.tabs.create({ url, windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'scrape_friendships'
      tolerance = 0
    })
  }
}

chrome.runtime.onMessage.addListener(({ background, step, structs }) => {
  if (!background) return
  if (step === 'sentinel') {
    tolerance = 0
  } else if (step === 'see') {
    chrome.storage.sync.get(['userDataaa'], ({ userDataaa }) => {
      chrome.tabs.create({ url: `http://aeterni.github.io?you&id=${userDataaa.id}` })
    })
  } else if (step === 'login') {
    chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }).then(r => {
      startSentinel()
      windowId = r.id
      currentTabId = r.tabs[0].id
      currentStep = 'credentialsAndData'
      tolerance = 0
    })
  } else if (step === 'build_network') { // initialize empty or with existing data
    if (structs !== undefined && structs.nodes.length > 0) { // continue mutual friends
      fnet.restart()
      fnet.graph.import(structs)
      fnet.graph.setAttribute('inDb', true)
      continueMutual()
    } else { // get friends
      chrome.storage.sync.get(['userDataaa'], ({ userDataaa }) => {
        const { sid, nid } = userDataaa
        let url
        if (sid) {
          url = `https://www.facebook.com/${sid}/friends`
        } else {
          url = `https://www.facebook.com/profile.php?id=${nid}&sk=friends`
        }
        chrome.tabs.create({ url, windowId }).then(r => {
          currentTabId = r.id
          currentStep = 'scrape_friends'
          tolerance = 0
        })
      })
    }
  } else if (step === 'absorb') {
    fnet.absorb(structs)
    continueMutual()
  } else if (step === 'blocked') {
    chrome.tabs.create({ url: 'https://www.facebook.com/profile.php', windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'finalize_blocked'
      tolerance = 0
    })
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && tabId === currentTabId && currentStep !== undefined) {
    [step, currentStep] = [currentStep, undefined] // to avoid matching multiple times
    tolerance = 0
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript_ok.js']
    }, () => {
      const msg = { step, content: true }
      if (step.startsWith('finalize')) {
        msg.anet = fnet.graph.toJSON()
        clearInterval(sentinelId)
      }
      tolerance = 0
      chrome.tabs.sendMessage(tabId, msg, () => console.log('MSG sent for step:', step, msg))
    })
  }
})

function startSentinel () {
  sentinelId = setInterval(() => {
    tolerance += 0.5
    if (tolerance > 20) {
      tolerance = 0
      const preclude = fnet.graph.getAttribute('preclude')
      preclude.push(nid)
      fnet.graph.setAttribute('preclude', preclude)
      continueMutual()
    }
  }, 500)
}
