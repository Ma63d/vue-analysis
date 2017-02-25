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
   * compiled piece of DOM, which instantiates all directive
   * instances.
   *
   * @param {Vue} vm
   * @param {Element|DocumentFragment} el
   * @param {Vue} [host] - host vm of transcluded content
   * @param {Object} [scope] - v-for scope
   * @param {Fragment} [frag] - link context fragment
   * @return {Function|undefined}
   */

  return function compositeLinkFn (vm, el, host, scope, frag) {
    // cache childNodes before linking parent, fix #657
    var childNodes = toArray(el.childNodes)
    // link
    // 任何link都是包裹在linkAndCapture中执行的,详见linkAndCapture函数
    var dirs = linkAndCapture(function compositeLinkCapturer () {
      if (nodeLinkFn) nodeLinkFn(vm, el, host, scope, frag)
      if (childLinkFn) childLinkFn(vm, childNodes, host, scope, frag)
    }, vm)
    return makeUnlinkFn(vm, dirs)
  }
}

/**
 * Apply a linker to a vm/element pair and capture the
 * directives created during the process.
 *
 * @param {Function} linker
 * @param {Vue} vm
 */
// link函数的执行过程会生成新的Directive实例,push到_directives数组中
// 而这些_directives并没有建立对应的watcher,watcher也没有收集依赖,
// 一切都还处于初始阶段,因此capture需要找到这些新添加的directive,
// 依次执行_bind,在_bind里会进行watcher生成,执行指令的bind和update,完成响应式构建
function linkAndCapture (linker, vm) {
  /* istanbul ignore if */
  // vm._directives存放的都是已经_bind过的,在生产环境下没必要保留他们,
  // 只需要在Vue卸载的时候执行unlink,unlink函数已经闭包了这些指令
  // 如果我们仍然保留他们在vm._directives里,那么卸载的时候就需要把他们splice out,
  // 而这会是很大的性能开销(perf hit)
  if (process.env.NODE_ENV === 'production') {
    // reset directives before every capture in production
    // mode, so that when unlinking we don't need to splice
    // them out (which turns out to be a perf hit).
    // they are kept in development mode because they are
    // useful for Vue's own tests.
    vm._directives = []
  }
  // 先记录下数组里原先有多少元素,他们都是已经执行过_bind的,我们只_bind新添加的directive
  var originalDirCount = vm._directives.length
  linker()
  // slice出新添加的指令们
  var dirs = vm._directives.slice(originalDirCount)
  // 对指令进行优先级排序,使得后面指令的bind过程是按优先级从高到低进行的
  dirs.sort(directiveComparator)
  for (var i = 0, l = dirs.length; i < l; i++) {
    dirs[i]._bind()
  }
  return dirs
}

/**
 * Directive priority sort comparator
 *
 * @param {Object} a
 * @param {Object} b
 */

function directiveComparator (a, b) {
  a = a.descriptor.def.priority || DEFAULT_PRIORITY
  b = b.descriptor.def.priority || DEFAULT_PRIORITY
  return a > b ? -1 : a === b ? 0 : 1
}

/**
 * Linker functions return an unlink function that
 * tearsdown all directives instances generated during
 * the process.
 *
 * We create unlink functions with only the necessary
 * information to avoid retaining additional closures.
 *
 * @param {Vue} vm
 * @param {Array} dirs
 * @param {Vue} [context]
 * @param {Array} [contextDirs]
 * @return {Function}
 */

function makeUnlinkFn (vm, dirs, context, contextDirs) {
  function unlink (destroying) {
    teardownDirs(vm, dirs, destroying)
    if (context && contextDirs) {
      teardownDirs(context, contextDirs)
    }
  }
  // expose linked directives
  unlink.dirs = dirs
  return unlink
}

/**
 * Teardown partial linked directives.
 *
 * @param {Vue} vm
 * @param {Array} dirs
 * @param {Boolean} destroying
 */

function teardownDirs (vm, dirs, destroying) {
  var i = dirs.length
  while (i--) {
    dirs[i]._teardown()
    if (process.env.NODE_ENV !== 'production' && !destroying) {
      vm._directives.$remove(dirs[i])
    }
  }
}

/**
 * Compile link props on an instance.
 *
 * @param {Vue} vm
 * @param {Element} el
 * @param {Object} props
 * @param {Object} [scope]
 * @return {Function}
 */

