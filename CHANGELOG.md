# CHANGELOG
_For changes from v0.6.0 and up see the [GitHub Releases page](https://github.com/birdofpreyru/sample-player/releases)._

---
- [0.5.4] Fix an issue that ignores 'gain: 0' option. Fix an issue with the player.play function that doesnt return anything.
- [0.5.3] Add envelope options parameters. Add 'started' event.
- [0.5.1] microtones: midi numbers can have decimals (and cents are added to options)
- [0.5.0]
  - schedule function simplified and order of parameter changed
  - player.on(function) is equivalent to player.on('event', function)

- [0.4.1] start options accepts duration as parameter (and stops the buffer)
- [0.4.0] Split code in modules. Add midi support by default.
- [0.3.3] Add ext/midi
- [0.3.2] Fix a typo in schedule event
- [0.3.0] Rewrite
- [0.1.0] First working version
- [0.0.3] Extract tracker
- [0.0.2] Bug fixed: stop method of a trigger accepts when parameter
- [0.0.1] First version
