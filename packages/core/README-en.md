# @meng-xi/unix-pinia

Pinia-style state management for uni-app x, written in strict UTS with a setup-store API. One codebase covers the **vdom-mode native app** platforms where the standard Pinia cannot compile.

## Why

In uni-app x vdom mode, the standard Pinia fails to compile on native platforms (Kotlin/Swift). unix-pinia re-implements the Pinia API surface in pure UTS:

- **Setup-style `defineStore`**: state via `Ref`, getters via `ComputedRef`, actions via arrow functions
- **Mount-free singletons**: a module-level registry guarantees app-lifetime stores shared across pages — no `app.use` required
- **Instance APIs as top-level functions**: `patch` / `dispose` / `getStoreId` mirror `$patch` / `$dispose` / `$id` (UTS has no Proxy, so methods cannot be attached to store objects)
- **1:1 parity, pruned**: everything Pinia offers is either implemented, or cut with a documented reason and replacement

UTS source distribution (Web → JS, Android → Kotlin), compiled on the fly by the uni-app x toolchain.

## Install

**npm** — sync the package into your project's `uni_modules/ux-pinia/` (the compiler does not scan node_modules):

```sh
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

**Plugin market**: search `ux-pinia` in HBuilderX.

## Quick start

```ts
// stores/counter.uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
  count: Ref<number>,
  doubleCount: ComputedRef<number>,
  increment: () => void
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
  const count: Ref<number> = ref(0)
  const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
  const increment = (): void => { count.value++ }
  return { count, doubleCount, increment } as CounterStore
})
```

```vue
<script setup lang="uts">
  import { storeToRefs } from '@/uni_modules/ux-pinia'
  import { useCounterStore } from '@/stores/counter.uts'

  const store = useCounterStore()
  const { count, doubleCount } = storeToRefs(store) // auto-unwrapped in template
  const bump = (): void => { store.count.value++ }   // script access via .value
</script>
```

Full docs (Chinese): https://mengxi-studio.github.io/unix-pinia/

## License

[MIT](./license.md)
