var constants = require('./constants') // shared values
var network = require('./network') // shared values

const basic = function () {
  return 'Handy  hi!'
}

const initialize = function () {
  return 'Handy  initialized!'
}

const startModule = module_ => {
  return module_.initialize()
}

const basicFromModule = module_ => {
  return module_.basic()
}

const startModules = (modules, init) => {
  const feedback = {}
  let action = basicFromModule
  if (init === true) { action = startModule }
  for (let i = 0; i < modules.length; i++) {
    feedback[i] = action(modules[i])
  }
  return feedback
}

const start = (modules, init = true) => {
  const feedback = startModules(modules, init)
  return `Hello World! ${Object.values(feedback).join('\n')} `
}

// basic startup:
const basicStart = () => {
  const baseConstants = constants.base()
  const start_ = start(baseConstants._allModules)

  const init = start(baseConstants._allModules, false)
  return `${start_}\n|||\n${init}`
}

class Router {
  constructor () {
    this.routes = {}
    this.registerPath('/', basicStart)
    this.registerPath('/network', network.basic)
    this.registerPath('/constants', constants.basic)
  }

  registerPath (path_, action_) {
    this.routes[path_] = action_
  }

  getPath (path) {
    if (path in this.routes) {
      return this.routes[path]
    } else {
      return constants.page_not_found
    }
  }
}

module.exports = { basic, initialize, basicStart, Router }
