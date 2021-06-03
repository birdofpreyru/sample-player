/* globals describe it */
const assert = require('assert')
const Player = require('..')
const Audio = require('./support/audio')

describe('player', function () {
  describe('connect', function () {
    it('returns the player instance', function () {
      const audio = new Audio('snare')
      const player = Player(audio.ac, audio.buffers)
      assert.strictEqual(player.connect(audio.ac.destination), player)
    })
    it('connects to the ac.destination', function () {
      const audio = new Audio('snare')
      const player = Player(audio.ac, audio.buffers)
      assert.strictEqual(player.connect(audio.ac.destination), player)
      assert.deepStrictEqual(audio.output(),
        { name: 'GainNode', gain: { value: 1, inputs: [] }, inputs: [] })
    })
  })
  describe('start', () => {
    it('has no need of name if only one buffer', async () => {
      const audio = new Audio('snare')
      const player = Player(audio.ac, audio.ac.createBuffer(2, 10, 44100)).connect(audio.ac.destination)
      await player.start()
      assert.strictEqual(audio.played().length, 1)
      assert.strictEqual(audio.played(0).buffer.length, 10)
    })
    it('needs name if more than one buffer', async () => {
      const audio = new Audio('one two')
      const player = Player(audio.ac, audio.buffers).connect(audio.ac.destination)
      await player.start('one')
      await player.start('two')
      assert.strictEqual(audio.played().length, 2)
      assert.strictEqual(audio.played(0).bufferName, 'one')
      assert.strictEqual(audio.played(1).bufferName, 'two')
    })
  })
  describe('stop', function () {
    it('should stop all buffers', function () {
      const audio = new Audio('one two')
      const player = Player(audio.ac, audio.buffers).connect(audio.ac.destination)
      player.start('one')
      player.start('two')
      player.stop()
    })
  })
})
