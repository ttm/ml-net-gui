var handy = require('../modules/handy');
var assert = require('assert').strict;  // shared values

let test_init = () => {
  let value = handy.basic_start();
  assert.match(value, /initialized/);
  assert.match(value, /hi!/);
}

let test_router = () => {
  let routes = [
    ['/somepath', () => 'return value'],
    ['/someotherpath/here', () => 'return value2']
  ];
  let router = new handy.Router();
  for (let i = 0; i < routes.length; i++) {
    let route = routes[i];
    router.register_path(route[0], route[1]);
  }
  assert.match(router.get_path(routes[0][0])(), /return value/);
  assert.match(router.get_path(routes[1][0])(), /return value2/);
}

let test_all = () => {
  console.log('testing started');
  test_init();
  test_router();
  console.log('tests passed');
}

test_all()

