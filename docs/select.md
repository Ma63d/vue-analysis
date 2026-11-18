# Module: select

**File:** `\vue源码注释版\directives\public\model\select.js`

## Overview

Module `select` contains 2 analyzed entities.

```
import {
  inDoc,
  isArray,
  toNumber,
  looseEqual,
  nextTick
} from '../../../util/index'

export default {

  bind () {
    var self = this
    var el = this.el

    // method to force update DOM using latest value.
    this.forceUpdate = function () {
      if (self._watcher) {
        self.update(self._watcher.get())
      }
    }

    // check if this is a multiple select
    var multiple = this.multiple = el.hasAttribute('multiple')

    // attach listener
    this.listener = function () {
      var value = getValue(el, multiple)
      value = self.params.number
        ? isArray(value)
          ? value.map(toNumber)
          : toNumber(value)
        : value
      self.set(value)
    }
    this.on('change', this.listener)

    // if has initial value, set afterBind
    var initValue = getValue(el, multiple, true)
    if ((multiple && initValue.length) ||
        (!multiple && initValue !== null)) {
      this.afterBind = this.listener
    }

    // All major browsers except Firefox resets
    // selectedIndex with value -1 to 0 when the element
    // is appended to a new parent, therefore we have to
    // force a DOM update whenever that happens...
    this.vm.$on('hook:attached', () => {
      nextTick(this.forceUpdate)
    })
    if (!inDoc(el)) {
      nextTick(this.forceUpdate)
    }
  },

  update (value) {
    var el = this.el
    el.selectedIndex = -1
    var multi = this.multiple && isArray(value)
    var options = el.options
    var i = options.length
    var op, val
    while (i--) {
      op = options[i]
      val = op.hasOwnProperty('_value')
        ? op._value
        : op.value
      /* eslint-disable eqeqeq */
      op.selected = multi
        ? indexOf(value, val) > -1
        : looseEqual(value, val)
      /* eslint-enable eqeqeq */
    }
  },

  unbind () {
    /* istanbul ignore next */
    this.vm.$off('hook:attached', this.forceUpdate)
  }
}

/**
 * Get select value
 *
 * @param {SelectElement} el
 * @param {Boolean} multi
 * @pa
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `select.getValue` | function | No description |
| `select.indexOf` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
