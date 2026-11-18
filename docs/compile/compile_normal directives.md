# compile.normal directives

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile.js` (lines 726-842)
- **Role:** internal
- **Stability:** unknown

## Signature

```

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

```

## Docstring

_No docstring provided._

## Source

```
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
... (truncated)
```

## Git History

- Commits: 7
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
