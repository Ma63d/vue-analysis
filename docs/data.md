# Module: data

**File:** `\vue源码注释版\instance\api\data.js`

## Overview

Module `data` contains 1 analyzed entities.

```
import Watcher from '../../watcher'
import { del, toArray } from '../../util/index'
import { parseText } from '../../parsers/text'
import { parseDirective } from '../../parsers/directive'
import { getPath } from '../../parsers/path'
import { parseExpression } from '../../parsers/expression'

const filterRE = /[^|]\|[^|]/

export default function (Vue) {
  /**
   * Get the value from an expression on this vm.
   *
   * @param {String} exp
   * @param {Boolean} [asStatement]
   * @return {*}
   */

  Vue.prototype.$get = function (exp, asStatement) {
    var res = parseExpression(exp)
    if (res) {
      if (asStatement) {
        var self = this
        return function statementHandler () {
          self.$arguments = toArray(arguments)
          var result = res.get.call(self, self)
          self.$arguments = null
          return result
        }
      } else {
        try {
          return res.get.call(this, this)
        } catch (e) {}
      }
    }
  }

  /**
   * Set the value from an expression on this vm.
   * The expression must be a valid left-hand
   * expression in an assignment.
   *
   * @param {String} exp
   * @param {*} val
   */

  Vue.prototype.$set = function (exp, val) {
    var res = parseExpression(exp, true)
    if (res && res.set) {
      res.set.call(this, this, val)
    }
  }

  /**
   * Delete a property on the VM
   *
   * @param {String} key
   */

  Vue.prototype.$delete = function (key) {
    del(this._data, key)
  }

  /**
   * Watch an expression, trigger callback when its
   * value changes.
   *
   * @param {String|Function} expOrFn
   * @param {Function} cb
   * @param {Object} [options]
   *                 - {Boolean} deep
   *                 - {Boolean} immediate
   * @return {Function} - unwatchFn
   */

  Vue.prototype.$watch = function (expOrFn, cb, options) {
    var vm = this
    var parsed
    if (typeof expOrFn === 'string') {
      parsed = parseDirective(expOrFn)
      expOrFn = parsed.expression
    }
    var watc
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `data.clean` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
