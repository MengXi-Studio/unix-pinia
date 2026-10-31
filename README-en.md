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
  <p>Pinia-style state management with built-in persistence for uni-app x (class-style stores, strict UTS, one API across platforms)</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-pinia.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-pinia?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-pinia)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-pinia?color=green)

</div>

## Why unix-pinia

In uni-app x **vdom-mode native apps**, the standard Pinia cannot compile (Vapor mode supports all platforms; vdom mode only supports Web / mini-programs), while the official "export a global reactive variable" recipe lacks any conventions — store naming, cross-page singletons, batch updates, subscriptions and persistence are all left to you. unix-pinia brings the full Pinia workflow to UTS:

- **Used Pinia before?** The class-style `defineStore` mirrors the official `state / getters / actions` mental model — state wrapped in strongly-typed `reactive<T>`, derived values as getters, actions as plain methods;
- **Want the full $-API?** `$patch` / `$reset` / `$subscribe` / `$onAction` / `$dispose` / `$id` / `$state` are all built in (on the class + reactive architecture);
- **Want persistence?** Built-in `createPersistPlugin`: automatic restore on store creation, automatic save on `$patch` / `$reset` / `$save` — just override the `_serialize` / `_hydrate` hooks when needed;
- **Multi-platform?** The same UTS source compiles to JS on Web and Kotlin on Android, on the fly by the uni-app x toolchain, with no JS bridge.

Design note: UTS has no Proxy and no reflection, and recent HBuilderX compilers fail to generate Kotlin imports for runtime-class vue symbols (`Ref` / `watch` / `effectScope`) inside UTS plugins — **class + reactive is the only viable architecture for a full Pinia surface in a uni-app x plugin**. `reactive<T>` in UTS is compile-time expanded (property proxies are generated) and unaffected by that constraint.

## Features

- **Class-style defineStore** - `class XxxStore extends PiniaStoreBase`: state wrapped in `reactive<T>`, derived values as getters, actions as plain methods; `defineStore<T>(id, factory)` returns the useStore function
- **Full instance API** - `$patch(partial)` / `$reset()` / `$subscribe(cb)` / `$onAction(cb)` / `$dispose()` / `$id` / `$state` / `$save()` all available
- **Built-in persistence plugin** - `createPersistPlugin({ keyPrefix, includeStores, excludeStores, serializer })`: automatic restore on store creation, automatic save on `$patch` / `$reset` / `$save`; `clearPersistedState` clears a single store
- **Mount-free singletons** - a module-level registry guarantees app-lifetime stores shared across pages; zero setup code for pure state management
- **Plugin system** - chainable `pinia.use(plugin)` with `PiniaPluginContext` (`pinia` / `store` / `storeId`) matching standard Pinia
- **Cross-store dependencies** - call the other `useStore()` inside a method; the registry guarantees singletons
- **Swappable storage backend** - `setStorageAdapter({ get, set, remove })`: uni storage by default, unix-storage / native preferences on demand
- **Idempotent & predictable** - duplicate `defineStore` with the same id warns and returns the existing instance; after `$dispose`, `useStore` rebuilds a fresh store
- **Strictly typed UTS** - fully explicit annotations; the Kotlin generics-erasure and nullability boundaries (`as any` / `any | null`) are contained inside the library
- **Verified on both platforms** - full test suite passes on Web (JS toolchain); Android cloud build (Kotlin toolchain) passes, on-device cases under re-verification

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
import { reactive } from 'vue'
import { defineStore, PiniaStoreBase } from '@/uni_modules/ux-pinia'

export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  // state: strongly-typed reactive wrapper (primitive fields, accessed directly)
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  // derived value: class getter (evaluated per access, reactive via property tracking)
  get doubleCount(): number {
    return this.state.count * 2
  }

  // constructor: call bindState(this.state) after super() — required by $-APIs and persistence
  constructor() {
    super()
    this.bindState(this.state)
  }

  // actions = plain class methods, mutate state directly
  increment(): void {
    this.state.count++
  }

  setName(n: string): void {
    this.state.name = n
  }
}

export const useCounterStore = defineStore<CounterStore>('counter', (): CounterStore => new CounterStore())
```

> **Why a getter instead of a computed field**: `effectScope` is unavailable inside plugins, a computed field binds to the page that first creates the store and stops working across pages. A getter is evaluated per access and has no such issue (dependency tracking happens through reactive property access).

### 2. Use in a page

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
    <button @click="counter.$reset()">reset</button>
  </view>
</template>
```

