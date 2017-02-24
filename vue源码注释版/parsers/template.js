import Cache from '../cache'
import {
  inBrowser,
  trimNode,
  isTemplate,
  isFragment
} from '../util/index'

const templateCache = new Cache(1000)
const idSelectorCache = new Cache(1000)

const map = {
  efault: [0, '', ''],
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [
    2,
    '<table><tbody></tbody><colgroup>',
    '</colgroup></table>'
  ]
}

map.td =
map.th = [
  3,
  '<table><tbody><tr>',
  '</tr></tbody></table>'
]

map.option =
map.optgroup = [
  1,
  '<select multiple="multiple">',
  '</select>'
]

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>']

map.g =
map.defs =
map.symbol =
map.use =
map.image =
map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [
  1,
  '<svg ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    'xmlns:ev="http://www.w3.org/2001/xml-events"' +
    'version="1.1">',
  '</svg>'
]

/**
 * Check if a node is a supported template node with a
 * DocumentFragment content.
 *
 * @param {Node} node
 * @return {Boolean}
 */

function isRealTemplate (node) {
  return isTemplate(node) && isFragment(node.content)
}

const tagRE = /<([\w:-]+)/
const entityRE = /&#?\w+?;/
const commentRE = /<!--/

/**
 * Convert a string template to a DocumentFragment.
 * Determines correct wrapping by tag types. Wrapping
 * strategy found in jQuery & component/domify.
 *
 * @param {String} templateString
 * @param {Boolean} raw
 * @return {DocumentFragment}
 */

function stringToFragment (templateString, raw) {
  // try a cache hit first
  var cacheKey = raw
    ? templateString
    : templateString.trim()
  var hit = templateCache.get(cacheKey)
  if (hit) {
    return hit
  }

  var frag = document.createDocumentFragment()
  var tagMatch = templateString.match(tagRE)
  var entityMatch = entityRE.test(templateString)
  var commentMatch = commentRE.test(templateString)

  if (!tagMatch && !entityMatch && !commentMatch) {
    // 如果没有tag 或者没有html字符实体(如&nbsp;) 或者 没有注释
    // text only, return a single text node.
    frag.appendChild(
      document.createTextNode(templateString)
    )
  } else {
    // 这里如前面的函数签名所说,使用了jQuery 和 component/domify中所使用的生成元素的策略
    // 我们要将模板变成实际的dom元素,一个简单的方法的是创建一个div document.createElement('div')
    // 然后再设置这个div的innerHtml为我们的模板,
    // (不直接创建一个模板的根元素是因为模板可能是片段实例,也就会生成多个dom元素)
    // (而设置这个div的outerHtml也不行哈,不能设置没有父元素的outerHtml)
    // 但是许多特殊元素只能再固定的父元素下存在,不能直接存在于div下,比如tbody,tr,th,td,legend等等等等
    // 那么怎么办? 所以就有了下面这个先获取第一个标签,然后按照map的里预先设置的内容,给模板设置设置好父元素,
    // 把模板嵌入到合适的父元素下,然后再层层进入父元素获取真正的模板元素.
    var tag = tagMatch && tagMatch[1]
    var wrap = map[tag] || map.efault
    var depth = wrap[0]
    var prefix = wrap[1]
    var suffix = wrap[2]
    var node = document.createElement('div')

    node.innerHTML = prefix + templateString + suffix
    // 这里是不断深入,进入正确的dom,
    // 比如你标签是tr,那么我会为包上table和tbody元素
    // 那么我拿到你的时候应该剥开外层的两个元素,让node指到tr
    while (depth--) {
      node = node.lastChild
    }

    var child
    /* eslint-disable no-cond-assign */
    // 用while循环把所有的子节点都提取了,因为可能是片段实例
    while (child = node.firstChild) {
    /* eslint-enable no-cond-assign */
      frag.appendChild(child)
    }
  }
  if (!raw) {
    trimNode(frag)
  }
  templateCache.put(cacheKey, frag)
  return frag
}

/**
 * Convert a template node to a DocumentFragment.
 *
 * @param {Node} node
 * @return {DocumentFragment}
 */

