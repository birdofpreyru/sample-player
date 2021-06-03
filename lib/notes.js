'use strict'

const note = require('note-parser')
const isMidi = function (n) { return n !== null && n !== [] && n >= 0 && n < 129 }
const toMidi = function (n) { return isMidi(n) ? +n : note.midi(n) }

// Adds note name to midi conversion
module.exports = function (player) {
  if (player.buffers) {
    const map = player.opts.map
    const toKey = typeof map === 'function' ? map : toMidi
    const mapper = function (name) {
      return name ? toKey(name) || name : null
    }

    player.buffers = mapBuffers(player.buffers, mapper)
    const start = player.start
    player.start = function (name, when, options) {
      let key = mapper(name)
      const dec = key % 1
      if (dec) {
        key = Math.floor(key)
        options = Object.assign(options || {}, { cents: Math.floor(dec * 100) })
      }
      return start(key, when, options)
    }
  }
  return player
}

function mapBuffers (buffers, toKey) {
  return Object.keys(buffers).reduce(function (mapped, name) {
    mapped[toKey(name)] = buffers[name]
    return mapped
  }, {})
}
