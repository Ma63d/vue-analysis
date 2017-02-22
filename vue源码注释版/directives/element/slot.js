import { SLOT } from '../priorities'
import {
  extractContent,
  replace,
  remove
} from '../../util/index'

export default {

  priority: SLOT,
  params: ['name'],

  bind () {
    // this was resolved during component transclusion
    var name = this.params.name || 'default'
    var content = this.vm._slotContents && this.vm._slotContents[name]
    if (!content || !content.hasChildNodes()) {
      // 如果没有内容要分发到slot的位置,那就把slot节点的内容作为要分发的内容拿去compile,实现"回退内容"的功能
      this.fallback()
    } else {
      this.compile(content.cloneNode(true), this.vm._context, this.vm)
    }
  },

  compile (content, context, host) {
    if (content && context) {
      // 对于不存在context的,比如要分发进slot的内容 是 el选项指定的dom里的childNodes,
      // 那么就根本不需要编译,他们直接进后一个if, replace掉slot元素即可
      if (
        this.el.hasChildNodes() &&
        content.childNodes.length === 1 &&
        content.childNodes[0].nodeType === 1 &&
        content.childNodes[0].hasAttribute('v-if')
      ) {
        // 尤大的注释写得非常清楚了:
        // if the inserted slot has v-if
        // inject fallback content as the v-else
        const elseBlock = document.createElement('template')
        elseBlock.setAttribute('v-else', '')
        elseBlock.innerHTML = this.el.innerHTML
        // the else block should be compiled in child scope
        elseBlock._context = this.vm
        content.appendChild(elseBlock)
      }
      const scope = host
        ? host._scope
        : this._scope
      // vm.$compile把compile和link都做了
      this.unlink = context.$compile(
        content, host, scope, this._frag
      )
    }
    if (content) {
      // 用编译和link后的内容替换原先的slot元素
      replace(this.el, content)
    } else {
      remove(this.el)
    }
  },

  fallback () {
    this.compile(extractContent(this.el, true), this.vm)
  },

  unbind () {
    if (this.unlink) {
      this.unlink()
    }
  }
}
