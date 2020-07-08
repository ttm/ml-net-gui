console.log('client load ok')
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === 'popup_msg') {
      console.log('client received popup msg')
      scrapeNameId()
      // scape user id and name
      // check if network in mongo, if it is, load it
    }
  }
)

const scrapeNameId = () => {
  const e = getElementsByXPath('//*/h1/span[1]/a')[0]
  const name = e.innerText
  const url = e.href
  const nid = url.match(/\/profile.php\?id=(\d+)/)
  const sid = url.match(/facebook.com\/(.*)\b/)
  console.log(nid, sid, name, url, 'HEY')
}

const getElementsByXPath = (xpath, parent) => {
  const results = []
  const query = document.evaluate(xpath, parent || document,
    null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    results.push(query.snapshotItem(i))
  }
  return results
}
