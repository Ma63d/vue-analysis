# compile-props.updateProp

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 275-279)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function updateProp (vm, prop, value) {
  processPropValue(vm, prop, value, value => {
    vm[prop.path] = value
  })
}
```

## Docstring

_No docstring provided._

## Source

```
export function updateProp (vm, prop, value) {
  processPropValue(vm, prop, value, value => {
    vm[prop.path] = value
  })
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
