let activeEffect = null
const bucket = new WeakMap()
const effectStack = []
const TRANCK_KEY = Symbol() // for in ownKeys
const triggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE',
}

function effect(fn, options = {}) {
  function effectFn() {
    clean(effectFn)
    effectStack.push(effectFn)
    activeEffect = effectFn
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = []
  effectFn.options = options
  if (options.lazy) {
    return effectFn
  }
  effectFn()
}

function clean(effectFn) {
  if (!effectFn || !effectFn.deps) return
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key)
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value)
      const oldValue = target[key]
      if (value !== target[key] && (value === value || oldValue === oldValue)) {
        trigger(target, key)
      }
      return result
    },
    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      result && trigger(target, key)
      return result
    },
    // ownKeys(target) {
    //   track(target, TRANCK_KEY)
    //   return Reflect.ownKeys(target)
    // },
  })
}

function track(target, key) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    depsMap = new Map()
    bucket.set(target, depsMap)
  }
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  const effects = new Set(deps)
  effects &&
    effects.forEach((fn) => {
      if (fn !== activeEffect) {
        if (fn.options.scheduler) {
          fn.options.scheduler(fn)
        } else {
          fn()
        }
      }
    })
}

export { reactive, effect, track, trigger }
