# global-api.createClass

- **Type:** function
- **Language:** javascript
- **File:** `\vue源码注释版\global-api.js` (lines 143-150)
- **Role:** internal
- **Stability:** unknown

## Signature

```
function createClass (name) {
    /* eslint-disable no-new-func */
    return new Function(
      'return function ' + classify(name) +
      ' (options) { this._init(options) }'
    )()
    /* eslint-enable no-new-func */
  }
```

## Docstring

_No docstring provided._

## Source

```
  function createClass (name) {
    /* eslint-disable no-new-func */
    return new Function(
      'return function ' + classify(name) +
      ' (options) { this._init(options) }'
    )()
    /* eslint-enable no-new-func */
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
