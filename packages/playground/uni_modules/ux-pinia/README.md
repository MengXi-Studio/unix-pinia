<img alt="梦曦工作室 Logo" width="180" src="https://raw.githubusercontent.com/MengXi-Studio/unix-pinia/master/packages/docs/src/public/logo.png">

# ux-pinia

为 uni-app x 提供 Pinia 风格的状态管理（UTS 编写，setup 式，一套 API 多端覆盖）。

**ux-pinia** 是开源项目 [unix-pinia](https://github.com/MengXi-Studio/unix-pinia) 的 uni_modules 插件发行版（npm 包名
[`@meng-xi/unix-pinia`](https://www.npmjs.com/package/@meng-xi/unix-pinia)），把标准 Pinia 的使用习惯完整搬到 UTS：setup 式 `defineStore`、`storeToRefs` 模板绑定、`patch` / `dispose` 实例 API、字段级订阅与插件体系，填补 **vdom 模式 App 原生端无法使用标准 Pinia** 的空缺。

## 特性

- **setup 式 defineStore**：state 用 `Ref`、getter 用 `ComputedRef`、action 用箭头函数，与 Pinia 官方推荐写法一致；返回类型显式 `type` 标注，编辑器全程提示
- **免挂载单例**：模块级注册表保证应用级单例，跨页面共享状态；纯状态管理零挂载代码
- **实例 API 顶层函数映射**：`patch` / `dispose` / `getStoreId` 对应 `$patch` / `$dispose` / `$id`（UTS 无 Proxy，无法在 store 对象上挂方法）
- **跨 store 依赖**：setup 内直接调用对方 `useStore`，注册表保证单例
- **插件体系**：`pinia.use(plugin)` 链式注册，`PiniaPluginContext`（`pinia` / `store` / `storeId`）对齐标准 Pinia 三字段；配套持久化插件 ux-pinia-persist
- **强类型 UTS**：全量显式类型标注；Kotlin 泛型擦除边界已在库内收敛，业务侧零感知

## 平台兼容性

| App-Android | App-iOS | App-HarmonyOS | Web（Chrome / Safari） | 微信小程序 |
| :---------: | :-----: | :-----------: | :--------------------: | :--------: |
|      √      |    √    |       √       |           √            |     √      |

> 环境要求：HBuilderX 4.75+（5.26 实测），uni-app x 项目，manifest 需显式 `"vapor": false`（vdom 模式）。iOS / 鸿蒙代码与 Android 全端同构，待实测。

## 使用说明

### 1. 导入插件

在 HBuilderX 中通过插件市场「导入插件」安装，插件位于工程 `uni_modules/ux-pinia/`；也可从 npm 安装 `@meng-xi/unix-pinia` 后将包内容复制到 `uni_modules/ux-pinia/`。

### 2. 定义 store（stores/counter.uts）

```uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
	count: Ref<number>,                   // state：Ref
	doubleCount: ComputedRef<number>,     // getter：ComputedRef
	increment: () => void,                // action：箭头函数
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

### 3. 页面使用

```uts
import { storeToRefs } from '@/uni_modules/ux-pinia'
import { useCounterStore } from '@/stores/counter.uts'

const store = useCounterStore()                    // 多次调用返回同一实例（跨页面共享）
const { count, doubleCount } = storeToRefs(store)  // 模板解构自动解包

store.count.value++                                // 脚本访问 state：.value（UTS 无 Proxy 不自动解包）
```

> 纯状态管理无需任何挂载代码；需要插件调度时在 main.uts 顶层 `setActivePinia(createPinia().use(myPlugin))`（P8 实测：原生端 `app.use` 不触发 install）。

## API 清单

| API | 说明 |
| --- | --- |
| defineStore | 定义 store（仅 setup 式），同 id 幂等返回既有实例 |
| storeToRefs | 解构 state / getter 为响应式引用（模板自动解包） |
| createPinia / setActivePinia / getActivePinia | 实例管理与登记（插件场景） |
| patch | 批量修改：`patch(store, (s) => { ... })`（≙ `$patch`，仅 mutator 形态） |
| dispose | 注销实例，下次 useStore 重建（≙ `$dispose`） |
| getStoreId | 反查 store id（≙ `$id`） |

## 文档与演示

- 📖 完整文档（指南 + API 参考 + 更新日志，中英双语）：[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)
- 💻 示例工程：仓库自带 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)，首页自动运行全部验证用例
- 📱 Android 真机体验：[下载演示 App（APK）](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793386392738-__UNI__0AA2919_1793386383661.apk)

## 更新记录

### 0.1.0（2026-10-17）

- 首个版本发布：vdom 模式 App 原生端可用的 Pinia 风格状态管理
- 核心 API：defineStore / storeToRefs / createPinia / setActivePinia / getActivePinia / patch / dispose / getStoreId
- 双端实测：Web 与 Android 真机全用例通过，双端行为一致

完整更新记录见 [changelog.md](./changelog.md)。

## 交流与支持

想了解设计思路与实现原理（UTS 无 Proxy 的解包差异、Kotlin 泛型擦除红线、`$subscribe` 裁决过程等）？公众号「**梦曦工作室**」有系列解析，扫码获取更多信息：

<img alt="微信公众号二维码" width="180" src="https://raw.githubusercontent.com/MengXi-Studio/unix-pinia/master/packages/docs/src/public/QR_code.jpg">

- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)
- 🌐 官网：[mengxi-studio.github.io](https://mengxi-studio.github.io/.github/)

## 开源协议

[MIT](./license.md) © MengXi-Studio
