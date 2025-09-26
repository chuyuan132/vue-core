import computed from '../src/core/reactivity/computed'
import { effect, reactive, shallowReactive } from '../src/core/reactivity/proxy'
import watch from '../src/core/reactivity/watch'

// -----------------------------------三元表达式测试------------------------------------
// const obj = {
//   count: 1,
//   check: true,
// }

// const proxy = reactive(obj)

// effect(() => {
//   console.log(proxy.check ? proxy.count : 'no')
// })

// setTimeout(() => {
//   proxy.check = false
// }, 1000)

//-----------------------------------嵌套effect测试-------------------------------------
// const obj = {
//   count: 1,
//   name: '张三',
// }

// const proxy = reactive(obj)

// effect(() => {
//   effect(() => {
//     proxy.count
//   })
//   console.log(proxy.name)
// })

// --------------------------------------fn内部同时读写测试------------------------------------
// const obj = {
//   count: 1,
//   name: '张三',
// }

// const proxy = reactive(obj)

// effect(() => {
//   proxy.count++
// })
// --------------------------------------手写computed测试-----------------------------------------
// const obj = {
//   count: 1,
//   name: '张三',
// }

// const proxy = reactive(obj)

// const a = computed(() => {
//   return proxy.count
// })
// effect(() => {
//   console.log('effect读取', a.value)
// })

// proxy.count++
// ------------------------------------------手写watch测试----------------------------------------------
// const obj = {
//   count: 1,
// }

// const proxy = reactive(obj)
// watch(
//   () => proxy.count,
//   (newValue, oldValue) => {
//     console.log('watch', newValue, oldValue)
//   },
//   {
//     immediate: true,
//   },
// )

// proxy.count++
// ------------------------------------------------对象代理   in操作符读取---------------------------------------------
// const obj = {
//   count: 1,
//   name: '张三',
// }

// const proxy = reactive(obj)
// effect(() => {
//   console.log('count' in proxy)
// })

// delete proxy.count

// ------------------------------------------------对象代理 for  in操作符读取---------------------------------------------
// const obj = {
//   count: 1,
//   name: '张三',
// }

// const proxy = reactive(obj)
// effect(() => {
//   for (const key in proxy) {
//     console.log(key)
//   }
// })

// delete proxy.count
// ------------------------------------------------对象代理 原型链代理---------------------------------------------
// const obj = {
//   count: 1,
// }

// const parent = {
//   name: '张三',
// }

// const parentProxy = reactive(parent)
// const objProxy = reactive(obj)
// Object.setPrototypeOf(objProxy, parentProxy)

// effect(() => {
//   console.log(objProxy.name)
// })

// objProxy.name = '22'

// ---------------------------------------------------深代理------------------------------------------------
// const obj = {
//   count: 1,
//   name: {
//     age: 2,
//   },
// }

// const proxy = reactive(obj)

// effect(() => {
//   console.log(proxy.name.age)
// })

// proxy.name.age = 3
// --------------------------------------------------浅代理-------------------------------------------------
// const obj = {
//   count: 1,
//   name: {
//     age: 2,
//   },
// }

// const proxy = shallowReactive(obj)

// effect(() => {
//   console.log(proxy.name.age)
// })

// proxy.name.age = 3

// --------------------------------数组代理

obj = { count: 1 }
const arr = [obj]
const proxy = reactive(arr)

// effect(() => {
//   for (const item of proxy) {
//     console.log(item)
//   }
// })

// proxy[0] = 2
// proxy.length = 5

console.log(proxy.includes(proxy[0]))