function nodeToFragment (node) {
  // if its a template tag and the browser supports it,
  // its content is already a document fragment. However, iOS Safari has
  // bug when using directly cloned template content with touch
  // events and can cause crashes when the nodes are removed from DOM, so we
  // have to treat template elements as string templates. (#2805)
  /* istanbul ignore if */
  // 在node是template元素的情况下,尽管他的content已经是一个document fragment,但是因为浏览器bug真心太多
  // 所以还是取出innerHTML出来又stringToFragment一遍
  if (isRealTemplate(node)) {
    return stringToFragment(node.innerHTML)
  }
  // script template
  if (node.tagName === 'SCRIPT') {
    return stringToFragment(node.textContent)
  }
  // normal node, clone it to avoid mutating the original
  // 那个node可能会被很多vm实例用,也可能就是需要摆在页面上的,所以clone之后复制进frag里.
  var clonedNode = cloneNode(node)
  var frag = document.createDocumentFragment()
  var child
  /* eslint-disable no-cond-assign */
  while (child = clonedNode.firstChild) {
  /* eslint-enable no-cond-assign */
    frag.appendChild(child)
  }
  trimNode(frag)
  return frag
}

// Test for the presence of the Safari template cloning bug
// https://bugs.webkit.org/showug.cgi?id=137755
var hasBrokenTemplate = (function () {
  /* istanbul ignore else */
  if (inBrowser) {
    var a = document.createElement('div')
    a.innerHTML = '<template>1</template>'
    return !a.cloneNode(true).firstChild.innerHTML
  } else {
    return false
  }
})()

// Test for IE10/11 textarea placeholder clone bug
var hasTextareaCloneBug = (function () {
  /* istanbul ignore else */
  if (inBrowser) {
    var t = document.createElement('textarea')
    t.placeholder = 't'
    return t.cloneNode(true).value === 't'
  } else {
    return false
  }
})()

/**
 * 1. Deal with Safari cloning nested <template> bug by
 *    manually cloning all template instances.
 * 2. Deal with IE10/11 textarea placeholder bug by setting
 *    the correct value after cloning.
 *
 * @param {Element|DocumentFragment} node
 * @return {Element|DocumentFragment}
 */

export function cloneNode (node) {
  /* istanbul ignore if */
  if (!node.querySelectorAll) {
    return node.cloneNode()
  }
  var res = node.cloneNode(true)
  var i, original, cloned
  /* istanbul ignore if */
  // Safari的某些老版本在克隆元素时,如果里面有template标签,
  // 那么克隆之后生成的新dom会错误的丢失template里的内容.
  if (hasBrokenTemplate) {
    var tempClone = res
    if (isRealTemplate(node)) {
      node = node.content
      tempClone = res.content
    }
    original = node.querySelectorAll('template')
    if (original.length) {
      cloned = tempClone.querySelectorAll('template')
      i = cloned.length
      while (i--) {
        cloned[i].parentNode.replaceChild(
          cloneNode(original[i]),
          cloned[i]
        )
      }
    }
  }
  /* istanbul ignore if */
  // ie的textarea的bug,复制后会把placeholder的内容错误的放在value里
  if (hasTextareaCloneBug) {
    if (node.tagName === 'TEXTAREA') {
      res.value = node.value
    } else {
      original = node.querySelectorAll('textarea')
      if (original.length) {
        cloned = res.querySelectorAll('textarea')
        i = cloned.length
        while (i--) {
          cloned[i].value = original[i].value
        }
      }
    }
  }
  return res
}

/**
 * Process the template option and normalizes it into a
 * a DocumentFragment that can be used as a partial or a
 * instance template.
 *
 * @param {*} template
 *        Possible values include:
 *        - DocumentFragment object
 *        - Node object of type Template
 *        - id selector: '#some-template-id'
 *        - template string: '<div><span>{{msg}}</span></div>'
 * @param {Boolean} shouldClone
 * @param {Boolean} raw
 *        inline HTML interpolation. Do not check for id
 *        selector and keep whitespace in the string.
 * @return {DocumentFragment|undefined}
 */

export function parseTemplate (template, shouldClone, raw) {
  var node, frag

  // if the template is already a document fragment,
  // do nothing
  if (isFragment(template)) {
    trimNode(template)
    return shouldClone
      ? cloneNode(template)
      : template
  }

  if (typeof template === 'string') {
    // id selector
    if (!raw && template.charAt(0) === '#') {
      // id selector can be cached too
      frag = idSelectorCache.get(template)
      if (!frag) {
        node = document.getElementById(template.slice(1))
        if (node) {
          frag = nodeToFragment(node)
          // save selector to cache
          idSelectorCache.put(template, frag)
        }
      }
    } else {
      // normal string template
      frag = stringToFragment(template, raw)
    }
  } else if (template.nodeType) {
    // a direct node
    // template是一个template元素也会进入此处
    frag = nodeToFragment(template)
  }

  return frag && shouldClone
    ? cloneNode(frag)
    : frag
}
