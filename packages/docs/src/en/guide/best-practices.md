# Best practices

## Store naming & organization

- Use **reversed-domain style** ids to avoid collisions: `'user.profile'`, `'cart.items'`
- One store per file under the `stores/` directory: `stores/user.uts`
- Export the state `type`, the store class and `useStore` from the same file — one import gives consumers everything

## State design

- **Keep only primitive-value fields in state**: wrapped in strongly-typed `reactive<T>`; the unwrapping behavior of nested objects / Refs is inconsistent across platforms, so keep them out of state
- **Derive, don't store**: derived values are always class getters, never stored as state fields (avoid dual sources of truth)
- **Mutate through actions**: components only call actions and never write `store.state.x` directly — keep every mutation path traceable; after direct mutations, call `store.$save()` if persist-to-storage / notification is needed
- **Minimize snapshots**: `_serialize()` returns only the fields that need persistence (in-memory fields such as temporary input stay out of the snapshot)

## Cross-store composition

```uts
// ✅ Recommended: call the other useStore inside a method (the registry guarantees singletons)
export class CartStore extends PiniaStoreBase {
  state: CartState = reactive<CartState>({ items: 0 })

  constructor() {
    super()
    this.bindState(this.state)
  }

  clearOnLogout(): void {
    useUserStore().logout()
    this.state.items = 0
  }
}
```

```uts
// ❌ Avoid: cross-store references in field initializers (store creation timing is uncontrollable)
// ❌ Avoid: cross-store references inside getters create circular dependencies
```

## Subscriptions & side effects

- `$subscribe` fires only on `$patch` / `$reset` / `$save` — call `$save()` explicitly after key operations; the callback receives the `_serialize()` snapshot
- `$dispose` is for app-level cleanup only (e.g. logout); **existing references become orphan instances after dispose** — reset through actions in normal business instead of disposing

## Template binding

- Template event bindings to class methods **must include parentheses**: `@click="counter.increment()"` (a method is not a value on Kotlin)
- Templates use `store.state.x` and getters directly — no destructuring step needed

## Persistence practices

- `_hydrate` refills field by field with per-field null checks (corrupted / missing data naturally falls back to initial values); do not overwrite the whole state
- For debugging, `clearPersistedState(storeId, keyPrefix)` clears a single store; to swap backends, use `setStorageAdapter` and call it before creating any store

## Type conventions

- `reactive<T>` generic arguments are annotated explicitly, and state field types come from a standalone `type` (e.g. `CounterState`)
- Types such as `PiniaPlugin` / `PiniaPluginContext` / `StorageAdapter` are imported from the plugin entry with `import type`
- `bindState(this.state)` is required after `super()` in the constructor — omitting it only warns at runtime, but `$reset` / `$patch` / `$subscribe` / persistence are unavailable
