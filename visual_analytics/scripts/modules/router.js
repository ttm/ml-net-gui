// to change navigation history and (previsous, next) pages:
// window.history.pushState({ data: 'some data' },'Some history entry title', '/some-path');
// to get current URL:
// const pathnameSplit = window.location.pathname.split('/')

class Router {
  constructor (routes) {
    this.routes = routes
  }

  loadCurrent () {
    let path = window.location.pathname.split('/')
    if (path.length > 2) {
      console.log('subpath addresses not implemented')
    }
    path = path[1]
    this.loadPath(path)
  }

  loadPath(path) {
    let action = this.routes[path]
    if (action !== undefined) {
      action()
      console.log(`loaded path: ${path}`)
    } else {
      console.log(`path not found: ${path}`)
    }
  }
}

module.exports = { use: { Router } }
