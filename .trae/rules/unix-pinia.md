# unix-pinia 使用规则

> 本文件面向 AI 编码助手。当项目引入了 `@meng-xi/unix-pinia`（npm 包）或 `ux-pinia`（uni_modules 分发，导入路径 `@/uni_modules/ux-pinia`）时，必须遵循以下约定编写代码。所有代码示例均为 UTS / uni-app x（uvue）语法。

## 1. 引入形态判定

两种形态 API 完全一致，仅 import 路径不同，同一项目禁止混用：

- npm 形态：`import { defineStore } from '@meng-xi/unix-pinia'`
- uni_modules 形态：`import { defineStore } from '@/uni_modules/ux-pinia'`

判定方法：项目存在 `uni_modules/ux-pinia/` → 用 uni_modules 路径；`package.json` 依赖含 `@meng-xi/unix-pinia` → 用 npm 路径。

**npm 分发特殊约定**：UTS 编译器不扫描 node_modules——npm 安装后必须同步到工程 `uni_modules/ux-pinia/`（本仓库 `scripts/sync-uni-modules.mjs`，INCLUDE 白名单复制 + KEEP 手工文件豁免 + `--check` 校验）。

## 2. 标准初始化（免挂载模式）

**纯状态管理零挂载代码**——store 注册表为 UTS 模块级单例（编译为 Kotlin 静态成员），无需 `createPinia()` / `app.use()`：

```ts
// stores/counter.uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

// ① 显式定义 store 类型（对象字面量仅支持赋值给 type 类型，UTS110111163）
export type CounterStore = {
	count: Ref<number>,
	doubleCount: ComputedRef<number>,
	increment: () => void,
	reset: () => void
}

// ② setup 式定义：state 用 Ref、getter 用 ComputedRef、action 用箭头函数
export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
	const count: Ref<number> = ref(0)
	const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
	const increment = (): void => { count.value++ }
	const reset = (): void => { count.value = 0 }
	return { count, doubleCount, increment, reset } as CounterStore
})
```

```ts
// 页面 / 组件中消费
import { storeToRefs } from '@/uni_modules/ux-pinia'
const counterStore = useCounterStore()          // 多次调用返回同一实例（跨页面共享）
const { count, doubleCount } = storeToRefs(counterStore) // 模板解构后自动解包
counterStore.increment()
const v: number = counterStore.count.value      // 脚本访问必须 .value
```

**需要插件时**（唯一需要 Pinia 实例的场景），在 `main.uts` 顶层显式登记：

```ts
// main.uts
import { createSSRApp } from 'vue'
import App from './App.uvue'
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'

export function createApp() {
	const app = createSSRApp(App)
	setActivePinia(createPinia().use(myPlugin)) // 顶层登记（P8 裁决：原生端唯一可靠形态）
	return { app }
}
```

## 3. 强制约定（红线）

