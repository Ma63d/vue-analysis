# Module: bind

**File:** `\vue源码注释版\directives\public\bind.js`

## Overview

Module `bind` contains 0 analyzed entities.

```
import { warn, setClass, camelize } from '../../util/index'
import { BIND } from '../priorities'
import vStyle from '../internal/style'
import { tokensToExp } from '../../parsers/text'

// xlink
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xlinkRE = /^xlink:/

// check for attributes that prohibit interpolations
const disallowedInterpAttrRE = /^v-|^:|^@|^(?:is|transition|transition-mode|debounce|track-by|stagger|enter-stagger|leave-stagger)$/
// these attributes should also set their corresponding properties
// because they only affect the initial state of the element
const attrWithPropsRE = /^(?:value|checked|selected|muted)$/
// these attributes expect enumrated values of "true" or "false"
// but are not boolean attributes
const enumeratedAttrRE = /^(?:draggable|contenteditable|spellcheck)$/

// these attributes should set a hidden property for
// binding v-model to object values
const modelProps = {
  value: '_value',
  'true-value': '_trueValue',
  'false-value': '_falseValue'
}

export default {

  priority: BIND,

  bind () {
    var attr = this.arg
    var tag = this.el.tagName
    // should be deep watch on object mode
    if (!attr) {
      this.deep = true
    }
    // handle interpolation bindings
    const descriptor = this.descriptor
    const tokens = descriptor.interp
    if (tokens) {
      // handle interpolations with one-time tokens
      if (descriptor.hasOneTime) {
        // 对于单次插值的情况
        // 在tokensToExp内部使用$eval将表达式'a '+val+' c'转换为'"a " + "text" + " c"',以此结果为新表达式
        // $eval过程中未设置Dep.target,因而不会订阅任何依赖,
        // 而后续Watcher.get在计算这个新的纯字符串表达式过程中则必然不会触发任何getter,也不会订阅任何依赖
        // 单次插值由此完成
        this.expression = tokensToExp(tokens, this._scope || this.vm)
      }

      // only allow binding on native attributes
      if (
        disallowedInterpAttrRE.test(attr) ||
        (attr === 'name' && (tag === 'PARTIAL' || tag === 'SLOT'))
      ) {
        process.env.NODE_ENV !== 'production' && warn(
          attr + '="' + desc
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| _none_ | — | — |

## Git History

- Commits: 5
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
