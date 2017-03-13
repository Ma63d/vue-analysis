import FragmentFactory from '../../fragment/factory'
import { FOR } from '../priorities'
import { withoutConversion } from '../../observer/index'
import { getPath } from '../../parsers/path'
import {
  isObject,
  warn,
  createAnchor,
  replace,
  before,
  after,
  remove,
  hasOwn,
  inDoc,
  defineReactive,
  def,
  cancellable,
  isArray,
  isPlainObject
} from '../../util/index'

let uid = 0

const vFor = {

  priority: FOR,
  terminal: true,

  params: [
    'track-by',
    'stagger',
    'enter-stagger',
    'leave-stagger'
  ],

  bind () {
    // support "item in/of items" syntax
    var inMatch = this.expression.match(/(.*) (?:in|of) (.*)/)
    if (inMatch) {
      var itMatch = inMatch[1].match(/\((.*),(.*)\)/)
      if (itMatch) {
        // v-for="{k,v} in array"的形式,iterator就是'k',别名为v
        this.iterator = itMatch[1].trim()
        this.alias = itMatch[2].trim()
      } else {
        // v-for="ele in array"的形式,别名为ele
        this.alias = inMatch[1].trim()
      }
      this.expression = inMatch[2]
    }

    if (!this.alias) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid v-for expression "' + this.descriptor.raw + '": ' +
        'alias is required.',
        this.vm
      )
      return
    }

    // uid as a cache identifier
    // 这个id是每个v-for指令实例的id
    this.id = '__v-for__' + (++uid)

    // check if this is an option list,
    // so that we know if we need to update the <select>'s
    // v-model when the option list has changed.
    // because v-model has a lower priority than v-for,
    // the v-model is not bound here yet, so we have to
    // retrive it in the actual updateModel() function.
    var tag = this.el.tagName
    this.isOption =
      (tag === 'OPTION' || tag === 'OPTGROUP') &&
      this.el.parentNode.tagName === 'SELECT'

    // setup anchor nodes
    // 生成anchor记录v-for内容的起始和结束,因为v-for会为每个数据创建DOM,因此需要标记这些DOM的边界
    this.start = createAnchor('v-for-start')
    this.end = createAnchor('v-for-end')
    replace(this.el, this.end)
    before(this.start, this.end)

    // cache
    this.cache = Object.create(null)

    // fragment factory
    this.factory = new FragmentFactory(this.vm, this.el)
  },

  update (data) {
    this.diff(data)
    this.updateRef()
    this.updateModel()
  },

  /**
   * Diff, based on new data and old data, determine the
   * minimum amount of DOM manipulations needed to make the
   * DOM reflect the new data Array.
   *
   * The algorithm diffs the new data Array by storing a
   * hidden reference to an owner vm instance on previously
   * seen data. This allows us to achieve O(n) which is
   * better than a levenshtein distance based algorithm,
   * which is O(m * n).
   *
   * @param {Array} data
   */

  diff (data) {
    // check if the Array was converted from an Object
    var item = data[0]
    // 如果数组元素是纯对象,
    // 那么在_postProcess中完成过对于对象的改造:将属性名放在$key上,将属性值放在$value上
    // 所以对于这种情况要区别对待一下
    var convertedFromObject = this.fromObject =
      isObject(item) &&
      hasOwn(item, '$key') &&
      hasOwn(item, '$value')

    var trackByKey = this.params.trackBy
    var oldFrags = this.frags
    var frags = this.frags = new Array(data.length)
    // alias别名, 比如v-for="a in b",那么a就是数组中元素的别名,alias='a'
    var alias = this.alias
    // v-for="(i, item) in items" 时,this.iterator='i'
    var iterator = this.iterator
    var start = this.start
    var end = this.end
    var inDocument = inDoc(start)
    var init = !oldFrags
    var i, l, frag, key, value, primitive

    // First pass, go through the new Array and fill up
    // the new frags array. If a piece of data has a cached
    // instance for it, we reuse it. Otherwise build a new
    // instance.
    // 第一步,遍历新数组,对每个元素,如果这个元素可复用(根据getTrackByKey),
    // 那么从缓存中找出原来的fragment, reuse it
    // 并且修改$index,$key,iterator以及scope[alias]
    // 如果没有找到对应的fragment,也就是新的元素,就创建frag,
    for (i = 0, l = data.length; i < l; i++) {
      item = data[i]
      key = convertedFromObject ? item.$key : null
      value = convertedFromObject ? item.$value : item
      primitive = !isObject(value)
      // 查找缓存的fragment实例
      // 对于初始化阶段,直接进入创建frag的流程
      frag = !init && this.getCachedFrag(value, i, key)
      if (frag) { // reusable fragment
        frag.reused = true
        // update $index
        // 如果有相关的watcher订阅了scope.$index,那么这一步会触发notify
        frag.scope.$index = i
        // update $key
        if (key) {
          // 同上
          frag.scope.$key = key
        }
        // update iterator
        if (iterator) {
          frag.scope[iterator] = key !== null ? key : i
        }
        // update data for track-by, object repeat &
        // primitive values.
        if (trackByKey || convertedFromObject || primitive) {
          // 对于alias属性的修改要一直放在withoutConversion中,原因详见v-for指令的create方法
          // 至于为什么要修改scope[alias]
          // 比如v-for="item in obj" obj={a:{id:1}},现在obj.a变成{id:2},
          // 那么这个frag的scope['item']肯定要修改成{id:2},
          // 这一步会触发setter,从而退订{id:1},订阅{id:2}
          withoutConversion(() => {
            frag.scope[alias] = value
          })
        }
      } else { // new isntance
        frag = this.create(value, alias, i, key)
        frag.fresh = !init
      }
      frags[i] = frag
      if (init) {
        frag.before(end)
      }
    }

    // we're done for the initial render.
    if (init) {
      return
    }

    // Second pass, go through the old fragments and
    // destroy those who are not reused (and remove them
    // from cache)
    var removalIndex = 0
    var totalRemoved = oldFrags.length - frags.length
    // when removing a large number of fragments, watcher removal
    // turns out to be a perf bottleneck, so we batch the watcher
    // removals into a single filter call!
    // 这里很关键,如上所述,如果在这一步就找出不需要的watcher并在他的teardown里把他从vm._watchers中移除的话,
    // 那么每找一次就是O(N),N个oldFrags就是O(N方),即使只有一个frag没reuse也是O(N),而后述的方法始终O(N)
    // 因此这里的批处理就是先this.vm._vForRemoving为true,
    // 在watcher的teardown方法中检测到this.vm._vForRemoving为true后只是做watcher上相关属性的删除
    // 和watcher.active改为false
    // 在oldFrags遍历完成后,_watchers.filter(w => w.active)找出没有被teardown的watcher,
    // 并将这个数组赋值到this.vm._watchers,
    // 而原先的包含了所有watcher的数组则不再被引用,也就会被JS的垃圾收集机制给收集掉,
    // 那些被teardown的watcher也就因此被gc给干掉了.
    this.vm._vForRemoving = true
    for (i = 0, l = oldFrags.length; i < l; i++) {
      frag = oldFrags[i]
      if (!frag.reused) {
        this.deleteCachedFrag(frag)
        // 每当有未复用的fragment,removalIndex加一
        this.remove(frag, removalIndex++, totalRemoved, inDocument)
      }
    }
    this.vm._vForRemoving = false
    if (removalIndex) {
      // 找出没有被teardown的watcher
      this.vm._watchers = this.vm._watchers.filter(w => w.active)
    }

    // Final pass, move/insert new fragments into the
    // right place.
    var targetPrev, prevEl, currentPrev
    var insertionIndex = 0
    for (i = 0, l = frags.length; i < l; i++) {
      frag = frags[i]
      // this is the frag that we should be after
      targetPrev = frags[i - 1]
      // prevEl为targetPrev的最后一个元素,
      // targetPrev表示按照现在frags的顺序,当前的frag应该摆在哪个frag的后面
      // 如果i为0,那么targetPrev就会是undefined,prevEl也就会是start anchor,
      // 也就是放在v-for的anchor后面即可
      // 否则i不0,targetPrev有值,那就放在targetPrev.end || targetPrev.node 之后
      prevEl = targetPrev
        ? targetPrev.staggerCb
          ? targetPrev.staggerAnchor
          : targetPrev.end || targetPrev.node
        : start
      if (frag.reused && !frag.staggerCb) {
        // 在当前DOM里,frag目前是放在currentPrev后面的
        currentPrev = findPrevFrag(frag, start, this.id)
        if (
          // 如果currentPrev和targetPrev相等,那么说明frag所在的位置就是我期望的位置
          currentPrev !== targetPrev && (
            !currentPrev ||
            // optimization for moving a single item.
            // thanks to suggestions by @livoras in #1807
            findPrevFrag(currentPrev, start, this.id) !== targetPrev
          )
        ) {
          this.move(frag, prevEl)
        }
      } else {
        // new instance, or still in stagger.
        // insert with updated stagger index.
        this.insert(frag, insertionIndex++, prevEl, inDocument)
      }
      frag.reused = frag.fresh = false
    }
  },

  /**
   * Create a new fragment instance.
   *
   * @param {*} value
   * @param {String} alias
   * @param {Number} index
   * @param {String} [key]
   * @return {Fragment}
   */
  // 创建一个继承自上级scope或vm的scope实例
  // 并且将数组中的对应元素通过defineReactive,响应式的设置到scope[alias]上去
  // 并设置好scope的$index $key等属性,
  // 然后将这个scope传入当前v-for指令的FragmentFactory实例的create方法,
  // 从而创建出一个Fragment实例,
  // 创建过程中会用之前缓存在FragmentFactory上的linker生成一个绑定了当前scope的DOM实例,
  // 之后,把这个Frag实例给缓存了,便于以后复用.  this.cacheFrag(value, frag, index, key)
  create (value, alias, index, key) {
    var host = this._host
    // create iteration scope
    // 因为存在多重v-for嵌套的情况,所以有限继承v-for指令的this._scope
    var parentScope = this._scope || this.vm
    // scope继承自上级scope或vm
    var scope = Object.create(parentScope)
    // ref holder for the scope
    scope.$refs = Object.create(parentScope.$refs)
    scope.$els = Object.create(parentScope.$els)
    // make sure point $parent to parent scope
    scope.$parent = parentScope
    // for two-way binding on alias
    scope.$forContext = this
    // define scope properties
    // important: define the scope alias without forced conversion
    // so that frozen data structures remain non-reactive.
    // 比如v-for="element in arr"
    // 那么就要实现scope['element'] = arr中具体的元素
    // 但是只需要设置element属性响应式的,并不用去把`arr中具体的元素`改造成响应式的
    // 因为最开始Vue启动时,就已经把数据设置为响应式的,此处不用多次一举
    // 此外有的数据可能被设置为frozen的,因此我们依然要保留其为frozen,所以要在此处withoutConversion
    withoutConversion(() => {
      defineReactive(scope, alias, value)
    })
    defineReactive(scope, '$index', index)
    if (key) {
      defineReactive(scope, '$key', key)
    } else if (scope.$key) {
      // avoid accidental fallback
      def(scope, '$key', null)
    }
    if (this.iterator) {
      defineReactive(scope, this.iterator, key !== null ? key : index)
    }
    // 创造fragment,这里执行了linker,生成了一个响应式的DOM
    // 完成了指令描述符到真正指令的生成,并为指令完成watcher的创建,watcher也监听到了scope对应属性上
    var frag = this.factory.create(host, scope, this._frag)
    frag.forId = this.id
    // 缓存Frag
    this.cacheFrag(value, frag, index, key)
    return frag
  },

  /**
   * Update the v-ref on owner vm.
   */

  updateRef () {
    var ref = this.descriptor.ref
    if (!ref) return
    var hash = (this._scope || this.vm).$refs
    var refs
    if (!this.fromObject) {
      refs = this.frags.map(findVmFromFrag)
    } else {
      refs = {}
      this.frags.forEach(function (frag) {
        refs[frag.scope.$key] = findVmFromFrag(frag)
      })
    }
    hash[ref] = refs
  },

  /**
   * For option lists, update the containing v-model on
   * parent <select>.
   */

  updateModel () {
    if (this.isOption) {
      var parent = this.start.parentNode
      var model = parent && parent.__v_model
      if (model) {
        model.forceUpdate()
      }
    }
  },

  /**
   * Insert a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Node} prevEl
   * @param {Boolean} inDocument
   */

  insert (frag, index, prevEl, inDocument) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel()
      frag.staggerCb = null
    }
    var staggerAmount = this.getStagger(frag, index, null, 'enter')
    if (inDocument && staggerAmount) {
      // create an anchor and insert it synchronously,
      // so that we can resolve the correct order without
      // worrying about some elements not inserted yet
      var anchor = frag.staggerAnchor
      if (!anchor) {
        anchor = frag.staggerAnchor = createAnchor('stagger-anchor')
        anchor.__v_frag = frag
      }
      after(anchor, prevEl)
      var op = frag.staggerCb = cancellable(function () {
        frag.staggerCb = null
        frag.before(anchor)
        remove(anchor)
      })
      setTimeout(op, staggerAmount)
    } else {
      var target = prevEl.nextSibling
      /* istanbul ignore if */
      if (!target) {
        // reset end anchor position in case the position was messed up
        // by an external drag-n-drop library.
        after(this.end, prevEl)
        target = this.end
      }
      frag.before(target)
    }
  },

  /**
   * Remove a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {Boolean} inDocument
   */

  remove (frag, index, total, inDocument) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel()
      frag.staggerCb = null
      // it's not possible for the same frag to be removed
      // twice, so if we have a pending stagger callback,
      // it means this frag is queued for enter but removed
      // before its transition started. Since it is already
      // destroyed, we can just leave it in detached state.
      return
    }
    var staggerAmount = this.getStagger(frag, index, total, 'leave')
    if (inDocument && staggerAmount) {
      var op = frag.staggerCb = cancellable(function () {
        frag.staggerCb = null
        frag.remove()
      })
      setTimeout(op, staggerAmount)
    } else {
      frag.remove()
    }
  },

  /**
   * Move a fragment to a new position.
   * Force no transition.
   *
   * @param {Fragment} frag
   * @param {Node} prevEl
   */

  move (frag, prevEl) {
    // fix a common issue with Sortable:
    // if prevEl doesn't have nextSibling, this means it's
    // been dragged after the end anchor. Just re-position
    // the end anchor to the end of the container.
    /* istanbul ignore if */
    if (!prevEl.nextSibling) {
      this.end.parentNode.appendChild(this.end)
    }
    // 把frag移动到prevEl的后一个兄弟节点之前,那也就把frag插到了prevEl之后(紧跟着prevEl)
    // before实际使用的是DOM的insertBefore的api
    frag.before(prevEl.nextSibling, false)
  },

  /**
   * Cache a fragment using track-by or the object key.
   *
   * @param {*} value
   * @param {Fragment} frag
   * @param {Number} index
   * @param {String} [key]
   */

  cacheFrag (value, frag, index, key) {
    var trackByKey = this.params.trackBy
    // 一个v-for一个专属cache
    var cache = this.cache
    var primitive = !isObject(value)
    var id
    if (key || trackByKey || primitive) {
      // 根据track-by等信息,取出作为track-by的key的具体值
      // 有track-by的情况下,就是track-by对应的具体值,
      // 没有track-by时, 对象v-for情况下,用key,数组v-for情况下,用value
      id = getTrackByKey(index, key, value, trackByKey)
      if (!cache[id]) {
        // 将fragment实例缓存
        cache[id] = frag
      } else if (trackByKey !== '$index') {
        process.env.NODE_ENV !== 'production' &&
        this.warnDuplicate(value)
      }
    } else {
      id = this.id
      if (hasOwn(value, id)) {
        if (value[id] === null) {
          value[id] = frag
        } else {
          process.env.NODE_ENV !== 'production' &&
          this.warnDuplicate(value)
        }
      } else if (Object.isExtensible(value)) {
        def(value, id, frag)
      } else if (process.env.NODE_ENV !== 'production') {
        warn(
          'Frozen v-for objects cannot be automatically tracked, make sure to ' +
          'provide a track-by key.'
        )
      }
    }
    frag.raw = value
  },

  /**
   * Get a cached fragment from the value/index/key
   *
   * @param {*} value
   * @param {Number} index
   * @param {String} key
   * @return {Fragment}
   */

  getCachedFrag (value, index, key) {
    var trackByKey = this.params.trackBy
    var primitive = !isObject(value)
    var frag
    if (key || trackByKey || primitive) {
      var id = getTrackByKey(index, key, value, trackByKey)
      frag = this.cache[id]
    } else {
      frag = value[this.id]
    }
    if (frag && (frag.reused || frag.fresh)) {
      process.env.NODE_ENV !== 'production' &&
      this.warnDuplicate(value)
    }
    return frag
  },

  /**
   * Delete a fragment from cache.
   *
   * @param {Fragment} frag
   */

  deleteCachedFrag (frag) {
    var value = frag.raw
    var trackByKey = this.params.trackBy
    var scope = frag.scope
    var index = scope.$index
    // fix #948: avoid accidentally fall through to
    // a parent repeater which happens to have $key.
    var key = hasOwn(scope, '$key') && scope.$key
    var primitive = !isObject(value)
    if (trackByKey || key || primitive) {
      var id = getTrackByKey(index, key, value, trackByKey)
      this.cache[id] = null
    } else {
      value[this.id] = null
      frag.raw = null
    }
  },

  /**
   * Get the stagger amount for an insertion/removal.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {String} type
   */

  getStagger (frag, index, total, type) {
    type = type + 'Stagger'
    var trans = frag.node.__v_trans
    var hooks = trans && trans.hooks
    var hook = hooks && (hooks[type] || hooks.stagger)
    return hook
      ? hook.call(frag, index, total)
      : index * parseInt(this.params[type] || this.params.stagger, 10)
  },

  /**
   * Pre-process the value before piping it through the
   * filters. This is passed to and called by the watcher.
   */
  // 使用filters处理前先把v-for指令绑定的真正数据放到rawValue上
  _preProcess (value) {
    // regardless of type, store the un-filtered raw value.
    this.rawValue = value
    return value
  },

  /**
   * Post-process the value after it has been piped through
   * the filters. This is passed to and called by the watcher.
   *
   * It is necessary for this to be called during the
   * watcher's dependency collection phase because we want
   * the v-for to update when the source Object is mutated.
   */
  // postProcess 当v-for的是一个对象时,给对象的每个属性添加$key和$value
  _postProcess (value) {
    if (isArray(value)) {
      return value
    } else if (isPlainObject(value)) {
      // convert plain object to array.
      var keys = Object.keys(value)
      var i = keys.length
      var res = new Array(i)
      var key
      while (i--) {
        key = keys[i]
        res[i] = {
          $key: key,
          $value: value[key]
        }
      }
      return res
    } else {
      // 如果v-for的是a in b这种,且b等于一个数字,那就生成一个数组.
      if (typeof value === 'number' && !isNaN(value)) {
        value = range(value)
      }
      // value可能是HTMLCollection NodeList之类的伪数组等等情况,最后这种情况下value保持不变
      return value || []
    }
  },

  unbind () {
    if (this.descriptor.ref) {
      (this._scope || this.vm).$refs[this.descriptor.ref] = null
    }
    if (this.frags) {
      var i = this.frags.length
      var frag
      while (i--) {
        frag = this.frags[i]
        this.deleteCachedFrag(frag)
        frag.destroy()
      }
    }
  }
}