export function compileAndLinkProps (vm, el, props, scope) {
  var propsLinkFn = compileProps(el, props, vm)
  var propDirs = linkAndCapture(function () {
    propsLinkFn(vm, scope)
  }, vm)
  return makeUnlinkFn(vm, propDirs)
}

/**
 * Compile the root element of an instance.
 *
 * 1. attrs on context container (context scope)
 * 2. attrs on the component template root node, if
 *    replace:true (child scope)
 *
 * If this is a fragment instance, we only need to compile 1.
 *
 * @param {Element} el
 * @param {Object} options
 * @param {Object} contextOptions
 * @return {Function}
 */

export function compileRoot (el, options, contextOptions) {
  var containerAttrs = options._containerAttrs
  var replacerAttrs = options._replacerAttrs
  var contextLinkFn, replacerLinkFn

  // only need to compile other attributes for
  // non-fragment instances
  if (el.nodeType !== 11) {
    // for components, container and replacer need to be
    // compiled separately and linked in different scopes.
    if (options._asComponent) {
      // 2. container attributes
      if (containerAttrs && contextOptions) {
        contextLinkFn = compileDirectives(containerAttrs, contextOptions)
      }
      if (replacerAttrs) {
        // 3. replacer attributes
        replacerLinkFn = compileDirectives(replacerAttrs, options)
      }
    } else {
      // non-component, just compile as a normal element.
      // vue在非组件时,el上的指令也认为是有效的,所以直接拿去编译就好
      replacerLinkFn = compileDirectives(el.attributes, options)
    }
  } else if (process.env.NODE_ENV !== 'production' && containerAttrs) {
    // warn container directives for fragment instances
    // 设置在el上的指令在片段实例的情况下不知道具体作用在哪个元素上,所以要warn一下
    var names = containerAttrs
      .filter(function (attr) {
        // allow vue-loader/vueify scoped css attributes
        return attr.name.indexOf('_v-') < 0 &&
          // allow event listeners
          !onRE.test(attr.name) &&
          // allow slots
          attr.name !== 'slot'
      })
      .map(function (attr) {
        return '"' + attr.name + '"'
      })
    if (names.length) {
      var plural = names.length > 1
      warn(
        'Attribute' + (plural ? 's ' : ' ') + names.join(', ') +
        (plural ? ' are' : ' is') + ' ignored on component ' +
        '<' + options.el.tagName.toLowerCase() + '> because ' +
        'the component is a fragment instance: ' +
        'http://vuejs.org/guide/components.html#Fragment-Instance'
      )
    }
  }

  options._containerAttrs = options._replacerAttrs = null
  return function rootLinkFn (vm, el, scope) {
    // link context scope dirs
    var context = vm._context
    var contextDirs
    if (context && contextLinkFn) {
      contextDirs = linkAndCapture(function () {
        contextLinkFn(context, el, null, scope)
      }, context)
    }

    // link self
    var selfDirs = linkAndCapture(function () {
      if (replacerLinkFn) replacerLinkFn(vm, el)
    }, vm)

    // return the unlink function that tearsdown context
    // container directives.
    return makeUnlinkFn(vm, selfDirs, context, contextDirs)
  }
}

/**
 * Compile a node and return a nodeLinkFn based on the
 * node type.
 *
 * @param {Node} node
 * @param {Object} options
 * @return {Function|null}
 */

function compileNode (node, options) {
  var type = node.nodeType
  if (type === 1 && !isScript(node)) {
    return compileElement(node, options)
  } else if (type === 3 && node.data.trim()) {
    return compileTextNode(node, options)
  } else {
    return null
  }
}

/**
 * Compile an element and return a nodeLinkFn.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|null}
 */

