//To issue message to begin scrolling
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, { "message": "clicked_browser_action" })
})

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === 'open_new_tab') {
            console.log('received open new tab')
            chrome.tabs.create({ url: request.url }, function (tab) {
                console.log('tab open mannn', request.all_profiles, 'PROFs')
                chrome.tabs.executeScript(tab.id, { file: 'scripts/fb_scrape.js' }, function () {
                    chrome.tabs.sendMessage(tab.id, { 'message': 'opened_new_tab', all_profiles: request.profiles })
                })
                // chrome.tabs.sendMessage(tab.id, { message: 'opened_new_tab', all_profiles })

            })
        }
    }
)

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === 'close_current_tab') {
            chrome.tabs.getSelected(null, function (tab) {
                all_profiles.push(request.profiles)
                console.log(all_profiles, '<=== all_profiles')
                // chrome.tabs.remove(tab.id);
            })
        }
    }
)
