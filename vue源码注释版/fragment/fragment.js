import {
  createAnchor,
  before,
  prepend,
  inDoc,
  mapNodeRange,
  removeNodeRange
} from '../util/index'

import {
  beforeWithTransition,
  removeWithTransition
} from '../transition/index'

/**
 * Abstraction for a partially-compiled fragment.
 * Can optionally compile content with a child scope.
 *
 * @param {Function} linker
 * @param {Vue} vm
 * @param {DocumentFragment} frag
 * @param {Vue} [host]
 * @param {Object} [scope]
 * @param {Fragment} [parentFrag]
 */

export default function Fragment (linker, vm, frag, host, scope, parentFrag) {
  // 当v-for指令里每个v-for的元素里有component时,那么其便会添加到children数组中
  this.children = []
  this.childFrags = []
  this.vm = vm
  this.scope = scope
  this.inserted = false
  this.parentFrag = parentFrag
  if (parentFrag) {
    parentFrag.childFrags.push(this)
  }
  // 执行linker, 创建Directive实例,创建watcher,订阅scope上的数据
  this.unlink = linker(vm, frag, host, scope, this)
  // 举个例子如果是 <li v-for="a in b"></li>,那么就属于single的情况,即每个数组元素只会创建一个DOM节点,
  // 那么这种情况下DOM的移动和销毁就简单得多,只用移动那个DOM
  // 如果是<template v-for="a in b"><span>1</span><span>2</span></template>
  // 那么就要意味着移动多个DOM,因此这种情况下就要创建两个anchor标识当前数组元素对应哪些DOM
  // 每次移动和销毁,需要先找到两个anchor,然后将两个anchor间的DOM统一移动或删除
  var single = this.single =
    frag.childNodes.length === 1 &&
    // do not go single mode if the only node is an anchor
    // 比如v-html的情况里面的DOM只是一个anchor,
    !(frag.childNodes[0].__v_anchor)
  if (single) {
    this.node = frag.childNodes[0]
    this.before = singleBefore
    this.remove = singleRemove
  } else {
    this.node = createAnchor('fragment-start')
    this.end = createAnchor('fragment-end')
    this.frag = frag
    prepend(this.node, frag)
    frag.appendChild(this.end)
    this.before = multiBefore
    this.remove = multiRemove
  }
  this.node.__v_frag = this
}

/**
 * Call attach/detach for all components contained within
 * this fragment. Also do so recursively for all child
 * fragments.
 *
 * @param {Function} hook
 */

Fragment.prototype.callHook = function (hook) {
  var i, l
  for (i = 0, l = this.childFrags.length; i < l; i++) {
    this.childFrags[i].callHook(hook)
  }
  for (i = 0, l = this.children.length; i < l; i++) {
    hook(this.children[i])
  }
}

/**
 * Insert fragment before target, single node version
 *
 * @param {Node} target
 * @param {Boolean} withTransition
 */

function singleBefore (target, withTransition) {
  this.inserted = true
  var method = withTransition !== false
    ? beforeWithTransition
    : before
  // 把this.node使用insertBefore插入到target之前
  method(this.node, target, this.vm)
  if (inDoc(this.node)) {
    this.callHook(attach)
  }
}

/**
 * Remove fragment, single node version
 */
// 移除fragment,会摧毁fragment的DOM上的指令和相关watcher,并最终执行fragment.destroy()
function singleRemove () {
  this.inserted = false
  var shouldCallRemove = inDoc(this.node)
  var self = this
  // 子fragment 子component 和watcher的teardown在此完成
  this.beforeRemove()
  // 真正移除dom,触发detach钩子 以及最终执行fragment.destroy()再此完成
  // destroy里会执行unlink,unlink闭包了link阶段生成的指令,
  // 会对所有指令执行_destroy(),并从this.dirs中移除
  removeWithTransition(this.node, this.vm, function () {
    if (shouldCallRemove) {
      self.callHook(detach)
    }
    self.destroy()
  })
}

/**
 * Insert fragment before target, multi-nodes version
 *
 * @param {Node} target
 * @param {Boolean} withTransition
 */

function multiBefore (target, withTransition) {
  this.inserted = true
  var vm = this.vm
  var method = withTransition !== false
    ? beforeWithTransition
    : before
  mapNodeRange(this.node, this.end, function (node) {
    method(node, target, vm)
  })
  if (inDoc(this.node)) {
    this.callHook(attach)
  }
}

/**
 * Remove fragment, multi-nodes version
 */

function multiRemove () {
  this.inserted = false
  var self = this
  var shouldCallRemove = inDoc(this.node)
  this.beforeRemove()
  removeNodeRange(this.node, this.end, this.vm, this.frag, function () {
    if (shouldCallRemove) {
      self.callHook(detach)
    }
    self.destroy()
  })
}

/**
 * Prepare the fragment for removal.
 */
// 主要是执行子fragment的beforeRemove,frament内component的$destroy和相关watcher的teardown
Fragment.prototype.beforeRemove = function () {
  var i, l
  for (i = 0, l = this.childFrags.length; i < l; i++) {
    // call the same method recursively on child
    // fragments, depth-first
    // 先执行子fragment的beforeRemove 如尤雨溪所述,深度优先的递归执行
    this.childFrags[i].beforeRemove(false)
  }
  // 对fragment里的component执行$destroy
  for (i = 0, l = this.children.length; i < l; i++) {
    // Call destroy for all contained instances,
    // with remove:false and defer:true.
    // Defer is necessary because we need to
    // keep the children to call detach hooks
    // on them.
    this.children[i].$destroy(false, true)
  }
  var dirs = this.unlink.dirs
  for (i = 0, l = dirs.length; i < l; i++) {
    // disable the watchers on all the directives
    // so that the rendered content stays the same
    // during removal.
    dirs[i]._watcher && dirs[i]._watcher.teardown()
  }
}

/**
 * Destroy the fragment.
 */

Fragment.prototype.destroy = function () {
  if (this.parentFrag) {
    this.parentFrag.childFrags.$remove(this)
  }
  this.node.__v_frag = null
  this.unlink()
}

/**
 * Call attach hook for a Vue instance.
 *
 * @param {Vue} child
 */

function attach (child) {
  if (!child._isAttached && inDoc(child.$el)) {
    child._callHook('attached')
  }
}

/**
 * Call detach hook for a Vue instance.
 *
 * @param {Vue} child
 */

function detach (child) {
  if (child._isAttached && !inDoc(child.$el)) {
    child._callHook('detached')
  }
}
