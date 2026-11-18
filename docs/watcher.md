# Module: watcher

**File:** `\vue源码注释版\watcher.js`

## Overview

Module `watcher` contains 2 analyzed entities.

```
import config from './config'
import Dep from './observer/dep'
import { parseExpression } from './parsers/expression'
import { pushWatcher } from './batcher'
import {
  extend,
  warn,
  isArray,
  isObject,
  nextTick,
  _Set as Set
} from './util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 *
 * @param {Vue} vm
 * @param {String|Function} expOrFn
 * @param {Function} cb
 * @param {Object} options
 *                 - {Array} filters
 *                 - {Boolean} twoWay
 *                 - {Boolean} deep
 *                 - {Boolean} user
 *                 - {Boolean} sync
 *                 - {Boolean} lazy
 *                 - {Function} [preProcess]
 *                 - {Function} [postProcess]
 * @constructor
 */

export default function Watcher (vm, expOrFn, cb, options) {
  // mix in options
  if (options) {
    extend(this, options)
  }
  var isFn = typeof expOrFn === 'function'
  this.vm = vm
  vm._watchers.push(this)
  this.expression = expOrFn
  // 把回调放在this上, 在完成了一轮的数据变动之后,在批处理最后阶段执行cb, cb一般是dom操作
  this.cb = cb
  this.id = ++uid // uid for batching
  this.active = true
  // lazy watcher是在计算属性里用到的,Vue在初始化时会封装你的计算属性的getter,
  // 并在里面闭包了一个新创建的lazy watcher,详见instance/internal/state.js:Vue.prototype._initComputed函数
  // 而指令bind函数中创建的那个并不是lazy watcher,即使这个指令是绑定到一个计算属性上的,请注意区分
  // lazy不会像一般的指令的watcher那样在这个watcher构造函数里计算初始值(this.value)
  // 求值的时机是在外界get这个计算属性时(参见官网http://v1-cn.vuejs.org/guide/reactivity.html#计算属性的奥秘),
  // 而计算属性的getter里写有了逻辑,如果他的lazy watcher的dirty是false,
  // 就拿出之前计算过的值返回给你(dirty的意思表示是数据的依赖有变化,你需要重新计算)
  // 否则就会使用Watcher.prototype.evaluate完成求值,
  // 一旦指定lazy为true,那么这个数据就肯定是dirty的
  // 因此初始化时,是从没有计算过的,数据是undefined,并非正确的值,因此肯定需要计算,所以this.dirty = this.lazy
  this.dirty = this.lazy // for lazy watchers
  // 用deps存储当前的依赖,而新一轮的依赖收集过程中收集到的依赖则会放到newDeps中
  // 之所以要用一个新的数组存放新的依赖是因为当依赖变动之后,
  // 比如由
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `watcher.Watcher` | function | No description |
| `watcher.` | function | No description |

## Git History

- Commits: 6
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
