'use strict'

const player = require('./player')
const events = require('./events')
const notes = require('./notes')
const scheduler = require('./scheduler')
const midi = require('./midi')

function SamplePlayer (ac, source, options) {
  return midi(scheduler(notes(events(player(ac, source, options)))))
}

if (typeof module === 'object' && module.exports) module.exports = SamplePlayer
if (typeof window !== 'undefined') window.SamplePlayer = SamplePlayer
