# Quick start

## Install

Complete the setup first per the [Installation](./installation) page (npm sync into `uni_modules/ux-pinia/` or the plugin market).

## Define a store (stores/counter.uts)

```uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
  count: Ref<number>,                 // state: Ref
  doubleCount: ComputedRef<number>,   // getter: ComputedRef
  increment: () => void,              // action: arrow function
  reset: () => void                   // replacement for $reset: custom reset action
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
  const count: Ref<number> = ref(0)
  const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
  const increment = (): void => { count.value++ }
  const reset = (): void => { count.value = 0 }
  return { count, doubleCount, increment, reset } as CounterStore
})
```

Three conventions:

1. **State via `Ref`, getters via `ComputedRef`, actions via arrow functions** (UTS forbids passing function declarations as values)
2. **The return type must be an explicit `type` annotation** (object literals can only be assigned to type aliases)
3. **`ComputedRef` must be imported**: `import type { ComputedRef } from 'vue'` (not globally injected; `Ref` is injected, but importing both explicitly is recommended)

## Use in a page

```vue
<template>
  <text>{{ count }} / {{ doubleCount }}</text>
  <button @click="increment">+1</button>
</template>

<script setup lang="uts">
  import { storeToRefs } from '@/uni_modules/ux-pinia'
  import { useCounterStore } from '@/stores/counter.uts'

  const store = useCounterStore()                    // repeated calls return the same instance
  const { count, doubleCount } = storeToRefs(store)  // auto-unwrapped in template

  const increment = (): void => {
    store.count.value++    // script access via .value
  }
</script>
```

## Mounting (optional)

Pure state management needs **zero setup code**. To use plugins, register explicitly at the top level of `main.uts`:

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

## Next steps

- [Basic usage](./basic-usage): instance APIs, cross-store dependencies, subscriptions
- [Differences from standard Pinia](./pinia-diff): pruned items and replacements
