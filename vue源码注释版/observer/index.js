import Dep from './dep'
import { arrayMethods } from './array'
import {
  def,
  isArray,
  isPlainObject,
  hasProto,
  hasOwn
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However in certain cases, e.g.
 * v-for scope alias and props, we don't want to force conversion
 * because the value may be a nested value under a frozen data structure.
 *
 * So whenever we want to set a reactive property without forcing
 * conversion on the new value, we wrap that call inside this function.
 */

let shouldConvert = true
export function withoutConversion (fn) {
  shouldConvert = false
  fn()
  shouldConvert = true
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @constructor
 */

export function Observer (value) {
  this.value = value
  this.dep = new Dep()
  def(value, '__ob__', this)
  if (isArray(value)) {
    // 如果是数组,要改写数组的push pop shift等方法 参见http://v1.vuejs.org/guide/list.html#Array-Change-Detection
    // 而es5及更低版本的js情况下无法完美继承数组
    // 参见http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
    // 如果浏览器实现了非标准的__proto__属性的话,那么可以实现继承数组,
    // 否则就只能用扩展实例的方式将改写过的push等方法直接def到实例上
    var augment = hasProto
      ? protoAugment
      : copyAugment
    augment(value, arrayMethods, arrayKeys)
    this.observeArray(value)
  } else {
    // 如果是对象则使用walk遍历每个属性
    this.walk(value)
  }
}

// Instance methods

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 *
 * @param {Object} obj
 */

Observer.prototype.walk = function (obj) {
  var keys = Object.keys(obj)
  for (var i = 0, l = keys.length; i < l; i++) {
    this.convert(keys[i], obj[keys[i]])
  }
}

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i])
  }
}

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */

Observer.prototype.convert = function (key, val) {
  defineReactive(this.value, key, val)
}

/**
 * Add an owner vm, so that when $set/$delete mutations
 * happen we can notify owner vms to proxy the keys and
 * digest the watchers. This is only called when the object
 * is observed as an instance's root $data.
 *
 * @param {Vue} vm
 */

Observer.prototype.addVm = function (vm) {
  (this.vms || (this.vms = [])).push(vm)
}

/**
 * Remove an owner vm. This is called when the object is
 * swapped out as an instance's $data object.
 *
 * @param {Vue} vm
 */

Observer.prototype.removeVm = function (vm) {
  this.vms.$remove(vm)
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} src
 */
// 如果浏览器环境中有__proto__这个属性可用,那么可以用原型链继承的方式去继承数组
function protoAugment (target, src) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */
// 否则不能继承数组,只能采用扩展实例的方式
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @param {Vue} [vm]
 * @return {Observer|undefined}
 * @static
 */

export function observe (value, vm) {
  if (!value || typeof value !== 'object') {
    // 保证只有对象会进入到这个函数
    return
  }
  var ob
  if (
    //如果这个数据身上已经有ob实例了,那就直接返回那个ob实例
    hasOwn(value, '__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    ob = value.__ob__
  } else if (
    shouldConvert &&
    (isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 是对象(包括数组)的话就深入进去遍历属性,observe每个属性
    ob = new Observer(value)
  }
  if (ob && vm) {
    // 如果直接是data,而不是data属性
    // 把vm加入到ob的vms数组当中,因为有的时候我们会对数据手动执行$set/$delete操作,
    // 那么就要提示vm实例这个行为的发生(让vm代理这个新$set的数据,和更新界面)
    ob.addVm(vm)
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 */

export function defineReactive (obj, key, val) {
  // 生成一个新的Dep实例,这个实例会被闭包到getter和setter中
  var dep = new Dep()

  var property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get
  var setter = property && property.set
  // 对属性的值继续执行observe,如果属性的值是一个对象,那么则又递归进去对他的属性执行defineReactive
  // 保证遍历到所有层次的属性
  var childOb = observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val
      // 只有在有Dep.target时才说明是Vue内部依赖收集过程触发的getter
      // 那么这个时候就需要执行dep.depend(),将watcher(Dep.target的实际值)添加到dep的subs数组中
      // 对于其他时候,比如dom事件回调函数中访问这个变量导致触发的getter并不需要执行依赖收集,直接返回value即可
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          // 如果value在observe过程中生成了ob实例,那么就让ob的dep也收集依赖
          childOb.dep.depend()
        }
        if (isArray(value)) {
          for (var e, i = 0, l = value.length; i < l; i++) {
            e = value[i]
            //如果数组元素也是对象,那么他们observe过程也生成了ob实例,那么就让ob的dep也收集依赖
            e && e.__ob__ && e.__ob__.dep.depend()
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val
      if (newVal === value) {
        return
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // observe这个新set的值
      childOb = observe(newVal)
      // 通知订阅我这个dep的watcher们:我更新了
      dep.notify()
    }
  })
}
