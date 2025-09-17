import { effect, track, trigger } from './proxy'

/**
 * 传入一个getter，拿到一个响应式数据，通过value访问，访问才计算
 * 如果有其他副作用访问计算属性，需要依赖收集
 * 计算属性根据缓存返回，避免重新计算
 *
 */
export default function computed(getter) {
  let value = undefined
  let dirty = true

  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      dirty = true
      trigger(obj, 'value')
    },
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        track(obj, 'value')
      }
      dirty = false
      return value
    },
  }
  return obj
}
