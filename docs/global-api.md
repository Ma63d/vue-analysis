# Module: global-api

**File:** `\vue源码注释版\global-api.js`

## Overview

Module `global-api` contains 1 analyzed entities.

```
import config from './config'
import directives from './directives/public/index'
import elementDirectives from './directives/element/index'
import filters from './filters/index'
import * as util from './util/index'
import * as compiler from './compiler/index'
import * as path from './parsers/path'
import * as text from './parsers/text'
import * as template from './parsers/template'
import * as directive from './parsers/directive'
import * as expression from './parsers/expression'
import * as transition from './transition/index'
import FragmentFactory from './fragment/factory'
import internalDirectives from './directives/internal/index'

import {
  set,
  del,
  nextTick,
  mergeOptions,
  classify,
  toArray,
  commonTagRE,
  reservedTagRE,
  warn,
  isPlainObject,
  extend
} from './util/index'

export default function (Vue) {
  /**
   * Vue and every constructor that extends Vue has an
   * associated options object, which can be accessed during
   * compilation steps as `this.constructor.options`.
   *
   * These can be seen as the default options of every
   * Vue instance.
   */

  Vue.options = {
    directives,
    elementDirectives,
    filters,
    transitions: {},
    components: {},
    partials: {},
    replace: true
  }

  /**
   * Expose useful internals
   */

  Vue.util = util
  Vue.config = config
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  /**
   * The following are exposed for advanced usage / plugins
   */

  Vue.compiler = compiler
  Vue.FragmentFactory = FragmentFactory
  Vue.internalDirectives = internalDirectives
  Vue.parsers = {
    path,
    text,
    template,
    directive,
    expression
  }

  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */

  Vue.cid = 0
  var cid = 1

  /**
   * Class inheritance
   *
   * @param {Object} extendOptions
   */

  Vue.extend = function (extendOptions)
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `global-api.createClass` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
