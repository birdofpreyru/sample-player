/* globals describe it */
const assert = require('assert')
const scheduler = require('../lib/scheduler')

function StubPlayer (time) {
  const player = { context: { currentTime: time }, played: [] }
  player.emit = function () {}
  player.start = function (note, time, options) {
    player.played.push({ time: time, note: note, opts: options })
  }
  return scheduler(player)
}

describe('scheduler', function () {
  it('events can be an array with [time, note]', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [[0, 60], [1, 72]])
    assert.deepStrictEqual(player.played, [
      { time: 1000, note: 60, opts: {} }, { time: 1001, note: 72, opts: {} }
    ])
  })
  it('events can be an array with [time, obj]', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [[1, { note: 'C2' }], [2, { note: 'C3' }]])
    assert.deepStrictEqual(player.played, [
      { time: 1001, note: 'C2', opts: { note: 'C2' } },
      { time: 1002, note: 'C3', opts: { note: 'C3' } }
    ])
  })
  it('events can be an array with [{time: t, note: n}]', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [{ time: 1, note: 60 }, { time: 2, note: 62 }])
    assert.deepStrictEqual(player.played, [
      { time: 1001, note: 60, opts: { time: 1, note: 60 } },
      { time: 1002, note: 62, opts: { time: 2, note: 62 } }
    ])
  })
  it('events can be an array with [{time: t, midi: n}]', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [{ time: 1, midi: 60 }, { time: 2, midi: 62 }])
    assert.deepStrictEqual(player.played, [
      { time: 1001, note: 60, opts: { time: 1, midi: 60 } },
      { time: 1002, note: 62, opts: { time: 2, midi: 62 } }
    ])
  })
  it('null is used as note when event payload is null', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [[1, null], [2, null]])
    assert.deepStrictEqual(player.played, [
      { time: 1001, note: null, opts: {} },
      { time: 1002, note: null, opts: {} }
    ])
  })
  it('null is used as note when no note, key, midi or name is present', function () {
    const player = StubPlayer(1000)
    player.schedule(0, [{ time: 1, gain: 1 }, { time: 2, gain: 0.5 }])
    assert.deepStrictEqual(player.played, [
      { time: 1001, note: null, opts: { time: 1, gain: 1 } },
      { time: 1002, note: null, opts: { time: 2, gain: 0.5 } }
    ])
  })
  it('null events are ignored', function () {
    const player = StubPlayer(1000)
    const events = 'x..x..'.split('')
      .map(function (c, i) {
        if (c === 'x') return [0.5 * i, 'kick']
        return undefined
      })
    player.schedule(0, events)
    assert.deepStrictEqual(player.played, [
      { time: 1000, note: 'kick', opts: {} },
      { time: 1001.5, note: 'kick', opts: {} }
    ])
  })
})
