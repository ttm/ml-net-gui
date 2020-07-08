console.log('server loaded ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'popup_msg') {
      console.log('background received popup msg')
      chrome.windows.create({ url: 'https://www.facebook.com/profile.php' }, function (win) {
        chrome.tabs.executeScript(win.tabs[0].id, { file: 'scripts/fb_scrape.js' }, function () {
          chrome.tabs.sendMessage(win.tabs[0].id, { message: 'popup_msg' })
        })
      })
    }
  }
)
