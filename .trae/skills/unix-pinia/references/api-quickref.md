# unix-pinia API 速查表

> 供 AI 编码助手按需查阅。所有示例为 UTS / uni-app x 语法；import 路径按项目形态替换（npm：`@meng-xi/unix-pinia`；uni_modules：`@/uni_modules/ux-pinia`）。

## 导出清单（v1，packages/core/utssdk/index.uts）

| API | 签名 | 说明 |
| --- | --- | --- |
| `defineStore` | `<T>(id: string, setup: () => T): () => T` | setup 式；id 必填；返回 useStore 闭包，首次调用执行 setup，后续返回同一实例 |
| `storeToRefs` | `<T>(store: T): T` | 转为 ref 集合供模板解构自动解包（方案 B 透传实现，幂等） |
| `createPinia` | `(): Pinia` | 创建 Pinia 实例（承载插件列表）；纯状态管理无需调用 |
| `setActivePinia` | `(pinia: Pinia \| null): void` | 登记当前实例（多实例切换 / 插件场景；原生端唯一可靠形态） |
| `getActivePinia` | `(): Pinia \| null` | 获取当前实例；未登记返回 null |
| `patch` | `<T>(store: T, fn: (s: T) => void): void` | ≙ `$patch(fn)`，仅 mutator 形态 |
| `dispose` | `<T>(store: T): void` | ≙ `$dispose()`，注册表移除（id 保留），下次 useStore 重建 |
| `getStoreId` | `<T>(store: T): string` | ≙ `$id`，未登记返回空串 `''` |

导出类型：`Pinia`（class：`use(plugin)` 链式 / `install(app)` 仅 Web 可靠 / `getPlugins()`）、`Unsubscribe = () => void`、`SubscribeCallback = () => void`、`PiniaPlugin`、`PiniaPluginContext`。

## defineStore 用户侧规范

```ts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
	count: Ref<number>,               // state → Ref
	doubleCount: ComputedRef<number>, // getter → ComputedRef
	increment: () => void,            // action → 箭头函数类型
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

硬约束：

- 对象字面量仅支持赋值给 **type** 定义的对象类型（UTS110111163），嵌套对象拆独立 type
- `ComputedRef` 编译器不全局注入，必须 `import type { ComputedRef } from 'vue'`；`Ref` 建议统一显式导入
- action 必须箭头函数表达式（函数声明不能作值传递，UTS110111152）
- id 必填 string（UTS 无 Symbol），建议域名式反写（`'user.profile'`）
- 同 id 重复 defineStore：幂等返回既有实例 + `console.warn`（所有 useStore 闭包共享首个注册实例）

## 访问模型（方案 B：Ref 直读，双端定稿）

| 场景 | 写法 |
| --- | --- |
| 脚本读/写 state | `store.count.value`（必须 `.value`） |
| 脚本读 getter | `store.doubleCount.value` |
| 调用 action | `store.increment()` |
| 模板绑定 | `const { count } = storeToRefs(store)` 后 `{{ count }}`（自动解包） |

实证依据：Android 端 `reactive()` 不解包 Ref/ComputedRef 字段（读到 `RefImpl` 对象原样），Web 端自动解包——reactive 包装导致双端 DX 不一致，故 setup 返回对象直接透传。**禁止 `reactive()` 包装 store**。

## 插件契约

```ts
import type { PiniaPlugin, PiniaPluginContext } from '@/uni_modules/ux-pinia'

