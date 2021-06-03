/* global AudioContext */
const load = require('@dr.pogodin/audio-loader')
const player = require('..')
const ac = new AudioContext()

function h (tag, text) {
  if (!tag.innerHTML) return '<' + tag + '>' + text + '</' + tag + '>'
  tag.innerHTML = text.join('')
  function append (t, text) { tag.innerHTML = tag.innerHTML + h(t, text) }
  append.log = function () { append('pre', Array.prototype.slice.call(arguments).join(' ')) }
  return append
}

const html = h(document.body, [
  h('h1', 'Map note names example'),
  h('h4', 'You can pass note names as strings or midi numbers')
])
html.log('Loading samples...')
load(ac, 'examples/audio/mrk2.json').then(function (buffers) {
  html.log('loaded')
  const drums = player(ac, buffers).connect(ac.destination)
  drums.on('event', function (a, b, c) { html.log(a, b, c) })

  const kicks = 'x...x...x...x...'.split('')
    .map(function (e, i) {
      if (e === 'x') return { name: 'kick', time: i * 1 / 8, gain: 1 }
      return undefined
    })
  const snares = '..x...x...x...x.'.split('')
    .map(function (e, i) {
      if (e === 'x') return { name: 'snare', gain: 0.2, time: i * 1 / 8 }
      return undefined
    })

  drums.schedule(0, kicks.concat(snares))
})
