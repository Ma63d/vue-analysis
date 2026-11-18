# Module: events

**File:** `\vue源码注释版\instance\api\events.js`

## Overview

Module `events` contains 7 analyzed entities.

```
import { toArray } from '../../util/index'

export default function (Vue) {
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$on = function (event, fn) {
    (this._events[event] || (this._events[event] = []))
      .push(fn)
    modifyListenerCount(this, event, 1)
    return this
  }

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$once = function (event, fn) {
    var self = this
    function on () {
      self.$off(event, on)
      fn.apply(this, arguments)
    }
    on.fn = fn
    this.$on(event, on)
    return this
  }

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   */

  Vue.prototype.$off = function (event, fn) {
    var cbs
    // all
    if (!arguments.length) {
      if (this.$parent) {
        for (event in this._events) {
          cbs = this._events[event]
          if (cbs) {
            modifyListenerCount(this, event, -cbs.length)
          }
        }
      }
      this._events = {}
      return this
    }
    // specific event
    cbs = this._events[event]
    if (!cbs) {
      return this
    }
    if (arguments.length === 1) {
      modifyListenerCount(this, event, -cbs.length)
      this._events[event] = null
      return this
    }
    // specific handler
    var cb
    var i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        modifyListenerCount(this, event, -1)
        cbs.splice(i, 1)
        break
      }
    }
    return this
  }

  /**
   * Trigger an event on self.
   *
   * @param {String|Object} event
   * @return {Boolean} shouldPropagate
   */

  Vue.prototype.$emit = function (event) {
    var isSource = typeof event === 'string'
    event = isSource
      ? event
      : event.
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `events.registerComponentEvents` | function | No description |
| `events.callAttach` | function | No description |
| `events.registerCallbacks` | function | No description |
| `events.onAttached` | function | No description |
| `events.register` | function | No description |
| `events.onDetached` | function | No description |
| `events.callDetach` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
