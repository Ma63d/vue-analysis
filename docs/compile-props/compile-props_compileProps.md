# compile-props.compileProps

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\compiler\compile-props.js` (lines 39-153)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function compileProps (el, propOptions, vm) {
  var props = []
  var names = Object.keys(propOptions)
  var i = names.length
  var options, name, attr, value, path, parsed, prop
  while (i--) {
    name = names[i]
    options = propOptions[name] || empty

    if (process.env.NODE_ENV !== 'production' && name === '$data') {
      warn('Do not use $data as prop.', vm)
      continue
    }

    // props could contain dashes, which will be
    // interpreted as minus calculations by the parser
    // so we need to camelize the path here
    path = camelize(name)
    if (!identRE.test(path)) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid prop key: "' + name + '". Prop keys ' +
        'must be valid identifiers.',
        vm
      )
      continue
    }

    prop = {
      name: name,
      path: path,
      options: options,
      mode: propBindingModes.ONE_WAY,
      raw: null
    }

    attr = hyphenate(name)
    // first check dynamic version
    if ((value = getBindAttr(el, attr)) === null) {
      if ((value = getBindAttr(el, attr + '.sync')) !== null) {
        prop.mode = propBindingModes.TWO_WAY
      } else if ((value = getBindAttr(el, attr + '.once')) !== null) {
        prop.mode = propBindingModes.ONE_TIME
      }
    }
    if (value !== null) {
      // has dynamic binding!
      prop.raw = value
      parsed = parseDirective(value)
      value = parsed.expression
      prop.filters = parsed.filters
      // check binding type
      if (isLiteral(value) && !parsed.filters) {
        // for expressions containing literal numbers and
        // booleans, there's no need to setup a prop binding,
        // so we can optimize them as a one-time set.
        prop.optimizedLiteral = true
      } else {
        prop.dynamic = true
        // check non-settable path for two-way bindings
        if (process.env.NODE_ENV !== 'production' &&
            prop.mode === propBindingModes.TWO_WAY &&
            !settablePathRE.test(value)) {
          prop.mode = propBindingModes.ONE_WAY
          warn(
            'Cannot bind two-way prop with non-settable ' +
            'parent path: ' + value,
            vm
          )
        }
      }
      prop.parentPath = value

      // warn required two-way
      if (
        process.env.NODE_ENV !== 'production' &&
        options.twoWay &&
        prop.mode !== propBindingModes.TWO_WAY
      ) {
        warn(
          'Prop "' + name + '" expects a two-way binding type.',
          vm
        )
      }
    } else if ((value = getAttr(el, attr)) !== null) {
      // has literal binding!
      prop.raw = value
    } else if (process.env.NODE_ENV !== 'production') {
      // check possible camelCase prop usage
      var lowerCaseName = path.toLowerCase()
      value = /[A-Z\-]/.test(name) && (
        el.getAttribute(lowerCaseName) ||
        el.getAttribute(':' + lowerCaseName) ||
        el.getAttribute('v-bind:' + lowerCaseName) ||
        el.getAttribute(':' + lowerCaseName + '.once') ||
        el.getAttribute('v-bind:' + lowerCaseName + '.once') ||
        el.getAttribute(':' + lowerCaseName + '.sync') ||
        el.getAttribute('v-bind:' + lowerCaseName + '.sync')
      )
      if (value) {
        warn(
          'Possible usage error for prop `' + lowerCaseName + '` - ' +
          'did you mean `' + attr + '`? HTML is case-insensitive, remember to use ' +
          'kebab-case for props in templates.',
          vm
        )
      } else if (options.required) {
        // warn missing required
        warn('Missing required prop: ' + name, vm)
      }
    }
    // push prop
    props.push(prop)
  }
  return makePropsLinkFn(props)
}
```

## Docstring

_No docstring provided._

## Source

```
export function compileProps (el, propOptions, vm) {
  var props = []
  var names = Object.keys(propOptions)
  var i = names.length
  var options, name, attr, value, path, parsed, prop
  while (i--) {
    name = names[i]
    options = propOptions[name] || empty

    if (process.env.NODE_ENV !== 'production' && name === '$data') {
      warn('Do not use $data as prop.', vm)
      continue
    }

    // props could contain dashes, which will be
    // interpreted as minus calculations by the parser
    // so we need to camelize the path here
    path = camelize(name)
    if (!identRE.test(path)) {
      process.env.NODE_ENV !== 'production' && warn(
        'Invalid prop key: "' + name + '". Prop keys ' +
        'must be valid identifiers.',
        vm
      )
      continue
    }

    prop = {
      name: name,
      path: path,
      options: options,
      mode: propBindingModes.ONE_WAY,
      raw: null
    }

    attr = hyphenate(name)
    // first check dynamic version
    if ((value = getBindAttr(el, attr)) === null) {
      if ((value = getBindAttr(el, attr + '.sync')) !== null) {
        prop.mode = propBindingModes.TWO_WAY
      } else if ((value = getBindAttr(el, attr + '.once')) !== null) {
        prop.mode = propBindingModes.ONE_TIME
      }
    }
    if (value !== null) {
      // has dynamic binding!
      prop.raw = value
      parsed = parseDirective(value)
      value = parsed.expression
      prop.filters = parsed.filters
      // check binding type
      if (isLiteral(value) && !parsed.filters) {
        // for expressions containing literal numbers and
        // booleans, there's no need to setup a prop binding,
        // so we can optimize them as a one-time set.
        prop.optimizedLiteral = true
      } else {
        prop.dynamic = true
        // check non-settable path for two-way bindings
        if (process.env.NODE_ENV !== 'production' &&
            prop.mode === propBindingModes.TWO_WAY &&
            !settablePathRE.test(value)) {
          prop.mode = propBindingModes.ONE_WAY
          warn(
            'Cannot bind two-way prop with non-settable ' +
            'parent path: ' + value,
            vm
          )
        }
      }
      prop.parentPath = value

      // warn required two-way
      if (
        process.env.NODE_ENV !== 'production' &&
        options.twoWay &&
        prop.mode !== propBindingModes.TWO_WAY
      ) {
        warn(
          'Prop "' + name + '" expects a two-way binding type.',
          vm
        )
      }
    } else if ((value = getAttr(el, attr)) !== null) {
      // has literal binding!
      prop.raw = value
    } else if (process.env.NODE_ENV !== 'production') {
      // check possible camelCase prop usage
      var lowerCaseName = path.toLowerCase()
      value = /[A-Z\-]/.test(name) && (
        el.getAttribute(lowerCaseName) ||
        el.getAttribute(':' + lowerCaseName) ||
        el.getAttribute('v-bind:' + lowerCaseName) ||
        el.getAttribute(':' + lowerCaseName + '.once') ||
        el.getAttribute('v-bind:' + lowerCaseName + '.once') ||
        el.getAttribute(':' + lowerCaseName + '.sync') ||
        el.getAttribute('v-bind:' + lowerCaseName + '.sync')
      )
      if (value) {
        warn(
... (truncated)
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
