# Quick start

## Install

Complete the setup first per the [Installation](./installation) page (npm sync into `uni_modules/ux-pinia/` or plugin market import).

## Define a store

Create `stores/counter.uts`:

```uts
import { reactive } from 'vue'
import { defineStore, PiniaStoreBase } from '@/uni_modules/ux-pinia'

export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  // state: strongly-typed reactive<T> wrapper (primitive fields, accessed directly in templates / scripts)
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  // derived value: class getter (templates update automatically via reactive property dependency tracking)
  get doubleCount(): number {
    return this.state.count * 2
  }

  // constructor: bindState(this.state) is required after super() (a prerequisite for the $-API and persistence)
  constructor() {
    super()
    this.bindState(this.state)
  }

  // actions = plain class methods, mutating state directly
  increment(): void {
    this.state.count++
  }
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => new CounterStore())
```

Three conventions:

1. **State is wrapped in strongly-typed `reactive<T>`, derived values are class getters, actions are plain methods**
2. **`bindState(this.state)` is required after `super()` in the constructor** — otherwise `$reset` / `$patch` / `$subscribe` / persistence are unavailable
3. **The `defineStore<T>(id, factory)` factory returns the subclass instance**, with the return type annotated explicitly

::: tip Why a getter instead of a computed field
`effectScope` is unavailable inside plugins; a computed binds to the scope of the page that first creates the store and stops working across pages. A getter is evaluated per access and has no such issue (dependency tracking happens automatically through reactive property access).
:::

## Use in a page

```uts
import { useCounterStore } from '@/stores/counter.uts'

const counter = useCounterStore()   // repeated calls return the same instance (shared across pages)
```

```html
<template>
  <view>
    <text>count: {{ counter.state.count }}</text>
    <text>double: {{ counter.doubleCount }}</text>
    <button @click="counter.increment()">+1</button>
    <button @click="counter.$reset()">Reset</button>
  </view>
</template>
```

> - Script access: `counter.state.count` (reactive field, read/written directly, no `.value`)
> - **Template event bindings to class methods must include parentheses**: `@click="counter.increment()"` (a method is not a value on Kotlin)

## Plugins & persistence (optional)

Pure state management requires **zero mounting code**. When you need plugins (including built-in persistence), register explicitly at the top level of `main.uts`:

```uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,               // null = all stores
  excludeStores: new Array<string>(),
  serializer: null                   // null = JSON serialization
})))
```

For the full persistence usage (the `_serialize` / `_hydrate` hook pair), see [Basic usage](./basic-usage#persistence).

## Next steps

- [Basic usage](./basic-usage): the instance $-API, cross-store dependencies, subscriptions, persistence
- [Differences from standard Pinia](./pinia-diff): form differences and pruned items
