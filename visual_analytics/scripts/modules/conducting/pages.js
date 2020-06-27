/* global wand */
const gui = require('./gui.js')
// const { DrawnNet } = require('./drawnet.js').use
// const { showMembers } = require('./animate.js').use

const net = (net, artist, transfer) => {
  console.log('in2')
  window.agui = new gui.NetGUI() // start with net upload button
  // const uel = document.getElementById('file-input')
  // uel.onchange = res => {
  //   const f = uel.files[0]
  //   f.text().then(t => {
  //     transfer.mong.writeNetIfNotThereReadIfThere(t, f.name, f.lastModified, r => console.log(r))
  //     window.anet = net.use.utils.loadJsonString(t)
  //     const drawnNet = new DrawnNet(artist.use, window.anet, [])
  //     showMembers(drawnNet.net, artist, true)
  //   })
  // }
}

const worldPropertyCondition = () => {
  const $ = wand.$
  const text = `In continuing to thrive through the gradus,
    you agree to be, or is considered as, an owner of the Earth
  and of the universe. In any matters of the State or institution
  you are part of, your deliberation/vote count as any other,
  you have to choose someone that is responsible in
  case of your abstinence. Her vote will count twice, if another
  person decides for her, that person's decision will count 3 times.`
  const a = $(`<div>${text}</div>`)
  a.prependTo('body')
  return a
}

module.exports = { net, worldPropertyCondition }
