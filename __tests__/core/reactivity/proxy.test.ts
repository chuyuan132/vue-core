import { reactive } from '@/core/reactivity/proxy'

describe('reactivity test', () => {
  it('proxy test', () => {
    const obj = { name: '张三' }
    const proxyObj = reactive(obj)
    proxyObj.name = '2'
  })
})