/**
 * Helper to find the previous element that is a fragment
 * anchor. This is necessary because a destroyed frag's
 * element could still be lingering in the DOM before its
 * leaving transition finishes, but its inserted flag
 * should have been set to false so we can skip them.
 *
 * If this is a block repeat, we want to make sure we only
 * return frag that is bound to this v-for. (see #929)
 *
 * @param {Fragment} frag
 * @param {Comment|Text} anchor
 * @param {String} id
 * @return {Fragment}
 */
// anchor是v-for指令整个的start anchor,id是v-for指令的id
function findPrevFrag (frag, anchor, id) {
  var el = frag.node.previousSibling
  /* istanbul ignore if */
  if (!el) return
  frag = el.__v_frag
  while (
    // 如果不是fragment对应的DOM
    // 或者不是当前v-for对应的frag(可能遍历到内层的v-for的frag了)
    // 或者是那些已经要$destroy的frag,但是因为他们有动画或者stagger,还没有删除
    // 或者找到的是整个v-for的anchor了.
    // 那么就跳过它,继续el = el.previousSibling,继续向前寻找
    (!frag || frag.forId !== id || !frag.inserted) &&
    el !== anchor
  ) {
    el = el.previousSibling
    /* istanbul ignore if */
    // 如果已经遍历到最前面的sibling了,那就说明无PrevFrag,return
    if (!el) return
    frag = el.__v_frag
  }
  return frag
}

