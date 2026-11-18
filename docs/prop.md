# Module: prop

**File:** `\vue源码注释版\directives\internal\prop.js`

## Overview

Module `prop` contains 0 analyzed entities.

```
// NOTE: the prop internal directive is compiled and linked
// during _initProps(), before the created hook is called.
// The purpose is to make the initial prop values available
// inside `created` hooks and `data` functions.

import Watcher from '../../watcher'
import config from '../../config'
import { initProp, updateProp } from '../../compiler/compile-props'

const bindingModes = config._propBindingModes

export default {

  bind () {
    const child = this.vm
    const parent = child._context
    // passed in from compiler directly
    const prop = this.descriptor.prop
    const childKey = prop.path
    const parentKey = prop.parentPath
    const twoWay = prop.mode === bindingModes.TWO_WAY

    const parentWatcher = this.parentWatcher = new Watcher(
      parent,
      parentKey,
      function (val) {
        updateProp(child, prop, val)
      }, {
        twoWay: twoWay,
        filters: prop.filters,
        // important: props need to be observed on the
        // v-for scope if present
        scope: this._scope
      }
    )

    // set the child initial value.
    initProp(child, prop, parentWatcher.value)

    // setup two-way binding
    if (twoWay) {
      // important: defer the child watcher creation until
      // the created hook (after data observation)
      var self = this
      child.$once('pre-hook:created', function () {
        self.childWatcher = new Watcher(
          child,
          childKey,
          function (val) {
            parentWatcher.set(val)
          }, {
            // ensure sync upward before parent sync down.
            // this is necessary in cases e.g. the child
            // mutates a prop array, then replaces it. (#1683)
            sync: true
          }
        )
      })
    }
  },

  unbind () {
    this.parentWatcher.teardown()
    if (this.childWatcher) {
      this.childWatcher.teardown()
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
