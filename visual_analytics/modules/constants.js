// for sparql queries (initially only to Data.World)
var conductor = require('./conductor');  // coordinates all other modules
var artist = require('./artist');  // drawing and animation with pixi.js
var spark = require('./spark');  // http calls to perform sparql queries
var network = require('./network');  // network I/O, measurements and procedures
var multilevel = require('./multilevel');  // multilevel routines for complex networks
var maestro = require('./maestro');  // sounds and music with tone.js
var slave = require('./slave');  // callbacks to a python server for heacy lifting if necessary
var handy = require('./handy');  // general utils
var constants = require('./constants');  // general utils

exports.basic = function () {
  return 'Constants hi!'
}

exports.base = function () {
  let _all_modules = [
    conductor,
    artist,
    spark,
    network,
    multilevel,
    maestro,
    slave,
    constants,
  ];
  return { _all_modules }
}

exports.initialize = function () {
  return 'constants  initialized!';
}

exports.page_not_found = function () {
  return 'page not found or blocked, sorry!';
}