1. **免挂载为唯一可靠形态**（P8 实证）：原生端 `app.use(Pinia实例)` 不触发 install（activePinia 为 null）；Web 端可用但双端不一致 → 统一顶层 `setActivePinia()`，`install` 方法保留仅 Web 可用。纯状态管理无需任何初始化代码。
2. **仅 setup 式**：Options 式（state/getters/actions + this）不支持——UTS 中 this 仅限 class 方法（UTS110111139）。
3. **store 类型必须显式 `type` 定义并标注**：`defineStore<CounterStore>('counter', (): CounterStore => {...})`，返回值 `as CounterStore` 收窄。对象字面量不能赋给 interface（UTS110111163）；嵌套对象需拆分独立 type。
4. **脚本访问 state 必须 `.value`**（方案 B 定稿）：UTS 无 Proxy，Android 端 `reactive()` 不解包 Ref/ComputedRef 字段（读到 `RefImpl` 对象原样），Web 端却自动解包——reactive 包装导致双端 DX 不一致，禁止用 `reactive()` 包 store。模板经 `storeToRefs` 解构后自动解包。
5. **类型导入规范**：`ComputedRef` 编译器**不会**全局注入，必须 `import type { ComputedRef } from 'vue'`；`Ref` 虽全局注入，建议统一显式导入两者。
6. **action 一律箭头函数表达式**：UTS 函数声明不能作值传递（UTS110111152）。
7. **store id 必填 string**（UTS 无 Symbol），建议域名式反写命名（如 `'user.profile'`）。同 id 重复 `defineStore`：幂等返回既有实例 + `console.warn`，所有 useStore 闭包共享首个注册实例。
8. **`$` 方法一律映射为模块级顶层函数**（UTS 无 Proxy、对象不可动态注入属性）：`patch(store, fn)` / `dispose(store)` / `getStoreId(store)`。在 store 实例上找 `$patch` 等方法不存在。
9. **`patch` 仅 mutator 形态**：`patch(store, (s: CounterStore): void => { s.count.value = 10 })`。对象形态依赖 `Partial<T>` 与字段反射，UTS 双重不可实现。
10. **整体订阅已裁掉（P9 实证）**：`watch(reactive(store), cb, {deep:true})` 在 Android 端对 RefImpl 字段不触发（Web 端正常），双端不一致。状态订阅用**字段级 `watch(store.count, cb)`**（Ref 天然可 watch，双端验证），返回取消函数。
11. **`$reset` 不内置**（与标准 Pinia setup store 行为一比一）：在 setup 中自定义 `reset` action。
12. **插件返回 void**：`PiniaPlugin = (ctx: PiniaPluginContext) => void`，裁掉"插件返回对象合并进 store"（UTS 禁止动态注入属性）。插件在**首次 useStore 创建实例时**按序调度（`ctx = { pinia, store, storeId }`）；**store 创建后注册的插件不作用于既有 store**——运行时可随时 `pinia.use(plugin)` 补注册（仅对之后新建的 store 生效），让插件作用于既有 store 的唯一途径是 `dispose(store)` 后重新 `useStore()`；未 `setActivePinia` 时静默跳过插件调度（`getActivePinia()` 返回 null，使用前判空）。
13. **`dispose` 后既有引用指向孤儿实例**：注册表移除但 id 保留，下次 `useStore()` 重新执行 setup 重建——旧变量不再更新，仅用于应用级清理场景。
14. **跨 store 依赖**：setup 内直接调用对方 `useStore()`（注册表保证单例）；避免 getter 内产生 store 间循环依赖。
15. **可空值用 `null`，禁止 `undefined`**；条件语句必须布尔表达式（`if (pinia != null)`，禁止 truthy 写法）。
16. **状态生命周期 = 应用进程**：无持久化（v2 独立插件规划），冷启动重置；跨页面共享由注册表保证。

## 4. 标准 Pinia 习惯写法禁用清单

来自 Pinia 的代码需注意以下差异，避免照搬：

| Pinia 习惯 | unix-pinia 现实 | 替代做法 |
| --- | --- | --- |
| Options 式 `defineStore({ state, getters, actions })` | ❌ 不支持（this 语义受限） | setup 式 |
| `store.count`（Proxy 自动解包） | ❌ 无 Proxy | `store.count.value`（脚本侧） |
| `store.$patch(对象)` | ❌ 无 `Partial<T>` / 字段反射 | `patch(store, mutator)` |
| `store.$subscribe(cb)` 整体订阅 | ❌ 裁掉（P9：deep watch Android 不触发） | 字段级 `watch(store.count, cb)` |
| `store.$reset()` | ❌ 不内置（setup 式 Pinia 同样抛错） | 自定义 `reset` action |
| `store.$state` 快照 / `$onAction` | ❌ 字段枚举不可实现 | mutator 内逐字段操作 / action 内显式打点 |
| `store.$id` | 顶层函数形态 | `getStoreId(store)`（未登记返回空串） |
| `store.$dispose()` | 顶层函数形态 | `dispose(store)` |
| 插件返回对象合并进 store | ❌ UTS 禁止动态注入属性 | 插件经 `PiniaPluginContext` 完成 hook 逻辑 |
| `id` 可推断（Symbol / SSR 上下文） | ❌ UTS 无 Symbol | id 必填 `string` |
| `mapState` / `mapActions` 等 | ❌ 裁掉 | `const { count } = storeToRefs(store)` |
| devtools / HMR（acceptHMRUpdate）/ SSR | ❌ 非目标 | — |
| `pinia.state.value` 全局 state 树 | ❌ 字段枚举不可实现 | 按 store 粒度访问 |

## 5. 平台差异速查

