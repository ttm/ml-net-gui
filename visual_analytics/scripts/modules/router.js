// to change navigation history and (previsous, next) pages:
// window.history.pushState({ data: 'some data' },'Some history entry title', '/some-path');
// to get current URL:
// const pathnameSplit = window.location.pathname.split('/')

let routes = [
]

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
    console.log(`loaded path: ${path}`)
  }
}

module.exports = { use: { Router }, share: { routes } }
