[中文](./README.md) | **English**

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="WeChat Official Account QR" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-pinia</h1>
  <p>Pinia-style state management for uni-app x (strict UTS, setup stores, one API across platforms)</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-pinia.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-pinia?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-pinia)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-pinia?color=green)

</div>

## Why unix-pinia

In uni-app x **vdom-mode native apps**, the standard Pinia cannot compile (Vapor mode supports all platforms; vdom mode only supports Web / mini-programs), while the official "export a global reactive variable" recipe lacks any conventions — store naming, cross-page singletons, batch updates and subscriptions are all left to you. unix-pinia brings the full Pinia workflow to UTS:

- **Used Pinia before?** The `defineStore` / `storeToRefs` / `createPinia` mental model maps 1:1 — state via `Ref`, getters via `ComputedRef`, actions via arrow functions. Pick it up at a glance;
- **Multi-platform?** The same UTS source compiles to JS on Web and Kotlin on Android, on the fly by the uni-app x toolchain, with no JS bridge;
- **Tricky pitfalls answered?** UTS-has-no-Proxy unwrapping differences, Kotlin generics erasure, unreliable `app.use` on native — each verified on both platforms and documented with replacements.

Design principle: replicate the Pinia API surface 1:1 and **prune what the platform cannot implement** (in the spirit of unix-router replicating vue-router). Every pruned item comes with a reason and a replacement — see the [diff table](#differences-from-standard-pinia).

## Features

- **Setup-style defineStore** - `defineStore<T>(id, setup)`: state via `Ref`, getters via `ComputedRef`, actions via arrow functions, matching the officially recommended Pinia style; explicit `type` annotation for full editor support
- **Mount-free singletons** - a module-level registry guarantees app-lifetime stores shared across pages, no `app.use` required; zero setup code for pure state management
- **Instance APIs as top-level functions** - `patch` / `dispose` / `getStoreId` mirror `$patch` / `$dispose` / `$id` (UTS has no Proxy, so methods cannot be attached to store objects)
- **Cross-store dependencies** - call the other `useStore` inside setup; the registry guarantees singletons
- **Plugin system** - chainable `pinia.use(plugin)` with `PiniaPluginContext` (`pinia` / `store` / `storeId`) matching standard Pinia
- **Idempotent & predictable** - duplicate `defineStore` with the same id warns and returns the existing instance; after `dispose`, `useStore` rebuilds a fresh store
- **Strictly typed UTS** - fully explicit annotations; the Kotlin generics-erasure boundary (`as any`) is contained inside the library, invisible to business code
- **Verified on both platforms** - full test suite passes on Web (JS toolchain) and Android (Kotlin toolchain, real device) with identical behavior

## Install

**npm** — sync the package into your project's `uni_modules/ux-pinia/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

**Plugin market**: search `ux-pinia` in HBuilderX.

> `packages/core` is a standard **uni_modules UTS plugin** (official `utssdk/` layout + `interface.uts` declarations); import from `@/uni_modules/ux-pinia` in your code.

## Quick start

### 1. Define a store (stores/counter.uts)

```uts
import type { Ref, ComputedRef } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'

export type CounterStore = {
	count: Ref<number>,                   // state: Ref
	doubleCount: ComputedRef<number>,     // getter: ComputedRef
	increment: () => void,                // action: arrow function (UTS forbids passing function declarations as values)
	reset: () => void                     // replacement for $reset: custom reset action
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => {
	const count: Ref<number> = ref(0)
	const doubleCount: ComputedRef<number> = computed((): number => count.value * 2)
	const increment = (): void => { count.value++ }
	const reset = (): void => { count.value = 0 }
	return { count, doubleCount, increment, reset } as CounterStore
})
```

> Type import rule: `ComputedRef` is NOT globally injected — you must `import type { ComputedRef } from 'vue'`; `Ref` is injected but importing it explicitly is recommended for consistency.

### 2. Use in a page

```uts
import { storeToRefs } from '@/uni_modules/ux-pinia'
import { useCounterStore } from '@/stores/counter.uts'

const store = useCounterStore()                    // repeated calls return the same instance (shared across pages)
const { count, doubleCount } = storeToRefs(store)  // auto-unwrapped in templates

store.count.value++                                // script access via .value (UTS has no Proxy)
```

### 3. Instance APIs (top-level function mapping of $-methods)

```uts
import { patch, dispose, getStoreId } from '@/uni_modules/ux-pinia'

// ≙ store.$patch(fn): batch update (mutator form only)
patch(store, (s: CounterStore): void => { s.count.value = 10 })

const id: string = getStoreId(store)   // ≙ store.$id → 'counter'

dispose(store)                         // ≙ store.$dispose(): next useStore rebuilds
```

### 4. Cross-store dependencies & plugins

```uts
// Cross-store dependency: call the other useStore inside setup
export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
	const counterStore = useCounterStore()
	const score: Ref<number> = ref(0)
	const addScoreFromCount = (): void => { score.value += counterStore.count.value }
	return { score, addScoreFromCount } as UserStore
})

// Plugins (optional; register at top level of main.uts — P8 finding: app.use is unreliable on native,
// explicit top-level registration is the only reliable form)
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

### Verification

The repo ships a demo app at [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground). Its home page auto-runs the full suite (reactivity matrix / cross-page singleton / patch / dual-store calls / idempotency / dispose-rebuild), logs with a `[verify]` prefix and renders pass/fail on the page. It is a plain HBuilderX project — open `packages/playground` in HBuilderX to release Web / Android and re-run the same suite.

**Android demo APK (cloud build)**: [Download APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1792298656822-__UNI__0AA2919_1792298648182.apk) (vdom mode; open each feature page to see the `[verify]` results)

**Verified on both platforms**: all cases pass on Web and on an Android real device (Kotlin toolchain) with identical behavior; iOS / HarmonyOS share the same codebase, pending on-device testing.

## Community & Support

- 📖 [Full docs](https://mengxi-studio.github.io/unix-pinia/) (guides + API reference + changelog, in Chinese)
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)

## Exports

- API: `defineStore` / `storeToRefs` / `createPinia` / `setActivePinia` / `getActivePinia` / `patch` / `dispose` / `getStoreId`
- Types: `Pinia` / `PiniaPlugin` / `PiniaPluginContext` / `Unsubscribe` / `SubscribeCallback`

## Documentation

📖 Full documentation (guides + API reference + changelog):

**[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)**

Suggested reading path: [Introduction](https://mengxi-studio.github.io/unix-pinia/guide/introduction.html) →
[Getting started](https://mengxi-studio.github.io/unix-pinia/guide/getting-started.html) →
[Basic usage](https://mengxi-studio.github.io/unix-pinia/guide/basic-usage.html) →
[Differences from standard Pinia](https://mengxi-studio.github.io/unix-pinia/guide/pinia-diff.html); API details in the [API reference](https://mengxi-studio.github.io/unix-pinia/api/functions.html).

## Changelog

📝 **[https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md](https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md)**

## License

[MIT](./license.md)
