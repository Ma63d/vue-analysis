# Module: radio

**File:** `\vue源码注释版\directives\public\model\radio.js`

## Overview

Module `radio` contains 0 analyzed entities.

```
import { toNumber, looseEqual } from '../../../util/index'

export default {

  bind () {
    var self = this
    var el = this.el

    this.getValue = function () {
      // value overwrite via v-bind:value
      if (el.hasOwnProperty('_value')) {
        return el._value
      }
      var val = el.value
      if (self.params.number) {
        val = toNumber(val)
      }
      return val
    }

    this.listener = function () {
      self.set(self.getValue())
    }
    this.on('change', this.listener)

    if (el.hasAttribute('checked')) {
      this.afterBind = this.listener
    }
  },

  update (value) {
    this.el.checked = looseEqual(value, this.getValue())
  }
}
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| _none_ | — | — |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
