# @meng-xi/unix-pinia

为 uni-app x 提供 Pinia 风格的状态管理库（UTS 编写，setup 式，一套 API 多端覆盖）。

> 当前处于 **M1 PoC 阶段**：API 以 PoC 验证为目的，正式 API 以 [功能设计文档](../../.trae/documents/unix-pinia-功能设计文档.md) 定稿为准。

## 定位

uni-app x **vdom 模式 App 端**无法使用标准 Pinia（蒸汽模式全平台可用，vdom 模式仅 Web/小程序可用）。unix-pinia 使用标准 UTS 语法实现 Pinia 风格状态管理，填补该空缺：

- UTS 源码分发（Web → JS，Android → Kotlin，iOS → Swift），由 uni-app x 编译链现场编译
- 模块级单例注册表，无需 `app.use()` 挂载
- setup 式 `defineStore(id, setup)`，state 用 `ref`、getter 用 `computed`、action 用箭头函数

## 快速开始（npm）

安装后将包内容同步到工程 `uni_modules/ux-pinia/`（编译器不扫描 node_modules）：

```sh
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

业务侧从 `@/uni_modules/ux-pinia` 导入。

## PoC 最小 API

```ts
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
  count: Ref<number>,
  doubleCount: ComputedRef<number>,
  increment: () => void,
  reset: () => void
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
  const count: Ref<number> = ref(0)
  const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
  const increment = (): void => { count.value++ }
  const reset = (): void => { count.value = 0 }
  return { count, doubleCount, increment, reset } as CounterStore
})
```

> 注意：`ComputedRef` 类型需 `import type { ComputedRef } from 'vue'`（编译器不全局注入该类型名）。

## 相关链接

- [完整文档](https://mengxi-studio.github.io/unix-pinia/)（M4 阶段上线）
- [设计文档与 PoC 报告](../../.trae/documents/)

## License

[MIT](./license.md)
