# compile.

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile.js` (lines 815-837)
- **Role:** internal
- **Stability:** unknown

## Signature

```
N/A
```

## Docstring

_No docstring provided._

## Source

```
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
