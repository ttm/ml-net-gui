/* global chrome */
const checkPageButton = document.getElementById('magic')
window.cccc = checkPageButton
checkPageButton.style.backgroundColor = '#ff0000'
checkPageButton.onclick = function (element) {
  checkPageButton.style.backgroundColor = '#00ff00'
  chrome.runtime.sendMessage({ message: 'popup_msg' })
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'client_msg') {
      checkPageButton.style.backgroundColor = '#ffff00'
      console.log('popup received client msg')
    } else if (request.message === 'background_msg') { // never received
      checkPageButton.style.backgroundColor = '#00ffff'
    }
  }
)

const name = document.getElementById('sage-name')
const id = document.getElementById('sage-id')
document.addEventListener('DOMContentLoaded', () => {
  // chrome.storage.clear()
  chrome.storage.sync.get(['name', 'sid', 'nid'], function (r) {
    name.innerHTML = r.name
    id.innerHTML = r.sid || r.nid
  })
})
