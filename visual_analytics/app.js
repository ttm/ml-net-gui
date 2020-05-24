var http = require('http')
var fs = require('fs')
var path = require('path')
var constants = require('./modules/constants').base() // shared values

// var handy = require('./modules/handy') // general utils, enable to manage server-side tasks and routing
// const startResult = handy.basicStart()
// const router = new handy.Router()

http.createServer(function (req, res) {
  // server side routing and tasks are desabled:
  // const response = router.getPath(req.url)
  // console.log(startResult)  // fixme: noisy
  console.log(`serving at ${constants.port}`)

  var filePath = '.' + req.url
  let extname = path.extname(filePath).toLowerCase()
  // all HTML files are handled by the client-side router. No subpaths allowed (yet):
  console.log(extname)
  if (extname === '.html' || filePath === './') {
    filePath = './public/index.html'
  }
  console.log(filePath)

  // fixme: is this really needed? are we not only using html or should we keep these to obtain data and files directly?
  // maybe also image files?
  extname = String(path.extname(filePath)).toLowerCase()
  var mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  }

  var contentType = mimeTypes[extname] || 'application/octet-stream'
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
}).listen(constants.port)
console.log('listening in port', constants.port)
