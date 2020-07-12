/* global chrome */
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const msg = request.message
    if (msg === 'login_msg_from_background') {
      console.log('mk login')
    }
  }
)
