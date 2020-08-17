const copyToClipboard = str => {
  const el = document.createElement('textarea')
  el.value = str
  document.body.appendChild(el)
  el.select()
  console.log('COPY FUN INSIDE')
  document.execCommand('copy')
  document.body.removeChild(el)
}

module.exports = { copyToClipboard }
