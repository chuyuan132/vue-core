let activeEffect = null
const bucket = new WeakMap()
const effectStack = []
const TRANCK_KEY = Symbol() // for in ownKeys
const triggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE',
}

// 存到原始对象与代理对象的映射
const proxyMap = new WeakMap()

// 重写数组方法
const arrayInstrumentations = {}
;[('includes', 'indexOf', 'lastIndexOf')].forEach((fn) => {
  arrayInstrumentations[fn] = function (...args) {
    const originMethod = Array.prototype[fn]
    const result = originMethod.apply(this, args)
    if (!result || result === -1) {
      return originMethod.apply(this.raw, args)
    }
    return result
  }
})

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
 * array
 *  1、set考虑两种情况：
 *      set大于length的索引，会自动更新length， 因此有访问length的副作用函数要重新执行
 *      手动set length属性的时候，大于等于length的索引会被删除，因此需要有条件的触发索引依赖函数
 *  2、for in循环，可以设置成length的依赖，因为很多时候修改数组的本质都是更新length
 *  3、delete 元素，意味着是delete操作，进入trigger会触发当前索引的依赖函数以及length依赖
 *  4、for of 会读取元素的索引和length，不需要改动代码，第一点已经实现了
 *
 */

/**
 *
 * @param {*} obj
 * @param {*} isShallow 是否浅代理
 * @returns
 */
function createReactive(
  obj,
  options = { isShallow: false, isReadonly: false },
) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target
      }

      if (arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }

      // 非只读才收集依赖, 数组的for of 会读取到symbol，会导致某些判断报错，需要避免
      if (!options.isReadonly && typeof key !== 'symbol') {
        track(target, key)
      }

      const result = Reflect.get(target, key, receiver)
      if (!options.isShallow && result !== null && typeof result === 'object') {
        return reactive(result, options)
      }
      return result
    },
    set(target, key, value, receiver) {
      // 只读给出警告提示
      if (options.isReadonly) {
        console.warn(`${key} is readonly`)
        return
      }
      // 避免原型链重复触发
      if (receiver.raw !== target) return
      const oldValue = target[key]

      // 如果是对象，判断如果是新增或者删除，for in循环需要重新执行
      // 如果是数组, key === 索引的时候会判断是不是add，如果key === ‘length’的时候直接无脑set，在trigger里再判断需不需要触发索引依赖函数
      const type = Array.isArray(target)
        ? key >= target.length
          ? triggerType.ADD
          : triggerType.SET
        : Object.prototype.hasOwnProperty.call(target, key)
          ? triggerType.SET
          : triggerType.ADD
      const result = Reflect.set(target, key, value, receiver)
      // 值不相等才需要执行，同时要处理nan情况 nan !== nan  = true nan === nan = false
      if (value !== oldValue && (value === value || oldValue === oldValue)) {
        trigger(target, key, type, value)
      }
      return result
    },
    has(target, key, receiver) {
      track(target, key)
      return Reflect.has(target, key, receiver)
    },
    deleteProperty(target, key) {
      if (isReadonly.isReadonly) {
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
      track(target, Array.isArray(target) ? 'length' : TRANCK_KEY)
      return Reflect.ownKeys(target)
    },
  })
}

function getReactive(...args) {
  const [target] = args
  const existedProxy = proxyMap.get(target)
  if (existedProxy) return existedProxy
  const proxyObj = createReactive(...args)
  proxyMap.set(target, proxyObj)
  return proxyObj
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

function trigger(target, key, type, newValue) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  const effects = new Set()
  effects.add(deps)
  // 虽然当前触发的是length依赖集合，但是大于length的索引的依赖集合也应该被触发，因为类似于被删除了
  if (Array.isArray(target) && key === 'length') {
    for (const [key, fns] of depsMap.entries()) {
      if (key >= newValue) {
        fns.forEach((fn) => {
          if (fn !== activeEffect) {
            effects.add(fn)
          }
        })
      }
    }
  }
  // 额外执行的
  if ([triggerType.ADD, triggerType.DELETE].includes(type)) {
    if (Object.prototype.toString.call(target) === '[object Object]') {
      effects.add(...(depsMap.get(TRANCK_KEY) || []))
    } else if (Array.isArray(target)) {
      effects.add(...(depsMap.get('length') || []))
    }
  }

  effects &&
    effects.forEach((fn) => {
      if (fn !== activeEffect) {
        if (fn.options?.scheduler) {
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
  return getReactive(obj, {
    isShallow: false,
    isReadonly: false,
  })
}

/**
 * 浅代理
 * @param {*} obj
 * @returns
 */
function shallowReactive(obj) {
  return getReactive(obj, {
    isShallow: true,
    isReadonly: false,
  })
}

/**
 * 深可读
 * @param {*} obj
 * @returns
 */
function readonly(obj) {
  return getReactive(obj, {
    isShallow: false,
    isReadonly: true,
  })
}

/**
 * 浅可读
 * @param {*} obj
 * @returns
 */
function shallowReadonly(obj) {
  return getReactive(obj, {
    isShallow: true,
    isReadonly: true,
  })
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
