# Basic usage

## Reading & writing state

In setup stores, state is a `Ref`: use `.value` in scripts; in templates, destructure via `storeToRefs` for auto-unwrapping.

```uts
const store = useCounterStore()
store.count.value++
console.log(store.doubleCount.value)
```

```uts
const { count, doubleCount } = storeToRefs(store)
```

## Instance APIs (top-level function form)

```uts
import { patch, dispose, getStoreId } from '@/uni_modules/ux-pinia'

// ≙ store.$patch(fn) — mutator form only
patch(store, (s: CounterStore): void => {
  s.count.value = 10
})

const id: string = getStoreId(store)   // ≙ store.$id

dispose(store)                         // ≙ store.$dispose()
```

::: warning dispose caveat
After `dispose`, existing references still point to the orphaned instance; mutations there will not reach the rebuilt store. Reserve `dispose` for app-level cleanup (e.g. logout); prefer resetting via actions in normal business flows.
:::

## Cross-store dependencies

Call the other `useStore` inside setup:

```uts
export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
  const counterStore = useCounterStore()
  const score: Ref<number> = ref(0)
  const addScoreFromCount = (): void => {
    score.value += counterStore.count.value
  }
  return { score, addScoreFromCount } as UserStore
})
```

Avoid cross-store references inside getters (computed) to prevent circular chains — same caveat as standard Pinia.

## Subscriptions

Whole-store `$subscribe` is pruned on Android (see the [diff](./pinia-diff)); use per-field `watch`:

```uts
import { watch } from 'vue'

watch(store.count, (newVal: number, oldVal: number): void => {
  console.log('count changed:', oldVal, '->', newVal)
})
```

## Resetting state

`$reset` matches standard Pinia's setup-store behavior (not built in). Provide a custom reset action:

```uts
const reset = (): void => {
  count.value = 0
  name.value = 'pinia'
}
```

## Plugins

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'

const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
  console.log('store created:', ctx.storeId)
  // UTS constraint: plugins must return void (no object merging into the store)
}

setActivePinia(createPinia().use(logger))
```

Register plugins before the first `useStore()` call (top level of `main.uts` is recommended).
