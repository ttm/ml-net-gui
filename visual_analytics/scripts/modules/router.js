// to change navigation history and (previsous, next) pages:
// window.history.pushState({ data: 'some data' },'Some history entry title', '/some-path');
// to get current URL:
// const pathnameSplit = window.location.pathname.split('/')

class Router {
  constructor (routes) {
    this.routes = routes
  }

  loadCurrent () {
    const pn = decodeURIComponent(window.location.href)
    let path
    if (pn.includes('?')) {
      path = pn.split('?')
      path = path[1]
    } else {
      path = pn.split('/')
      path = path[path.length - 1]
    }
    this.loadPath(path)
  }

  loadPath (path) {
    const action = this.routes[path]
    if (action !== undefined) {
      action()
      console.log(`loaded path: ${path}`)
    } else {
      console.log(`path not found: ${path}`)
    }
  }
}

module.exports = { use: { Router } }
