/* global wand */
// to change navigation history and (previsous, next) pages:
// window.history.pushState({ data: 'some data' },'Some history entry title', '/some-path');
// to get current URL:
// const pathnameSplit = window.location.pathname.split('/')

const pn = decodeURIComponent(window.location.href)
const u = new URL(pn)

class Router {
  constructor (routes) {
    this.routes = routes
  }

  loadCurrent () {
    let path
    if (pn.includes('?page=')) {
      // const a = new URLSearchParams(pn)
      // http://localhost:8080/?page=ankh_&usid=erangb.snooev.125&mnid=1537120300&s=1&ts=0.001&bypassMusic=1&muted=1&clevel=7
      wand.syncInfo = {
        usid: urlArgument('usid', true),
        msid: urlArgument('msid', true),
        unid: urlArgument('unid', true),
        mnid: urlArgument('mnid', true),
        syncDescription: urlArgument('desc'),
        syncRemovedNodes: (urlArgument('rmv', true) || '').split(','),
        syncId: urlArgument('syncId'),
        page: urlArgument('page'),
        allUsers: urlArgument('allUsers'),
        ts: urlArgument('ts'),
        bypassMusic: urlArgument('bypassMusic'),
        clevel: urlArgument('clevel'),
        syncCount: urlArgument('s')
      }
      console.log('OK, LOADING CORRECTLY')

      path = wand.syncInfo.page + '.html'
      // this.loadPath(wand.syncInfo.page + '.html')
      // return
    } else if (pn.includes('?')) {
      path = pn.split('?')
      path = path[1]
    } else {
      path = pn.split('/')
      path = path[path.length - 1]
    }
    urlArgument('muteMusic', () => {
      wand.maestro.base.Tone.Master.volume.value = -100
    })
    urlArgument('mute', () => {
      wand.maestro.synths.speaker.volume = -1 // 1 or 0 is 1, [0, 1] is ok range
    })
    this.loadPath(path)
  }

  loadPath (path) {
    const action = this.routes[path]
    window.onload = () => {
      if (action !== undefined) {
        action()
        console.log(`loaded path: ${path}`)
      } else {
        console.log(`path not found: ${path}`)
      }
    }
  }
}

const conditionalArgument = (arg, fun) => {
  if (u.searchParams.get(arg)) {
    fun()
  }
}

const urlArgument = (arg, rotOrFun) => {
  const a = u.searchParams.get(arg)
  if (typeof rotOrFun === 'function' && a) {
    rotOrFun()
  } else {
    return rotOrFun ? wand.utils.rot(a) : a
  }
}

module.exports = { use: { Router, urlArgument, conditionalArgument } }
