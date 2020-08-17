/* global wand, MediaRecorder, MediaStream, Blob */
function rec () {
  // records audio and canvas,
  // for more examples and audio/canvas separately, se tests.js

  const Tone = wand.maestro.base.Tone
  const actx = Tone.context
  const dest = actx.createMediaStreamDestination()
  Tone.Master.connect(dest)

  const canvas = wand.magic.app.view // document.querySelector('canvas')
  const stream = canvas.captureStream(15)

  const combined = new MediaStream([...dest.stream.getTracks(), ...stream.getTracks()])
  const recorder = new MediaRecorder(combined, { mimeType: 'video/webm' })

  let chunks = []
  recorder.videoUrls = []
  recorder.ondataavailable = evt => chunks.push(evt.data)
  recorder.onstop = function () {
    const blob = new Blob(chunks, { type: 'video/webm' })
    // audio.src = URL.createObjectURL(blob)
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = (this.filename || 'test') + '.webm'
    a.click()
    window.clickedSaveDialog = a
    const vurl = window.prompt('Upload the file you downloaded enter video URL here:', 'something as https://www.youtube... (start with https:// or http://)')
    console.log('tURL:', vurl)
    window.vurl = vurl
    recorder.videoUrls.push(vurl)
    if (recorder.callBack) {
      recorder.callBackResult = recorder.callBack(vurl)
    }
    window.URL.revokeObjectURL(url)
  }
  recorder.astart = function (callBack) {
    recorder.callBack = callBack
    if (recorder.state === 'inactive') {
      chunks = []
      this.start()
    }
  }
  return recorder // use start(), stop() (which will trigger download)
}

module.exports = { rec }
