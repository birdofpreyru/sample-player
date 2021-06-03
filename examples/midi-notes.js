/* global AudioContext */
const load = require('@dr.pogodin/audio-loader')
const player = require('..')
const ac = new AudioContext()

function h (tag, text) {
  if (!tag.innerHTML) return '<' + tag + '>' + text + '</' + tag + '>'
  tag.innerHTML = text.join('')
  return function (text) { tag.innerHTML = tag.innerHTML + h('pre', text) }
}

const log = h(document.body, [
  h('h1', 'Midi notes example'),
  h('h4', 'You can pass note names as strings or midi numbers')
])

const MIDI = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
log('Loading samples...')
load(ac, 'examples/audio/piano.js').then(function (buffers) {
  log('Samples loaded.')
  const piano = player(ac, buffers).connect(ac.destination)
  piano.on('start', function (time, note) {
    log('note ' + note + ' started at ' + time)
  })
  piano.schedule(ac.currentTime, MIDI.map(function (note, i) {
    return { name: note + 48, time: 0.2 * i }
  }))
})
