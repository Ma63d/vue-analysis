# Module: html

**File:** `\vue源码注释版\directives\public\html.js`

## Overview

Module `html` contains 0 analyzed entities.

```
import { parseTemplate } from '../../parsers/template'
import {
  createAnchor,
  before,
  replace,
  remove,
  _toString,
  toArray
} from '../../util/index'

export default {

  bind () {
    // a comment node means this is a binding for
    // {{{ inline unescaped html }}}
    if (this.el.nodeType === 8) {
      // hold nodes
      this.nodes = []
      // replace the placeholder with proper anchor
      this.anchor = createAnchor('v-html')
      replace(this.el, this.anchor)
    }
  },

  update (value) {
    value = _toString(value)
    if (this.nodes) {
      this.swap(value)
    } else {
      this.el.innerHTML = value
    }
  },

  swap (value) {
    // remove old nodes
    var i = this.nodes.length
    while (i--) {
      remove(this.nodes[i])
    }
    // convert new value to a fragment
    // do not attempt to retrieve from id selector
    var frag = parseTemplate(value, true, true)
    // save a reference to these nodes so we can remove later
    this.nodes = toArray(frag.childNodes)
    before(frag, this.anchor)
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