> Script access: `counter.state.count` (reactive field, read/write directly, no `.value`). **Template event bindings to class methods must include parentheses**: `@click="counter.increment()"` (a method is not a value on Kotlin).

### 3. Instance APIs ($-methods)

```uts
const counter = useCounterStore()

// ≙ store.$patch(partial): batch update (loaded through the _hydrate hook)
counter.$patch({ count: 10 } as UTSJSONObject)

counter.$reset()                        // runs the _doReset hook, then notifies subscribers

const unsub = counter.$subscribe((type: string, state: UTSJSONObject): void => {
  // type = 'patch' | 'reset' | 'save'; state = the _serialize() snapshot
})
unsub()                                 // unsubscribe

counter.$save()                         // explicit save point (notifies subscribers; persistence plugin writes)
counter.$dispose()                      // next useStore rebuilds
counter.$id                             // → 'counter'
```

### 4. Cross-store dependencies & plugins

```uts
// Cross-store dependency: call the other useStore() inside a method (never in a field initializer)
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

// Plugins (optional; register at top level of main.uts — P8 finding: app.use is unreliable on native,
// explicit top-level registration is the only reliable form)
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
setActivePinia(createPinia().use(myPlugin))
```

### 5. Persistence (built-in plugin, zero glue)

Register the persistence plugin once in main.uts (applies to all stores):

```uts
// main.uts
import { createPinia, setActivePinia, createPersistPlugin } from '@/uni_modules/ux-pinia'

setActivePinia(createPinia().use(createPersistPlugin({
  keyPrefix: 'ux-pinia:',
  includeStores: null,                              // null = all stores
  excludeStores: new Array<string>(),
  serializer: null                                  // null = JSON.stringify
})))
```

Stores that need persistence override two hooks (Template Method contract):

```uts
export class UserStore extends PiniaStoreBase {
  state: UserState = reactive<UserState>({ token: '', tempView: '' })

  constructor() {
    super()
    this.bindState(this.state)
  }

  // Save snapshot: tempView excluded (in-memory control field)
  override _serialize(): UTSJSONObject {
    return { token: this.state.token } as UTSJSONObject
  }

  // Restore: per-field null checks (corrupted / missing data keeps initial values)
  override _hydrate(data: UTSJSONObject): void {
    if (data['token'] != null) {
      this.state.token = data['token'] as string
    }
  }
}
```

- **Restore**: the plugin reads storage and calls `_hydrate` on store creation (automatic, zero code)
- **Save**: `$patch` / `$reset` / `$save` trigger the `_serialize` snapshot write (automatic); after direct state mutations call `counter.$save()`
- **Swap backend**: `setStorageAdapter({ get, set, remove })` before creating any store
- **Debug**: `clearPersistedState('user', 'ux-pinia:')` clears one store's persisted data

### Verification

The repo ships a demo app at [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground). Its home page auto-runs the full suite (basic usage / reactivity / cross-page singleton / instance APIs / cross-store / subscriptions / plugins / persistence), logging with a `[verify]` prefix and rendering pass/fail on the page. Open `packages/playground` in HBuilderX to release Web / Android and re-run the same suite.

**Android demo APK (cloud build)**: [Download APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793456655694-__UNI__0AA2919_1793456648910.apk) (vapor mode; open each feature page to see the `[verify]` results)

**Verified on both platforms**: all cases pass on Web; the Android cloud build (Kotlin toolchain) passes with on-device cases under re-verification; iOS / HarmonyOS share the same codebase, pending testing.

## Community & Support

- 📖 [Full docs](https://mengxi-studio.github.io/unix-pinia/) (guides + API reference + changelog, in Chinese)
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)

## Exports

- APIs: `defineStore` / `createPinia` / `setActivePinia` / `getActivePinia` / `dispose` / `getStoreId` / `createPersistPlugin` / `clearPersistedState` / `setStorageAdapter`
- Classes: `PiniaStoreBase` (store base) / `Pinia` (instance)
- Types: `PiniaPlugin` / `PiniaPluginContext` / `Unsubscribe` / `StorageAdapter` / `PersistOptions` / `StateChangeCallback` / `ActionInfo`

## Documentation

📖 Full documentation (guides + API reference + changelog):

**[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)**

## Changelog

📝 **[https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md](https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/changelog.md)**

## License

[MIT](./license.md)
