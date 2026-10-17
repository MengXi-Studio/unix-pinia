# 类型

## Pinia

Pinia 实例类型（`createPinia` 返回）。

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | 注册插件，链式 |
| `install` | `(app: any) => void` | `app.use(pinia)` 入口（仅 Web 端可靠，原生端请用 `setActivePinia`） |

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
| `store` | 刚创建的 store 实例（`any`，使用处 `as` 收窄为具体 store 类型） |
| `storeId` | store id |

## Unsubscribe

```uts
export type Unsubscribe = () => void
```

取消订阅函数（字段级 `watch` 的返回值即此形态）。

## store 类型约定

store 类型由用户以 `type` 定义并显式标注（对象字面量只能赋给 type 类型）：

```uts
export type CounterStore = {
  count: Ref<number>,                 // state：Ref<T>
  doubleCount: ComputedRef<number>,   // getter：ComputedRef<T>
  increment: () => void               // action：箭头函数
}
```

::: warning
`ComputedRef` 必须显式导入：`import type { ComputedRef } from 'vue'`（编译器不全局注入该类型名）。`Ref` 可全局注入，建议统一显式导入。
:::