export type PiniaPluginContext = {
	pinia: Pinia,      // 当前 Pinia 实例
	store: any,        // 刚创建的 store 实例（使用处 as 收窄为具体 store 类型）
	storeId: string    // store id
}
export type PiniaPlugin = (ctx: PiniaPluginContext) => void  // 必须箭头语法，返回 void
```

行为细节：

- 插件在**首次 useStore 创建实例时**按注册顺序调度；**store 创建后注册的插件不作用于既有 store**——运行时可随时 `pinia.use(plugin)` 补注册（对之后新建的 store 生效），让插件作用于既有 store 的唯一途径是 `dispose(store)` 后重新 `useStore()`（playground plugin 页 P8-2 验证）
- 未 `setActivePinia` 时插件调度静默跳过（不报错）
- 返回 void 是硬约束——UTS 禁止向既有对象动态注入属性，裁掉标准 Pinia「插件返回对象合并进 store」能力，hook 逻辑经 ctx 完成
- 注册：`setActivePinia(createPinia().use(pluginA).use(pluginB))`（链式，`use` 返回实例本身）

## 判断工具（vue 内建，P6 双端验证）

| 函数 | 用途 |
| --- | --- |
| `isRef(v)` | 判断值是否 Ref（调试 store 字段 / 验证 reactive 未解包时返回 true 的关键工具，双端一致） |

## 与标准 Pinia 差异对照表（定稿）

| 能力 | 标准 Pinia | unix-pinia v1 | 归属 |
| --- | --- | --- | --- |
| createPinia / app.use | ✅ | 免挂载为唯一可靠形态（P8：原生端 install 不触发）；插件场景顶层 `setActivePinia(createPinia())` | 实现（形态落定） |
| defineStore setup 式 | ✅ | ✅ id 必填 + 显式 type 标注 | 实现 |
| defineStore Options 式 | ✅ | ❌ this 语义受限（UTS110111139） | 裁掉 |
| storeToRefs | ✅ | ✅ 透传 | 实现 |
| 脚本访问 state | `store.count` | `store.count.value`（无 Proxy 硬约束） | 形态差异 |
| `$patch(fn)` | ✅ | `patch(store, fn)` | 实现 |
| `$patch(对象)` | ✅ | ❌ 无 `Partial<T>`（UTS110111125）+ 无字段反射 | 裁掉 |
| `$subscribe` | ✅ | ❌ P9 裁决裁掉（deep watch Android 不触发） | 字段级 `watch(store.count, cb)` |
| `$onAction` | ✅ | ❌ action 枚举不可实现 | 裁掉（action 内显式打点） |
| `$id` | ✅ | `getStoreId(store)` | 实现 |
| `$reset` | setup 式不内置（抛错） | 不内置（自定义 reset action） | 行为一比一 |
| `$state` 快照 | ✅ | ❌ 字段枚举不可实现 | 裁掉 |
| `$dispose` | ✅ | `dispose(store)` | 实现 |
| pinia.use 插件 | 插件可返回对象合并进 store | 插件返回 void，仅 hook 逻辑 | 约束差异 |
| mapState / mapActions / mapStores | ✅ | ❌ | 裁掉（用 storeToRefs） |
| devtools / HMR（acceptHMRUpdate）/ SSR | ✅ | ❌ 非目标 | 裁掉 |
| Symbol 注入 key / id 推断 | ✅ | ❌ string id 必填 | 裁掉 |
| `pinia.state.value` 全局 state 树 | ✅ | ❌ | 按 store 粒度访问 |
| 持久化 | pinia-plugin-persistedstate | v2 独立插件规划 | 后置 |

## PoC 实证双端差异（Android vdom vs Web，2026-10-17）

| 编号 | 验证项 | 结论 |
| --- | --- | --- |
| P1 | 组合式 API 与类型注入 | `ref/computed` 函数与 `Ref<T>` 全局注入；**`ComputedRef` 不注入**，必须 `import type { ComputedRef } from 'vue'` |
| P2 | 模块级 Map 注册表单例 | 双端成立；同页多次 useStore 同一实例，跨页面共享 |
| P3 | reactive 对 Ref/ComputedRef 字段解包 | **Web 自动解包 / Android 不解包**（`RefImpl` 原样）→ 方案 A 出局，方案 B（Ref 直读）定稿 |
| P4 | watch 对 Ref 订阅 | 双端一致（`fired=1, new=1, old=0`） |
| P5 | 泛型 defineStore\<T\> + 显式 type + 函数属性对象字面量 | 双端成立（Android 需 error17 修复） |
| P6 | isRef 可用性 | 双端一致 |
| P8 | `app.use(Pinia实例)` | **原生端 install 不触发**，Web 可用 → 统一免挂载 + 顶层 setActivePinia |
| P9 | deep watch 实现 $subscribe | **Android 端对 RefImpl 字段不触发** → 裁掉，字段级 watch 替代 |
| error17 | Kotlin 泛型擦除 | 泛型 T 进出 `Map<string, any>` 必须显式 `as any` |

环境基线：HBuilderX ≥ 4.75（PoC 于 5.26 验证）；vdom 模式 manifest 显式 `"vapor": false`；蒸汽模式项目直接用标准 Pinia。

## 库源码结构（packages/core/utssdk/，本仓库开发）

| 文件 | 职责 |
| --- | --- |
| `index.uts` | 跨平台根入口：对外 API **内联具名声明**（转发 Impl），类型经 `export type` 转发 |
| `interface.uts` | 对外类型集中声明（PiniaPlugin / PiniaPluginContext / Unsubscribe / SubscribeCallback） |
| `pinia/pinia.uts` | Pinia class + createPinia / setActivePinia / getActivePinia 实现 |
| `pinia/registry.uts` | 注册表：`storeMap`（id→实例）/ `storeIdMap`（实例→id，按引用相等）/ `definedIds` |
| `pinia/defineStore.uts` | useStore 闭包：幂等创建 + 插件调度 |
| `pinia/storeToRefs.uts` | 透传实现（签名位置为演进保留） |
| `pinia/instanceApi.uts` | patch / dispose / getStoreId 实现 |

开发红线（unix-storage 云打包实战）：

1. 入口对外 API 一律内联 `export function` 具名声明；**禁止 `export { x } from` 转发链**（uts-proxy V1 只解析入口内联声明，转发 API 云打包 Kotlin 丢失）
2. 实现函数一律 **Impl 后缀**，避免同名 top-level 符号触发 Kotlin 导出符号静默重整（`__1`）
3. 对外类型集中在 interface.uts（类型转发可用、函数转发不可用）；Pinia class 经 `import type` 使返回类型对入口可见
4. 泛型 T 进出 Map 显式 `as any`（error17）
5. 修改 core 后运行 `scripts/sync-uni-modules.mjs` 同步 playground（dev server 锁目录先 `cli project close`）

运行时行为细节：

- store 创建成功输出 `[unix-pinia] store '<id>' 已创建`；install 输出 `[unix-pinia] pinia install（app.use 挂载成功）`
- `removeStore` 后 `definedIds` 保留——dispose 后重建的 store 不触发重复定义警告
- `storeIdMap` 对象 key 按引用相等，getStoreId 对未登记实例返回 `''`