function compileElement (el, options) {
  // preprocess textareas.
  // textarea treats its text content as the initial value.
  // just bind it as an attr directive for value.

  // textarea元素是把tag中间的内容当做了他的value,这和input什么的不太一样
  // 因此大家写模板的时候通常是这样写: <textarea>{{hello}}</textarea>
  // 但是template转换成dom之后,这个内容跑到了textarea元素的value属性上,tag中间的内容是空的,
  // 因此遇到textarea的时候需要单独编译一下它的value

  if (el.tagName === 'TEXTAREA') {
    var tokens = parseText(el.value)
    if (tokens) {
      el.setAttribute(':value', tokensToExp(tokens))
      el.value = ''
    }
  }
  var linkFn
  var hasAttrs = el.hasAttributes()
  var attrs = hasAttrs && toArray(el.attributes)
  // check terminal directives (for & if)
  if (hasAttrs) {
    linkFn = checkTerminalDirectives(el, attrs, options)
  }
  // check element directives
  if (!linkFn) {
    linkFn = checkElementDirectives(el, options)
  }
  // check component
  if (!linkFn) {
    linkFn = checkComponent(el, options)
  }
  // normal directives
  if (!linkFn && hasAttrs) {
    linkFn = compileDirectives(attrs, options)
  }
  return linkFn
}

/**
 * Compile a textNode and return a nodeLinkFn.
 *
 * @param {TextNode} node
 * @param {Object} options
 * @return {Function|null} textNodeLinkFn
 */

function compileTextNode (node, options) {
  // skip marked text nodes
  if (node._skip) {
    return removeText
  }

  var tokens = parseText(node.wholeText)
  // 没有token就意味着没有插值,
  // 没有插值那么内容不需要任何更改,也不会是响应式的数据
  if (!tokens) {
    return null
  }

  // mark adjacent text nodes as skipped,
  // because we are using node.wholeText to compile
  // all adjacent text nodes together. This fixes
  // issues in IE where sometimes it splits up a single
  // text node into multiple ones.
  var next = node.nextSibling
  while (next && next.nodeType === 3) {
    next._skip = true
    next = next.nextSibling
  }

  var frag = document.createDocumentFragment()
  var el, token
  for (var i = 0, l = tokens.length; i < l; i++) {
    token = tokens[i]
    // '{{a}} vue {{b}}'这样一段插值得到的token中
    // token[1]就是' vue ',tag为false,
    // 直接用' vue ' createTextNode即可
    el = token.tag
      ? processTextToken(token, options)
      : document.createTextNode(token.value)
    frag.appendChild(el)
  }
  return makeTextNodeLinkFn(tokens, frag, options)
}

/**
 * Linker for an skipped text node.
 *
 * @param {Vue} vm
 * @param {Text} node
 */

function removeText (vm, node) {
  remove(node)
}

/**
 * Process a single text token.
 *
 * @param {Object} token
 * @param {Object} options
 * @return {Node}
 */

function processTextToken (token, options) {
  var el
  if (token.oneTime) {
    el = document.createTextNode(token.value)
  } else {
    if (token.html) {
      // 这个comment元素形成一个锚点的作用,告诉vue哪个地方应该插入v-html生成的内容
      el = document.createComment('v-html')
      setTokenType('html')
    } else {
      // IE will clean up empty textNodes during
      // frag.cloneNode(true), so we have to give it
      // something here...
      el = document.createTextNode(' ')
      setTokenType('text')
    }
  }
  function setTokenType (type) {
    if (token.descriptor) return
    // parseDirective其实是解析出filters,
    // 比如 'msg | uppercase' 就会生成{expression:'msg',filters:[过滤器名称和参数]}
    var parsed = parseDirective(token.value)
    token.descriptor = {
      name: type,
      def: publicDirectives[type],
      expression: parsed.expression,
      filters: parsed.filters
    }
  }
  return el
}

/**
 * Build a function that processes a textNode.
 *
 * @param {Array<Object>} tokens
 * @param {DocumentFragment} frag
 */

function makeTextNodeLinkFn (tokens, frag) {
  return function textNodeLinkFn (vm, el, host, scope) {
    var fragClone = frag.cloneNode(true)
    var childNodes = toArray(fragClone.childNodes)
    var token, value, node
    for (var i = 0, l = tokens.length; i < l; i++) {
      token = tokens[i]
      value = token.value
      if (token.tag) {
        node = childNodes[i]
        if (token.oneTime) {
          // 单次插值直接$eval,因为不是用watcher来计算表达式的值,所以不会收集任何依赖,也就避免响应式更新
          value = (scope || vm).$eval(value)
          if (token.html) {
            replace(node, parseTemplate(value, true))
          } else {
            node.data = _toString(value)
          }
        } else {
          vm._bindDir(token.descriptor, node, host, scope)
        }
      }
    }
    replace(el, fragClone)
  }
}

