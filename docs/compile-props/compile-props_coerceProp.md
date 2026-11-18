# compile-props.coerceProp

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 377-391)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function coerceProp (prop, value, vm) {
  var coerce = prop.options.coerce
  if (!coerce) {
    return value
  }
  if (typeof coerce === 'function') {
    return coerce(value)
  } else {
    process.env.NODE_ENV !== 'production' && warn(
      'Invalid coerce for prop "' + prop.name + '": expected function, got ' + typeof coerce + '.',
      vm
    )
    return value
  }
}
```

## Docstring

_No docstring provided._

## Source

```
function coerceProp (prop, value, vm) {
  var coerce = prop.options.coerce
  if (!coerce) {
    return value
  }
  if (typeof coerce === 'function') {
    return coerce(value)
  } else {
    process.env.NODE_ENV !== 'production' && warn(
      'Invalid coerce for prop "' + prop.name + '": expected function, got ' + typeof coerce + '.',
      vm
    )
    return value
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
