# 快速开始

## 安装

请先按[安装](./installation)页完成引入（npm 同步到 `uni_modules/ux-pinia/` 或插件市场导入）。

## 定义 store

创建 `stores/counter.uts`：

```uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
  count: Ref<number>,                 // state：Ref
  doubleCount: ComputedRef<number>,   // getter：ComputedRef
  increment: () => void,              // action：箭头函数
  reset: () => void                   // $reset 的替代：自定义 reset action
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
  const count: Ref<number> = ref(0)
  const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
  const increment = (): void => { count.value++ }
  const reset = (): void => { count.value = 0 }
  return { count, doubleCount, increment, reset } as CounterStore
})
```

三个约定：

1. **state 用 `Ref`、getter 用 `ComputedRef`、action 用箭头函数**（UTS 函数声明不能作值传递）
2. **返回类型必须显式定义 `type` 并标注**（UTS 对象字面量只能赋给 type 类型）
3. **`ComputedRef` 必须 `import type { ComputedRef } from 'vue'`**（编译器不注入该类型名；`Ref` 可注入，建议统一显式导入）

## 页面使用

```vue
<template>
  <text>{{ count }} / {{ doubleCount }}</text>
  <button @click="increment">+1</button>
</template>

<script setup lang="uts">
  import { storeToRefs } from '@/uni_modules/ux-pinia'
  import { useCounterStore } from '@/stores/counter.uts'

  const store = useCounterStore()                    // 多次调用返回同一实例（跨页面共享）
  const { count, doubleCount } = storeToRefs(store)  // 模板解构自动解包

  const increment = (): void => {
    store.count.value++    // 脚本访问 state：.value（UTS 无 Proxy 不自动解包）
  }
</script>
```

## 挂载（可选）

纯状态管理**无需任何挂载代码**——模块级注册表保证单例。需要插件（`pinia.use`）时在 `main.uts` 顶层显式登记：

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

## 下一步

- [基础用法](./basic-usage)：实例 API、跨 store 依赖、订阅
- [与标准 Pinia 的差异](./pinia-diff)：裁掉项与替代方案
