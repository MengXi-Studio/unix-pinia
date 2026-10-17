# 与标准 Pinia 的差异

unix-pinia 一比一复刻 Pinia API 面；因 UTS 编译到 Kotlin/Swift 后无 Proxy、对象不可动态注入属性、不可反射枚举字段，部分能力无法实现，逐项列明如下。

## 形态差异（可实现，形态不同）

| 标准 Pinia | unix-pinia | 原因 |
| --- | --- | --- |
| `store.$patch(fn)` | `patch(store, fn)` 顶层函数 | store 对象上无法挂方法 |
| `store.$id` | `getStoreId(store)` | 同上 |
| `store.$dispose()` | `dispose(store)` | 同上 |
| 脚本访问 state `store.count` | `store.count.value` | UTS 无 Proxy，不自动解包；模板经 `storeToRefs` 解构后自动解包 |
| `defineStore` 类型自动推断 | 返回类型必须显式 `type` 标注 | UTS 推断能力受限，显式标注更稳 |
| `pinia.use` 插件可返回对象合并进 store | 插件返回 `void`，仅 hook 逻辑 | UTS 禁止向既有对象动态注入属性 |

## 裁掉的 API（不可实现）

| API | 原因 | 替代方案 |
| --- | --- | --- |
| Options 式 `defineStore` | UTS 中 this 仅限 class 方法 | setup 式（Pinia 官方同样首推） |
| `$patch(对象)` | 无 `Partial<T>`、无字段反射 | `patch(store, mutator)` |
| `$subscribe(cb)` | deep watch 在 Android 端对 RefImpl 字段不触发（双端实测不一致） | 字段级 `watch(store.count, cb)` |
| `$onAction(cb)` | action 枚举不可实现 | action 内显式打点 |
| `$state` 快照 | 字段枚举不可实现 | patch mutator 内逐字段操作 |
| `mapState` 等 Options 辅助 | 组合式为主流，展开注入未验证 | `storeToRefs` 解构 |
| devtools / HMR / SSR | 原生端无对应机制 | — |
| `acceptHMRUpdate` | 同上 | — |

## 行为一比一（非裁掉）

| 项 | 说明 |
| --- | --- |
| `$reset` 不内置 | 标准 Pinia 对 setup store 同样不内置（调用即抛错）；自定义 reset action |
| id 必填 | 标准 Pinia 的 id 推断依赖 Symbol/SSR 上下文 |
| 多 Pinia 实例 | store 全局唯一注册表（uni-app x 应用无多实例隔离场景），`createPinia` 实例承载插件与 active 标记 |

## 挂载差异

`app.use(pinia)` 在 vdom 模式原生端不触发 install（实测）——unix-pinia 采用**免挂载**为唯一可靠形态：不写任何挂载代码即可用；需要插件时顶层 `setActivePinia(createPinia().use(plugin))`。
