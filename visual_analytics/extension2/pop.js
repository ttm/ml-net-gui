/* global chrome */
const checkPageButton = document.getElementById('magic')
checkPageButton.style.backgroundColor = '#ffaaaa'
checkPageButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_msg' })
}

const loginButton = document.getElementById('mlogin')
loginButton.style.backgroundColor = '#ffffaa'
loginButton.onclick = function (element) {
  chrome.runtime.sendMessage({ message: 'popup_login_msg' })
}

const name = document.getElementById('sage-name')
const id = document.getElementById('sage-id')
const nfriends = document.getElementById('nfriends')
const friendsVisited = document.getElementById('friends-visited')
const friendships = document.getElementById('friendships')
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['scrapeStatus'], r => {
    const i = r.scrapeStatus
    name.innerHTML = i.name
    id.innerHTML = i.sid || i.nid
    nfriends.innerHTML = i.nfriends
    friendsVisited.innerHTML = i.friendsVisited
    friendships.innerHTML = i.friendships
  })
})
