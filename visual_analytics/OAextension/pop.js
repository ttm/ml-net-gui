/* global chrome */
const checkPageButton = document.getElementById('advance')
checkPageButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_advance_msg' })
}

const gradusButton = document.getElementById('gradus')
gradusButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_gradus_msg' })
}

const lycoreiaButton = document.getElementById('lycoreia')
lycoreiaButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_lycoreia_msg' })
}

const tithoreaButton = document.getElementById('tithorea')
tithoreaButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_tithorea_msg' })
}

const name = document.getElementById('sage-name')
const id = document.getElementById('sage-id')
const nfriends = document.getElementById('nfriends')
const friendsVisited = document.getElementById('friends-visited')
const friendships = document.getElementById('friendships')
document.addEventListener('DOMContentLoaded', () => {
  checkPageButton.style.backgroundColor = '#ffaaaa'
  gradusButton.style.backgroundColor = '#ffffaa'
  lycoreiaButton.style.backgroundColor = '#ffffaa'
  tithoreaButton.style.backgroundColor = '#ffffaa'
  chrome.storage.sync.get(['scrapeStatus'], r => {
    const i = r.scrapeStatus
    if (!i) return
    name.innerHTML = i.name
    id.innerHTML = i.sid || i.nid
    nfriends.innerHTML = i.nfriends
    friendsVisited.innerHTML = i.friendsVisited
    friendships.innerHTML = i.friendships
  })
})
