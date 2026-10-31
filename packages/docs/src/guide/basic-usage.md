# 基础用法

## 状态读写

state 是 `reactive<T>` 强类型对象：**脚本与模板同路径直接读写，无 `.value`**。

```uts
const counter = useCounterStore()

counter.state.count++                 // 脚本读写
console.log(counter.doubleCount)      // getter 求值
```

```html
<text>{{ counter.state.count }} / {{ counter.doubleCount }}</text>
```

## 实例 API（$-methods）

`PiniaStoreBase` 基类内置完整实例 API：

```uts
const counter = useCounterStore()

// 批量修改：经 _hydrate 钩子装载局部数据
counter.$patch({ count: 10 } as UTSJSONObject)

// 重置：调用 _doReset 钩子后通知订阅器
counter.$reset()

// 显式保存点：direct 修改 state 后的落盘 / 通知触发
counter.$save()

// 注销实例，下次 useStore() 重建
counter.$dispose()

// store id 与当前 state 引用
counter.$id        // 'counter'
counter.$state     // reactive state（与 counter.state 同引用）
```

::: warning dispose 注意
`$dispose` 后，**既有引用仍指向旧实例**（孤儿实例），后续对旧引用的修改不会反映到新实例。仅在与应用同生命周期的清理场景使用（如登出），常规业务请通过 action 重置状态。
:::

## 状态订阅

`$subscribe(cb)` 订阅状态变更，回调收到分发类型与 `_serialize()` 快照：

```uts
const unsub = counter.$subscribe((type: string, state: UTSJSONObject): void => {
  // type = 'patch' | 'reset' | 'save'；state = _serialize() 快照
  console.log('state changed:', type, state['count'])
})
unsub()   // 取消订阅
```

::: warning 订阅触发时机
`$subscribe` 仅由 `$patch` / `$reset` / `$save` 触发——**direct 修改 state（含 action 内直接改字段）不触发**（UTS 无全局订阅钩子）。需要快照 / 落盘的场景，在关键操作后显式调用 `counter.$save()`。
:::

`$onAction(cb)` 订阅 action 调用（仅经 `callAction` 包装的 action 被追踪）：

```uts
// store 内：让 increment 触发 $onAction 订阅
increment(): void {
  this.callAction('increment', (): any => {
    this.state.count++
    return null
  })
}

// 页面内订阅
const unsub = counter.$onAction((info: ActionInfo): void => {
  console.log('action:', info.name)
})
```

## 重置状态

`$reset()` 的行为由 `_doReset` 钩子定义（不重写则为空操作）：

```uts
override _doReset(): void {
  this.state.count = 0
  this.state.name = 'pinia'
}
```

## 跨 store 依赖

在 method 内直接调用对方 `useStore`（注册表保证单例；**不要放在字段初始化器中**——store 创建时机不可控）：

```uts
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
```

避免在 getter 内跨 store 引用产生循环依赖，与标准 Pinia 注意事项一致。

## 持久化

`main.uts` 顶层登记内置持久化插件（一次配置，全部 store 生效）：

```uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,               // null = 全部 store
  excludeStores: new Array<string>(),
  serializer: null                   // null = JSON 序列化
})))
```

需要持久化的 store 重写两个钩子（Template Method 契约）：

```uts
override _serialize(): UTSJSONObject {
  // 落盘快照：只含需持久化的字段（tempValue 等内存字段不含）
  return { token: this.state.token } as UTSJSONObject
}

override _hydrate(data: UTSJSONObject): void {
  // 恢复回填：字段级判空（存储损坏 / 字段缺失 → 保留初始值）
  if (data['token'] != null) {
    this.state.token = data['token'] as string
  }
}
```

- **恢复**：store 创建时插件读存储并调 `_hydrate`（自动，无需任何代码）
- **落盘**：`$patch` / `$reset` / `$save` 触发 `_serialize` 快照写存储（自动）；direct 修改后需调 `counter.$save()`
- **换后端**：`setStorageAdapter({ get, set, remove })` 在创建任何 store 前调用（默认 uni storage，可换 unix-storage / 原生 preferences）
- **调试**：`clearPersistedState('user', 'ux-pinia:')` 清空指定 store 的持久化数据

::: tip
三个钩子均可不重写——state 修改 / actions / `$subscribe`（`$patch` / `$reset` 触发）依然有效；不重写 `_serialize` / `_hydrate` 时该 store 持久化为空操作。
:::

## 插件

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
import type { PiniaPlugin, PiniaPluginContext } from '@/uni_modules/ux-pinia'

const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
  console.log('store created:', ctx.storeId)
  // ctx.store 为 any：const base = ctx.store as any as PiniaStoreBase 后可用基类能力
}

setActivePinia(createPinia().use(logger))
```

插件需在首个 `useStore()` 调用前登记（建议放在 `main.uts` 顶层）。UTS 约束：插件返回 `void`，不能像标准 Pinia 那样返回对象合并进 store。
