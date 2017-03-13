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
  // 比如由依赖a和b变成依赖a和c
  // 那么需要把原先的依赖订阅清除掉,也就是从b的subs数组中移除当前watcher,因为我已经不想监听b的变动
  // 所以我需要比对deps和newDeps,找出那些不再依赖的dep,然后dep.removeSub(当前watcher),这一步在afterGet中完成
  this.deps = []
  this.newDeps = []
  // 这两个set是用来提升比对过程的效率,不用set的话,判断deps中的一个dep是否在newDeps中的复杂度是O(n)
  // 改用set来判断的话,就是O(1)
  this.depIds = new Set()
  this.newDepIds = new Set()
  this.prevError = null // for async error stacks
  // parse expression for getter/setter
  if (isFn) {
    // 对于计算属性来说,就会进入到这里
    this.getter = expOrFn
    this.setter = undefined
  } else {
    // 把expression解析为一个对象,对象的get/set属性存放了获取/设置的函数
    // 比如hello解析的get函数为function(scope) {return scope.hello;}
    var res = parseExpression(expOrFn, this.twoWay)
    this.getter = res.get
    // 比如scope.a = {b: {c: 0}} 而expression为a.b.c
    // 执行res.set(scope, 123)能得到scope.a变成{b: {c: 123}}
    this.setter = res.set
  }
  // 执行get(),既拿到表达式的值,又完成第一轮的依赖收集,使得watcher订阅到相关的依赖
  // 如果是lazy则不在此处计算初值
  this.value = this.lazy
    ? undefined
    : this.get()
  // state for avoiding false triggers for deep and Array
  // watchers during vm._digest()
  this.queued = this.shallow = false
}

/**
 * Evaluate the getter, and re-collect dependencies.
 */

Watcher.prototype.get = function () {
  // beforeGet就一行: Dep.target = this
  this.beforeGet()
  // v-for情况下,this.scope有值,是对应的数组元素
  var scope = this.scope || this.vm
  var value
  try {
    // 执行getter,这一步很精妙,表面上看是求出指令的初始值,
    // 其实也完成了初始的依赖收集操作,即:让当前的Watcher订阅到对应的依赖(Dep)
    // 比如a+b这样的expression实际是依赖两个a和b变量,this.getter的求值过程中
    // 会依次触发a 和 b的getter,在observer/index.js:defineReactive函数中,我们定义好了他们的getter
    // 他们的getter会将Dep.target也就是当前Watcher加入到自己的subs(订阅者数组)里
    value = this.getter.call(scope, scope)
  } catch (e) {
    if (
      process.env.NODE_ENV !== 'production' &&
      config.warnExpressionErrors
    ) {
      warn(
        'Error when evaluating expression ' +
        '"' + this.expression + '": ' + e.toString(),
        this.vm
      )
    }
  }
  // "touch" every property so they are all tracked as
  // dependencies for deep watching
  if (this.deep) {
    traverse(value)
  }
  if (this.preProcess) {
    value = this.preProcess(value)
  }
  if (this.filters) {
    value = scope._applyFilters(value, null, this.filters, false)
  }
  if (this.postProcess) {
    value = this.postProcess(value)
  }
  this.afterGet()
  return value
}

/**
 * Set the corresponding value with the setter.
 *
 * @param {*} value
 */

Watcher.prototype.set = function (value) {
  var scope = this.scope || this.vm
  if (this.filters) {
    value = scope._applyFilters(
      value, this.value, this.filters, true)
  }
  try {
    this.setter.call(scope, scope, value)
  } catch (e) {
    if (
      process.env.NODE_ENV !== 'production' &&
      config.warnExpressionErrors
    ) {
      warn(
        'Error when evaluating setter ' +
        '"' + this.expression + '": ' + e.toString(),
        this.vm
      )
    }
  }
  // two-way sync for v-for alias
  var forContext = scope.$forContext
  if (forContext && forContext.alias === this.expression) {
    if (forContext.filters) {
      process.env.NODE_ENV !== 'production' && warn(
        'It seems you are using two-way binding on ' +
        'a v-for alias (' + this.expression + '), and the ' +
        'v-for has filters. This will not work properly. ' +
        'Either remove the filters or use an array of ' +
        'objects and bind to object properties instead.',
        this.vm
      )
      return
    }
    forContext._withLock(function () {
      if (scope.$key) { // original is an object
        forContext.rawValue[scope.$key] = value
      } else {
        forContext.rawValue.$set(scope.$index, value)
      }
    })
  }
}

/**
 * Prepare for dependency collection.
 */

Watcher.prototype.beforeGet = function () {
  Dep.target = this
}

/**
 * Add a dependency to this directive.
 *
 * @param {Dep} dep
 */

Watcher.prototype.addDep = function (dep) {
  var id = dep.id
  // 如果newDepIds里已经有了这个Dep的id, 说明这一轮的依赖收集过程已经完成过这个依赖的处理了
  // 比如a + b + a这样的表达式,第二个a在get时就没必要在收集一次了
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id)
    this.newDeps.push(dep)
    if (!this.depIds.has(id)) {
      // 如果连depIds里都没有,说明之前就没有收集过这个依赖,依赖的订阅者里面没有我这个Watcher,
      // 所以加进去
      // 一般发生在第一次依赖收集时
      dep.addSub(this)
    }
  }
}

/**
 * Clean up for dependency collection.
 */
