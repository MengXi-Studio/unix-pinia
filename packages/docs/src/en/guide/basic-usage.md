# Basic usage

## Reading & writing state

state is a strongly-typed `reactive<T>` object: **scripts and templates read/write it directly through the same path, no `.value`**.

```uts
const counter = useCounterStore()

counter.state.count++                 // read/write from scripts
console.log(counter.doubleCount)      // getter evaluation
```

```html
<text>{{ counter.state.count }} / {{ counter.doubleCount }}</text>
```

## Instance APIs ($-methods)

The `PiniaStoreBase` base class ships the full instance API:

```uts
const counter = useCounterStore()

// batch update: partial data is loaded through the _hydrate hook
counter.$patch({ count: 10 } as UTSJSONObject)

// reset: runs the _doReset hook, then notifies subscribers
counter.$reset()

// explicit save point: triggers persist-to-storage / notification after direct state mutations
counter.$save()

// dispose the instance; the next useStore() rebuilds it
counter.$dispose()

// store id and the current state reference
counter.$id        // 'counter'
counter.$state     // reactive state (same reference as counter.state)
```

::: warning dispose caveat
After `$dispose`, **existing references still point to the old instance** (an orphan instance); later mutations through an old reference will not reach the new one. Use it only for app-lifetime cleanup scenarios (e.g. logout); in normal business, reset state through actions.
:::

## State subscriptions

`$subscribe(cb)` subscribes to state changes; the callback receives the dispatch type and the `_serialize()` snapshot:

```uts
const unsub = counter.$subscribe((type: string, state: UTSJSONObject): void => {
  // type = 'patch' | 'reset' | 'save'; state = the _serialize() snapshot
  console.log('state changed:', type, state['count'])
})
unsub()   // unsubscribe
```

::: warning when subscriptions fire
`$subscribe` is triggered only by `$patch` / `$reset` / `$save` — **direct state mutations (including field writes inside actions) do not trigger it** (UTS has no global subscription hook). For snapshot / persist-to-storage scenarios, call `counter.$save()` explicitly after key operations.
:::

`$onAction(cb)` subscribes to action calls (only actions wrapped with `callAction` are tracked):

```uts
// inside the store: make increment trigger $onAction subscribers
increment(): void {
  this.callAction('increment', (): any => {
    this.state.count++
    return null
  })
}

// subscribe in a page
const unsub = counter.$onAction((info: ActionInfo): void => {
  console.log('action:', info.name)
})
```

## Resetting state

The behavior of `$reset()` is defined by the `_doReset` hook (a no-op unless overridden):

```uts
override _doReset(): void {
  this.state.count = 0
  this.state.name = 'pinia'
}
```

## Cross-store dependencies

Call the other `useStore` directly inside a method (the registry guarantees singletons; **never in a field initializer** — store creation timing is uncontrollable):

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

Avoid cross-store references inside getters that create circular dependencies — same caveat as standard Pinia.

## Persistence

Register the built-in persistence plugin at the top level of `main.uts` (one configuration, effective for all stores):

```uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,               // null = all stores
  excludeStores: new Array<string>(),
  serializer: null                   // null = JSON serialization
})))
```

Stores that need persistence override two hooks (the Template Method contract):

```uts
override _serialize(): UTSJSONObject {
  // persist-to-storage snapshot: only fields that need persistence (in-memory fields like tempValue are excluded)
  return { token: this.state.token } as UTSJSONObject
}

override _hydrate(data: UTSJSONObject): void {
  // restore refill: per-field null checks (corrupted / missing data keeps initial values)
  if (data['token'] != null) {
    this.state.token = data['token'] as string
  }
}
```

- **Restore**: on store creation the plugin reads storage and calls `_hydrate` (automatic, zero code)
- **Persist to storage**: `$patch` / `$reset` / `$save` trigger the `_serialize` snapshot write (automatic); after direct mutations, call `counter.$save()`
- **Swap backend**: call `setStorageAdapter({ get, set, remove })` before creating any store (uni storage by default; swap to unix-storage / native preferences)
- **Debug**: `clearPersistedState('user', 'ux-pinia:')` clears the persisted data of one store

::: tip
All three hooks can be left unoverridden — state mutations / actions / `$subscribe` (triggered by `$patch` / `$reset`) still work; without `_serialize` / `_hydrate` overrides, persistence for that store is a no-op.
:::

## Plugins

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
import type { PiniaPlugin, PiniaPluginContext } from '@/uni_modules/ux-pinia'

const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
  console.log('store created:', ctx.storeId)
  // ctx.store is any: use const base = ctx.store as any as PiniaStoreBase to reach the base-class capabilities
}

setActivePinia(createPinia().use(logger))
```

Register plugins before the first `useStore()` call (top level of `main.uts` recommended). UTS constraint: plugins return `void` and cannot return an object to merge into the store like standard Pinia.
