# watcher.

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\watcher.js` (lines 399-425)
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
function traverse (val, seen) {
  let i, keys
  if (!seen) {
    seen = seenObjects
    seen.clear()
  }
  const isA = isArray(val)
  const isO = isObject(val)
  if ((isA || isO) && Object.isExtensible(val)) {
    if (val.__ob__) {
      var depId = val.__ob__.dep.id
      if (seen.has(depId)) {
        return
      } else {
        seen.add(depId)
      }
    }
    if (isA) {
      i = val.length
      while (i--) traverse(val[i], seen)
    } else if (isO) {
      keys = Object.keys(val)
      i = keys.length
      while (i--) traverse(val[keys[i]], seen)
    }
  }
}
```

## Git History

- Commits: 6
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