// 新一轮的依赖收集后,依赖被收集到this.newDepIds和this.newDeps里
// this.deps存储的上一轮的的依赖此时将会被遍历, 找出其中不再依赖的dep,将自己从dep的subs列表中清除
// 不再订阅那些不依赖的dep
Watcher.prototype.afterGet = function () {
  Dep.target = null
  var i = this.deps.length
  while (i--) {
    var dep = this.deps[i]
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this)
    }
  }
  // 清除订阅完成,this.depIds和this.newDepIds交换后清空this.newDepIds
  var tmp = this.depIds
  this.depIds = this.newDepIds
  this.newDepIds = tmp
  this.newDepIds.clear()
  // 同上,清空数组
  tmp = this.deps
  this.deps = this.newDeps
  this.newDeps = tmp
  this.newDeps.length = 0
}

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 *
 * @param {Boolean} shallow
 */

Watcher.prototype.update = function (shallow) {
  if (this.lazy) {
    // lazy模式下,标记下当前是脏的就可以了
    this.dirty = true
  } else if (this.sync || !config.async) {
    this.run()
  } else {
    // if queued, only overwrite shallow with non-shallow,
    // but not the other way around.
    // 首先,shallow形参只在_digest里为true,表示浅层更新,其他改动数据引发notify的情况都是false,表示深层更新
    // 如果一个watcher在当前轮次的事件循环里是第一次执行update,this.shallow就直接存放shallow的值('!!'只是转换undefined为false)
    // 如果是后续再一次update,那就要考虑一下了:若以前是浅层更新,而这一次是深层更新,那就一定要修改为深层更新,
    // 若以前是深层更新,那不管这一次是啥都继续保持深层更新
    // 因为深层更新包含了浅层更新的所有操作,还多出了执行指令的update这一步,因此浅可以转深,深不能转浅
    // 详见Vue.prototype._digest 和Watcher.prototype.run
    this.shallow = this.queued
      ? shallow
        ? this.shallow
        : false
      : !!shallow
    // 标记已经加入批处理队列
    this.queued = true
    // record before-push error stack in debug mode
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.debug) {
      this.prevError = new Error('[vue] async stack trace')
    }
    pushWatcher(this)
  }
}

/**
 * Batcher job interface.
 * Will be called by the batcher.
 */

Watcher.prototype.run = function () {
  if (this.active) {
    var value = this.get()
    // 如果两次数据不相同,则不仅要执行上面的 求值、订阅依赖 ,还要执行下面的 指令update、更新dom
    // 如果是相同的,那么则要考虑是否为Deep watchers and watchers on Object/Arrays
    // 因为虽然对象引用相同,但是可能内层属性有变动,
    // 但是又存在一种特殊情况,如果是对象引用相同,但为浅层更新(this.shallow为true),
    // 则一定不可能是内层属性变动的这种情况(因为他们只是_digest引起的watcher"无辜"update),所以不用执行后续操作
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated; but only do so if this is a
      // non-shallow update (caused by a vm digest).
      ((isObject(value) || this.deep) && !this.shallow)
    ) {
      // set new value
      var oldValue = this.value
      this.value = value
      // in debug + async mode, when a watcher callbacks
      // throws, we also throw the saved before-push error
      // so the full cross-tick stack trace is available.
      var prevError = this.prevError
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' &&
          config.debug && prevError) {
        this.prevError = null
        try {
          this.cb.call(this.vm, value, oldValue)
        } catch (e) {
          nextTick(function () {
            throw prevError
          }, 0)
          throw e
        }
      } else {
        this.cb.call(this.vm, value, oldValue)
      }
    }
    this.queued = this.shallow = false
  }
}

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */

Watcher.prototype.evaluate = function () {
  // avoid overwriting another watcher that is being
  // collected.
  // 因为lazy watcher的evaluate()可能是在一个指令watcher的get过程中执行的,
  // 所以指令的依赖收集过程并没有完成,所以先用current缓存起来,lazy watcher计算完成之后再改回去
  var current = Dep.target
  this.value = this.get()
  this.dirty = false
  Dep.target = current
}

/**
 * Depend on all deps collected by this watcher.
 */

Watcher.prototype.depend = function () {
  var i = this.deps.length
  while (i--) {
    this.deps[i].depend()
  }
}

/**
 * Remove self from all dependencies' subcriber list.
 */

Watcher.prototype.teardown = function () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed or is performing a v-for
    // re-render (the watcher list is then filtered by v-for).
    // 在v-for指令的diff方法中,在开始销毁不需要的watcher时,_vForRemoving设置为true
    // 也就不执行$remove操作,
    // 因为$remove操作是对数组先indexOf,遍历的找到指定元素的index,然后再splice(index,1),
    // 遍历和splice都是高耗操作,因此,暂时不执行,
    // 在v-for中,稍后filter找出active为true的watcher并保存之,一次遍历即可.详见v-for的diff方法
    if (!this.vm._isBeingDestroyed && !this.vm._vForRemoving) {
      this.vm._watchers.$remove(this)
    }
    var i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
    this.active = false
    this.vm = this.cb = this.value = null
  }
}

/**
 * Recrusively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 *
 * @param {*} val
 */

const seenObjects = new Set()
function traverse (val, seen) {
  let i, keys
  if (!seen) {
    seen = seenObjects
    seen.clear()
  }
  const isA = isArray(val)
  const isO = isObject(val)
  if ((isA || isO) && Object.isExtensible(val)) {
    if (val.__ob__) {
      var depId = val.__ob__.dep.id
      if (seen.has(depId)) {
        return
      } else {
        seen.add(depId)
      }
    }
    if (isA) {
      i = val.length
      while (i--) traverse(val[i], seen)
    } else if (isO) {
      keys = Object.keys(val)
      i = keys.length
      while (i--) traverse(val[keys[i]], seen)
    }
  }
}
