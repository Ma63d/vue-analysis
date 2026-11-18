# Module: debug

**File:** `\vue源码注释版\util\debug.js`

## Overview

Module `debug` contains 0 analyzed entities.

```
import config from '../config'
import { hyphenate } from './lang'

let warn
let formatComponentName

if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'

  warn = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.error('[Vue warn]: ' + msg + (vm ? formatComponentName(vm) : ''))
    }
  }

  formatComponentName = vm => {
    var name = vm._isVue ? vm.$options.name : vm.name
    return name
      ? ' (found in component: <' + hyphenate(name) + '>)'
      : ''
  }
}

export { warn }
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
