/* global AudioBuffer */
'use strict'

const ADSR = require('adsr')

const EMPTY = {}
const DEFAULTS = {
  gain: 1,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.9,
  release: 0.3,
  loop: false,
  cents: 0,
  loopStart: 0,
  loopEnd: 0
}

function toSeconds (pos, buffer) {
  if (typeof pos === 'string' && pos.endsWith('%')) {
    return buffer.duration * parseFloat(pos.slice(0, -1)) / 100
  }
  return pos
}

/**
 * Create a sample player.
 *
 * @param {AudioContext} ac - the audio context
 * @param {ArrayBuffer|Object<String,ArrayBuffer>} source
 * @param {Onject} options - (Optional) an options object
 * @return {player} the player
 * @example
 * var SamplePlayer = require('@dr.pogodin/sample-player')
 * var ac = new AudioContext()
 * var snare = SamplePlayer(ac, <AudioBuffer>)
 * snare.play()
 */
function SamplePlayer (ac, source, options) {
  let connected = false
  let nextId = 0
  const tracked = {}
  const out = ac.createGain()
  out.gain.value = 1

  const opts = Object.assign({}, DEFAULTS, options)

  /**
   * @namespace
   */
  const player = { context: ac, out: out, opts: opts }
  if (source instanceof AudioBuffer) player.buffer = source
  else player.buffers = source

  /**
   * Start a sample buffer.
   *
   * The returned object has a function `stop(when)` to stop the sound.
   *
   * @param {String} name - the name of the buffer. If the source of the
   * SamplePlayer is one sample buffer, this parameter is not required
   * @param {Float} when - (Optional) when to start (current time if by default)
   * @param {Object} options - additional sample playing options
   * @return {Promise<AudioNode>} Resolves to an audio node with
   *  a `stop` function.
   * @example
   * var sample = player(ac, <AudioBuffer>).connect(ac.destination)
   * sample.start()
   * sample.start(5, { gain: 0.7 }) // name not required since is only one AudioBuffer
   * @example
   * var drums = player(ac, { snare: <AudioBuffer>, kick: <AudioBuffer>, ... }).connect(ac.destination)
   * drums.start('snare')
   * drums.start('snare', 0, { gain: 0.3 })
   */
  // TODO: It would be a way cleaner with async/await, but... that requires
  // redo the compilation setup, for which I have not time right now.
  player.start = function (name, when, options) {
    return new Promise(function (resolve) {
      resolve(player.context.state !== 'running'
        ? player.context.resume()
        : '')
    }).then(function () {
      // if only one buffer, reorder arguments
      if (player.buffer && name !== null) return player.start(null, name, when)

      const buffer = name ? player.buffers[name] : player.buffer
      if (!buffer) {
        console.warn('Buffer ' + name + ' not found.')
        return
      } else if (!connected) {
        console.warn('SamplePlayer not connected to any node.')
        return
      }

      const opts = options || EMPTY
      when = Math.max(ac.currentTime, when || 0)
      player.emit('start', when, name, opts)
      const node = createNode(name, buffer, opts)
      node.id = track(name, node)
      node.env.start(when)
      node.source.start(when)
      player.emit('started', when, node.id, node)
      if (opts.duration) node.stop(when + opts.duration)
      return node
    })
  }

  // NOTE: start will be override so we can't copy the function reference
  // this is obviously not a good design, so this code will be gone soon.
  /**
   * An alias for `player.start`
   * @see player.start
   * @since 0.3.0
   */
  player.play = function (name, when, options) {
    return player.start(name, when, options)
  }

  /**
   * Stop some or all samples
   *
   * @param {Float} when - (Optional) an absolute time in seconds (or currentTime
   * if not specified)
   * @param {Array} nodes - (Optional) an array of nodes or nodes ids to stop
   * @return {Array} an array of ids of the stoped samples
   *
   * @example
   * var longSound = player(ac, <AudioBuffer>).connect(ac.destination)
   * longSound.start(ac.currentTime)
   * longSound.start(ac.currentTime + 1)
   * longSound.start(ac.currentTime + 2)
   * longSound.stop(ac.currentTime + 3) // stop the three sounds
   */
  player.stop = function (when, ids) {
    let node
    ids = ids || Object.keys(tracked)
    return ids.map(function (id) {
      node = tracked[id]
      if (!node) return null
      node.stop(when)
      return node.id
    })
  }
  /**
   * Connect the player to a destination node
   *
   * @param {AudioNode} destination - the destination node
   * @return {AudioPlayer} the player
   * @chainable
   * @example
   * var sample = player(ac, <AudioBuffer>).connect(ac.destination)
   */
  player.connect = function (dest) {
    connected = true
    out.connect(dest)
    return player
  }

  player.emit = function (event, when, obj, opts) {
    if (player.onevent) player.onevent(event, when, obj, opts)
    const fn = player['on' + event]
    if (fn) fn(when, obj, opts)
  }

  return player

  // =============== PRIVATE FUNCTIONS ============== //

  function track (name, node) {
    node.id = nextId++
    tracked[node.id] = node
    node.source.onended = function () {
      delete tracked[node.id]
      const now = ac.currentTime
      node.source.disconnect()
      node.env.disconnect()
      node.disconnect()
      player.emit('ended', now, node.id, node)
    }
    return node.id
  }

  function createNode (name, buffer, options) {
    // NOTE: Using node constructors here breaks unit tests, as they rely on
    // unsupported and old Web API mock library, which explicitly forbids using
    // the constructors. Unfortunately, it is not straightforward to mock for
    // test using something newer, thus it is better to keep it as is for now.
    const node = ac.createGain()
    node.gain.value = 0 // the envelope will control the gain
    node.connect(out)

    node.env = envelope(ac, options, opts)

    // TODO: Not sure it is correct: node.gain is just the gain number
    // (a-rate AudioParam), and not an AudioNode. Apparently, the created
    // node structure works anyway, though...
    node.env.connect(node.gain)

    node.source = ac.createBufferSource()
    node.source.buffer = buffer
    node.source.connect(node)
    node.source.loop = options.loop || opts.loop
    node.source.playbackRate.value = centsToRate(options.cents || opts.cents)
    node.source.loopStart =
      toSeconds(options.loopStart || opts.loopStart, buffer)
    node.source.loopEnd =
      toSeconds(options.loopEnd || opts.loopEnd, buffer)
    node.stop = function (when) {
      const time = when || ac.currentTime
      player.emit('stop', time, name)
      const stopAt = node.env.stop(time)
      node.source.stop(stopAt)
    }
    return node
  }
}

function isNum (x) { return typeof x === 'number' }
const PARAMS = ['attack', 'decay', 'sustain', 'release']
function envelope (ac, options, opts) {
  const env = ADSR(ac)
  const adsr = options.adsr || opts.adsr
  PARAMS.forEach(function (name, i) {
    if (adsr) env[name] = adsr[i]
    else env[name] = options[name] || opts[name]
  })
  env.value.value = isNum(options.gain)
    ? options.gain
    : isNum(opts.gain) ? opts.gain : 1
  return env
}

/*
 * Get playback rate for a given pitch change (in cents)
 * Basic [math](http://www.birdsoft.demon.co.uk/music/samplert.htm):
 * f2 = f1 * 2^( C / 1200 )
 */
function centsToRate (cents) { return cents ? Math.pow(2, cents / 1200) : 1 }

module.exports = SamplePlayer
