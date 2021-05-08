/* global chrome */
const { steps, getAttr } = require('./helpers.js')

console.log('starting background')

let currentTabId
let currentStep

chrome.runtime.onMessage.addListener(({ background, step, structs }) => {
  if (!background) return
  console.log('(background) msg received:', step)
  if (step in steps) {
    console.log('BACKGROUND trying to activate step:', step)
    steps[step].back(structs).then(r => {
      console.log('--- BACKGROUND ---:', step, r)
      if ('tabs' in r) chrome.storage.sync.set({ windowId: r.id })
      currentTabId = getAttr(r, step)
      currentStep = step
      console.log('id, step:', currentTabId, currentStep)
    })
  }
})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('tab updated:', tabId, changeInfo, tab)
  if (changeInfo.status === 'complete' && tabId === currentTabId && currentStep !== 'xxx') {
    const step = currentStep
    currentStep = 'xxx' // to avoid matching multiple times
    console.log('yeah, completed')
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['contentScript_ok.js']
    }, () => {
      chrome.tabs.sendMessage(tabId, { step, content: true }, () => console.log('MSG sent for step:', step))
    })
  }
})
