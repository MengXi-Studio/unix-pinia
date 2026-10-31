# 类型

## Pinia

Pinia 实例类型（`createPinia` 返回）。

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | 注册插件，链式 |
| `install` | `(app: any) => void` | `app.use(pinia)` 入口（仅 Web 端可靠，原生端请用 `setActivePinia`） |

## PiniaStoreBase

class 式 store 基类，所有 store 继承它获得 $-API 与持久化能力。

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `$id` | `string` | store id（defineStore 创建实例时注入） |
| `$state` | `any \| null` | 当前 state 引用（bindState 后与子类 state 同引用） |
| `bindState` | `(state: any) => void` | constructor 中 `super()` 后调用一次，绑定响应式 state |
| `$patch` | `(partial: UTSJSONObject) => void` | 批量修改（经 `_hydrate` 装载）并通知订阅器 |
| `$reset` | `() => void` | 调用 `_doReset` 钩子后通知订阅器 |
| `$save` | `() => void` | 显式保存点（direct 修改 state 后的落盘触发） |
| `$subscribe` | `(cb: StateChangeCallback) => Unsubscribe` | 订阅状态变更（`$patch` / `$reset` / `$save` 触发） |
| `$onAction` | `(cb: ActionChangeCallback) => Unsubscribe` | 订阅 action 调用（经 `callAction` 包装的 action） |
| `$dispose` | `() => void` | 注销实例，下次 `useStore()` 重建 |
| `callAction` | `(name: string, fn: () => any) => any \| null` | 让 action 触发 `$onAction` 订阅 |
| `_doReset` | `() => void` | 钩子：定义 `$reset` 行为（按需重写） |
| `_hydrate` | `(data: UTSJSONObject) => void` | 钩子：装载局部数据 / 持久化恢复（按需重写） |
| `_serialize` | `() => UTSJSONObject` | 钩子：state 快照（按需重写） |

## PiniaPlugin

```uts
export type PiniaPlugin = (ctx: PiniaPluginContext) => void
```

插件函数类型。UTS 约束：返回 `void`（不能返回对象合并进 store），插件逻辑通过 ctx 完成。

## PiniaPluginContext

```uts
export type PiniaPluginContext = {
  pinia: Pinia,
  store: any,
  storeId: string
}
```

| 字段 | 说明 |
| --- | --- |
| `pinia` | 当前 Pinia 实例 |
| `store` | 刚创建的 store 实例（`any`，使用处 `as any as PiniaStoreBase` 收窄） |
| `storeId` | store id |

## StateChangeCallback

```uts
export type StateChangeCallback = (type: string, state: UTSJSONObject) => void
```

`$subscribe` 回调：`type` = `'patch' | 'reset' | 'save'`；`state` = `_serialize()` 快照。

## ActionInfo / ActionChangeCallback

```uts
export type ActionInfo = {
  name: string
}

export type ActionChangeCallback = (info: ActionInfo) => void
```

`$onAction` 回调数据：仅经 `callAction` / `callActionWithArgs` 包装的 action 被追踪。

## Unsubscribe

```uts
export type Unsubscribe = () => void
```

取消订阅函数（`$subscribe` / `$onAction` 的返回值）。

## StorageAdapter

```uts
export type StorageAdapter = {
  get: (key: string) => string | null,
  set: (key: string, value: string) => void,
  remove: (key: string) => void
}
```

存储适配器（持久化后端）：默认实现基于 uni storage（零依赖），可换 unix-storage / 原生 preferences。

## PersistOptions

```uts
export type PersistOptions = {
  keyPrefix: string,
  includeStores: Array<string> | null,
  excludeStores: Array<string>,
  serializer: ((state: UTSJSONObject) => string) | null
}
```

| 字段 | 说明 |
| --- | --- |
| `keyPrefix` | 存储键前缀（完整键 = `keyPrefix + storeId`），默认 `'ux-pinia:'` |
| `includeStores` | 仅持久化指定 store（`null` = 全部） |
| `excludeStores` | 排除指定 store |
| `serializer` | 自定义序列化器（`null` = JSON 序列化） |

::: warning UTS 类型完整
UTS 对象字面量必须完整：调用 `createPersistPlugin` 时四个字段都要显式给出（可选语义用 `null` 表达），参见[基础用法](../guide/basic-usage#持久化)示例。
:::

## store 类型约定

store = `PiniaStoreBase` 子类 + 独立 state `type`：

```uts
export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  constructor() {
    super()
    this.bindState(this.state)
  }
}
```
