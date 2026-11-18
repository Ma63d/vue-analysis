# compile-props.assertType

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 401-429)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function assertType (value, type) {
  var valid
  var expectedType
  if (type === String) {
    expectedType = 'string'
    valid = typeof value === expectedType
  } else if (type === Number) {
    expectedType = 'number'
    valid = typeof value === expectedType
  } else if (type === Boolean) {
    expectedType = 'boolean'
    valid = typeof value === expectedType
  } else if (type === Function) {
    expectedType = 'function'
    valid = typeof value === expectedType
  } else if (type === Object) {
    expectedType = 'object'
    valid = isPlainObject(value)
  } else if (type === Array) {
    expectedType = 'array'
    valid = isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
  }
}
```

## Docstring

_No docstring provided._

## Source

```
function assertType (value, type) {
  var valid
  var expectedType
  if (type === String) {
    expectedType = 'string'
    valid = typeof value === expectedType
  } else if (type === Number) {
    expectedType = 'number'
    valid = typeof value === expectedType
  } else if (type === Boolean) {
    expectedType = 'boolean'
    valid = typeof value === expectedType
  } else if (type === Function) {
    expectedType = 'function'
    valid = typeof value === expectedType
  } else if (type === Object) {
    expectedType = 'object'
    valid = isPlainObject(value)
  } else if (type === Array) {
    expectedType = 'array'
    valid = isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
  }
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
