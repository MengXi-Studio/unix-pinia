# Functions

## defineStore

```uts
export function defineStore<T>(id: string, factory: () => T): () => T
```

Define a class-style store.

| Param | Type | Notes |
| --- | --- | --- |
| `id` | `string` | globally unique identifier (naming suggestion: `'user.profile'`, reversed-domain style) |
| `factory` | `() => T` | factory function: returns a `PiniaStoreBase` subclass instance (`new CounterStore()`) |

Returns the `useStore` function. **The first call creates the instance and registers it; later calls return the same instance** (shared across pages); duplicate `defineStore` with the same id warns and stays idempotent. On first creation it injects `$id`, the dispose hook, and schedules the registered plugins in order.

## createPinia

```uts
export function createPinia(): Pinia
```

Creates a Pinia instance (carries the plugin list). Mount-free design: pure state management never calls it; in plugin scenarios, after top-level `setActivePinia(createPinia().use(plugin))` registration, plugins are scheduled when stores are created.

## setActivePinia / getActivePinia

```uts
export function setActivePinia(pinia: Pinia | null): void
export function getActivePinia(): Pinia | null
```

Register / read the current Pinia instance (multi-instance switching / plugin scenarios; the only reliable form on native). Without registration, plugins are not scheduled but stores themselves work normally.

## dispose

```uts
export function dispose<T>(store: T): void
```

Disposes a store instance, ≙ `store.$dispose()`. The next `useStore()` rebuilds a brand-new instance. Note that existing references become orphan instances; use it only for app-level cleanup scenarios.

## getStoreId

```uts
export function getStoreId<T>(store: T): string
```

Looks up the store id, ≙ `store.$id`. Returns an empty string if unregistered.

## createPersistPlugin

```uts
export function createPersistPlugin(options: PersistOptions): PiniaPlugin
```

Creates the built-in persistence plugin (register at the top level of `main.uts`; one configuration, effective for all stores):

- **Restore**: on store creation, read storage → `store._hydrate(data)` (automatic)
- **Persist to storage**: `$patch` / `$reset` / `$save` trigger the `_serialize()` snapshot write (automatic)
- **Prerequisite**: stores override `_serialize()` / `_hydrate()` on demand (without overriding, persistence for that store is a no-op)

See [PersistOptions](./types#persistoptions) for the options.

## clearPersistedState

```uts
export function clearPersistedState(storeId: string, keyPrefix: string): void
```

Clears the persisted data of the given store. Keep `keyPrefix` consistent with the `createPersistPlugin` configuration.

## setStorageAdapter

```uts
export function setStorageAdapter(next: StorageAdapter): void
```

Swaps the storage backend (uni storage by default; swap to unix-storage / native preferences). Call before creating any store.

::: tip Migration note
The early setup-style APIs (`storeToRefs` / top-level `patch` / `loadPersisted` / `savePersisted` etc.) have been removed. For the form mapping see [Differences from standard Pinia](../guide/pinia-diff); for the change history see the changelog.
:::
