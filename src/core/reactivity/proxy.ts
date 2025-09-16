/**
 * 一、代理逻辑，需要分数据结构维度讨论？
 * 1、对象维度
 *    读取： obj.xxx | in操作符 | for in 循环读取
 *
 * 二、依赖收集与依赖触发的问题点？
 * 1、避免三元表达式，导致残余依赖收集，因此每次执行副作用函数之前，要先清理从所有依赖集合中清理该副作用函数，副作用函数执行时再重新收集依赖
 */

/**
 * sss
 */
interface EffectFnOptions {
  scheduler: () => void | null
  lazy: boolean
}

const bucket = new WeakMap<object, Map<string | symbol, Set<() => void>>>()
let activeEffect: () => void | null = null
const TRACK_KEY = Symbol()

/**
 * 副作用辅助函数
 * @param fn
 * @param options
 */
export function effect(fn: () => void | null, options: EffectFnOptions) {
  if (!fn) return

  function effectFn(fn: () => void) {
    clean(effectFn)
    activeEffect = fn
    fn()
  }

  effectFn.deps = [] as Array<() => void>[]
  effectFn.options = options
  effectFn(fn)
}

/**
 * 清理依赖
 */
function clean(effectFn: any) {
  if (!effectFn.deps || !effectFn.deps.length) return
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    delete deps.delete[effectFn]
  }
  effectFn.deps.length = 0
}

/**
 * 依赖收集
 */
function tack(target: object, key: string | symbol) {
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
}

function trigger(target: object, key: string | symbol) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  if (!deps) return
  deps &&
    deps.forEach((fn) => {
      fn()
    })
}

/**
 * 创建代理
 * @param obj
 */
export function reactive<T extends object>(obj: T) {
  return new Proxy<T>(obj, {
    get(target: object, key: string | symbol, receiver: object) {
      console.log('触发属性读取')
      tack(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target: object, key: string, value: any, receiver: object) {
      console.log('触发属性设置')
      tack(target, key)
      return Reflect.set(target, key, value, receiver)
    },
    has(target: object, key: string) {
      console.log('触发了in操作符')
      tack(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target: object) {
      console.log('触发了for in 循环读取')
      tack(target, TRACK_KEY)
      return Reflect.ownKeys(target)
    },
  })
}
