# compile.heckTerminalDi

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile.js` (lines 323-360)
- **Role:** internal
- **Stability:** unknown

## Signature

```
inkFn = checkTerminalDirectives(el, attrs, options)
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
    tok
```

## Docstring

_No docstring provided._

## Source

```
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
