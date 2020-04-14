var http = require('http');

var conductor = require('./modules/conductor');
var artist = require('./modules/artist');
var spark = require('./modules/spark');
var multilevel = require('./modules/multilevel');
var maestro = require('./modules/maestro');
var slave = require('./modules/slave');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(`Hello World! ${conductor.BaseConductor()} ${artist.BaseArtist()} ${spark.BaseSpark()}`
          + ` ${multilevel.BaseMultilevel()} ${maestro.BaseMaestro()} ${slave.BaseSlave()}`);
  console.log('end of the world2');
}).listen(8080);
