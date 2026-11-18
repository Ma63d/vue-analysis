# compile-props.formatType

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 438-442)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function formatType (type) {
  return type
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : 'custom type'
}
```

## Docstring

_No docstring provided._

## Source

```
function formatType (type) {
  return type
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : 'custom type'
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
