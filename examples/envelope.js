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
  h('h1', 'Envelope example')
])

load(ac, 'examples/audio/440Hz.mp3').then(function (buffer) {
  const p = player(ac, buffer, { attack: 10 }).connect(ac.destination)
  p.on(function (a, b, c, d) { console.log(a, b, c, d) })
  log('Playing...')
  const now = ac.currentTime
  p.start(now, { attack: 1, release: 1.5 })
  p.stop(now + 3)
  p.start(now + 5)
})
