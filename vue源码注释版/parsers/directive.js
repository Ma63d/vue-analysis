import { toNumber, stripQuotes } from '../util/index'
import Cache from '../cache'

const cache = new Cache(1000)
const filterTokenRE = /[^\s'"]+|'[^']*'|"[^"]*"/g
const reservedArgRE = /^in$|^-?\d+/

/**
 * Parser state
 */

var str, dir
var c, prev, i, l, lastFilterIndex
var inSingle, inDouble, curly, square, paren

/**
 * Push a filter to the current directive object
 */

function pushFilter () {
  var exp = str.slice(lastFilterIndex, i).trim()
  var filter
  if (exp) {
    filter = {}
    var tokens = exp.match(filterTokenRE)
    filter.name = tokens[0]
    if (tokens.length > 1) {
      filter.args = tokens.slice(1).map(processFilterArg)
    }
  }
  if (filter) {
    (dir.filters = dir.filters || []).push(filter)
  }
  lastFilterIndex = i + 1
}

/**
 * Check if an argument is dynamic and strip quotes.
 *
 * @param {String} arg
 * @return {Object}
 */

function processFilterArg (arg) {
  if (reservedArgRE.test(arg)) {
    return {
      value: toNumber(arg),
      dynamic: false
    }
  } else {
    var stripped = stripQuotes(arg)
    var dynamic = stripped === arg
    return {
      value: dynamic ? arg : stripped,
      dynamic: dynamic
    }
  }
}

/**
 * Parse a directive value and extract the expression
 * and its filters into a descriptor.
 *
 * Example:
 *
 * "a + 1 | uppercase" will yield:
 * {
 *   expression: 'a + 1',
 *   filters: [
 *     { name: 'uppercase', args: null }
 *   ]
 * }
 *
 * @param {String} s
 * @return {Object}
 */
// 用来提取出指令的表达式当中的filters部分,并解析出表达式的name和参数部分,参见上面注释中的实例
export function parseDirective (s) {
  var hit = cache.get(s)
  if (hit) {
    return hit
  }

  // reset parser state
  str = s
  inSingle = inDouble = false
  curly = square = paren = 0
  lastFilterIndex = 0
  dir = {}
  //接下来解析每一个指令中的每一个字符
  for (i = 0, l = str.length; i < l; i++) {
    prev = c
    c = str.charCodeAt(i)
    if (inSingle) {
      // check single quote
      // 如果处于单引号之后,那么只用判断当前是否单引号,其他情况都不用管,不会产生新filter
      // 0x5C 为转义字符
      if (c === 0x27 && prev !== 0x5C) inSingle = !inSingle
    } else if (inDouble) {
      // check double quote
      // 如果处于双引号之后,那么只用判断当前是否单引号,其他情况都不用管,不会产生新filter
      if (c === 0x22 && prev !== 0x5C) inDouble = !inDouble
    } else if (
      // 遇到'|'了 filter开始
      c === 0x7C && // pipe
      str.charCodeAt(i + 1) !== 0x7C &&
      str.charCodeAt(i - 1) !== 0x7C
    ) {
      if (dir.expression == null) {
        // first filter, end of expression
        // '|' 之后的字符都属于filter 之前的则是expression部分
        lastFilterIndex = i + 1
        dir.expression = str.slice(0, i).trim()
      } else {
        // already has filter
        // 又遇到了filter,先记录之前的的filter
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break // "
        case 0x27: inSingle = true; break // '
        case 0x28: paren++; break         // (
        case 0x29: paren--; break         // )
        case 0x5B: square++; break        // [
        case 0x5D: square--; break        // ]
        case 0x7B: curly++; break         // {
        case 0x7D: curly--; break         // }
      }
    }
  }

  if (dir.expression == null) {
    dir.expression = str.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    // 记录最后一个filter
    pushFilter()
  }

  cache.put(s, dir)
  return dir
}
