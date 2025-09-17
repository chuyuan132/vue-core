import { effect } from './proxy'

const defaultOptions = {
  immediate: false,
  deep: false,
}

function traverse(val, seen) {
  if (typeof val !== 'object' || val === null || seen.has(val)) return
  seen.add(val)
  for (let key in val) {
    traverse(val[key], seen)
  }
}

// 暂支持传getter函数或对象，暂不支持数组
export default function watch(val, cb, options = defaultOptions) {
  let oldValue = null
  let newValue = null
  let getter = null
  if (typeof val === 'function') {
    getter = val
  } else if (options.deep) {
    getter = () => traverse(val, new Set())
  } else {
    getter = () => val
  }

  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      newValue = effectFn()
      cb(newValue, oldValue)
      oldValue = newValue
    },
  })

  if (options.immediate) {
    newValue = effectFn()
    cb(newValue, oldValue)
    oldValue = newValue
  } else {
    oldValue = effectFn()
  }
}
