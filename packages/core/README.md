# @meng-xi/unix-pinia

为 uni-app x 提供 Pinia 风格的状态管理库（UTS 编写，setup 式，一套 API 多端覆盖，**一比一复刻 Pinia API 面、裁掉平台不可实现项**）。

## 定位

uni-app x **vdom 模式 App 端**无法使用标准 Pinia（蒸汽模式全平台可用，vdom 模式仅 Web/小程序可用）。unix-pinia 使用标准 UTS 语法实现 Pinia 风格状态管理：

- UTS 源码分发（Web → JS，Android → Kotlin，iOS → Swift），由 uni-app x 编译链现场编译
- 模块级单例注册表，**免挂载**（无需 `app.use` 即可工作；多页面共享同一 store 实例）
- setup 式 `defineStore(id, setup)`：state 用 `ref`、getter 用 `computed`、action 用箭头函数
- 实例 API（`$patch/$dispose/$id`）以顶层函数形态提供（UTS 无 Proxy，无法在 store 对象上挂方法）

## 安装

**npm**——安装后将包内容同步到工程 `uni_modules/ux-pinia/`（编译器不扫描 node_modules）：

```sh
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

**插件市场**：搜索 `ux-pinia` 导入 HBuilderX。

## 快速开始

### 1. 定义 store（stores/counter.uts）

```ts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
  count: Ref<number>,                     // state：Ref
  doubleCount: ComputedRef<number>,       // getter：ComputedRef
  increment: () => void,                  // action：箭头函数（UTS 函数声明不能作值传递）
  reset: () => void                       // $reset 的替代：自定义 reset action
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
  const count: Ref<number> = ref(0)
  const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
  const increment = (): void => { count.value++ }
  const reset = (): void => { count.value = 0 }
  return { count, doubleCount, increment, reset } as CounterStore
})
```

> 类型导入规范：`ComputedRef` 编译器不全局注入，必须 `import type { ComputedRef } from 'vue'`；`Ref` 可注入但建议统一显式导入。

### 2. 页面使用

```vue
<template>
  <text>{{ count }} / {{ doubleCount }}</text>
</template>

<script setup lang="uts">
  import { storeToRefs } from '@/uni_modules/ux-pinia'
  import { useCounterStore } from '@/stores/counter.uts'

  const store = useCounterStore()                    // 多次调用返回同一实例（跨页面共享）
  const { count, doubleCount } = storeToRefs(store)  // 模板解构自动解包

  const doPatch = (): void => {
    patch(store, (s: CounterStore): void => { s.count.value = 10 })   // ≙ store.$patch(fn)
  }
</script>
```

### 3. main.uts（可选，仅使用插件时需要）

纯状态管理**无需任何挂载代码**。需要插件（`pinia.use`）时在顶层显式登记：

```ts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

## API 参考

| 导出 | 签名 | ≙ 标准 Pinia |
| --- | --- | --- |
| `defineStore` | `<T>(id: string, setup: () => T): () => T` | `defineStore`（setup 式；id 必填，返回类型须显式 type 标注） |
| `storeToRefs` | `<T>(store: T): T` | `storeToRefs` |
| `createPinia` | `(): Pinia` | `createPinia` |
| `setActivePinia` / `getActivePinia` | 同名 | 同名 |
| `patch` | `<T>(store: T, fn: (s: T) => void): void` | `store.$patch(fn)`（仅 mutator 形态） |
| `dispose` | `<T>(store: T): void` | `store.$dispose()` |
| `getStoreId` | `<T>(store: T): string` | `store.$id` |
| `Pinia.use(plugin)` | `(plugin: PiniaPlugin): Pinia` 链式 | `pinia.use`（插件返回 void，UTS 不可向 store 注入属性） |

## 与标准 Pinia 的差异（裁掉项）

| 项 | 原因 | 替代 |
| --- | --- | --- |
| Options 式 `defineStore` | UTS 中 this 仅限 class 方法 | setup 式 |
| `$patch(对象)` | 无 `Partial<T>` / 字段反射 | `patch(store, mutator)` |
| `$subscribe` | deep watch 在 Android 端对 RefImpl 字段不触发（双端不一致，已实测裁掉） | 字段级 `watch(store.count, cb)` |
| `$onAction` | action 枚举不可实现 | action 内显式打点 |
| `$state` 快照 | 字段枚举不可实现 | patch mutator 内逐字段操作 |
| `$reset` | 与 Pinia setup store 行为一比一（其亦不内置） | 自定义 reset action |
| `mapState` 等辅助 / devtools / HMR / SSR | 组合式为主流 / 原生端无 | — |

**访问形态差异**：脚本中 `store.count.value`（UTS 无 Proxy，不自动解包）；模板经 `storeToRefs` 解构后自动解包。

## 平台兼容

| 场景 | 支持 |
| --- | --- |
| vdom 模式 App-Android | ✅（Kotlin 编译链验证） |
| vdom 模式 Web | ✅ |
| vdom 模式 iOS / 鸿蒙 | 代码全端同构，待实测 |
| 蒸汽模式 | 可运行（该场景建议直接用标准 Pinia） |

环境要求：HBuilderX 4.75+（5.26 实测）。

## License

[MIT](./license.md)
