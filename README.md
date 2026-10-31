**中文** | [English](./README-en.md)

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="梦曦工作室 Logo" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="微信公众号 二维码" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-pinia</h1>
  <p>为 uni-app x 提供 Pinia 风格的状态管理与内置持久化（class 式 store，UTS 编写，一套 API 多端覆盖）</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-pinia.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-pinia?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-pinia)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-pinia?color=green)

</div>

## 为什么是 unix-pinia

uni-app x 的 **vdom 模式 App 原生端**无法使用标准 Pinia（蒸汽模式全平台可用，vdom 模式仅 Web/小程序可用）；官方「导出全局 reactive 变量」的裸方案又缺少统一范式——store 命名、跨页面单例、批量更新、订阅、持久化，每项都要自己约定。unix-pinia 把 Pinia 的使用习惯完整搬到 UTS：

- **写过 Pinia？** class 式 `defineStore` 对齐官方 `state / getters / actions` 结构化心智——state 用 `reactive<T>` 强类型包裹、派生值用 getter、action 就是普通 method，看一眼就能上手；
- **要完整 $-API？** `$patch` / `$reset` / `$subscribe` / `$onAction` / `$dispose` / `$id` / `$state` 全部内置（class + reactive 架构）；
- **要持久化？** 内置 `createPersistPlugin`：store 创建自动恢复、`$patch` / `$reset` / `$save` 自动落盘——只需按需重写 `_serialize` / `_hydrate` 两个钩子；
- **多端发布？** 同一份 UTS 源码，Web 编译为 JS、Android 编译为 Kotlin，由 uni-app x 编译链现场编译，无 JS Bridge。

设计说明：UTS 无 Proxy、无反射，且新版 HBuilderX 编译器对 UTS 插件内运行时类 vue 符号（`Ref` / `watch` / `effectScope`）的 Kotlin import 生成失效——**class + reactive 是 uni-app x 插件实现完整 Pinia 功能面的唯一可行架构**（同款方案见官方推荐的 [x-pinia-s](https://ext.dcloud.net.cn/plugin?name=x-pinia-s)）。`reactive<T>` 在 UTS 中为编译期展开（生成属性代理），不受该约束影响。

## 特性

- **class 式 defineStore** - `class XxxStore extends PiniaStoreBase`：state 用 `reactive<T>` 强类型包裹、派生值用 class getter、action 为普通 method；`defineStore<T>(id, factory)` 返回 useStore
- **完整实例 API** - `$patch(partial)` / `$reset()` / `$subscribe(cb)` / `$onAction(cb)` / `$dispose()` / `$id` / `$state` / `$save()` 全部可用
- **内置持久化插件** - `createPersistPlugin({ keyPrefix, includeStores, excludeStores, serializer })`：store 创建自动恢复、`$patch` / `$reset` / `$save` 自动落盘；`clearPersistedState` 清空指定 store
- **免挂载单例** - 模块级注册表保证应用级单例，跨页面共享状态；纯状态管理零挂载代码
- **插件体系** - `pinia.use(plugin)` 链式注册，`PiniaPluginContext`（`pinia` / `store` / `storeId`）对齐标准 Pinia 三字段
- **跨 store 依赖** - method 内直接调用对方 `useStore()`，注册表保证单例
- **可替换存储后端** - `setStorageAdapter({ get, set, remove })`：默认 uni storage，可换 unix-storage / 原生 preferences
- **幂等与可预测** - 同 id 重复 `defineStore` 警告并返回既有实例；`$dispose` 后 `useStore` 重建全新实例
- **强类型 UTS** - 全量显式类型标注；Kotlin 泛型擦除与可空性边界（`as any` / `any | null`）已在库内收敛，业务侧零感知
- **双端实测** - Web（JS 编译链）与 Android（Kotlin 编译链、云打包）全用例通过

## 安装

**npm**——安装后将包内容同步到工程 `uni_modules/ux-pinia/`（编译器不扫描 node_modules）：

```bash
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

**插件市场**：搜索 `ux-pinia` 导入 HBuilderX。

> `packages/core` 为标准 **uni_modules UTS 插件**（`utssdk/` 官方目录结构 + `interface.uts` 对外声明），业务侧从 `@/uni_modules/ux-pinia` 导入。

## 快速开始

### 1. 定义 store（stores/counter.uts）

```uts
import { reactive } from 'vue'
import { defineStore, PiniaStoreBase } from '@/uni_modules/ux-pinia'

export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  // state：reactive<T> 强类型包裹（字段为原始值，模板/脚本直接访问）
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  // 派生值：class getter（每次求值，模板经 reactive 属性依赖收集自动更新）
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

  setName(n: string): void {
    this.state.name = n
  }
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => new CounterStore())
```

> **为什么用 getter 而不是 computed 字段**：`effectScope` 在插件内不可用，computed 会绑定首次创建页面的作用域、跨页面后失效；getter 每次求值无此问题（依赖收集经 reactive 属性自动完成）。

### 2. 页面使用

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

> 脚本访问：`counter.state.count`（reactive 字段直接读写，无 `.value`）。**模板事件绑定 class method 必须带括号**：`@click="counter.increment()"`（Kotlin 端 method 不是值）。

### 3. 实例 API（$-methods）

```uts
const counter = useCounterStore()

