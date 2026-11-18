# cache.Cache

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\cache.js` (lines 14-19)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function Cache (limit) {
  this.size = 0
  this.limit = limit
  this.head = this.tail = undefined
  this._keymap = Object.create(null)
}
```

## Docstring

_No docstring provided._

## Source

```
export default function Cache (limit) {
  this.size = 0
  this.limit = limit
  this.head = this.tail = undefined
  this._keymap = Object.create(null)
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
