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
        syncKey: urlArgument('syncKey'),
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
    const ft = wand.$('<div/>', { id: 'afooter', css: { width: '100%', display: 'flex', 'white-space': 'nowrap', 'overflow-x': 'auto' } }).appendTo('body')
    const lflag = urlArgument('lang') ? `&lang=${urlArgument('lang')}` : ''
    wand.$('<a/>', {
      href: `?page=about${lflag}`,
      target: '_blank',
      css: {
        'margin-left': '1%',
        display: 'inline-block',
        float: 'left'
      }
    }).html('about Our Aquarium').appendTo(ft)
    wand.$('<div/>', { class: 'notranslate', css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft).html(' / ')
    wand.$('<a/>', {
      href: `?page=donate${lflag}`,
      target: '_blank',
      css: {
        'margin-left': '1%',
        display: 'inline-block',
        float: 'left'
      }
    }).html('Donate').appendTo(ft)
    wand.$('<div/>', { class: 'notranslate', css: { display: 'inline-block', 'margin-left': '30%', float: 'left' } }).appendTo(ft).html('language:')
    wand.$('<div/>', { id: 'google_translate_element', class: 'notranslate', css: { display: 'inline-block', 'margin-left': '1%', float: 'left' } }).appendTo(ft)
    wand.$('<script/>', {
      type: 'text/javascript',
      src: '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    }).appendTo('body')
    // setTimeout(() => {
    //   wand.$('.skiptranslate')[0].remove()
    //   // wand.$('iframe.skiptranslate').css('visibility', 'hidden')
    //   wand.$('body').css('top', '0px')
    // }, 1000)
    // const intervalId = setInterval(() => {
    //   console.log(wand.$('.skiptranslate').length, '<<<<<===== n skiptranslate')
    //   const els = wand.$('.skiptranslate')
    //   if (els.length > 4) {
    //     console.log('HEYYY 2233')
    //     clearInterval(intervalId)
    //     els[0].remove()
    //     wand.$('body').css('top', '0px')
    //   }
    // }, 1000)

    const lang = urlArgument('lang')
    let finished = 0
    const intervalId2 = setInterval(() => {
      console.log('set lang and remove trans bar loop, finished')
      if (wand.$('.goog-te-combo').length) {
        if (lang) {
          const el = wand.$('.goog-te-combo')
          el.val(lang)
          triggerHtmlEvent(wand.$('.goog-te-combo').get(0), 'change')
        }
        finished++
      }
      const els = wand.$('.skiptranslate')
      if (els.length > 4) {
        els[0].remove()
        finished++
        wand.$('body').css('top', '0px')
      }
      if (finished >= 2) { // fixme: better clear interval?
        clearInterval(intervalId2)
        if (wand.$('.goog-te-combo').val().length === 0) {
          const aint = setInterval(() => {
            const els = wand.$('.skiptranslate')
            if (els.length > 4) {
              els[0].remove()
              wand.$('body').css('top', '0px')
              clearInterval(aint)
            }
          }, 1000)
        }
      }
    }, 2000)
  }
}

const conditionalArgument = (arg, fun) => {
  if (u.searchParams.get(arg)) {
    fun()
  }
}

function triggerHtmlEvent (element, eventName) {
  var event
  if (document.createEvent) {
    event = document.createEvent('HTMLEvents')
    event.initEvent(eventName, true, true)
    window.eell = element
    console.log(element, eventName)
    element.dispatchEvent(event)
  } else {
    event = document.createEventObject()
    event.eventType = eventName
    element.fireEvent('on' + event.eventType, event)
  }
}

const urlArgument = (arg, rotOrFun) => {
  const a = u.searchParams.get(arg)
  if (typeof rotOrFun === 'function' && a) {
    rotOrFun()
  } else {
    // return rotOrFun ? wand.utils.rot(a) : a
    return rotOrFun ? wand.utils.rot(a) : a
  }
}

module.exports = { use: { Router, urlArgument, conditionalArgument } }
