/* global chrome */
console.log('server loaded ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'popup_msg') {
      console.log('background received popup msg')
      chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }, function (win) {
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_msg' })
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'background_msg' })
        })
      })
    } else if (request.message === 'client_msg') {
      console.log('background received client msg')
    } else if (request.message === 'client_scrapped_user') {
      // open new tab
      openUserFriendsPage()
    }
  }
)

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
