# compile-props.formatValue

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 451-453)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function formatValue (val) {
  return Object.prototype.toString.call(val).slice(8, -1)
}
```

## Docstring

_No docstring provided._

## Source

```
function formatValue (val) {
  return Object.prototype.toString.call(val).slice(8, -1)
}
```

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
