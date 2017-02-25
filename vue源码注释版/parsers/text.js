import Cache from '../cache'
import config from '../config'
import { parseDirective } from '../parsers/directive'

const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g
let cache, tagRE, htmlRE

/**
 * Escape a string so it can be used in a RegExp
 * constructor.
 *
 * @param {String} str
 */

function escapeRegex (str) {
  return str.replace(regexEscapeRE, '\\$&')
}

export function compileRegex () {
  var open = escapeRegex(config.delimiters[0])
  var close = escapeRegex(config.delimiters[1])
  var unsafeOpen = escapeRegex(config.unsafeDelimiters[0])
  var unsafeClose = escapeRegex(config.unsafeDelimiters[1])
  tagRE = new RegExp(
    unsafeOpen + '((?:.|\\n)+?)' + unsafeClose + '|' +
    open + '((?:.|\\n)+?)' + close,
    'g'
  )
  htmlRE = new RegExp(
    '^' + unsafeOpen + '((?:.|\\n)+?)' + unsafeClose + '$'
  )
  // reset cache
  cache = new Cache(1000)
}

/**
 * Parse a template text string into an array of tokens.
 *
 * @param {String} text
 * @return {Array<Object> | null}
 *               - {String} type
 *               - {String} value
 *               - {Boolean} [html]
 *               - {Boolean} [oneTime]
 */

export function parseText (text) {
  if (!cache) {
    // 执行cache 和 正则的初始化操作,
    // 因为vue允许你修改插值的delimiters也就是'{{'和'}}'
    // 所以需要用delimiters动态计算出用于tag匹配的正则
    compileRegex()
  }
  var hit = cache.get(text)
  if (hit) {
    return hit
  }
  if (!tagRE.test(text)) {
    return null
  }
  var tokens = []
  // lastIndex记录上一次匹配到的插值字符串结束位置+1的位置,即最后一个花括号后一个的位置
  var lastIndex = tagRE.lastIndex = 0
  var match, index, html, value, first, oneTime
  /* eslint-disable no-cond-assign */
  // 反复执行匹配操作,直至所有的插值都匹配完
  while (match = tagRE.exec(text)) {

  /* eslint-enable no-cond-assign */
    // 当前匹配的起始位置
    index = match.index
    // push text token
    if (index > lastIndex) {
      // 如果index比lastIndex要大,说明当前匹配的起始位置和上次的结束位置中间存在空隙,
      // 比如'{{a}} to {{b}}',这个空隙就是中间的纯字符串部分' to '
      tokens.push({
        value: text.slice(lastIndex, index)
      })
    }
    // tag token
    html = htmlRE.test(match[0])
    // 如果用于匹配{{{xxx}}}的htmlRE匹配上了,则应该从第一个捕获结果中取出value,反之则为match[2]
    value = html ? match[1] : match[2]
    first = value.charCodeAt(0)
    // 有value的第一个字符是否为* 判断是否是单次插值
    oneTime = first === 42 // *
    value = oneTime
      ? value.slice(1)
      : value
    tokens.push({
      tag: true, // 是插值还是普通字符串
      value: value.trim(), // 存放普通字符串或者插值表达式
      html: html, // 是否是html插值
      oneTime: oneTime // 是否是单次插值
    })
    // lastIndex记录为本次匹配结束位置的后一位.
    // 注意index + match[0].length到达的是后一位
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    // 如果上次匹配结束位置的后一位之后还存在空间,则应该是还有纯字符串
    tokens.push({
      value: text.slice(lastIndex)
    })
  }
  cache.put(text, tokens)
  return tokens
}

/**
 * Format a list of tokens into an expression.
 * e.g. tokens parsed from 'a {{b}} c' can be serialized
 * into one single expression as '"a " + b + " c"'.
 *
 * @param {Array} tokens
 * @param {Vue} [vm]
 * @return {String}
 */
// 这个函数不仅仅是把插值转换为表达式,他其实隐式的使用formatToken完成了单次插值的求值(vm.$eval)
// 比如这样一段插值模板: 'a {{* b}} c',假设 b= "text",那么会变成'"a " + "text" + " c"'
export function tokensToExp (tokens, vm) {
  if (tokens.length > 1) {
    return tokens.map(function (token) {
      return formatToken(token, vm)
    }).join('+')
  } else {
    return formatToken(tokens[0], vm, true)
  }
}

/**
 * Format a single token.
 *
 * @param {Object} token
 * @param {Vue} [vm]
 * @param {Boolean} [single]
 * @return {String}
 */

function formatToken (token, vm, single) {
  return token.tag
    ? token.oneTime && vm
      ? '"' + vm.$eval(token.value) + '"'
      : inlineFilters(token.value, single)
    : '"' + token.value + '"'
}

/**
 * For an attribute with multiple interpolation tags,
 * e.g. attr="some-{{thing | filter}}", in order to combine
 * the whole thing into a single watchable expression, we
 * have to inline those filters. This function does exactly
 * that. This is a bit hacky but it avoids heavy changes
 * to directive parser and watcher mechanism.
 *
 * @param {String} exp
 * @param {Boolean} single
 * @return {String}
 */

var filterRE = /[^|]\|[^|]/
function inlineFilters (exp, single) {
  if (!filterRE.test(exp)) {
    return single
      ? exp
      : '(' + exp + ')'
  } else {
    var dir = parseDirective(exp)
    if (!dir.filters) {
      return '(' + exp + ')'
    } else {
      return 'this._applyFilters(' +
        dir.expression + // value
        ',null,' +       // oldValue (null for read)
        JSON.stringify(dir.filters) + // filter descriptors
        ',false)'        // write?
    }
  }
}
