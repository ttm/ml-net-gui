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

function addType (grid, type, c) {
  $('<span/>').html('type:').appendTo(grid)
  $('<span/>').appendTo(grid)
    .append($('<span/>').html(`<b>${type}</b>`))
    .append($('<span/>', { css: { 'margin-left': '4%', background: '#ffbbbb', height: '50%' } }).html('X').click(() => {
      console.log('remove me: ' + type)
      grid.hide()
      grid.voiceRemoved = true
    }))
  c.gd(grid)
}

e.Mk = class {
  constructor () {
    $('body').css('margin-top', '1%')
    this.div1 = $('<div/>', { css: { display: 'inline-block', width: '50%' } }).appendTo('body')
    this.div2 = $('<div/>', { css: { display: 'inline-block', float: 'right', width: '50%' } }).appendTo('body')
    this.gd = grid => utils.gridDivider(0, 160, 0, grid)

    transfer.findAll({ 'header.med2': { $exists: true } }).then(r => {
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
        this.loadSetting(aself.currentTarget.value)
      })
    this.s = s
    this.allSettings.forEach((i, ii) => {
      s.append($('<option/>', { class: 'pres' }).val(ii).html(i.header.med2))
    })
    $('<button/>').html('Delete').appendTo(grid)
      .click(() => {
        const option = $(`option[value="${$('#mselect').val()}"].pres`)
        const ind = option[0].value
        transfer.remove({ 'header.med2': this.allSettings[ind].header.med2 }).then(r => {
          console.log('REMOVED! reply', r)
          option.remove()
          this.allSettings.splice(ind, 1)
          this.obutton.attr('disabled', true).html('Open')
          $('.pres').remove()
          this.allSettings.forEach((i, ii) => {
            s.append($('<option/>', { class: 'pres' }).val(ii).html(i.header.med2))
          })
        })
      })

    $('<span/>').html('id:').appendTo(grid)
    const med2 = $('<input/>', {
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
    const datetime = flatpickr(adiv, {
      enableTime: true
    })
    datetime.setDate(dt)

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

    this.header = { med2, datetime, d, vcontrol, communionSchedule }
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
    this.posPos = posPos
    bPos.bindex = 0
    obj.bPos = bPos

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
          const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3], '50%')
          addType(grid, i, this)
          const set = this['add' + i.replace('-', '')](grid)
          set.type = i
          set.grid = grid
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
        const voices = []
        this.setting.forEach(i => {
          if (i.grid.voiceRemoved) return
          const voice = {}
          for (const ii in i) {
            if (ii === 'grid') continue
            const v = p(i[ii])
            if (ii !== 'type' && isNaN(v)) {
              window.alert(`Define the value for <b>${ii}</b> in the voice with type <b>${i.type}</b>.`)
              return
            }
            voice[ii] = v
          }
          if (!this.checkVoice(voice)) return
          voices.push(voice)
        })
        // add header and visual settings:
        const h = this.header
        const header = {
          med2: h.med2.val(), // check not empty OK
          datetime: h.datetime.selectedDates[0], // check not past OK
          d: p(h.d), // check not empty & > 5s OK
          vcontrol: h.vcontrol.prop('checked'),
          communionSchedule: h.communionSchedule.prop('checked')
        }
        if (!this.checkHeader(header)) return
        const v = this.visSetting
        const visSetting = {
          lemniscate: v.lemniscate.prop('checked'),
          rainbowFlakes: v.rainbowFlakes.prop('checked'),
          ellipse: v.ellipse.prop('checked'),
          bPos: v.bPos.index
        }
        const colors = ['bcc', 'bgc', 'fgc', 'ccc', 'lcc']
        colors.forEach(i => { visSetting[i] = v[i].toString() })
        const toSave = {
          header,
          visSetting,
          voices
        }
        window.toSave = toSave
        console.log(toSave)
        // save to mongo
        transfer.writeAny(toSave).then(resp => {
          console.log('saved settins!', resp)
          this.s.append($('<option/>', { class: 'pres' }).val(this.allSettings.length).html(toSave.header.med2))
          this.s.val(this.allSettings.length)
          this.allSettings.push(toSave)
          this.obutton.attr('disabled', false).html(`Open: ${toSave.header.med2}`)
        })
        // enable load setting OK
        // enable delete setting OK
        // make layout of the voices fine (they are starting below) OK
        // implement restrictions/verifications before saving OK
        // add pan to binaural and Martigli-Binaural
        // add switch for multiple martigli
        // enable preview (after implementing the model)
      }).appendTo(grid)
    this.obutton = $('<button/>')
      .html('Open')
      .attr('title', 'Open URL of the meditation.')
      .click(() => {
        // open url with:
        window.open(`?_${this.header.med2.val()}`)
      })
      .appendTo(grid)
      .attr('disabled', true)
  }

  addMartigli (grid) {
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

  addBinaural (grid) {
    const fl = addNumField(grid, 'freq left', 'freq in Herz', 'Frequency on the left channel.', 150)
    const waveformL = addWaveforms(grid, 'waveform left', 'waveformL')
    this.gd(grid)
    const fr = addNumField(grid, 'freq right', 'freq in Herz', 'Frequency on the right channel.', 155)
    const waveformR = addWaveforms(grid, 'waveform right', 'waveformR')
    return { fl, waveformL, fr, waveformR }
  }

  addSymmetry (grid) {
    const nnotes = addNumField(grid, 'number of notes', 'any integer', 'number of different notes in the symmetric structure/voice', 3)
    const noctaves = addNumField(grid, 'number of octaves', 'any real number', 'number of octaves to spread the notes evenly (endpoint not included)', 1)
    const f0 = addNumField(grid, 'lowest frequency', 'any real number', 'frequency of the lowest note', 100)
    const d = addNumField(grid, 'cycle duration', 'any real number', 'duration of the iteration on all notes before repetition', 1.5)
    return { nnotes, noctaves, f0, d }
  }

  addSample (grid) {
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

  addMartigliBinaural (grid) {
    const { fl, waveformL, fr, waveformR } = this.addBinaural(grid)
    const { ma, mp0, mp1, md } = this.addMartigliCommon(grid)
    return { fl, waveformL, fr, waveformR, grid, ma, mp0, mp1, md }
  }

  loadSetting (index) {
    console.log('Load setting', index)
    const s = this.allSettings[index]

    const h = this.header
    const h_ = s.header
    h.med2.val(h_.med2)
    h.datetime.setDate(h_.datetime)
    h.d.val(h_.d)
    h.vcontrol.prop('checked', h_.vcontrol)
    h.communionSchedule.prop('checked', h_.communionSchedule)

    const v = this.visSetting
    const v_ = s.visSetting
    v.lemniscate.prop('checked', v_.lemniscate)
    v.rainbowFlakes.prop('checked', v_.rainbowFlakes)
    v.ellipse.prop('checked', v_.ellipse)
    v.bPos.bindex = v_.bPos || 0
    v.bPos.html(this.posPos[v_.bPos])
    const colors = ['bcc', 'bgc', 'fgc', 'ccc', 'lcc']
    colors.forEach(i => { v[i].fromString(v_[i]) })

    // clearing voices:
    this.setting.forEach(s => {
      s.grid.hide()
      s.voiceRemoved = true
    })
    // loading voices in the settings:
    const l = s.voices
    l.forEach(i => {
      const grid = utils.mkGrid(2, this.div2, '90%', this.colors[this.counter++ % 3], '50%')
      addType(grid, i.type, this)
      const set = this['add' + i.type.replace('-', '')](grid)
      set.type = i
      set.grid = grid
      this.setting.push(set)
      for (const j in i) {
        if (typeof i[j] !== 'string') {
          set[j].val(i[j])
        }
      }
    })
  }

  checkVoice (v) {
    if (v.type === 'Martigli') {
      if (v.ma > v.mf0) {
        if (!window.confirm('Martigli amplitude is greater than carrier frequency. Are you shure?')) return
      }
      if (v.ma / v.mf0 < 0.05) {
        if (!window.confirm('Martigli amplitude less than 5% of the carrier frequency. Are you shure?')) return
      }
    } else if (v.type === 'Binaural') {
      if (!this.checkBinaural(v)) return
    } else if (v.type === 'Sample') {
      if (v.soundSamplePeriod !== 0 && v.soundSamplePeriod < maestro.sounds[v.soundSample].duration) {
        // todo: test if sampler can overlap playback (if so, remove the following line:)
        window.alert('define a repetition period which is greater than the samples\' duration or 0 (for looping).')
      }
    } else if (v.type === 'Martigli-Binaural') {
      if (v.ma > Math.min(v.fl, v.fr)) {
        if (!window.confirm('Martigli amplitude is greater than binaural frequencies in the Martigli-Binaural voice. Are you shure?')) return
      }
      if (!this.checkBinaural(v)) return
    } else if (v.type === 'Symmetry') {
      if (v.d / v.nnotes < 0.015) {
        if (!window.confirm('The notes in the Symmetry voice have less than 15ms. Are you shure?')) return
      }
    }
    return true
  }

  checkBinaural (v) {
    if (Math.min(v.fl, v.fr) < 20 || Math.max(v.fl, v.fr) < 20000) {
      if (!window.confirm('Binaural frequencies are not in audible range ([20, 20000]). Are you shure?')) return
    }
    return true
  }

  checkHeader (h) {
    if (h.med2 === '') {
      window.alert('define the meditation id.')
      return
    }
    for (let i = 0; i < this.allSettings.length; i++) {
      if (h.med2 === this.allSettings[i].header.med2) {
        window.alert('change the meditation id to be unique.')
        return
      }
    }
    if (h.datetime === undefined || h.datetime < new Date()) {
      if (!window.confirm('the date has passed. Are you shure?')) return
    }
    if (h.d < 30) {
      if (!window.confirm('the artifact has less than 30 seconds. Are you shure?')) return
    }
    return true
  }
}
