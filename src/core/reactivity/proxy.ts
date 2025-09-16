/**
 * 代理普通对象：
 * 当obj是object时：需要处理对象的多个读取场景：例如in操作符，for in循环读取，.属性读取
 * @param obj
 */
export function reactive<T extends object>(obj: T) {
  return new Proxy<T>(obj, {
    get(target: object, key: string | symbol, receiver: any) {
      console.log('触发属性读取')
      return Reflect.get(target, key, receiver)
    },
    set(target: object, key: string | symbol, value: any, receiver: any) {
      console.log('触发属性设置')
      return Reflect.set(target, key, value, receiver)
    },
  })
}
