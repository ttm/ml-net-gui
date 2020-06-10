let scrappedData
let counter

const getMutualFriendsURL = (profile) => {
  if (profile.numericId === undefined) {
    return `${profile.url}/friends_mutual`
  } else {
    return `${profile.url}&sk=friends_mutual`
  }
}

chrome.browserAction.onClicked.addListener(function (tab) {
  scrappedData = { profiles: [], pageUserData: [], seed: undefined }
  counter = 0
  chrome.tabs.sendMessage(tab.id, { message: 'clicked_browser_action' })
})

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'open_new_tab') {
      if (request.pageUserData !== undefined) {
        if (scrappedData.seed === undefined) { // seed arrived
          scrappedData.seed = {
            userInfo: request.pageUserData,
            profiles: request.profiles
          }
        } else { // iterating
          scrappedData.pageUserData.push(request.pageUserData)
          scrappedData.profiles.push(...request.profiles)
        }
        if (counter < scrappedData.seed.profiles.length) {
          const profile = scrappedData.seed.profiles[counter++]
          console.log('profile', profile, getMutualFriendsURL(profile))
          chrome.tabs.getSelected(null, function (tab) {
            // chrome.tabs.remove(tab.id);
            chrome.tabs.create({ url: getMutualFriendsURL(profile) }, function (tab) {
              chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
                chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
              })
            })
          })
        } else {
          console.log('finished scrapping iteration')
        }
      } else { // just clicked, first page to scrape
        chrome.tabs.create({ url: request.url }, function (tab) {
          chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
            chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab' })
          })
        })
      }
    }
  }
)
