import { reactive } from '@/core/reactivity/proxy'

describe('obj reactivity test', () => {
  it('set/get attr operation proxy', () => {
    const obj = { name: '张三' }
    const proxyObj = reactive(obj)
    proxyObj.name = '2'
  })
  it('in operation proxy', () => {
    const obj = { name: '1' }
    const proxyObj = reactive(obj)
    console.log('name' in proxyObj)
  })
  it('for in operation proxy', () => {
    const obj = { name: '2' }
    const proxyObj = reactive(obj)
    for (const key in proxyObj) {
      console.log(key)
    }
  })
})