/**
 * Find a vm from a fragment.
 *
 * @param {Fragment} frag
 * @return {Vue|undefined}
 */

function findVmFromFrag (frag) {
  let node = frag.node
  // handle multi-node frag
  if (frag.end) {
    while (!node.__vue__ && node !== frag.end && node.nextSibling) {
      node = node.nextSibling
    }
  }
  return node.__vue__
}

/**
 * Create a range array from given number.
 *
 * @param {Number} n
 * @return {Array}
 */

function range (n) {
  var i = -1
  var ret = new Array(Math.floor(n))
  while (++i < n) {
    ret[i] = i
  }
  return ret
}

/**
 * Get the track by key for an item.
 *
 * @param {Number} index
 * @param {String} key
 * @param {*} value
 * @param {String} [trackByKey]
 */

function getTrackByKey (index, key, value, trackByKey) {
  return trackByKey
    ? trackByKey === '$index'
      ? index
      : trackByKey.charAt(0).match(/\w/)
        // 如果首字母为标识符字母且不为$
        // 那应该是用户自定义的,那么就可能出track-by="a.b.c"的情况,这就不能直接value["a.b.c"]了
        ? getPath(value, trackByKey)
        // 否则如果以$开头的,那么就是$key,$value之类的了,直接取即可
        : value[trackByKey]
    // 如果没有trackByKey,那么如果是对象v-for,就用key,数组v-for就用value(数组具体元素)
    : (key || value)
}

if (process.env.NODE_ENV !== 'production') {
  vFor.warnDuplicate = function (value) {
    warn(
      'Duplicate value found in v-for="' + this.descriptor.raw + '": ' +
      JSON.stringify(value) + '. Use track-by="$index" if ' +
      'you are expecting duplicate values.',
      this.vm
    )
  }
}

export default vFor
