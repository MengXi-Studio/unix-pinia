# 函数

## defineStore

```uts
export function defineStore<T>(id: string, setup: () => T): () => T
```

定义一个 setup 式 store。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 全局唯一标识（命名建议 `'user.profile'` 域名式反写） |
| `setup` | `() => T` | 工厂函数：state 用 `Ref`、getter 用 `ComputedRef`、action 用箭头函数，返回显式 `type` 标注的对象 |

返回 `useStore` 函数。**首次调用执行 setup 并登记注册表，后续调用返回同一实例**（跨页面共享）；同 id 重复 `defineStore` 输出警告并保持幂等。

## storeToRefs

```uts
export function storeToRefs<T>(store: T): T
```

返回 store 的 ref 集合，供模板解构后自动解包。幂等，可重复调用。

## createPinia

```uts
export function createPinia(): Pinia
```

创建 Pinia 实例（承载插件列表）。配合 `setActivePinia` 登记后，store 创建时会依次调度已注册插件。

## setActivePinia / getActivePinia

```uts
export function setActivePinia(pinia: Pinia | null): void
export function getActivePinia(): Pinia | null
```

多实例切换（插件场景）。不调用时首次 `useStore` 会惰性创建默认实例，纯状态管理无需关心。

## patch

```uts
export function patch<T>(store: T, fn: (s: T) => void): void
```

批量修改状态，对应 `store.$patch(fn)`。仅 mutator 形态（对象形态依赖 `Partial<T>`，UTS 不可实现）。

## dispose

```uts
export function dispose<T>(store: T): void
```

注销 store 实例，对应 `store.$dispose()`。下次 `useStore()` 重新执行 setup 重建。注意既有引用会变成孤儿实例。

## getStoreId

```uts
export function getStoreId<T>(store: T): string
```

反查 store id，对应 `store.$id`。未登记返回空串。
