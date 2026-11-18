# batcher.resetBatcherState

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\batcher.js` (lines 25-31)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function resetBatcherState () {
  queue.length = 0
  userQueue.length = 0
  has = {}
  circular = {}
  waiting = false
}
```

## Docstring

_No docstring provided._

## Source

```
function resetBatcherState () {
  queue.length = 0
  userQueue.length = 0
  has = {}
  circular = {}
  waiting = false
}
```

## Git History

- Commits: 3
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
