# Module: el

**File:** `\vue源码注释版\directives\public\el.js`

## Overview

Module `el` contains 0 analyzed entities.

```
import { camelize, hasOwn, defineReactive } from '../../util/index'
import { EL } from '../priorities'

export default {

  priority: EL,

  bind () {
    /* istanbul ignore if */
    if (!this.arg) {
      return
    }
    var id = this.id = camelize(this.arg)
    var refs = (this._scope || this.vm).$els
    if (hasOwn(refs, id)) {
      refs[id] = this.el
    } else {
      defineReactive(refs, id, this.el)
    }
  },

  unbind () {
    var refs = (this._scope || this.vm).$els
    if (refs[this.id] === this.el) {
      refs[this.id] = null
    }
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
