# Module: checkbox

**File:** `\vue源码注释版\directives\public\model\checkbox.js`

## Overview

Module `checkbox` contains 1 analyzed entities.

```
import {
  toNumber,
  isArray,
  indexOf,
  looseEqual
} from '../../../util/index'

export default {

  bind () {
    var self = this
    var el = this.el

    this.getValue = function () {
      return el.hasOwnProperty('_value')
        ? el._value
        : self.params.number
          ? toNumber(el.value)
          : el.value
    }

    function getBooleanValue () {
      var val = el.checked
      if (val && el.hasOwnProperty('_trueValue')) {
        return el._trueValue
      }
      if (!val && el.hasOwnProperty('_falseValue')) {
        return el._falseValue
      }
      return val
    }

    this.listener = function () {
      var model = self._watcher.value
      if (isArray(model)) {
        var val = self.getValue()
        if (el.checked) {
          if (indexOf(model, val) < 0) {
            model.push(val)
          }
        } else {
          model.$remove(val)
        }
      } else {
        self.set(getBooleanValue())
      }
    }

    this.on('change', this.listener)
    if (el.hasAttribute('checked')) {
      this.afterBind = this.listener
    }
  },

  update (value) {
    var el = this.el
    if (isArray(value)) {
      el.checked = indexOf(value, this.getValue()) > -1
    } else {
      if (el.hasOwnProperty('_trueValue')) {
        el.checked = looseEqual(value, el._trueValue)
      } else {
        el.checked = !!value
      }
    }
  }
}
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `checkbox.getBooleanValue` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
