# compile.的value属性上,t

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile.js` (lines 304-313)
- **Role:** internal
- **Stability:** unknown

## Signature

```
extarea元素的value属性上,tag中间的内容是空的,
  // 因此遇到textarea的时候需要单独编译一下它的value

  if (el.tagName === 'TEXTAREA') {
    var tokens = parseText(el.value)
    if (tokens) {
      el.setAttribute(':value', tokensToExp(tokens))
      el.value = ''
    }
  }
  var linkFn
  var hasAtt
```

## Docstring

_No docstring provided._

## Source

```
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
