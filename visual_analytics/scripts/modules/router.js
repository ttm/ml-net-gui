/* global wand */
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
    if (pn.includes('?page=')) {
      const a = new URLSearchParams(pn)
      const u = new URL(pn)
      // http://localhost:8080/?page=ankh_&usid=erangb.snooev.125&mnid=1537120300&s=1&ts=0.001&bypassMusic=1&muted=1&clevel=7
      wand.syncInfo = {
        page: u.searchParams.get('page'),
        usid: wand.utils.rot(u.searchParams.get('usid')),
        msid: wand.utils.rot(u.searchParams.get('msid')),
        unid: wand.utils.rot(u.searchParams.get('unid')),
        mnid: wand.utils.rot(u.searchParams.get('mnid')),
        ts: wand.utils.rot(u.searchParams.get('ts')),
        muted: wand.utils.rot(u.searchParams.get('muted')),
        bypassMusic: wand.utils.rot(u.searchParams.get('bypassMusic')),
        clevel: wand.utils.rot(u.searchParams.get('clevel')),
        syncCount: u.searchParams.get('s')
      }
      this.loadPath(wand.syncInfo.page + '.html')
    } else if (pn.includes('?')) {
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
