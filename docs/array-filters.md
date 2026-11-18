# Module: array-filters

**File:** `\vue源码注释版\filters\array-filters.js`

## Overview

Module `array-filters` contains 5 analyzed entities.

```
import { getPath } from '../parsers/path'
import vFor from '../directives/public/for'
import {
  toArray,
  toNumber,
  isArray,
  isObject,
  isPlainObject
} from '../util/index'
const convertArray = vFor._postProcess

/**
 * Limit filter for arrays
 *
 * @param {Number} n
 * @param {Number} offset (Decimal expected)
 */

export function limitBy (arr, n, offset) {
  offset = offset ? parseInt(offset, 10) : 0
  n = toNumber(n)
  return typeof n === 'number'
    ? arr.slice(offset, offset + n)
    : arr
}

/**
 * Filter filter for arrays
 *
 * @param {String} search
 * @param {String} [delimiter]
 * @param {String} ...dataKeys
 */

export function filterBy (arr, search, delimiter) {
  arr = convertArray(arr)
  if (search == null) {
    return arr
  }
  if (typeof search === 'function') {
    return arr.filter(search)
  }
  // cast to lowercase string
  search = ('' + search).toLowerCase()
  // allow optional `in` delimiter
  // because why not
  var n = delimiter === 'in' ? 3 : 2
  // extract and flatten keys
  var keys = Array.prototype.concat.apply([], toArray(arguments, n))
  var res = []
  var item, key, val, j
  for (var i = 0, l = arr.length; i < l; i++) {
    item = arr[i]
    val = (item && item.$value) || item
    j = keys.length
    if (j) {
      while (j--) {
        key = keys[j]
        if ((key === '$key' && contains(item.$key, search)) ||
            contains(getPath(val, key), search)) {
          res.push(item)
          break
        }
      }
    } else if (contains(item, search)) {
      res.push(item)
    }
  }
  return res
}

/**
 * Filter filter for arrays
 *
 * @param {String|Array<String>|Function} ...sortKeys
 * @param {Number} [order]
 */

export function orderBy (arr) {
  let comparator = null
  let sortKeys
  arr = convertArray(arr)

  // determine order (last argument)
  let args = toArray(arguments, 1)
  let order = args[args.length - 1]
  if (typeof order === 'number') {
    order = order < 0 ? -1 : 1
    args = args.length > 1 ? args
```

## Key Components

| Entity | Type | Description |
|--------|------|-------------|
| `array-filters.limitBy` | function | No description |
| `array-filters.orderBy` | function | No description |
| `array-filters.contains` | function | No description |
| `array-filters.filterBy` | function | No description |
| `array-filters.baseCompare` | function | No description |

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Note

Connect an NVIDIA Nemotron model (Ollama locally or Nebius Serverless) and re-run
`documentor generate` to upgrade these pages to AI-generated narrative docs with
purpose, usage examples, and gotchas.
