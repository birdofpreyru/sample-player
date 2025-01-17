/* globals describe it */
const assert = require('assert')
const Player = require('..')
const notes = require('../lib/notes')
const Audio = require('./support/audio')

const StubPlayer = function (buffers, opts) {
  const player = { buffers: buffers, opts: opts || {}, started: [] }
  player.start = function (note, time, opts) {
    player.started.push({ note: note, time: time, opts: opts })
  }
  return notes(player)
}

describe('mapper', function () {
  it('accepts midi numbers as note names', function () {
    const player = StubPlayer({ C4: 'C oct4', C5: 'C oct5' })
    player.start(60, 10)
    assert.deepStrictEqual(player.started[0], { note: 60, time: 10, opts: undefined })
    assert.strictEqual(player.buffers[60], 'C oct4')
  })
  it('converts note names to midi numbers', function () {
    const player = StubPlayer({ Db4: 'buffer' })
    player.start('C#4')
    assert.deepStrictEqual(player.started[0], { note: 61, time: undefined, opts: undefined })
    assert.strictEqual(player.buffers[61], 'buffer')
  })
  it('accepts note midi numbers with decimal points', function () {
    const player = StubPlayer({ C4: 'note' })
    player.start(60.5, 10)
    assert.deepStrictEqual(player.started[0], { note: 60, time: 10, opts: { cents: 50 } })
  })
  it('it maps note to midi numbers by default', async () => {
    const audio = Audio('C4 D4')
    const player = Player(audio.ac, audio.buffers).connect(audio.ac.destination)
    console.log(player.buffers)
    assert.strictEqual(player.buffers[60], audio.buffers.C4)
    assert.strictEqual(player.buffers[62], audio.buffers.D4)
    await player.start(60)
    assert.strictEqual(audio.played().length, 1)
    assert.strictEqual(audio.played(0).bufferName, 'C4')
  })
  it('accepts a custom map function', async () => {
    function upcase (str) { return str.toUpperCase() }
    const audio = Audio('one two')
    const player = Player(audio.ac, audio.buffers, { map: upcase })
      .connect(audio.ac.destination)
    assert.deepStrictEqual(Object.keys(player.buffers), ['ONE', 'TWO'])
    await player.start('ONE')
    assert.strictEqual(audio.played().length, 1)
    await player.start('oNe')
    assert.strictEqual(audio.played().length, 2)
  })
})
