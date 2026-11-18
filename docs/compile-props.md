# Module: compile-props

**File:** `\vue源码注释版\compiler\compile-props.js`

## Overview

Module `compile-props` contains 11 analyzed entities.

```
import config from '../config'
import { parseDirective } from '../parsers/directive'
import { isSimplePath } from '../parsers/expression'
import { defineReactive, withoutConversion } from '../observer/index'
import propDef from '../directives/internal/prop'
import {
  warn,
  camelize,
  hyphenate,
  getAttr,
  getBindAttr,
  isLiteral,
  toBoolean,
  toNumber,
  stripQuotes,
  isArray,
  isPlainObject,
  isObject,
  hasOwn
} from '../util/index'

const propBindingModes = config._propBindingModes
const empty = {}

// regexes
const identRE = /^[$_a-zA-Z]+[\w$]*$/
const settablePathRE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[[^\[\]]+\])*$/

/**
 * Compile props on a root element and return
 * a props link function.
 *
 * @param {Element|DocumentFragment} el
 * @param {Array} propOptions
 * @param {Vue} vm
 * @return {Function} propsLinkFn
 */

export function compileProps (el, propOptions, vm) {
  var props = []
  var names = Object.keys(propOptions)
  var i = names.length
  var options, name, attr, value, path, parsed, prop
  while (i--) {
    name = names[i]
    options = propOptions[name] || empty

    if (process.env.NODE_ENV !== 'production' && name === '$data') {
      warn('Do not use $data as prop.', vm)
      continue
    }

    // props could contain dashes, which will be
    // interpreted as minus calculations by the parser
    // so we need to camelize the path here
    path = camelize(name)
    if (!identRE.test(path)) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid prop key: "' + name + '". Prop keys ' +
        'must be valid identifiers.',
        vm
      )
      continue
    }

    prop = {
      name: name,
      path: path,
      options: options,
      mode: propBindingModes.ONE_WAY,
      raw: null
    }

    attr = hyphenate(name)
    // first check dynamic version
    if ((value = getBindAttr(el, attr)) === null) {
      if ((value = getBindAttr(el, attr + '.sync')) !== null) {
        prop.mode = propBindingModes.TWO_
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `compile-props.compileProps` | function | No description |
| `compile-props.makePropsLinkFn` | function | No description |
| `compile-props.initProp` | function | No description |
| `compile-props.updateProp` | function | No description |
| `compile-props.processPropValue` | function | No description |
| `compile-props.getPropDefaultValue` | function | No description |
| `compile-props.assertProp` | function | No description |
| `compile-props.coerceProp` | function | No description |
| `compile-props.assertType` | function | No description |
| `compile-props.formatType` | function | No description |
| `compile-props.formatValue` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
