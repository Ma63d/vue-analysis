# Module: compile

**File:** `\vue源码注释版\compiler\compile.js`

## Overview

Module `compile` contains 24 analyzed entities.

```
import publicDirectives from '../directives/public/index'
import internalDirectives from '../directives/internal/index'
import { compileProps } from './compile-props'
import { parseText, tokensToExp } from '../parsers/text'
import { parseDirective } from '../parsers/directive'
import { parseTemplate } from '../parsers/template'
import {
  _toString,
  resolveAsset,
  toArray,
  warn,
  remove,
  replace,
  commonTagRE,
  checkComponentAttr,
  findRef,
  defineReactive,
  getAttr
} from '../util/index'

// special binding prefixes

const bindRE = /^v-bind:|^:/
const onRE = /^v-on:|^@/

// 判断是否是"v-"开头的指令,捕获v-后面的内容,不捕获"."字符后面的内容,因为它们属于modifier部分
const dirAttrRE = /^v-([^:]+)(?:$|:(.*)$)/
// 是否有modifier
const modifierRE = /\.[^\.]+/g
const transitionRE = /^(v-bind:|:)?transition$/

// default directive priority
const DEFAULT_PRIORITY = 1000
// 优先值大于两千才可能是终端指令
const DEFAULT_TERMINAL_PRIORITY = 2000

/**
 * Compile a template and return a reusable composite link
 * function, which recursively contains more link functions
 * inside. This top level compile function would normally
 * be called on instance root nodes, but can also be used
 * for partial compilation if the partial argument is true.
 *
 * The returned composite link function, when called, will
 * return an unlink function that tearsdown all directives
 * created during the linking phase.
 *
 * @param {Element|DocumentFragment} el
 * @param {Object} options
 * @param {Boolean} partial
 * @return {Function}
 */

export function compile (el, options, partial) {
  // link function for the node itself.
  var nodeLinkFn = partial || !options._asComponent
    ? compileNode(el, options)
    : null
  // link function for the childNodes
  var childLinkFn =
    !(nodeLinkFn && nodeLinkFn.terminal) &&
    !isScript(el) &&
    el.hasChildNodes()
      ? compileNodeList(el.childNodes, options)
      : null

  /**
   * A composite linker function to be called on a already
   * compiled piece of DOM, which instantiates all dir
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `compile.heckTerminalDi` | function | No description |
| `compile.` | function | No description |
| `compile.的value属性上,t` | function | No description |
| `compile.cerAttrs) {` | function | No description |
| `compile.normal directives` | function | No description |
| `compile.ion ' +
            'a` | function | No description |
| `compile."{{p` | function | No description |
| `compile.nction} terminalLinkFn
` | function | No description |
| `compile., but only if ` | function | No description |
| `compile.}
  // 元素指令都是用户` | function | No description |
| `compile.<div id="a"><sp` | function | No description |
| `compile.{Element} el
 * @param` | function | No description |
| `compile.oken(token, opt` | function | No description |
| `compile.tions._` | function | No description |
| `compile.ance.
` | function | No description |
| `compile.(dirs[i])
  ` | function | No description |
| `compile. function unlink (d` | function | No description |
| `compile.ives before ev` | function | No description |
| `compile.opDirs)
}

/` | function | No description |
| `compile.eRoot (el, options,` | function | No description |

## Git History

- Commits: 7
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
