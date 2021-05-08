// const $ = require('jquery')
// test if popup script can:
//  1) load libs such as graphology OK
//  2) i/o mongo OK
//  3) scrape fb OK
//  4) chrome storage OK
// const info = $('<div/>').appendTo('body')

document.getElementById('abut').addEventListener('click', async () => {
  // alert('yeah pop')

  const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })

  window.chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['contentScript_ok.js']
    // files: ['test_ok.js']
  })
})

document.getElementById('rbut').addEventListener('click', async () => {
  window.chrome.runtime.sendMessage({ step: 'authhh', background: true })
})
