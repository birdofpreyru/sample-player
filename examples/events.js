/* global AudioContext */
const load = require('@dr.pogodin/audio-loader')
const player = require('..')
const ac = new AudioContext()
const NOTES = 'C4 D4 E4 F4 G4 A4 B4 C5'.split(' ')

document.body.innerHTML = '<h1>Events (sample-player)</h1>(open the dev console)'
console.log('Loading sample...')
load(ac, 'examples/audio/piano.js').then(function (buffers) {
  console.log('loaded')
  const piano = player(ac, buffers).connect(ac.destination)
  piano.on('event', function (a, b, c, d) {
    console.log(a, b, c, d)
  })
  const notes = NOTES.concat(NOTES.slice(0, -1).reverse())
  console.log('schedule', notes)
  piano.schedule(0, notes.map(function (note, i) {
    return { name: note, time: 0.2 * i }
  }))
})
