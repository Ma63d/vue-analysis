import config from './config'
import {
  warn,
  nextTick,
  devtools
} from './util/index'

// we have two separate queues: one for directive updates
// and one for user watcher registered via $watch().
// we want to guarantee directive updates to be called
// before user watchers so that when user watchers are
// triggered, the DOM would have already been in updated
// state.

var queue = []
var userQueue = []
var has = {}
var circular = {}
var waiting = false

/**
 * Reset the batcher's state.
 */

function resetBatcherState () {
  queue.length = 0
  userQueue.length = 0
  has = {}
  circular = {}
  waiting = false
}

/**
 * Flush both queues and run the watchers.
 */

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
 * @param {Array} queue
 */

function runBatcherQueue (queue) {
  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (let i = 0; i < queue.length; i++) {
    var watcher = queue[i]
    var id = watcher.id
    has[id] = null
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > config._maxUpdateCount) {
        warn(
          'You may have an infinite update loop for watcher ' +
          'with expression "' + watcher.expression + '"',
          watcher.vm
        )
        break
      }
    }
  }
  queue.length = 0
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 *
 * @param {Watcher} watcher
 *   properties:
 *   - {Number} id
 *   - {Function} run
 */

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
