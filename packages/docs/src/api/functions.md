# 函数

## defineStore

```uts
export function defineStore<T>(id: string, factory: () => T): () => T
```

定义一个 class 式 store。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 全局唯一标识（命名建议 `'user.profile'` 域名式反写） |
| `factory` | `() => T` | 工厂函数：返回 `PiniaStoreBase` 子类实例（`new CounterStore()`） |

返回 `useStore` 函数。**首次调用创建实例并登记注册表，后续调用返回同一实例**（跨页面共享）；同 id 重复 `defineStore` 输出警告并保持幂等。首次创建时注入 `$id`、dispose 钩子并按序调度已登记插件。

## createPinia

```uts
export function createPinia(): Pinia
```

创建 Pinia 实例（承载插件列表）。免挂载设计：纯状态管理无需调用；插件场景在顶层 `setActivePinia(createPinia().use(plugin))` 登记后，store 创建时调度插件。

## setActivePinia / getActivePinia

```uts
export function setActivePinia(pinia: Pinia | null): void
export function getActivePinia(): Pinia | null
```

登记 / 读取当前 Pinia 实例（多实例切换 / 插件场景；原生端唯一可靠形态）。未登记时插件不调度，store 本身正常工作。

## dispose

```uts
export function dispose<T>(store: T): void
```

注销 store 实例，≙ `store.$dispose()`。下次 `useStore()` 重建全新实例。注意既有引用会变成孤儿实例，仅用于应用级清理场景。

## getStoreId

```uts
export function getStoreId<T>(store: T): string
```

反查 store id，≙ `store.$id`。未登记返回空串。

## createPersistPlugin

```uts
export function createPersistPlugin(options: PersistOptions): PiniaPlugin
```

创建内置持久化插件（`main.uts` 顶层登记，一次配置全部 store 生效）：

- **恢复**：store 创建时读存储 → `store._hydrate(data)`（自动）
- **落盘**：`$patch` / `$reset` / `$save` 触发 `_serialize()` 快照写存储（自动）
- **前提**：store 按需重写 `_serialize()` / `_hydrate()`（不重写则该 store 持久化为空操作）

配置项见 [PersistOptions](./types#persistoptions)。

## clearPersistedState

```uts
export function clearPersistedState(storeId: string, keyPrefix: string): void
```

清空指定 store 的持久化数据。`keyPrefix` 与 `createPersistPlugin` 的配置保持一致。

## setStorageAdapter

```uts
export function setStorageAdapter(next: StorageAdapter): void
```

替换存储后端（默认基于 uni storage；可换 unix-storage / 原生 preferences）。需在创建任何 store 前调用。

::: tip 迁移提示
早期 setup 式 API（`storeToRefs` / 顶层 `patch` / `loadPersisted` / `savePersisted` 等）已移除，形态对照见[与标准 Pinia 的差异](../guide/pinia-diff)，变更记录见更新日志。
:::
