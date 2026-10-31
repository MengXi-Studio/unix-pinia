# 快速开始

## 安装

请先按[安装](./installation)页完成引入（npm 同步到 `uni_modules/ux-pinia/` 或插件市场导入）。

## 定义 store

创建 `stores/counter.uts`：

```uts
import { reactive } from 'vue'
import { defineStore, PiniaStoreBase } from '@/uni_modules/ux-pinia'

export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  // state：reactive<T> 强类型包裹（字段为原始值，模板 / 脚本直接访问）
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  // 派生值：class getter（模板经 reactive 属性依赖收集自动更新）
  get doubleCount(): number {
    return this.state.count * 2
  }

  // constructor：super() 后必须 bindState(this.state)（$-API 与持久化的前提）
  constructor() {
    super()
    this.bindState(this.state)
  }

  // actions = 普通 class method，直接修改 state
  increment(): void {
    this.state.count++
  }
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => new CounterStore())
```

三个约定：

1. **state 用 `reactive<T>` 强类型包裹**、派生值用 class getter、action 为普通 method
2. **constructor 中 `super()` 后必须 `bindState(this.state)`**——否则 `$reset` / `$patch` / `$subscribe` / 持久化不可用
3. **`defineStore<T>(id, factory)` 的 factory 返回子类实例**，返回类型显式标注

::: tip 为什么用 getter 而不是 computed 字段
插件内 `effectScope` 不可用，computed 会绑定首次创建页面的作用域、跨页面后失效；getter 每次求值无此问题（依赖收集经 reactive 属性自动完成）。
:::

## 页面使用

```uts
import { useCounterStore } from '@/stores/counter.uts'

const counter = useCounterStore()   // 多次调用返回同一实例（跨页面共享）
```

```html
<template>
  <view>
    <text>count: {{ counter.state.count }}</text>
    <text>double: {{ counter.doubleCount }}</text>
    <button @click="counter.increment()">+1</button>
    <button @click="counter.$reset()">重置</button>
  </view>
</template>
```

> - 脚本访问：`counter.state.count`（reactive 字段直接读写，无 `.value`）
> - **模板事件绑定 class method 必须带括号**：`@click="counter.increment()"`（Kotlin 端 method 不是值）

## 插件与持久化（可选）

纯状态管理**无需任何挂载代码**。需要插件（含内置持久化）时在 `main.uts` 顶层显式登记：

```uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,               // null = 全部 store
  excludeStores: new Array<string>(),
  serializer: null                   // null = JSON 序列化
})))
```

持久化的完整用法（`_serialize` / `_hydrate` 双钩子）见[基础用法](./basic-usage#持久化)。

## 下一步

- [基础用法](./basic-usage)：实例 $-API、跨 store 依赖、订阅、持久化
- [与标准 Pinia 的差异](./pinia-diff)：形态差异与裁掉项
