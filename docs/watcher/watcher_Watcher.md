# watcher.Watcher

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\watcher.js` (lines 36-94)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function Watcher (vm, expOrFn, cb, options) {
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
    value = scope._applyFilters(value, null, this.filter
```

## Docstring

_No docstring provided._

## Source

```
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
```

## Git History

- Commits: 6
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
