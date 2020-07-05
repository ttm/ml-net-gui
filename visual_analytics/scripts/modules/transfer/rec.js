/* global wand, MediaRecorder, MediaStream, Blob */
const rec = () => {
  // records audio and canvas,
  // for more examples and audio/canvas separately, se tests.js

  const Tone = wand.maestro.base.Tone
  const actx = Tone.context
  const dest = actx.createMediaStreamDestination()
  Tone.Master.connect(dest)

  const canvas = wand.magic.app.view // document.querySelector('canvas')
  const stream = canvas.captureStream(5)

  const combined = new MediaStream([...dest.stream.getTracks(), ...stream.getTracks()])
  const recorder = new MediaRecorder(combined, { mimeType: 'video/webm' })

  let chunks = []
  recorder.ondataavailable = evt => chunks.push(evt.data)
  recorder.onstop = evt => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    // audio.src = URL.createObjectURL(blob)
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'test.webm'
    a.click()
    window.URL.revokeObjectURL(url)
  }
  recorder.astart = function () {
    chunks = []
    this.start()
  }
  return recorder // use start(), stop() (which will trigger download)
}

module.exports = { rec }
