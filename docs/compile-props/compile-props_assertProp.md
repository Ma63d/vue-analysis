# compile-props.assertProp

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 322-367)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function assertProp (prop, value, vm) {
  if (
    !prop.options.required && ( // non-required
      prop.raw === null ||      // abscent
      value == null             // null or undefined
    )
  ) {
    return true
  }
  var options = prop.options
  var type = options.type
  var valid = !type
  var expectedTypes = []
  if (type) {
    if (!isArray(type)) {
      type = [type]
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i])
      expectedTypes.push(assertedType.expectedType)
      valid = assertedType.valid
    }
  }
  if (!valid) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'Invalid prop: type check failed for prop "' + prop.name + '".' +
        ' Expected ' + expectedTypes.map(formatType).join(', ') +
        ', got ' + formatValue(value) + '.',
        vm
      )
    }
    return false
  }
  var validator = options.validator
  if (validator) {
    if (!validator(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid prop: custom validator check failed for prop "' + prop.name + '".',
        vm
      )
      return false
    }
  }
  return true
}
```

## Docstring

_No docstring provided._

## Source

```
function assertProp (prop, value, vm) {
  if (
    !prop.options.required && ( // non-required
      prop.raw === null ||      // abscent
      value == null             // null or undefined
    )
  ) {
    return true
  }
  var options = prop.options
  var type = options.type
  var valid = !type
  var expectedTypes = []
  if (type) {
    if (!isArray(type)) {
      type = [type]
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i])
      expectedTypes.push(assertedType.expectedType)
      valid = assertedType.valid
    }
  }
  if (!valid) {
    if (process.env.NODE_ENV !== 'production') {
      warn(
        'Invalid prop: type check failed for prop "' + prop.name + '".' +
        ' Expected ' + expectedTypes.map(formatType).join(', ') +
        ', got ' + formatValue(value) + '.',
        vm
      )
    }
    return false
  }
  var validator = options.validator
  if (validator) {
    if (!validator(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid prop: custom validator check failed for prop "' + prop.name + '".',
        vm
      )
      return false
    }
  }
  return true
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
