const http = require('http')
const path = require('path')
const fs = require('fs')
http.createServer(function (req, res) {
  const url = 'http://localhost:8081' + req.url // this is ok because framework is to work without the server
  const filePath = new URL(url).pathname === '/' ? './index.html' : '.' + req.url
  const extname = req.url.includes('.html') ? '.html' : String(path.extname(filePath)).toLowerCase()
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  }
  console.log(filePath)
  const contentType = mimeTypes[extname] || 'application/octet-stream'
  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile('./public/404.html', function (error, content) {
          res.writeHead(404, { 'Content-Type': 'text/html' })
          res.end(content, error, 'utf-8')
        })
      } else {
        res.writeHead(500)
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n')
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content, 'utf-8')
    }
  })
}).listen(8080)
