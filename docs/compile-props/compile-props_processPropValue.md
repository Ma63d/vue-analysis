# compile-props.processPropValue

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 233-251)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function processPropValue (vm, prop, rawValue, fn) {
  const isSimple = prop.dynamic && isSimplePath(prop.parentPath)
  let value = rawValue
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop)
  }
  value = coerceProp(prop, value, vm)
  const coerced = value !== rawValue
  if (!assertProp(prop, value, vm)) {
    value = undefined
  }
  if (isSimple && !coerced) {
    withoutConversion(() => {
      fn(value)
    })
  } else {
    fn(value)
  }
}
```

## Docstring

_No docstring provided._

## Source

```
function processPropValue (vm, prop, rawValue, fn) {
  const isSimple = prop.dynamic && isSimplePath(prop.parentPath)
  let value = rawValue
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop)
  }
  value = coerceProp(prop, value, vm)
  const coerced = value !== rawValue
  if (!assertProp(prop, value, vm)) {
    value = undefined
  }
  if (isSimple && !coerced) {
    withoutConversion(() => {
      fn(value)
    })
  } else {
    fn(value)
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
