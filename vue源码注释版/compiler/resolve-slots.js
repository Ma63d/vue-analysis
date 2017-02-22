import { parseTemplate } from '../parsers/template'
import {
  isTemplate,
  toArray,
  getBindAttr,
  warn
} from '../util/index'

/**
 * Scan and determine slot content distribution.
 * We do this during transclusion instead at compile time so that
 * the distribution is decoupled from the compilation order of
 * the slots.
 *
 * @param {Element|DocumentFragment} template
 * @param {Element} content
 * @param {Vue} vm
 */

export function resolveSlots (vm, content) {
  if (!content) {
    return
  }
  var contents = vm._slotContents = Object.create(null)
  var el, name
  for (var i = 0, l = content.children.length; i < l; i++) {
    el = content.children[i]
    /* eslint-disable no-cond-assign */
    if (name = el.getAttribute('slot')) {
      // 将指定的分发slot的dom存放在contents对象的对应的属性上
      (contents[name] || (contents[name] = [])).push(el)
    }
    /* eslint-enable no-cond-assign */
    if (process.env.NODE_ENV !== 'production' && getBindAttr(el, 'slot')) {
      warn('The "slot" attribute must be static.', vm.$parent)
    }
  }
  for (name in contents) {
    // 这一步会抽离出那些指定了分发slot的dom,存放到documentFragment里
    // 所以后面的contents['default']里是不包含这些dom的
    contents[name] = extractFragment(contents[name], content)
  }
  if (content.hasChildNodes()) {
    const nodes = content.childNodes
    if (
      nodes.length === 1 &&
      nodes[0].nodeType === 3 &&
      !nodes[0].data.trim()
    ) {
      // 如果childNodes里就只有一个空文本节点,那么就return
      return
    }
    // 否则把childNodes作为默认slot的内容
    contents['default'] = extractFragment(content.childNodes, content)
  }
}

/**
 * Extract qualified content nodes from a node list.
 *
 * @param {NodeList} nodes
 * @return {DocumentFragment}
 */

// 如果一个nodes里面存在template标签(有v-if或者v-for属性的在此不做考虑),
// 那么这个template里面的内容需要抽取出来,剥离外面的template
function extractFragment (nodes, parent) {
  var frag = document.createDocumentFragment()
  nodes = toArray(nodes)
  for (var i = 0, l = nodes.length; i < l; i++) {
    var node = nodes[i]
    if (
      isTemplate(node) &&
      !node.hasAttribute('v-if') &&
      !node.hasAttribute('v-for')
    ) {
      parent.removeChild(node)
      node = parseTemplate(node, true)
    }
    // 别忘了appendChild是会将node从原来的位置移除的
    frag.appendChild(node)
  }
  return frag
}
