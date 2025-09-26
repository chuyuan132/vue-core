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

/**
 * obj
 *  1、get set
 *  2、delete
 *  3、in操作符
 *  4、for in 循环读取
 *  5、对象本体和原型链对象都是响应式变量，set的时候，不需要触发两次，虽然在trigger里也有用set兜底
 *  6、实现深响应式和浅响应式，深可读和浅可读
 */

/**
 *
 * @param {*} obj
 * @param {*} isShallow 是否浅代理
 * @returns
 */
function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target
      }
      // 非只读才收集依赖
      if (!isReadonly) {
        track(target, key)
      }
      const result = Reflect.get(target, key, receiver)
      if (!isShallow) {
        if (result !== null && typeof result === 'object') {
          return reactive(result, isShallow)
        }
      }
      return result
    },
    set(target, key, value, receiver) {
      // 只读给出警告提示
      if (isReadonly) {
        console.warn(`${key} is readonly`)
        return
      }
      // 避免原型链重复触发
      if (receiver.raw !== target) return
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      if (value !== oldValue && (value === value || oldValue === oldValue)) {
        const type = target[key] ? triggerType.SET : triggerType.ADD
        trigger(target, key, type)
      }
      return result
    },
    has(target, key, receiver) {
      track(target, key)
      return Reflect.has(target, key, receiver)
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`${key} is readonly`)
        return
      }
      const hasKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (result && hasKey) {
        trigger(target, key, triggerType.DELETE)
      }
      return result
    },
    ownKeys(target) {
      track(target, TRANCK_KEY)
      return Reflect.ownKeys(target)
    },
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

function trigger(target, key, type) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  const effects = new Set(deps)
  if ([triggerType.ADD, triggerType.DELETE].includes(type)) {
    effects.add(...(depsMap.get(TRANCK_KEY) || []))
  }
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

/**
 * 创建响应式对象，深响应式且非可读
 * @param {*} obj
 * @returns
 */
function reactive(obj) {
  return createReactive(obj, false, false)
}

/**
 * 浅代理
 * @param {*} obj
 * @returns
 */
function shallowReactive(obj) {
  return createReactive(obj, true)
}

/**
 * 深可读
 * @param {*} obj
 * @returns
 */
function readonly(obj) {
  return createReactive(obj, false, true)
}

/**
 * 浅可读
 * @param {*} obj
 * @returns
 */
function shallowReadonly(obj) {
  return createReactive(obj, true)
}

export {
  reactive,
  effect,
  track,
  trigger,
  shallowReactive,
  readonly,
  shallowReadonly,
}
