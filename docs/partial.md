# Module: partial

**File:** `\vue源码注释版\directives\element\partial.js`

## Overview

Module `partial` contains 0 analyzed entities.

```
import vIf from '../public/if'
import FragmentFactory from '../../fragment/factory'
import { PARTIAL } from '../priorities'
import {
  createAnchor,
  replace,
  resolveAsset
} from '../../util/index'

export default {

  priority: PARTIAL,

  params: ['name'],

  // watch changes to name for dynamic partials
  paramWatchers: {
    name (value) {
      vIf.remove.call(this)
      if (value) {
        this.insert(value)
      }
    }
  },

  bind () {
    this.anchor = createAnchor('v-partial')
    replace(this.el, this.anchor)
    this.insert(this.params.name)
  },

  insert (id) {
    var partial = resolveAsset(this.vm.$options, 'partials', id, true)
    if (partial) {
      this.factory = new FragmentFactory(this.vm, partial)
      vIf.insert.call(this)
    }
  },

  unbind () {
    if (this.frag) {
      this.frag.destroy()
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
