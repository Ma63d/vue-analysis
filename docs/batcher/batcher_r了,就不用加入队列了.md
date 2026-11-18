# batcher.r了,就不用加入队列了

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\batcher.js` (lines 95-116)
- **Role:** internal
- **Stability:** unknown

## Signature

```
有这个watcher了,就不用加入队列了,这样不管一个数据更新多少次,Vue都只更新一次dom
  if (has[id] == null) {
    // push watcher into appropriate queue
    // 选择合适的队列,对于用户使用$watch方法或者watch选项观察数据的watcher,则要放到userQueue中
    // 因为他们的回调在执行过程中可能又触发了其他watcher的更新,所以要分两个队列存放
    const q = watcher.user
      ? userQueue
      : queue
    // has[id]记录这个watcher在队列中的下标
    // 主要是判断是否出现了循环更新:你更新我后我更新你,没完没了了
    has[id] = q.length
    q.push(watcher)
    // queue the flush
    if (!waiting) {
      //waiting这个flag用于标记是否已经把flushBatcherQueue加入到nextTick任务队列当中了
      waiting = true
      nextTick(flushBatcherQueue)
    }
  }
}

```

## Docstring

_No docstring provided._

## Source

```
export function pushWatcher (watcher) {
  const id = watcher.id
  // 如果已经有这个watcher了,就不用加入队列了,这样不管一个数据更新多少次,Vue都只更新一次dom
  if (has[id] == null) {
    // push watcher into appropriate queue
    // 选择合适的队列,对于用户使用$watch方法或者watch选项观察数据的watcher,则要放到userQueue中
    // 因为他们的回调在执行过程中可能又触发了其他watcher的更新,所以要分两个队列存放
    const q = watcher.user
      ? userQueue
      : queue
    // has[id]记录这个watcher在队列中的下标
    // 主要是判断是否出现了循环更新:你更新我后我更新你,没完没了了
    has[id] = q.length
    q.push(watcher)
    // queue the flush
    if (!waiting) {
      //waiting这个flag用于标记是否已经把flushBatcherQueue加入到nextTick任务队列当中了
      waiting = true
      nextTick(flushBatcherQueue)
    }
  }
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