/**
 * Compile a node list and return a childLinkFn.
 *
 * @param {NodeList} nodeList
 * @param {Object} options
 * @return {Function|undefined}
 */

function compileNodeList (nodeList, options) {
  var linkFns = []
  var nodeLinkFn, childLinkFn, node
  for (var i = 0, l = nodeList.length; i < l; i++) {
    node = nodeList[i]
    nodeLinkFn = compileNode(node, options)
    childLinkFn =
      !(nodeLinkFn && nodeLinkFn.terminal) &&
      node.tagName !== 'SCRIPT' &&
      node.hasChildNodes()
        ? compileNodeList(node.childNodes, options)
        : null
    // 为什么是紧邻着的push了nodeLinkFn和childLinkFn,请参见makeChildLinkFn注释
    linkFns.push(nodeLinkFn, childLinkFn)
  }
  return linkFns.length
    ? makeChildLinkFn(linkFns)
    : null
}

/**
 * Make a child link function for a node's childNodes.
 *
 * @param {Array<Function>} linkFns
 * @return {Function} childLinkFn
 */

function makeChildLinkFn (linkFns) {
  return function childLinkFn (vm, nodes, host, scope, frag) {
    var node, nodeLinkFn, childrenLinkFn
    for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
      node = nodes[n]
      nodeLinkFn = linkFns[i++]
      childrenLinkFn = linkFns[i++]
      // cache childNodes before linking parent, fix #657
      var childNodes = toArray(node.childNodes)
      // 比如模板如下:
      // <div>
      //      <div id="a"><span>a</span><div>
      //      <div><span>b</span><div>
      // </div>
      // link时,遍历外层div的子元素,遍历到#a时
      // 然后就把<div id="a"><div>交给nodeLinkFn,
      // 然后把#a的childNodes:<span>a</span> 交给childLinkFn
      // 每轮遍历会同时遍历到元素和元素的childNodes,所以当时就把他们的link函数push在相邻的位置
      if (nodeLinkFn) {
        nodeLinkFn(vm, node, host, scope, frag)
      }
      if (childrenLinkFn) {
        childrenLinkFn(vm, childNodes, host, scope, frag)
      }
    }
  }
}

/**
 * Check for element directives (custom elements that should
 * be resovled as terminal directives).
 *
 * @param {Element} el
 * @param {Object} options
 */

function checkElementDirectives (el, options) {
  var tag = el.tagName.toLowerCase()
  if (commonTagRE.test(tag)) {
    return
  }
  // 元素指令都是用户自定义的,并且将它的定义放在了options里,需要通过
  // resolveAsset取出
  var def = resolveAsset(options, 'elementDirectives', tag)
  if (def) {
    return makeTerminalNodeLinkFn(el, tag, '', options, def)
  }
}

/**
 * Check if an element is a component. If yes, return
 * a component link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|undefined}
 */

function checkComponent (el, options) {
  var component = checkComponentAttr(el, options)
  if (component) {
    // 遍历el上的attribute,检测有无v-ref
    var ref = findRef(el)
    var descriptor = {
      name: 'component',
      ref: ref,
      expression: component.id,
      def: internalDirectives.component,
      modifiers: {
        literal: !component.dynamic
      }
    }
    var componentLinkFn = function (vm, el, host, scope, frag) {
      if (ref) {
        // 如果定义了ref,则需要把$refs上的对应属性设置为响应式的
        defineReactive((scope || vm).$refs, ref, null)
      }
      vm._bindDir(descriptor, el, host, scope, frag)
    }
    componentLinkFn.terminal = true
    return componentLinkFn
  }
}

/**
 * Check an element for terminal directives in fixed order.
 * If it finds one, return a terminal link function.
 *
 * @param {Element} el
 * @param {Array} attrs
 * @param {Object} options
 * @return {Function} terminalLinkFn
 */

// 检查元素的属性里是否具有终端指令
// 如果有 则返回terminal link function
// 终端指令的定义详见 http://v1-cn.vuejs.org/guide/custom-directive.html#terminal
// 比如v-if 因为元素是否存在和编译需要视v-if的值而定, (这个元素最终都不存在你编译他的指令和内容干嘛...- -)
// 所以编译和link的任务交由v-if决定(在v-if的值为true之后开始编译和link)
// 再比如v-for v-for决定了元素是否存在,如果存在会具体复制几份, 指令和dom内容的编译都是具体到v-for
// 里的每个元素上的,所以交由v-for接管

