import { warn, setClass, camelize } from '../../util/index'
import { BIND } from '../priorities'
import vStyle from '../internal/style'
import { tokensToExp } from '../../parsers/text'

// xlink
const xlinkNS = 'http://www.w3.org/1999/xlink'
const xlinkRE = /^xlink:/

// check for attributes that prohibit interpolations
const disallowedInterpAttrRE = /^v-|^:|^@|^(?:is|transition|transition-mode|debounce|track-by|stagger|enter-stagger|leave-stagger)$/
// these attributes should also set their corresponding properties
// because they only affect the initial state of the element
const attrWithPropsRE = /^(?:value|checked|selected|muted)$/
// these attributes expect enumrated values of "true" or "false"
// but are not boolean attributes
const enumeratedAttrRE = /^(?:draggable|contenteditable|spellcheck)$/

// these attributes should set a hidden property for
// binding v-model to object values
const modelProps = {
  value: '_value',
  'true-value': '_trueValue',
  'false-value': '_falseValue'
}

export default {

  priority: BIND,

  bind () {
    var attr = this.arg
    var tag = this.el.tagName
    // should be deep watch on object mode
    if (!attr) {
      this.deep = true
    }
    // handle interpolation bindings
    const descriptor = this.descriptor
    const tokens = descriptor.interp
    if (tokens) {
      // handle interpolations with one-time tokens
      if (descriptor.hasOneTime) {
        // 对于单次插值的情况
        // 在tokensToExp内部使用$eval将表达式'a '+val+' c'转换为'"a " + "text" + " c"',以此结果为新表达式
        // $eval过程中未设置Dep.target,因而不会订阅任何依赖,
        // 而后续Watcher.get在计算这个新的纯字符串表达式过程中则必然不会触发任何getter,也不会订阅任何依赖
        // 单次插值由此完成
        this.expression = tokensToExp(tokens, this._scope || this.vm)
      }

      // only allow binding on native attributes
      if (
        disallowedInterpAttrRE.test(attr) ||
        (attr === 'name' && (tag === 'PARTIAL' || tag === 'SLOT'))
      ) {
        process.env.NODE_ENV !== 'production' && warn(
          attr + '="' + descriptor.raw + '": ' +
          'attribute interpolation is not allowed in Vue.js ' +
          'directives and special attributes.',
          this.vm
        )
        this.el.removeAttribute(attr)
        this.invalid = true
      }

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production') {
        var raw = attr + '="' + descriptor.raw + '": '
        // warn src
        if (attr === 'src') {
          warn(
            raw + 'interpolation in "src" attribute will cause ' +
            'a 404 request. Use v-bind:src instead.',
            this.vm
          )
        }

        // warn style
        if (attr === 'style') {
          warn(
            raw + 'interpolation in "style" attribute will cause ' +
            'the attribute to be discarded in Internet Explorer. ' +
            'Use v-bind:style instead.',
            this.vm
          )
        }
      }
    }
  },

  update (value) {
    if (this.invalid) {
      return
    }
    var attr = this.arg
    if (this.arg) {
      // v-bind:hello="you" 解析出来this.arg='hello'
      this.handleSingle(attr, value)
    } else {
      // 处理:class 和 :style, 他们的arg为null 参见compiler/compile.js:compileDirectives
      this.handleObject(value || {})
    }
  },

  // share object handler with v-bind:class
  // 绑定对象只可能发生在:class和:style情况下,所以直接用了vStyle.handleObject
  handleObject: vStyle.handleObject,

  handleSingle (attr, value) {
    const el = this.el
    const interp = this.descriptor.interp
    if (this.modifiers.camel) {
      // 将绑定的attribute名字转回驼峰命名,svg的属性绑定时可能会用到
      attr = camelize(attr)
    }
    // 对于value|checked|selected等attribute,不仅仅要setAttribute把dom上的attribute值修改了
    // 还要在el上修改el['value']/el['checked']等值为对应的值
    if (
      !interp &&
      attrWithPropsRE.test(attr) &&
      attr in el
    ) {
      var attrValue = attr === 'value'
        ? value == null // IE9 will set input.value to "null" for null...
          ? ''
          : value
        : value

      if (el[attr] !== attrValue) {
        el[attr] = attrValue
      }
    }
    // set model props
    // vue支持设置checkbox/radio/option等的true-value,false-value,value等设置,
    // 如<input type="radio" v-model="pick" v-bind:value="a">
    // 如果bind的是此类属性,那么则把value放到元素的对应的指定属性上,供v-model提取
    var modelProp = modelProps[attr]
    if (!interp && modelProp) {
      el[modelProp] = value
      // update v-model if present
      var model = el.__v_model
      if (model) {
        // 如果这个元素绑定了一个model,那么就提示model,这个input组件value有更新
        model.listener()
      }
    }
    // do not set value attribute for textarea
    if (attr === 'value' && el.tagName === 'TEXTAREA') {
      el.removeAttribute(attr)
      return
    }
    // update attribute
    // 如果是只接受true false 的"枚举型"的属性
    if (enumeratedAttrRE.test(attr)) {
      el.setAttribute(attr, value ? 'true' : 'false')
    } else if (value != null && value !== false) {
      if (attr === 'class') {
        // handle edge case #1960:
        // class interpolation should not overwrite Vue transition class
        if (el.__v_trans) {
          value += ' ' + el.__v_trans.id + '-transition'
        }
        setClass(el, value)
      } else if (xlinkRE.test(attr)) {
        el.setAttributeNS(xlinkNS, attr, value === true ? '' : value)
      } else {
        el.setAttribute(attr, value === true ? '' : value)
      }
    } else {
      el.removeAttribute(attr)
    }
  }
}
