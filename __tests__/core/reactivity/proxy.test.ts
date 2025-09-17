import { reactive, registerEffect } from '@/core/reactivity/proxy'

describe('obj reactivity test', () => {
  it('set/get attr operation proxy', () => {
    const proxyObj = reactive({ a: 1 })
    registerEffect(() => {
      console.log(proxyObj.a)
    })
  })
})