function checkTerminalDirectives (el, attrs, options) {
  if (getAttr(el, 'v-pre') !== null) {
    return skip
  }
  // skip v-else block, but only if following v-if
  if (el.hasAttribute('v-else')) {
    var prev = el.previousElementSibling
    if (prev && prev.hasAttribute('v-if')) {
      return skip
    }
  }
  //termDef用于存储循环中之前检测出的终端指令
  var attr, name, value, modifiers, matched, dirName, rawName, arg, def, termDef
  for (var i = 0, j = attrs.length; i < j; i++) {
    attr = attrs[i]
    name = attr.name.replace(modifierRE, '')

    //只有以"v-"开头的指令才可能是vue内部的终端指令,其他则不用考虑
    if ((matched = name.match(dirAttrRE))) {
      def = resolveAsset(options, 'directives', matched[1])
      if (def && def.terminal) {
        // 如果之前没有检测出终端指令 或者 之前的终端指令比当前的小,或者比2000小(当前没有优先级的情况下)
        // 那么进入下面的if
        // 保证最终接管这个元素的编译连接过程的是那个最高优先级的终端指令
        if (!termDef || ((def.priority || DEFAULT_TERMINAL_PRIORITY) > termDef.priority)) {
          termDef = def
          rawName = attr.name
          modifiers = parseModifiers(attr.name)
          value = attr.value
          dirName = matched[1]
          arg = matched[2]
        }
      }
    }
  }

  if (termDef) {
    return makeTerminalNodeLinkFn(el, dirName, value, options, termDef, rawName, arg, modifiers)
  }
}

function skip () {}
skip.terminal = true

/**
 * Build a node link function for a terminal directive.
 * A terminal link function terminates the current
 * compilation recursion and handles compilation of the
 * subtree in the directive.
 *
 * @param {Element} el
 * @param {String} dirName
 * @param {String} value
 * @param {Object} options
 * @param {Object} def
 * @param {String} [rawName]
 * @param {String} [arg]
 * @param {Object} [modifiers]
 * @return {Function} terminalLinkFn
 */

function makeTerminalNodeLinkFn (el, dirName, value, options, def, rawName, arg, modifiers) {
  var parsed = parseDirective(value)
  var descriptor = {
    name: dirName,
    arg: arg,
    expression: parsed.expression,
    filters: parsed.filters,
    raw: value,
    attr: rawName,
    modifiers: modifiers,
    def: def
  }
  // check ref for v-for and router-view
  if (dirName === 'for' || dirName === 'router-view') {
    descriptor.ref = findRef(el)
  }
  var fn = function terminalNodeLinkFn (vm, el, host, scope, frag) {
    if (descriptor.ref) {
      defineReactive((scope || vm).$refs, descriptor.ref, null)
    }
    vm._bindDir(descriptor, el, host, scope, frag)
  }
  fn.terminal = true
  return fn
}

/**
 * Compile the directives on an element and return a linker.
 *
 * @param {Array|NamedNodeMap} attrs
 * @param {Object} options
 * @return {Function}
 */

