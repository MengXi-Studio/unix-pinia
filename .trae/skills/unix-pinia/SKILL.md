---
name: unix-pinia
description: 在 uni-app x 项目中使用 @meng-xi/unix-pinia（npm）或 ux-pinia（uni_modules）进行 Pinia 风格状态管理时使用。涵盖 setup 式 defineStore、storeToRefs 模板绑定、patch/dispose 实例 API、字段级 watch 订阅、插件编写与免挂载初始化，以及 UTS 强类型约束下的正确写法。
---

# unix-pinia 使用技能

本库是 uni-app x 的 Pinia 风格状态管理库（纯 UTS，setup 式，填补 vdom 模式 App 端无法使用标准 Pinia 的空缺），UTS 源码分发，编译期转 Kotlin / Swift / JS。按以下流程操作；需要完整 API 速查表时读 `references/api-quickref.md`。

## 1. 判定引入形态

先检查项目形态，决定 import 路径（同一项目禁止混用）：

- 项目存在 `uni_modules/ux-pinia/` → uni_modules 形态，统一用 `@/uni_modules/ux-pinia`
- `package.json` 依赖含 `@meng-xi/unix-pinia` → npm 形态，统一用 `@meng-xi/unix-pinia`（注意：UTS 编译器不扫描 node_modules，npm 安装后需同步到工程 `uni_modules/ux-pinia/`）

以下示例以 uni_modules 路径书写；npm 项目把 import 来源整体替换即可，其余代码不变。

## 2. 免挂载心智（与标准 Pinia 的第一差异）

- **纯状态管理零挂载代码**：store 注册表是 UTS 模块级单例，`main.uts` 无需任何 pinia 代码，直接 `defineStore` 即用
- **需要插件时**才创建 Pinia 实例，且在顶层登记：`setActivePinia(createPinia().use(plugin))`
- **禁止依赖 `app.use(pinia)`**（P8 实证：原生端 install 不触发，双端不一致）
- 状态生命周期 = 应用进程（冷启动重置），跨页面共享由注册表保证

## 3. 任务配方

### 定义 setup 式 store

```ts
// stores/counter.uts
import type { Ref, ComputedRef } from 'vue' // ComputedRef 必须显式导入（编译器不注入）
import { defineStore } from '@/uni_modules/ux-pinia'

// ① 显式 type 定义 store 类型（对象字面量仅支持赋值给 type 类型）
export type CounterStore = {
	count: Ref<number>,            // state 用 Ref
	doubleCount: ComputedRef<number>, // getter 用 ComputedRef
	increment: () => void,         // action 用箭头函数类型
	reset: () => void
}

// ② 泛型显式标注 + setup 返回值显式标注
export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
	const count: Ref<number> = ref(0)
	const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
	const increment = (): void => { count.value++ } // 箭头函数（函数声明不能作值传递）
	const reset = (): void => { count.value = 0 }   // $reset 不内置，自定义 reset action
	return { count, doubleCount, increment, reset } as CounterStore
})
```

id 必填 string（建议域名式反写，如 `'user.profile'`）；同 id 重复定义幂等返回既有实例并警告。

### 页面消费（脚本 .value / 模板自动解包）

```vue
<script setup lang="uts">
import { storeToRefs } from '@/uni_modules/ux-pinia'
import { useCounterStore } from '@/stores/counter.uts'

const counterStore = useCounterStore() // 多次调用同一实例
const { count, doubleCount } = storeToRefs(counterStore) // 解构后模板自动解包

const onInc = (): void => {
	counterStore.increment()
	const v: number = counterStore.count.value // 脚本访问必须 .value（UTS 无 Proxy）
}
</script>

<template>
	<scroll-view style="flex:1">
		<text>count: {{ count }}</text>       <!-- 模板自动解包，无需 .value -->
		<button @click="onInc">+1</button>
	</scroll-view>
</template>
```

**红线**：禁止用 `reactive()` 包装 store——Android 端不解包 Ref 字段（读到 RefImpl 原样），Web 端却自动解包，双端行为不一致。

### 批量修改 / 反查 id / 注销

```ts
import { patch, getStoreId, dispose } from '@/uni_modules/ux-pinia'

patch(useCounterStore(), (s: CounterStore): void => { s.count.value = 10 }) // ≙ $patch（仅 mutator 形态）
const id: string = getStoreId(useCounterStore())  // ≙ $id → 'counter'，未登记返回空串
dispose(useCounterStore())                        // ≙ $dispose；下次 useStore 重新执行 setup 重建
// 注意 dispose 后旧引用指向孤儿实例，需重新 useStore() 获取新实例
```

### 状态订阅（字段级 watch，整体 $subscribe 已裁掉）

```ts
const stop = watch(counterStore.count, (newVal: number, oldVal: number): void => {
	console.log('count 变化', oldVal, '->', newVal)
})
stop() // 取消订阅
```

