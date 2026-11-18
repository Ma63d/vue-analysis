# Module: text

**File:** `\vue源码注释版\parsers\text.js`

## Overview

Module `text` contains 0 analyzed entities.

```
import Cache from '../cache'
import config from '../config'
import { parseDirective } from '../parsers/directive'

const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g
let cache, tagRE, htmlRE

/**
 * Escape a string so it can be used in a RegExp
 * constructor.
 *
 * @param {String} str
 */

function escapeRegex (str) {
  return str.replace(regexEscapeRE, '\\$&')
}

export function compileRegex () {
  var open = escapeRegex(config.delimiters[0])
  var close = escapeRegex(config.delimiters[1])
  var unsafeOpen = escapeRegex(config.unsafeDelimiters[0])
  var unsafeClose = escapeRegex(config.unsafeDelimiters[1])
  tagRE = new RegExp(
    unsafeOpen + '((?:.|\\n)+?)' + unsafeClose + '|' +
    open + '((?:.|\\n)+?)' + close,
    'g'
  )
  htmlRE = new RegExp(
    '^' + unsafeOpen + '((?:.|\\n)+?)' + unsafeClose + '$'
  )
  // reset cache
  cache = new Cache(1000)
}

/**
 * Parse a template text string into an array of tokens.
 *
 * @param {String} text
 * @return {Array<Object> | null}
 *               - {String} type
 *               - {String} value
 *               - {Boolean} [html]
 *               - {Boolean} [oneTime]
 */

export function parseText (text) {
  if (!cache) {
    // 执行cache 和 正则的初始化操作,
    // 因为vue允许你修改插值的delimiters也就是'{{'和'}}'
    // 所以需要用delimiters动态计算出用于tag匹配的正则
    compileRegex()
  }
  var hit = cache.get(text)
  if (hit) {
    return hit
  }
  if (!tagRE.test(text)) {
    return null
  }
  var tokens = []
  // lastIndex记录上一次匹配到的插值字符串结束位置+1的位置,即最后一个花括号后一个的位置
  var lastIndex = tagRE.lastIndex = 0
  var match, index, html, value, first, oneTime
  /* eslint-disable no-cond-assign */
  // 反复执行匹配操作,直至所有的插值都匹配完
  while (match = tagRE.exec(text)) {

  /* eslint-enable no-cond-assign */
    // 当前匹配的起始位置
    index = match.index
    // push text token
    if (index > lastIndex) {
      // 如果index比lastIndex要大,说明当前匹配的起始位置和上次的结束位置中间存在空隙,
      // 比如'{{a}} to {{b}}',这个空隙就是中间的纯字符串部分' to '
      tokens.push({
        value: text.slice(lastIndex, index)
      })
    }
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| _none_ | — | — |

## Git History

- Commits: 4
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