function compileDirectives (attrs, options) {
  var i = attrs.length
  var dirs = []
  var attr, name, value, rawName, rawValue, dirName, arg, modifiers, dirDef, tokens, matched
  while (i--) {
    attr = attrs[i]
    //存放属性的全名
    name = rawName = attr.name
    //存放属性在dom里的值
    value = rawValue = attr.value
    tokens = parseText(value)
    // reset arg
    arg = null
    // check modifiers
    modifiers = parseModifiers(name)
    //name存放删除掉修饰符部分的属性名称
    name = name.replace(modifierRE, '')

    // attribute interpolations
    if (tokens) {
      // 有tokens,那就一定是'{{a}}'这样的插值模板,那就一定对应v-bind指令,
      // 因为hello="{{people}}" 等价于 :hello="people"
      value = tokensToExp(tokens)
      arg = name
      pushDir('bind', publicDirectives.bind, tokens)
      // warn against mixing mustaches with v-bind
      if (process.env.NODE_ENV !== 'production') {
        if (name === 'class' && Array.prototype.some.call(attrs, function (attr) {
          return attr.name === ':class' || attr.name === 'v-bind:class'
        })) {
          warn(
            'class="' + rawValue + '": Do not mix mustache interpolation ' +
            'and v-bind for "class" on the same element. Use one or the other.',
            options
          )
        }
      }
    } else

    // special attribute: transition
    if (transitionRE.test(name)) {
      modifiers.literal = !bindRE.test(name)
      pushDir('transition', internalDirectives.transition)
    } else

    // event handlers
    if (onRE.test(name)) {
      arg = name.replace(onRE, '')
      pushDir('on', publicDirectives.on)
    } else

    // attribute bindings
    if (bindRE.test(name)) {
      dirName = name.replace(bindRE, '')
      if (dirName === 'style' || dirName === 'class') {
        // 这里不设置arg,这就使得v-bind指令的update函数里会执行this.handleObject而不是this.handleSingle
        pushDir(dirName, internalDirectives[dirName])
      } else {
        arg = dirName
        pushDir('bind', publicDirectives.bind)
      }
    } else

    // normal directives
    if ((matched = name.match(dirAttrRE))) {
      dirName = matched[1]
      arg = matched[2]

      // skip v-else (when used with v-show)
      if (dirName === 'else') {
        continue
      }

      dirDef = resolveAsset(options, 'directives', dirName, true)
      if (dirDef) {
        pushDir(dirName, dirDef)
      }
    }
  }

  /**
   * Push a directive.
   *
   * @param {String} dirName
   * @param {Object|Function} def
   * @param {Array} [interpTokens]
   */
  // rawName,rawValue等变量都是父级作用域也就是compileDirectives函数内的那些变量
  // 他们在进入这个函数前就已经设置好了.
  function pushDir (dirName, def, interpTokens) {
    // 遍历所有插值token,只要一个是oneTime,那么整个表达式就是oneTime的
    var hasOneTimeToken = interpTokens && hasOneTime(interpTokens)
    var parsed = !hasOneTimeToken && parseDirective(value)
    dirs.push({
      name: dirName,
      attr: rawName,
      raw: rawValue,
      def: def,
      arg: arg,
      modifiers: modifiers,
      // conversion from interpolation strings with one-time token
      // to expression is differed until directive bind time so that we
      // have access to the actual vm context for one-time bindings.
      expression: parsed && parsed.expression,
      filters: parsed && parsed.filters,
      interp: interpTokens,
      // 这个用来记录是否是单次插值的属性只会在bind指令中用到,
      // bind指令的bind阶段检测到这个属性之后会执行tokensToExp,然后隐式的处理单次插值的情况
      // 详见bind指令的bind函数
      hasOneTime: hasOneTimeToken
    })
  }

  if (dirs.length) {
    return makeNodeLinkFn(dirs)
  }
}

/**
 * Parse modifiers from directive attribute name.
 *
 * @param {String} name
 * @return {Object}
 */

function parseModifiers (name) {
  var res = Object.create(null)
  var match = name.match(modifierRE)
  if (match) {
    var i = match.length
    while (i--) {
      res[match[i].slice(1)] = true
    }
  }
  return res
}

/**
 * Build a link function for all directives on a single node.
 *
 * @param {Array} directives
 * @return {Function} directivesLinkFn
 */
// 让link函数闭包住编译阶段生成好的dir对象(他们还不是Directive实例,虽然变量名叫做directives)
function makeNodeLinkFn (directives) {
  return function nodeLinkFn (vm, el, host, scope, frag) {
    // reverse apply because it's sorted low to high
    var i = directives.length
    while (i--) {
      vm._bindDir(directives[i], el, host, scope, frag)
    }
  }
}

/**
 * Check if an interpolation string contains one-time tokens.
 *
 * @param {Array} tokens
 * @return {Boolean}
 */

function hasOneTime (tokens) {
  var i = tokens.length
  while (i--) {
    if (tokens[i].oneTime) return true
  }
}

function isScript (el) {
  return el.tagName === 'SCRIPT' && (
    !el.hasAttribute('type') ||
    el.getAttribute('type') === 'text/javascript'
  )
}
