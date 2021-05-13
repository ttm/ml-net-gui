/* global chrome */
// todo:
//  update network with new friends
//  scrape group

const fnet = chrome.fnet = require('./fnetwork.js')

let currentTabId
let currentStep // sent to background
let currentCount // to only visit 5 friends
let step // of the background
let windowId
let url

function continueMutual () {
  url = fnet.getNextURL()
  if (url === undefined) {
    chrome.tabs.create({ url: 'https://www.facebook.com/profile.php', windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'finalize_ended'
    })
  } else {
    chrome.tabs.create({ url, windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'scrape_friendships'
      currentCount++
    })
  }
}

chrome.runtime.onMessage.addListener(({ background, step, structs }) => {
  if (!background) return
  if (step === 'see') {
    chrome.storage.sync.get(['userDataaa'], ({ userDataaa }) => {
      chrome.tabs.create({ url: `http://aeterni.github.io?you&id=${userDataaa.id}` })
    })
  } else if (step === 'parseWhats') {
    console.log('back parse', structs.id)
    chrome.tabs.sendMessage(structs.id, { step, content: true })
  } else if (step === 'login') {
    chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }).then(r => {
      windowId = r.id
      currentTabId = r.tabs[0].id
      currentStep = 'credentialsAndData'
    })
  } else if (step === 'build_network') { // initialize empty or with existing data
    if (structs !== undefined && structs.nodes.length > 0) { // continue mutual friends
      fnet.restart()
      fnet.graph.import(structs)
      fnet.graph.setAttribute('inDb', true)
      currentCount = 0
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
        })
      })
    }
  } else if (step === 'absorb') {
    fnet.absorb(structs)
    // if (currentCount < 5) { // dev
    if (currentCount < 10) {
      continueMutual()
    } else {
      chrome.tabs.create({ url: 'https://www.facebook.com/profile.php', windowId }).then(r => {
        currentTabId = r.id
        currentStep = 'finalize_blocked'
      })
    }
  } else if (step === 'blocked') {
    chrome.tabs.create({ url: 'https://www.facebook.com/profile.php', windowId }).then(r => {
      currentTabId = r.id
      currentStep = 'finalize_blocked'
    })
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && tabId === currentTabId && currentStep !== undefined) {
    [step, currentStep] = [currentStep, undefined] // to avoid matching multiple times
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript_ok.js']
    }, () => {
      const msg = { step, content: true }
      if (step.startsWith('finalize')) {
        msg.anet = fnet.graph.toJSON()
      }
      chrome.tabs.sendMessage(tabId, msg, () => console.log('MSG sent for step:', step, msg))
    })
  }
})
