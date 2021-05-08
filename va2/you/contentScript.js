const { steps } = require('./helpers.js')

window.chrome.runtime.onMessage.addListener(({ content, step }) => {
  if (!content) return
  console.log('(client) msg received:', step)
  if (step in steps) steps[step].content() // step in authFb, scrapeFriends, scrapFriendships
})
