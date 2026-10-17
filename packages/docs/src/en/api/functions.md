# Functions

## defineStore

```uts
export function defineStore<T>(id: string, setup: () => T): () => T
```

Define a setup-style store.

| Param | Type | Notes |
| --- | --- | --- |
| `id` | `string` | globally unique id (reverse-domain naming recommended, e.g. `'user.profile'`) |
| `setup` | `() => T` | factory: state via `Ref`, getters via `ComputedRef`, actions via arrow functions, returning an explicitly annotated `type` object |

Returns the `useStore` function. **The first call runs setup and registers the store; later calls return the same instance** (shared across pages); duplicate `defineStore` with the same id warns and stays idempotent.

## storeToRefs

```uts
export function storeToRefs<T>(store: T): T
```

Returns the store's ref collection for template destructuring with auto-unwrapping. Idempotent.

## createPinia

```uts
export function createPinia(): Pinia
```

Creates a Pinia instance (carries the plugin list). Pair with `setActivePinia` so stores schedule plugins on creation.

## setActivePinia / getActivePinia

```uts
export function setActivePinia(pinia: Pinia | null): void
export function getActivePinia(): Pinia | null
```

Multi-instance switching (plugin scenarios). Without a call, the first `useStore` lazily creates a default instance — pure state management never needs these.

## patch

```uts
export function patch<T>(store: T, fn: (s: T) => void): void
```

Batch-update state, mirroring `store.$patch(fn)`. Mutator form only (the object form requires `Partial<T>`, not implementable in UTS).

## dispose

```uts
export function dispose<T>(store: T): void
```

Removes the store instance, mirroring `store.$dispose()`. The next `useStore()` re-runs setup. Note existing references become orphans.

## getStoreId

```uts
export function getStoreId<T>(store: T): string
```

Looks up the store id, mirroring `store.$id`. Returns an empty string if unregistered.
