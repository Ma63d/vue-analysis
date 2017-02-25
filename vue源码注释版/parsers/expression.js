import { warn } from '../util/index'
import { parsePath, setPath } from './path'
import Cache from '../cache'

const expressionCache = new Cache(1000)

const allowedKeywords =
  'Math,Date,this,true,false,null,undefined,Infinity,NaN,' +
  'isNaN,isFinite,decodeURI,decodeURIComponent,encodeURI,' +
  'encodeURIComponent,parseInt,parseFloat'
const allowedKeywordsRE =
  new RegExp('^(' + allowedKeywords.replace(/,/g, '\\b|') + '\\b)')

// keywords that don't make sense inside expressions
const improperKeywords =
  'break,case,class,catch,const,continue,debugger,default,' +
  'delete,do,else,export,extends,finally,for,function,if,' +
  'import,in,instanceof,let,return,super,switch,throw,try,' +
  'var,while,with,yield,enum,await,implements,package,' +
  'protected,static,interface,private,public'
const improperKeywordsRE =
  new RegExp('^(' + improperKeywords.replace(/,/g, '\\b|') + '\\b)')

const wsRE = /\s/g
const newlineRE = /\n/g
const saveRE = /[\{,]\s*[\w\$_]+\s*:|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`)|new |typeof |void /g
const restoreRE = /"(\d+)"/g
const pathTestRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['.*?'\]|\[".*?"\]|\[\d+\]|\[[A-Za-z_$][\w$]*\])*$/
// identRE匹配第一个字符不是标识符而后面紧跟着标识符的情况 比如'vue+jQuery'中的'+jQuery',捕获'jQuery'
const identRE = /[^\w$\.](?:[A-Za-z_$][\w$]*)/g
const literalValueRE = /^(?:true|false|null|undefined|Infinity|NaN)$/

function noop () {}

/**
 * Save / Rewrite / Restore
 *
 * When rewriting paths found in an expression, it is
 * possible for the same letter sequences to be found in
 * strings and Object literal property keys. Therefore we
 * remove and store these parts in a temporary array, and
 * restore them after the path rewrite.
 */

var saved = []

/**
 * Save replacer
 *
 * The save regex can match two possible cases:
 * 1. An opening object literal
 * 2. A string
 * If matched as a plain string, we need to escape its
 * newlines, since the string needs to be preserved when
 * generating the function body.
 *
 * @param {String} str
 * @param {String} isString - str if matched as a string
 * @return {String} - placeholder with index
 */

function save (str, isString) {
  var i = saved.length
  saved[i] = isString
    ? str.replace(newlineRE, '\\n')
    : str
  return '"' + i + '"'
}

/**
 * Path rewrite replacer
 *
 * @param {String} raw
 * @return {String}
 */

function rewrite (raw) {
  // 保留第一个字符是因为identRE的匹配到的第一个字符是非变量字符,这个字符为前一个运算符当中的部分或者是空格
  // 比如' result=a+b' 那么raw就会匹配上' result' 和' =a' 和' +b',所以要保留第一个=和+,
  // 然后将结果加上'scope.' 变成'scope.result=scope.a+scope.b'
  var c = raw.charAt(0)
  var path = raw.slice(1)
  if (allowedKeywordsRE.test(path)) {
    return raw
  } else {
    // 如果是字符串 那就不加
    // 不过按理说只有raw.charAt(0)可能会是引号,path里不会匹配到引号啊
    path = path.indexOf('"') > -1
      ? path.replace(restoreRE, restore)
      : path
    return c + 'scope.' + path
  }
}

/**
 * Restore replacer
 *
 * @param {String} str
 * @param {String} i - matched save index
 * @return {String}
 */

function restore (str, i) {
  return saved[i]
}

/**
 * Rewrite an expression, prefixing all path accessors with
 * `scope.` and generate getter/setter functions.
 *
 * @param {String} exp
 * @return {Function}
 */

function compileGetter (exp) {
  if (improperKeywordsRE.test(exp)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid using reserved keywords in expression: ' + exp
    )
  }
  // reset state
  saved.length = 0
  // save strings and object literal keys
  // fixme! 没有看明白这个saveRE和save函数具体是对字符串做了什么处理
  var body = exp
    .replace(saveRE, save)
    .replace(wsRE, '')
  // rewrite all paths
  // pad 1 space here because the regex matches 1 extra char
  // identRE会匹配到那些运算符或空白符后的变量,将变量rewrite为scope.xxx的形式,
  // 而body前之所以要加一个就是要开头位置如果也是变量的话成功匹配上
  // 比如 'a+b*2'不加空格则只会得到'a+scope.b*2'
  // fixme! 没有看明白restoreRE和restore函数具体是对字符串做了什么处理
  body = (' ' + body)
    .replace(identRE, rewrite)
    .replace(restoreRE, restore)
  return makeGetterFn(body)
}

/**
 * Build a getter function. Requires eval.
 *
 * We isolate the try/catch so it doesn't affect the
 * optimization of the parse function when it is not called.
 *
 * @param {String} body
 * @return {Function|undefined}
 */

function makeGetterFn (body) {
  try {
    /* eslint-disable no-new-func */
    return new Function('scope', 'return ' + body + ';')
    /* eslint-enable no-new-func */
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if (e.toString().match(/unsafe-eval|CSP/)) {
        warn(
          'It seems you are using the default build of Vue.js in an environment ' +
          'with Content Security Policy that prohibits unsafe-eval. ' +
          'Use the CSP-compliant build instead: ' +
          'http://vuejs.org/guide/installation.html#CSP-compliant-build'
        )
      } else {
        warn(
          'Invalid expression. ' +
          'Generated function body: ' + body
        )
      }
    }
    return noop
  }
}

/**
 * Compile a setter function for the expression.
 *
 * @param {String} exp
 * @return {Function|undefined}
 */

function compileSetter (exp) {
  var path = parsePath(exp)
  if (path) {
    return function (scope, val) {
      setPath(scope, path, val)
    }
  } else {
    process.env.NODE_ENV !== 'production' && warn(
      'Invalid setter expression: ' + exp
    )
  }
}

/**
 * Parse an expression into re-written getter/setters.
 *
 * @param {String} exp
 * @param {Boolean} needSet
 * @return {Function}
 */

export function parseExpression (exp, needSet) {
  exp = exp.trim()
  // try cache
  var hit = expressionCache.get(exp)
  if (hit) {
    if (needSet && !hit.set) {
      hit.set = compileSetter(hit.exp)
    }
    return hit
  }
  var res = { exp: exp }
  res.get = isSimplePath(exp) && exp.indexOf('[') < 0
    // optimized super simple getter
    ? makeGetterFn('scope.' + exp)
    // dynamic getter
    // 如果不是简单Path, 也就是语句了,那么就要对这个字符串做一些额外的处理了,
    // 主要是在变量前加上'scope.'
    : compileGetter(exp)
  if (needSet) {
    res.set = compileSetter(exp)
  }
  expressionCache.put(exp, res)
  return res
}

/**
 * Check if an expression is a simple path.
 *
 * @param {String} exp
 * @return {Boolean}
 */

export function isSimplePath (exp) {
  // 检查是否是 a['b'] 或者 a.b.c 这样的
  // 或者是true false null 这种字面量
  // 再或者就是Math.max这样,
  // 对于a=true和a/=2和hello()这种就不是simple path
  return pathTestRE.test(exp) &&
    // don't treat literal values as paths
    !literalValueRE.test(exp) &&
    // Math constants e.g. Math.PI, Math.E etc.
    exp.slice(0, 5) !== 'Math.'
}