deep watch 整体订阅在 Android 端对 RefImpl 字段不触发（双端不一致），必须逐字段 watch（Ref 天然可 watch）。

### 跨 store 依赖

```ts
export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
	const counterStore = useCounterStore() // setup 内直接调用（注册表保证单例）
	const addScoreFromCount = (): void => { score.value += counterStore.count.value }
	// 避免在 getter 内产生 store 间循环依赖
})
```

### 编写插件

```ts
import type { PiniaPlugin, PiniaPluginContext } from '@/uni_modules/ux-pinia'

// 签名固定：返回 void（UTS 禁止动态注入属性，裁掉"返回对象合并进 store"）
const loggerPlugin: PiniaPlugin = (ctx: PiniaPluginContext): void => {
	// ctx.pinia / ctx.storeId 可直接用；ctx.store 为 any，需 as 收窄
	console.log('[plugin] store 创建：' + ctx.storeId)
}
// 注册：main.uts 顶层 setActivePinia(createPinia().use(loggerPlugin))
```

调度时机：**首次 useStore 创建实例时**按序执行；store 创建后注册的插件不作用于既有 store；未 setActivePinia 时静默跳过。

**运行时补注册插件**：`pinia.use(plugin)` 可随时调用，仅对之后新建的 store 生效。让插件作用于既有 store 的唯一途径是 `dispose(store)` 后重新 `useStore()`（重建时按当前插件列表调度）：

```ts
const pinia = getActivePinia()
if (pinia != null) {
	pinia.use(loggerPlugin)      // 运行时注册（链式）
	dispose(useCounterStore())   // 注销既有实例
	useCounterStore()            // 重建时插件生效
}
```

### 多实例管理

```ts
import { createPinia, setActivePinia, getActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia())  // 登记当前实例
const p = getActivePinia()     // Pinia | null，未登记返回 null（判空用 != null）
```

## 4. UTS 强类型红线（写码时逐条自检）

1. store 类型必须显式 `type` 定义（嵌套拆分独立 type），`defineStore<T>` 与 setup 返回值双重标注，返回对象 `as XxxStore`
2. state=Ref / getter=ComputedRef / action=箭头函数表达式；`ComputedRef` 必须 `import type { ComputedRef } from 'vue'`
3. 脚本访问 state 必须 `.value`；模板经 storeToRefs 解构后自动解包
4. 禁止 `reactive()` 包装 store（双端解包行为不一致）；禁止在实例上找 `$patch` 等方法（一律顶层函数）
5. id 必填 string，禁止依赖类型推断
6. 可空值用 `null` 禁止 `undefined`；条件必须布尔表达式（`if (p != null)`，禁止 truthy 写法）
7. **Pinia 习惯写法禁用**：Options 式定义、`$patch(对象)`、`$subscribe` 整体订阅、`$reset`、`$state`、`$onAction`、`mapState/mapActions`、插件返回对象合并、devtools / HMR / SSR
8. uvue 页面可滚动内容必须放在 scroll-view 等滚动容器中；页面文件后缀 `.uvue`

## 5. 错误排查

| 信号 | 处置 |
| --- | --- |
| Android 编译「参数类型不匹配：实际 'T'，预期 'Any'」 | Kotlin 泛型擦除：泛型 T 进出 `Map<string, any>` 显式 `as any`（库源码已内置） |
| `ComputedRef` 编译 warning | `import type { ComputedRef } from 'vue'` |
| 脚本读到 `{"__v_isRef": true, ...}` 对象 | 方案 B 预期：加 `.value`；检查是否误用 reactive 包装 |
| watch 不触发（Android） | deep watch 已裁掉（P9）：改字段级 `watch(store.count, cb)` |
| 警告「store id 'xxx' 已定义，本次定义将被忽略」 | 幂等设计（HMR 也会触发）：核对 id 拼撞 |
| dispose 后旧变量不更新 | 孤儿实例预期行为：重新 useStore() |
| 插件不执行 | 确认顶层 `setActivePinia(createPinia().use(plugin))` 且发生在首次 useStore 之前 |
| 原生端无 `pinia install` 日志 | P8 预期：原生端 app.use 不触发 install，用顶层 setActivePinia |

## 6. 深入资料

- 完整 API 速查（导出清单 / 类型定义 / 插件契约 / 与标准 Pinia 差异对照 / PoC 双端差异证据 / 库源码结构）：本技能目录 `references/api-quickref.md`
- 设计文档：仓库 `.trae/documents/`（功能设计 / API 设计定稿 / PoC 验证报告）
- 库源码：`packages/core/utssdk/`（index.uts 入口 + interface.uts 类型 + pinia/ 实现）；修改后需 `scripts/sync-uni-modules.mjs` 同步 playground
- 示例工程：`packages/playground/`（stores/counter.uts、stores/user.uts 及 pages-sub 各验证页面）
