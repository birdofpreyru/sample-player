/* globals describe it */
var assert = require('assert')
var Player = require('..')
var Audio = require('./support/audio')

function eventHandler () {
  function handler (e, t, o) {
    handler.last = { event: e, time: t, object: o }
    handler.events.push(handler.last)
  }
  handler.last = null
  handler.events = []
  return handler
}

describe('events', function () {
  it('emit events', function () {
    var audio = new Audio('one')
    var player = Player(audio.ac, audio.buffers).connect(audio.ac.destination)
    player.onevent = eventHandler()
    player.play('one')
    assert.deepStrictEqual(player.onevent.events.length, 2)
    assert.deepStrictEqual(player.onevent.events[0], { event: 'start', time: 0, object: 'one' })
    assert.deepStrictEqual(player.onevent.events[1], { event: 'started', time: 0, object: 0 })
    player.stop()
    assert.deepStrictEqual(player.onevent.last, { event: 'stop', time: 0, object: 'one' })
  })
  it('event handlers receives all events', function () {
    var player = Player(new Audio().ac)
    player.onevent = eventHandler()
    player.onready = eventHandler()
    player.onstart = eventHandler()
    player.emit('ready')
    player.emit('start')
    assert.strictEqual(player.onready.events.length, 1)
    assert.strictEqual(player.onstart.events.length, 1)
    assert.strictEqual(player.onevent.events.length, 2)
  })
  it('add handlers', function () {
    var player = Player(new Audio().ac)
    var one = eventHandler()
    var two = eventHandler()
    player.on('event', one)
    player.on('event', two)
    player.emit('ready', 0, 'obj')
    assert.deepStrictEqual(one.last, { event: 'ready', time: 0, object: 'obj' })
    assert.deepStrictEqual(two.last, { event: 'ready', time: 0, object: 'obj' })
  })
  it('uses "event" as default', function () {
    var player = Player(new Audio().ac)
    var handler = eventHandler()
    player.on(handler)
    player.emit('blah', 0, 'obj')
    assert.deepStrictEqual(handler.last, { event: 'blah', time: 0, object: 'obj' })
  })
  it('on returns the player', function () {
    var player = Player(new Audio().ac)
    assert(player === player.on('event', eventHandler()))
  })
})
