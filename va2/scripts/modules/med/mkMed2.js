const $ = require('jquery')
const transfer = require('../transfer.js')
const utils = require('../utils.js')
const maestro = require('../maestro.js')
const J = require('@eastdesire/jscolor')

const e = module.exports

function addWaveforms (grid, str, id) {
  $('<span/>').html(str + ':').appendTo(grid)
  const select = $('<select/>', { id }).appendTo(grid)
  const aw = (val, str) => select.append($('<option/>').val(val).html(str))
  aw(0, 'sine')
  aw(1, 'triangle')
  aw(2, 'square')
  aw(3, 'sawtooth')
  return select
}

function addNumField (grid, str, placeholder, title, value) {
  $('<span/>').html(str + ':').appendTo(grid)
  return $('<input/>', { placeholder, title, value }).appendTo(grid)
}

e.Mk = class {
  constructor () {
    this.div1 = $('<div/>', { css: { display: 'inline-block', width: '50%' } }).appendTo('body')
    this.div2 = $('<div/>', { css: { display: 'inline-block', width: '50%' } }).appendTo('body')
    this.gd = grid => utils.gridDivider(0, 160, 0, grid)

    transfer.findAll({ med2: { $exists: true } }).then(r => {
      this.allSettings = r
      this.addHeader()
      // this.gd()
      this.setVisual()
      // this.gd()
      this.addMenu()
      this.addFinalButtons()
      $('#loading').hide()
    })
  }

  addHeader () {
    const grid = utils.mkGrid(2, this.div1, '90%', '#eeeeff', '50%')
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
      .val(utils.chooseUnique(['love', 'light', 'happiness', 'immortality', 'God', 'appreciation', 'hope', 'faith', 'peace', 'self-control'])[0])

    $('<span/>').html('when:').appendTo(grid)
    const adiv = $('<input/>', {
      placeholder: 'select date and time'
    }).appendTo(grid)
      .attr('title', 'Select a date and time for the mentalization to occur.')
    const dt = new Date()
    dt.setMinutes(dt.getMinutes() + 10)
    const mfp = flatpickr(adiv, {
      enableTime: true
    }).setDate(dt)

    const d = addNumField(grid, 'total duration', 'in seconds (0 if forever)', 'Duration of the meditation in seconds.', 900)

    this.gd(grid)
    $('<span/>').html('volume control:').appendTo(grid)
    const vcontrol = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Enables volume control widget if checked.')
      .prop('checked', true)

    $('<span/>').html('<a target="_blank" href="?communion">communion schedule</a>:').appendTo(grid)
    const communionSchedule = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Is this meeting to be put on the communion meetings table?')

    this.header = { mdiv, mfp, d, vcontrol, communionSchedule }
  }

  setVisual () {
    const grid = utils.mkGrid(2, this.div1, '90%', '#eeffee', '50%')
    const obj = {}

    $('<span/>').html('lemniscate:').appendTo(grid)
    obj.lemniscate = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Visualization with lemniscate if checked, sinusoid if not checked.')
      .on('change', function () {
        if (this.checked) {
          $('#lb_ccc').html('left circ color:')
          $('#lb_lcc').html('right circ color:')
        } else {
          $('#lb_ccc').html('center circ color:')
          $('#lb_lcc').html('lateral circ color:')
        }
      })

    $('<span/>').html('rainbow flakes:').appendTo(grid)
    obj.rainbowFlakes = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'The flakes are in all colors if checked.')

    this.gd(grid)

    $('<span/>').html('breathing ellipse:').appendTo(grid)
    obj.ellipse = $('<input/>', {
      type: 'checkbox'
    }).appendTo(grid)
      .attr('title', 'Breath-scaled circle is ellipsoid if checked.')
      .prop('checked', true)

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

    function colorItem (str, id, title, color) {
      $('<span/>', { id: 'lb_' + id }).html(str + ':').appendTo(grid)
      $('<input/>', { id }).appendTo(grid)
        .attr('title', title)
      const foo = new J('#' + id, { value: '#' + color })
      obj[id] = foo
    }
    // todo: add palette maker:
    colorItem('breathing circ color', 'bcc', 'The color of circle that expands when to inhale.', '4444FF')
    this.gd(grid)
    colorItem('backgroung color', 'bgc', 'The color of the background.', '000000')
    colorItem('foreground color', 'fgc', 'The color of main drawing (e.g. sinusoid + shaking attractive circle).', 'FFFFFF')
    colorItem('center circ color', 'ccc', 'The color of moving circle in (or most to) the middle.', '00FF00')
    colorItem('lateral circ color', 'lcc', 'The color of the moving circle in (or most to) the laterals.', 'FFFF00')

    this.visSetting = obj
  }

  addMenu () {
    const grid = utils.mkGrid(2, this.div1, '90%', '#ffeeee', '50%')
    this.colors = ['#eeeeff', '#eeffee', '#ffeeee']
    this.counter = 0
    this.setting = []
    $('<span/>').html('add:').appendTo(grid)
    const voiceTypes = ['Martigli', 'Binaural', 'Symmetry', 'Sample', 'Martigli-Binaural', 'Prayer', 'Recording']
    voiceTypes.forEach(i => {
      $('<button/>', { id: i + 'Btn' })
        .html(i)
        .appendTo(grid)
        .click(() => {
          const set = this['add' + i.replace('-', '')]()
          set.type = i
          this.setting.push(set)
        })
    })
    // todo: implement:
    $('#PrayerBtn').attr('disabled', true)
    $('#RecordingBtn').attr('disabled', true)
  }

  addFinalButtons () {
    const grid = utils.mkGrid(2, this.div1, '90%', '#eeeeff')
    const p = v => typeof v === 'string' ? v : parseFloat(v.val())
    $('<button/>')
      .attr('title', 'Create the meditation with the settings defined.')
      .html('Create')
      .click(() => {
        this.setting.forEach(i => {
          for (const ii in i) {
            console.log(ii, ':', p(i[ii]))
          }
        })
      }).appendTo(grid)
    this.cbutton = $('<button/>')
      .html('Open')
      .attr('title', 'Open URL of the meditation.')
      .click(() => {
        // open url with
        window.open(`?_${this.header.mdiv.val()}`)
      })
      .appendTo(grid)
      .attr('disabled', true)
  }

  addMartigli () {
    const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3])
    const mf0 = addNumField(grid, 'Martigli carrier frequency', 'in Herz', 'carrier frequency for the Martigli Oscillation.', 200)
    const waveformM = addWaveforms(grid, 'Martigli carrier waveform', 'waveformM')
    const { ma, mp0, mp1, md } = this.addMartigliCommon(grid)
    return { mf0, waveformM, ma, mp0, mp1, md }
  }

  addMartigliCommon (grid) {
    const ma = addNumField(grid, 'Martigli amplitude', 'in Herz', 'Variation amplitude, in Hz, of the frequency to guide breathing.', 20)
    this.gd(grid)
    const mp0 = addNumField(grid, 'Martigli initial period', 'period in seconds', 'Initial duration of the breathing cycle.', 10)
    const mp1 = addNumField(grid, 'Martigli final period', 'period in seconds', 'Final duration of the breathing cycle.', 20)
    const md = addNumField(grid, 'Martigli transition', 'duration in seconds', 'Duration of the transition from the initial to the final Martigli period.', 600)
    return { ma, mp0, mp1, md }
  }

  addBinaural () {
    const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3])
    const fl = addNumField(grid, 'freq left', 'freq in Herz', 'Frequency on the left channel.', 150)
    const waveformL = addWaveforms(grid, 'waveform left', 'waveformL')
    this.gd(grid)
    const fr = addNumField(grid, 'freq right', 'freq in Herz', 'Frequency on the right channel.', 155)
    const waveformR = addWaveforms(grid, 'waveform right', 'waveformR')
    return { fl, waveformL, fr, waveformR, grid }
  }

  addSymmetry () {
    const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3])
    const nnotes = addNumField(grid, 'number of notes', 'any integer', 'number of different notes in the symmetric structure/voice', 3)
    const noctaves = addNumField(grid, 'number of octaves', 'any real number', 'number of octaves to spread the notes evenly (endpoint not included)', 1)
    const f0 = addNumField(grid, 'lowest frequency', 'any real number', 'frequency of the lowest note', 100)
    const d = addNumField(grid, 'cycle duration', 'any real number', 'duration of the iteration on all notes before repetition', 1.5)
    return { nnotes, noctaves, f0, d }
  }

  addSample () {
    const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3])
    $('<span/>').html('sound sample:').appendTo(grid)
    const soundSample = $('<select/>', { id: 'soundSample' }).appendTo(grid)
      .attr('title', 'Sound sample to be played continuously.')
    maestro.sounds.forEach((s, ii) => {
      soundSample.append($('<option/>').val(ii).html(`${s.name}, ${s.duration}s`))
    })

    const soundSampleVolume = addNumField(grid, 'sample volume', 'in decibels', 'relative volume of the sound sample.', -6)
    const soundSamplePeriod = addNumField(grid, 'sample repetition period', 'in seconds', 'period between repetitions of the sound.', maestro.sounds[0].duration)
    const soundSampleStart = addNumField(grid, 'sample starting time', 'in seconds', 'time for the first incidence of the sound', 0)

    return { soundSample, soundSampleVolume, soundSamplePeriod, soundSampleStart }
  }

  addMartigliBinaural () {
    const { fl, waveformL, fr, waveformR, grid } = this.addBinaural()
    const { ma, mp0, mp1, md } = this.addMartigliCommon(grid)
    return { fl, waveformL, fr, waveformR, grid, ma, mp0, mp1, md }
  }
}
