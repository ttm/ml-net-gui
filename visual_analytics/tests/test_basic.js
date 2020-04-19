var handy = require('../modules/handy')
var assert = require('assert').strict // shared values

const testInit = () => {
  const value = handy.basicStart()
  assert.match(value, /initialized/)
  assert.match(value, /hi!/)
}

const testRouter = () => {
  const routes = [
    ['/somepath', () => 'return value'],
    ['/someotherpath/here', () => 'return value2']
  ]
  const router = new handy.Router()
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    router.registerPath(route[0], route[1])
  }
  assert.match(router.getPath(routes[0][0])(), /return value/)
  assert.match(router.getPath(routes[1][0])(), /return value2/)
}

const testAll = () => {
  console.log('testing started')
  testInit()
  testRouter()
  console.log('tests passed')
}

testAll()
