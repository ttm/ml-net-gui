var http = require('http')
var fs = require('fs')
var path = require('path')

// var conductor = require('./modules/conductor') // coordinates all other modules
// var artist = require('./modules/artist') // drawing and animation with pixi.js
// var spark = require('./modules/spark') // http calls to perform sparql queries
// var network = require('./modules/network') // network I/O, measurements and procedures, uses graphology
// var multilevel = require('./modules/multilevel') // multilevel routines for complex networks. Uses network and maybe graphology
// var maestro = require('./modules/maestro') // sounds and music with tone.js
// var slave = require('./modules/slave') // callbacks to a python server for heavy lifting if necessary
var handy = require('./modules/handy') // general utils

var constants = require('./modules/constants').base() // shared values

const startResult = handy.basicStart()

const router = new handy.Router()

http.createServer(function (req, res) {
  const response = router.getPath(req.url)
  const r = response()
  // res.end(r)
  console.log(startResult)
  console.log(`serving at ${constants.port}`)

  var filePath = '.' + req.url
  if (filePath === './') {
    filePath = './public/index.html'
  }

  var extname = String(path.extname(filePath)).toLowerCase()
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