| 差异点 | App（Android / iOS，vdom 模式） | Web / 小程序（vdom 模式） | 蒸汽模式（Vapor） |
| --- | --- | --- | --- |
| 编译产物 | Kotlin / Swift | JS | — |
| 定位 | **主战场**（标准 Pinia 不可用） | 可用本库（同源编译） | 直接用标准 Pinia，无需本库 |
| `app.use(pinia)` | ❌ install 不触发（P8） | ✅ 可用（但禁止依赖，保持双端一致） | — |
| `reactive()` 对 Ref 字段解包 | ❌ 不解包（RefImpl 原样） | ✅ 自动解包 | — |
| deep watch 对 Ref 字段 | ❌ 不触发（P9） | ✅ 触发 | — |
| 泛型进出 Map | 必须显式 `as any`（error17） | 不可见（Web 无此约束） | — |

适用版本基线：HBuilderX ≥ 4.75（PoC 于 5.26 验证）；vdom 模式需 manifest 显式 `"vapor": false`。

## 6. 常见编译 / 运行错误排查

| 现象 | 原因与修复 |
| --- | --- |
| Android 编译报「参数类型不匹配：实际类型为 'T'，预期类型为 'Any'」 | Kotlin 泛型擦除（error17）：泛型 T 进出 `Map<string, any>` 必须显式 `as any`；库源码已内置，自写同类代码同样处理 |
| `ComputedRef` 编译 warning / 不可用 | 编译器不全局注入：`import type { ComputedRef } from 'vue'` |
| 脚本读到 `store.count` 是 `RefImpl` 对象（`{"__v_isRef": true, ...}`） | 方案 B 预期行为：必须 `.value`；用 `isRef(store.count)` 可直接验证；检查是否误用 `reactive()` 包装 store（Android 不解包，禁止） |
| 状态变了但 watch 回调不触发（Android） | deep watch 对 RefImpl 字段不触发（P9 裁决）：改字段级 `watch(store.count, cb)` |
| 控制台警告「store id 'xxx' 已定义，本次定义将被忽略」 | 同 id 重复 `defineStore`（幂等设计，如 HMR 触发）；核对 id 拼撞 |
| `dispose` 后旧 store 变量不更新 | 孤儿实例预期行为：重新调用 `useStore()` 获取重建实例 |
| 插件不执行 | 确认 `setActivePinia(createPinia().use(plugin))` 在**首次 useStore 之前**执行（store 创建后才注册的插件不作用于既有 store）；运行时补注册用 `pinia.use(plugin)` + `dispose` 后重建；未登记 activePinia 时插件静默跳过 |
| 原生端无 `[unix-pinia] pinia install` 日志 | P8 裁决预期行为：原生端 `app.use` 不触发 install，改用顶层 `setActivePinia()` |
| uni_modules 目录重命名 Access denied | dev server 锁目录：先 `cli project close` 再操作 |

## 7. 库源码开发约束（本仓库 packages/core）

修改 `packages/core/utssdk/` 时必须遵守（unix-storage 云打包实战红线）：

1. **入口内联声明**：`index.uts` 对外 API 一律 `export function` 具名实现（转发领域层 Impl 函数）；**禁止** `export { x } from` 转发链——uts-proxy V1 只解析平台入口的内联声明，转发 API 在云打包 Kotlin 编译时丢失。
2. **Impl 后缀**：插件内所有 .uts 同 Kotlin package，实现函数一律 `XxxImpl` 命名，避免同名 top-level 符号触发 Kotlin 导出符号静默重整（`__1`）。
3. **类型集中 interface.uts**：对外类型内联声明于 `interface.uts`，入口经 `export type` 转发（类型转发可用，API 函数转发不可用）；`Pinia` class 需 `import type` 使返回类型对入口可见。
4. **修改 core 后同步 playground**：运行 `scripts/sync-uni-modules.mjs` 同步到 `packages/playground/uni_modules/ux-pinia/`（先 `cli project close` 解锁）。
5. **playground 约定**：`"vapor": false`（vdom 模式主战场）；`[verify]` 前缀日志为验证工程必要业务日志，非调试残留；页面用 `defineUniPage` 宏 + ux-router 文件路由。

## 8. 版本要求与深入资料

- 当前 `@meng-xi/unix-pinia` 0.1.0（v1 核心已实现：defineStore / storeToRefs / createPinia / setActivePinia / getActivePinia / patch / dispose / getStoreId）
- 持久化插件（≙ pinia-plugin-persistedstate）规划 v2 独立包
- 设计与验证文档：`.trae/documents/`（功能设计 / API 设计定稿 / PoC 验证报告——双端差异证据）
