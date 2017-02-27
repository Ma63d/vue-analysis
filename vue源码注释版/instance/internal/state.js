import Watcher from '../../watcher'
import { compileAndLinkProps } from '../../compiler/index'
import Dep from '../../observer/dep'
import {
  observe,
  defineReactive
} from '../../observer/index'

import {
  warn,
  query,
  hasOwn,
  isReserved,
  isPlainObject,
  bind
} from '../../util/index'

export default function (Vue) {
  /**
   * Accessor for `$data` property, since setting $data
   * requires observing the new object and updating
   * proxied properties.
   */

  Object.defineProperty(Vue.prototype, '$data', {
    get () {
      return this._data
    },
    set (newData) {
      if (newData !== this._data) {
        this._setData(newData)
      }
    }
  })

  /**
   * Setup the scope of an instance, which contains:
   * - observed data
   * - computed properties
   * - user methods
   * - meta properties
   */

  Vue.prototype._initState = function () {
    this._initProps()
    this._initMeta()
    this._initMethods()
    this._initData()
    this._initComputed()
  }

  /**
   * Initialize props.
   */

  Vue.prototype._initProps = function () {
    var options = this.$options
    var el = options.el
    var props = options.props
    if (props && !el) {
      process.env.NODE_ENV !== 'production' && warn(
        'Props will not be compiled if no `el` option is ' +
        'provided at instantiation.',
        this
      )
    }
    // make sure to convert string selectors into element now
    el = options.el = query(el)
    this._propsUnlinkFn = el && el.nodeType === 1 && props
      // props must be linked in proper scope if inside v-for
      ? compileAndLinkProps(this, el, props, this._scope)
      : null
  }

  /**
   * Initialize the data.
   */

  Vue.prototype._initData = function () {
    // 初始化数据,其实一方面把data的内容代理到vm实例上,
    // 另一方面改造data,变成reactive的
    // 即get时触发依赖收集(将订阅者加入Dep实例的subs数组中),set时notify订阅者
    var dataFn = this.$options.data
    var data = this._data = dataFn ? dataFn() : {}
    if (!isPlainObject(data)) {
      data = {}
      process.env.NODE_ENV !== 'production' && warn(
        'data functions should return an object.',
        this
      )
    }
    var props = this._props
    // proxy data on instance
    var keys = Object.keys(data)
    var i, key
    i = keys.length
    while (i--) {
      key = keys[i]
      // there are two scenarios where we can proxy a data key:
      // 1. it's not already defined as a prop
      // 2. it's provided via a instantiation option AND there are no
      //    template prop present
      if (!props || !hasOwn(props, key)) {
        // 将data属性的内容代理到vm上面去,使得vm访问指定属性即可拿到_data内的同名属性
        // 实现vm.prop === vm._data.prop,
        // 这样当前vm的后代实例就能直接通过原型链查找到父代的属性
        // 比如v-for指令会为数组的每一个元素创建一个scope,这个scope就继承自vm或上级数组元素的scope,
        // 这样就可以在v-for的作用域中访问父级的数据
        this._proxy(key)
      } else if (process.env.NODE_ENV !== 'production') {
        warn(
          'Data field "' + key + '" is already defined ' +
          'as a prop. To provide default value for a prop, use the "default" ' +
          'prop option; if you want to pass prop values to an instantiation ' +
          'call, use the "propsData" option.',
          this
        )
      }
    }
    // observe data
    observe(data, this)
  }

  /**
   * Swap the instance's $data. Called in $data's setter.
   *
   * @param {Object} newData
   */

  Vue.prototype._setData = function (newData) {
    newData = newData || {}
    var oldData = this._data
    this._data = newData
    var keys, key, i
    // unproxy keys not present in new data
    keys = Object.keys(oldData)
    i = keys.length
    while (i--) {
      key = keys[i]
      if (!(key in newData)) {
        this._unproxy(key)
      }
    }
    // proxy keys not already proxied,
    // and trigger change for changed values
    keys = Object.keys(newData)
    i = keys.length
    while (i--) {
      key = keys[i]
      if (!hasOwn(this, key)) {
        // new property
        this._proxy(key)
      }
    }
    oldData.__ob__.removeVm(this)
    observe(newData, this)
    this._digest()
  }

  /**
   * Proxy a property, so that
   * vm.prop === vm._data.prop
   *
   * @param {String} key
   */

  Vue.prototype._proxy = function (key) {
    // $和_开头的属性默认是Vue内部属性,不允许挂载到Vue上,
    // 大家自己写data的时候也尽量别写这些属性名,尤其是在使用mongo做后台时,没错,我想说的就是那个_id属性
    if (!isReserved(key)) {
      // need to store ref to self here
      // because these getter/setters might
      // be called by child scopes via
      // prototype inheritance.
      var self = this
      Object.defineProperty(self, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter () {
          return self._data[key]
        },
        set: function proxySetter (val) {
          self._data[key] = val
        }
      })
    }
  }

  /**
   * Unproxy a property.
   *
   * @param {String} key
   */

  Vue.prototype._unproxy = function (key) {
    if (!isReserved(key)) {
      delete this[key]
    }
  }

  /**
   * Force update on every watcher in scope.
   */

  Vue.prototype._digest = function () {
    for (var i = 0, l = this._watchers.length; i < l; i++) {
      // shallow updates 浅层更新,即对于对象的情况,如果oldVal和val指向同一个值,那就不用再执行指令的update(修改dom),
      // 而不是像正常改动数据后的更新那样,只要被notify了,即使引用相同也是要更改的dom的,因为可能是内部的属性更新了
      // 因为_digest只会在data的顶级属性set/delete的时候执行, 不会有任何watcher订阅整个data,
      // 而_digest会"无情"的触发所有watcher执行update(就是下面这行代码啦)
      // 因此只要让那些想要订阅我刚刚set的这个属性的watcher订阅即可,
      // 对于他们而言,这个属性由undefined变成一个新值,都不用考虑深层还是浅层的问题,直接更新,详见Watcher.prototype.run
      // 而对于其他被无辜触发的watcher,Vue让他们有执行浅层更新,只要引用相同即可,不必去执行指令的update,避免不必要的性能开销
      this._watchers[i].update(true) // shallow updates
    }
  }

  /**
   * Setup computed properties. They are essentially
   * special getter/setters
   */

  function noop () {}
  Vue.prototype._initComputed = function () {
    var computed = this.$options.computed
    if (computed) {
      for (var key in computed) {
        var userDef = computed[key]
        var def = {
          enumerable: true,
          configurable: true
        }
        if (typeof userDef === 'function') {
          def.get = makeComputedGetter(userDef, this)
          def.set = noop
        } else {
          def.get = userDef.get
            ? userDef.cache !== false
              ? makeComputedGetter(userDef.get, this)
              : bind(userDef.get, this)
            : noop
          def.set = userDef.set
            ? bind(userDef.set, this)
            : noop
        }
        // 封装好计算属性的getter/setter后define到vm实例上.
        Object.defineProperty(this, key, def)
      }
    }
  }

  function makeComputedGetter (getter, owner) {
    // 新建一个lazy watcher,闭包在计算属性被封装过后的getter中
    var watcher = new Watcher(owner, getter, null, {
      lazy: true
    })
    return function computedGetter () {
      // 这个函数才是计算属性的真正getter,
      if (watcher.dirty) {
        // 如果数据是脏的 那么需要更新,否则就直接返回了,
        // 这也就是官网计算属性的奥秘一章中Date.now()的那个例子中,每次计算属性得到的时间戳不变的原因
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }

  /**
   * Setup instance methods. Methods must be bound to the
   * instance since they might be passed down as a prop to
   * child components.
   */

  Vue.prototype._initMethods = function () {
    var methods = this.$options.methods
    if (methods) {
      for (var key in methods) {
        this[key] = bind(methods[key], this)
      }
    }
  }

  /**
   * Initialize meta information like $index, $key & $value.
   */

  Vue.prototype._initMeta = function () {
    var metas = this.$options._meta
    if (metas) {
      for (var key in metas) {
        defineReactive(this, key, metas[key])
      }
    }
  }
}
