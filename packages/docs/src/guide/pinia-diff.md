# 与标准 Pinia 的差异

unix-pinia 对齐标准 Pinia 的功能面与使用习惯；因 UTS 编译到 Kotlin/Swift 后无 Proxy、不可反射枚举字段，且新版 HBuilderX 编译器对 UTS 插件内运行时类 vue 符号（`Ref` / `watch` / `effectScope`）的 Kotlin import 生成失效，部分能力形态不同或裁掉，逐项列明如下。

## 架构形态差异

| 标准 Pinia | unix-pinia | 原因 |
| --- | --- | --- |
| setup 式或 Options 式 defineStore | class 式：`class XxxStore extends PiniaStoreBase` | class + reactive 是插件内实现完整 $-API 的唯一可行架构 |
| state 任意结构（ref / reactive 混用） | state 为 class 字段，`reactive<T>` 强类型包裹（原始值字段） | UTS 无 Proxy，Ref 嵌套解包行为双端不一致；reactive 编译期展开双端一致 |
| getter = `computed` | 派生值 = class getter | 插件内 `effectScope` 不可用，computed 跨页面失效；getter 每次求值无生命周期问题 |
| 脚本访问 `store.count` | `store.state.count`（无 `.value`） | state 为 reactive 强类型对象，脚本模板同路径 |
| 返回类型自动推断 | factory 返回类型显式标注（class 实例） | UTS 推断能力受限，显式标注更稳 |

## 实例 API 差异

| 标准 Pinia | unix-pinia | 说明 |
| --- | --- | --- |
| `$patch(fn)` / `$patch(partial)` | `$patch(partial: UTSJSONObject)` 仅对象形态 | 无 `Partial<T>` 推导；装载经 `_hydrate` 钩子，类型安全 |
| `$subscribe(cb)` 任意变更触发 | `$subscribe(cb)` 仅 `$patch` / `$reset` / `$save` 触发 | UTS 无全局字段订阅钩子；direct 修改后调 `$save()` |
| `$onAction` 自动追踪全部 action | 仅追踪经 `callAction` 包装的 action | UTS 无法自动包装 method |
| `$state = { ... }` 整体替换 | `$state` 只读引用（同 `store.state`） | reactive 对象无法整体 cast，逐字段修改 + `$patch` |
| `$reset()` 内置（Options store） | `$reset()` 由 `_doReset` 钩子定义 | 标准 Pinia 对 setup store 同样不内置 |
| 插件可返回对象合并进 store | 插件返回 `void`，仅 hook 逻辑 | UTS 禁止向既有对象动态注入属性 |

## 裁掉的 API

| API | 原因 | 替代方案 |
| --- | --- | --- |
| Options 式 `defineStore` | UTS 中 this 仅限 class 方法（class 式已覆盖该形态） | class 式 defineStore |
| `mapState` 等 Options 辅助 | 组合式为主流，展开注入未验证 | 直接访问 `store.state.x` 与 getter |
| devtools / HMR / SSR / `acceptHMRUpdate` | 原生端无对应机制 | — |

## 行为一比一（非裁掉）

| 项 | 说明 |
| --- | --- |
| id 必填 | 标准 Pinia 的 id 推断依赖 Symbol/SSR 上下文 |
| 同 id 幂等 | 重复 `defineStore` 警告并返回既有实例 |
| 多 Pinia 实例 | store 全局唯一注册表（uni-app x 应用无多实例隔离场景），`createPinia` 实例承载插件与 active 标记 |

## 挂载差异

`app.use(pinia)` 在原生端不触发 install（实测）——unix-pinia 采用**免挂载**为唯一可靠形态：不写任何挂载代码即可用；需要插件时顶层 `setActivePinia(createPinia().use(plugin))`。

## 模板绑定差异

模板事件绑定 class method **必须带括号**：`@click="counter.increment()"`——Kotlin 端 method 不是值（Web 端 JS 函数一等公民掩盖了该差异）。
