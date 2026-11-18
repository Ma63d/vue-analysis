# batcher.flushBatcherQueue

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\batcher.js` (lines 37-52)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function flushBatcherQueue () {
  runBatcherQueue(queue)
  runBatcherQueue(userQueue)
  // user watchers triggered more watchers,
  // keep flushing until it depletes
  // userQueue在执行时可能又会往指令queue里加入新任务(用户可能又更改了数据使得dom需要更新)
  if (queue.length) {
    return flushBatcherQueue()
  }
  // dev tool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
  resetBatcherState()
}

/**
 * Run the watchers in a single queue.
 *
 * @param {Array} 
```

## Docstring

_No docstring provided._

## Source

```
function flushBatcherQueue () {
  runBatcherQueue(queue)
  runBatcherQueue(userQueue)
  // user watchers triggered more watchers,
  // keep flushing until it depletes
  // userQueue在执行时可能又会往指令queue里加入新任务(用户可能又更改了数据使得dom需要更新)
  if (queue.length) {
    return flushBatcherQueue()
  }
  // dev tool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
  resetBatcherState()
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
