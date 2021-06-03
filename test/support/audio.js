/* globals AudioContext */
require('web-audio-test-api')

module.exports = function Audio (keys) {
  const ac = new AudioContext()
  Object.defineProperty(ac, 'state', { value: 'running' })
  const names = !keys ? [] : keys.split ? keys.split(' ') : keys || []
  const buffers = {}
  names.forEach(function (key, i) {
    buffers[key] = ac.createBuffer(2, i, 44100)
  })
  function output () {
    return ac.toJSON().inputs[0]
  }
  function played (i) {
    if (arguments.length > 0) return played()[i]
    return output().inputs.map(function (input) {
      const amp = input
      const source = amp.inputs[0]
      const buffer = source.buffer
      const bufferName = names[buffer.length]
      return { amp, source, buffer, bufferName }
    })
  }
  return { ac, buffers, output, played }
}
