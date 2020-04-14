var http = require('http');

var conductor = require('./modules/conductor');  // coordinates all other modules
var artist = require('./modules/artist');  // drawing and animation with pixi.js
var spark = require('./modules/spark');  // http calls to perform sparql queries
var network = require('./modules/network');  // network I/O, measurements and procedures
var multilevel = require('./modules/multilevel');  // multilevel routines for complex networks
var maestro = require('./modules/maestro');  // sounds and music with tone.js
var slave = require('./modules/slave');  // callbacks to a python server for heacy lifting if necessary
var handy = require('./modules/handy');  // general utils

var constants = require('./modules/constants');  // shared values

start_result = handy.basic_start();

let router = new handy.Router();
router.register_path('/', handy.basic_start);
router.register_path('/network', network.basic);
router.register_path('/constants', constants.basic);

http.createServer(function (req, res) {
  let response = router.get_path(req.url);
  let r = response();
  res.end(r)
  console.log(start_result);
}).listen(8080);