// ≙ store.$patch(partial)：批量修改（经 _hydrate 钩子装载）
counter.$patch({ count: 10 } as UTSJSONObject)

counter.$reset()                        // 调用 _doReset 钩子后通知订阅器

const unsub = counter.$subscribe((type: string, state: UTSJSONObject): void => {
  // type = 'patch' | 'reset' | 'save'；state = _serialize() 快照
})
unsub()                                 // 取消订阅

counter.$save()                         // 显式保存点（通知订阅器，持久化插件落盘）
counter.$dispose()                      // 注销后下次 useStore 重建
counter.$id                             // → 'counter'
```

### 4. 跨 store 与插件

```uts
// 跨 store 依赖：method 内直接调用对方 useStore()（注册表保证单例；不要放在字段初始化器中）
export class UserStore extends PiniaStoreBase {
  state: UserState = reactive<UserState>({ score: 0 })

  constructor() {
    super()
    this.bindState(this.state)
  }

  addScoreFromCount(): void {
    this.state.score += useCounterStore().state.count
  }
}

// 插件（可选；main.uts 顶层登记，P8 实测：原生端 app.use 不可靠，顶层显式登记为唯一可靠形态）
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

### 5. 持久化（内置插件，零胶水）

main.uts 顶层登记持久化插件（一次配置，全部 store 生效）：

```uts
// main.uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,                              // null = 全部 store
  excludeStores: new Array<string>(),
  serializer: null                                  // null = JSON.stringify
})))
```

需要持久化的 store 重写两个钩子（Template Method 契约）：

```uts
export class UserStore extends PiniaStoreBase {
  state: UserState = reactive<UserState>({ token: '', tempView: '' })

  constructor() {
    super()
    this.bindState(this.state)
  }

  // 落盘快照：tempView 不含（内存字段对照）
  override _serialize(): UTSJSONObject {
    return { token: this.state.token } as UTSJSONObject
  }

  // 恢复回填：字段级判空（存储损坏 / 字段缺失 → 保留初始值）
  override _hydrate(data: UTSJSONObject): void {
    if (data['token'] != null) {
      this.state.token = data['token'] as string
    }
  }
}
```

- **恢复**：store 创建时插件读存储并调 `_hydrate`（自动，无需任何代码）
- **落盘**：`$patch` / `$reset` / `$save` 触发 `_serialize` 快照写存储（自动）；direct 修改 state 后需调 `counter.$save()`
- **换后端**：`setStorageAdapter({ get, set, remove })` 在创建任何 store 前调用
- **调试**：`clearPersistedState('user', 'ux-pinia:')` 清空指定 store 的持久化数据

### 运行效果

仓库自带示例工程 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)，进入首页自动运行全部验证用例（基础用法 / 响应式 / 单例跨页面 / 实例 API / 跨 store / 订阅 / 插件 / 持久化），以 `[verify]` 前缀输出日志并在页面直接显示 pass/fail。示例工程为纯 HBuilderX 工程，用 HBuilderX 打开 `packages/playground` 即可发行 Web / Android，复验同一组用例。

**Android 体验包（云打包产物）**：[下载 APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793456655694-__UNI__0AA2919_1793456648910.apk)（蒸汽模式，安装后进入各功能页查看 `[verify]` 结果）

**双端实测结论**：Web 全用例通过；Android 云打包（Kotlin 编译链）通过、真机用例复验中；iOS / 鸿蒙代码全端同构，待实测。

## 交流与支持

想了解设计思路与实现原理（UTS reactive 的编译期展开、可空性红线、`x-pinia-s` 架构对照等）？公众号「**梦曦工作室**」有系列解析，扫码关注：

<p align="center">
  <img alt="微信公众号 二维码" width="180" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
</p>

- 📖 [完整文档](https://mengxi-studio.github.io/unix-pinia/)（指南 + API 参考 + 更新日志）
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)

## 导出

- API：`defineStore` / `createPinia` / `setActivePinia` / `getActivePinia` / `dispose` / `getStoreId` / `createPersistPlugin` / `clearPersistedState` / `setStorageAdapter`
- class：`PiniaStoreBase`（store 基类）/ `Pinia`（实例）
- 类型：`PiniaPlugin` / `PiniaPluginContext` / `Unsubscribe` / `StorageAdapter` / `PersistOptions` / `StateChangeCallback` / `ActionInfo`

## 文档

📖 从入门到精通的完整文档（指南 + API 参考 + 更新日志）：

**[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)**

## 更新日志

📝 **[https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md](https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md)**

## License

[MIT](./license.md)
