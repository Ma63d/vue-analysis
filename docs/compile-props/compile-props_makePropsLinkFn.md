# compile-props.makePropsLinkFn

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 162-220)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function makePropsLinkFn (props) {
  return function propsLinkFn (vm, scope) {
    // store resolved props info
    vm._props = {}
    var inlineProps = vm.$options.propsData
    var i = props.length
    var prop, path, options, value, raw
    while (i--) {
      prop = props[i]
      raw = prop.raw
      path = prop.path
      options = prop.options
      vm._props[path] = prop
      if (inlineProps && hasOwn(inlineProps, path)) {
        initProp(vm, prop, inlineProps[path])
      } if (raw === null) {
        // initialize absent prop
        initProp(vm, prop, undefined)
      } else if (prop.dynamic) {
        // dynamic prop
        if (prop.mode === propBindingModes.ONE_TIME) {
          // one time binding
          value = (scope || vm._context || vm).$get(prop.parentPath)
          initProp(vm, prop, value)
        } else {
          if (vm._context) {
            // dynamic binding
            vm._bindDir({
              name: 'prop',
              def: propDef,
              prop: prop
            }, null, null, scope) // el, host, scope
          } else {
            // root instance
            initProp(vm, prop, vm.$get(prop.parentPath))
          }
        }
      } else if (prop.optimizedLiteral) {
        // optimized literal, cast it and just set once
        var stripped = stripQuotes(raw)
        value = stripped === raw
          ? toBoolean(toNumber(raw))
          : stripped
        initProp(vm, prop, value)
      } else {
        // string literal, but we need to cater for
        // Boolean props with no value, or with same
        // literal value (e.g. disabled="disabled")
        // see https://github.com/vuejs/vue-loader/issues/182
        value = (
          options.type === Boolean &&
          (raw === '' || raw === hyphenate(prop.name))
        ) ? true
          : raw
        initProp(vm, prop, value)
      }
    }
  }
}
```

## Docstring

_No docstring provided._

## Source

```
function makePropsLinkFn (props) {
  return function propsLinkFn (vm, scope) {
    // store resolved props info
    vm._props = {}
    var inlineProps = vm.$options.propsData
    var i = props.length
    var prop, path, options, value, raw
    while (i--) {
      prop = props[i]
      raw = prop.raw
      path = prop.path
      options = prop.options
      vm._props[path] = prop
      if (inlineProps && hasOwn(inlineProps, path)) {
        initProp(vm, prop, inlineProps[path])
      } if (raw === null) {
        // initialize absent prop
        initProp(vm, prop, undefined)
      } else if (prop.dynamic) {
        // dynamic prop
        if (prop.mode === propBindingModes.ONE_TIME) {
          // one time binding
          value = (scope || vm._context || vm).$get(prop.parentPath)
          initProp(vm, prop, value)
        } else {
          if (vm._context) {
            // dynamic binding
            vm._bindDir({
              name: 'prop',
              def: propDef,
              prop: prop
            }, null, null, scope) // el, host, scope
          } else {
            // root instance
            initProp(vm, prop, vm.$get(prop.parentPath))
          }
        }
      } else if (prop.optimizedLiteral) {
        // optimized literal, cast it and just set once
        var stripped = stripQuotes(raw)
        value = stripped === raw
          ? toBoolean(toNumber(raw))
          : stripped
        initProp(vm, prop, value)
      } else {
        // string literal, but we need to cater for
        // Boolean props with no value, or with same
        // literal value (e.g. disabled="disabled")
        // see https://github.com/vuejs/vue-loader/issues/182
        value = (
          options.type === Boolean &&
          (raw === '' || raw === hyphenate(prop.name))
        ) ? true
          : raw
        initProp(vm, prop, value)
      }
    }
  }
}
```

## Git History

- Commits: 1
- Authors: 1
- Bug fixes: 0
- Features: 0

## Callers

None

## Callees

None
