const $ = require('jquery')
const transfer = require('../transfer.js')
const utils = require('../utils.js')

const e = module.exports

e.Mk = class {
  constructor () {
    this.div1 = $('<div/>', { css: { display: 'inline-block', width: '50%' } }).appendTo('body')
    this.div2 = $('<div/>', { css: { display: 'inline-block', width: '50%' } }).appendTo('body')
    this.grid = utils.mkGrid(2, this.div1, '90%', '#eeeeff')
    this.grid2 = utils.mkGrid(2, this.div1, '90%', '#eeffee')
    this.grid3 = utils.mkGrid(2, this.div1, '90%', '#ffeeee')
    this.gd = grid => utils.gridDivider(0, 160, 0, grid)

    transfer.findAll({ med2: { $exists: true } }).then(r => {
      this.allSettings = r
      this.addHeader()
      // this.gd()
      this.setVisual()
      this.gd()
      this.addMenu()
      $('#loading').hide()
    })
  }

  addHeader () {
    console.log('good work man')
    const grid = this.grid
    $('<link/>', {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css'
    }).appendTo('head')
    const flatpickr = require('flatpickr')

    const s = $('<select/>', { id: 'mselect' }).appendTo(grid)
      .append($('<option/>').val(-1).html('~ creating ~'))
      .attr('title', 'Select template to load, edit, or delete.')
      .on('change', aself => {
        this.load(aself.currentTarget.value)
      })
    this.s = s
    this.allSettings.forEach((i, ii) => {
      s.append($('<option/>', { class: 'pres' }).val(ii).html(i.med2))
    })
    $('<button/>').html('Delete').appendTo(grid)
      .click(() => {
      })

    $('<span/>').html('id:').appendTo(grid)
    const mdiv = $('<input/>', {
      placeholder: 'id for the meditation'
    }).appendTo(grid)
      .attr('title', 'The ID for the meditation (will appear on the URL).')

    $('<span/>').html('when:').appendTo(grid)
    const adiv = $('<input/>', {
      placeholder: 'select date and time'
    }).appendTo(grid)
      .attr('title', 'Select a date and time for the mentalization to occur.')
    const mfp = flatpickr(adiv, {
      enableTime: true
    })

    $('<span/>').html('total duration:').appendTo(grid)
    const d = $('<input/>', {
      placeholder: 'in seconds (0 if forever)'
    }).appendTo(grid)
      .attr('title', 'Duration of the meditation in seconds.')

    window.foo = { mdiv, mfp, d }
  }

  setVisual () {
    const grid = this.grid2
    // const grid = utils.mkGrid(2)
    $('<span/>').html('breathing ellipse:').appendTo(grid)
    const ellipse = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Breath-scaled circle is ellipsoid if checked.')

    $('<span/>').html('breathing position:').appendTo(grid)
    const posPos = ['Center', 'Left', 'Right']
    const bPos = $('<button/>')
      .html('Center')
      .appendTo(grid)
      .attr('title', 'Breath-scaled circle position.')
      .click(() => {
        bPos.bindex = (bPos.bindex + 1) % posPos.length
        bPos.html(posPos[bPos.bindex])
      })
    bPos.bindex = 0

    this.gd(grid)

    $('<span/>').html('rainbow flakes:').appendTo(grid)
    const rainbowFlakes = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'The flakes are in all colors if checked.')

    const J = require('@eastdesire/jscolor')
    $('<span/>').html('backgroung color:').appendTo(grid)
    $('<input/>', { id: 'bgc' }).appendTo(grid)
      .attr('title', 'The color of the background.')
    const bgc = new J('#bgc', { value: '#000000' })

    $('<span/>').html('foreground color:').appendTo(grid)
    $('<input/>', { id: 'fgc' }).appendTo(grid)
      .attr('title', 'The color of main drawing (e.g. sinusoid + shaking attractive circle).')
    const fgc = new J('#fgc', { value: '#FFFFFF' })

    $('<span/>').html('breathing circ color:').appendTo(grid)
    $('<input/>', { id: 'bcc' }).appendTo(grid)
      .attr('title', 'The color of circle that expands when to inhale.')
    const bcc = new J('#bcc', { value: '#4444FF' })

    const centerC = $('<span/>').html('center circ color:').appendTo(grid)
    $('<input/>', { id: 'ccc' }).appendTo(grid)
      .attr('title', 'The color of moving circle in (or most to) the middle.')
    const ccc = new J('#ccc', { value: '#00FF00' })

    const lateralC = $('<span/>').html('lateral circ color:').appendTo(grid)
    $('<input/>', { id: 'lcc' }).appendTo(grid)
      .attr('title', 'The color of the moving circle in (or most to) the laterals.')
    const lcc = new J('#lcc', { value: '#FFFF00' })

    this.gd(grid)

    $('<span/>').html('lemniscate:').appendTo(grid)
    const lemniscate = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Visualization with lemniscate if checked, sinusoid if not checked.')
      .on('change', function () {
        if (this.checked) {
          console.log('checked L')
          centerC.html('left circ color:')
          lateralC.html('right circ color:')
        } else {
          console.log('unchecked L')
          centerC.html('center circ color:')
          lateralC.html('lateral circ color:')
        }
      })
    window.bar = { ellipse, rainbowFlakes, bgc, fgc, bcc, ccc, lcc, lemniscate }
  }

  addMenu () {
    const grid = this.grid3
    $('<span/>').html('add:').appendTo(grid)
    const btnAddMartigli = $('<button/>')
      .html('Martigli')
      .appendTo(grid)
    const btnAddBinaural = $('<button/>')
      .html('Binaural')
      .appendTo(grid)
    const btnAddSymmetry = $('<button/>')
      .html('Symmetry')
      .appendTo(grid)
    const btnAddSample = $('<button/>')
      .html('Sample')
      .appendTo(grid)
    const btnAddMartigliBinaural = $('<button/>')
      .html('Martigli-Binaural')
      .appendTo(grid)
    window.baz = { btnAddMartigli, btnAddBinaural, btnAddSymmetry, btnAddSample, btnAddMartigliBinaural }
  }

  addMartigli () {
  }

  addBinaural () {
  }

  addSymmetry () {
  }

  addSample () {
  }

  addMartigliBinaural () {
  }
}
