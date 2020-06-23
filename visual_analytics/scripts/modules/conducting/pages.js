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

module.exports = { net }
