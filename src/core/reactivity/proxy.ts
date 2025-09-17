/**
 * 1、注册副作用函数，接收fn和行为选项，实现新一层的封装，可以集成自定义方法，类似切面编程
 */
const bucket = new WeakMap<object, Map<string | symbol, Set<() => void>>>()
let activeEffect: (() => void) | null = null

function registerEffect(
  fn: () => void,
  // options: RegisterEffectOptions = defaultRegisterEffectOptions,
) {
  activeEffect = fn
  fn()
}

function track(target: object, key: string | symbol) {
  if (!activeEffect) return
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

function reactive<T extends object>(obj: T) {
  return new Proxy<T>(obj, {
    get(target: T, key: string | symbol, receiver: any) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    },
  })
}

export { reactive, registerEffect }
