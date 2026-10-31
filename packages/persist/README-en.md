**[中文](./README.md)** | English

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="WeChat Official Account QR" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-pinia-persist</h1>
  <p>Persistence showcase plugin for uni-app x (storage primitives + one-line-per-field convention, swappable backends)</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-pinia.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-pinia-persist?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-pinia-persist)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-pinia-persist?color=green)

</div>

## Why unix-pinia-persist

State in uni-app x lives in memory and vanishes on cold start — counters, auth tokens and user preferences all require hand-written `getStorageSync` / `setStorageSync` boilerplate, plus your own serialization, dirty-data handling and key naming. The standard Pinia ecosystem's [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) cannot help here: on the vdom-mode native side standard Pinia itself is unavailable, and UTS has no reflection and no property injection — the zero-convention `{ persist: true }` form has no foundation to exist. unix-pinia-persist condenses persistence into **two storage primitives + a one-line convention**:

- **Used persistedstate before?** The "declare it and it persists" mindset is preserved: one `persistedRef` line per field, with restore and auto-save built in;
- **Care about data safety?** Each field is stored in its own JSON envelope (`{ v }`) — avoiding the ambiguity between uni storage's "miss returns empty string" and legitimate empty values, with corrupted data falling back to defaults automatically;
- **Swappable backends?** `setStorageAdapter` switches to unix-storage / native preferences in one call with zero business-code changes.

## Features

- **Pure storage primitives** - `loadPersisted` / `savePersisted`: JSON-envelope reads and writes with automatic fallback on miss or corruption; the plugin layer has zero vue dependency
- **One line per field** - the host-project `persistedRef` helper (see below): declare it and it persists, with restore and field-level watch auto-save built in
- **Swappable backend** - `setStorageAdapter`: uni storage by default, unix-storage / native preferences on demand, zero business-code changes
- **Rock-solid architecture** - zero vue symbols in the plugin layer (proven by HBuilderX 5.34 cloud packaging: Kotlin import generation for vue symbols inside UTS plugins fails; staying isomorphic with ux-pinia core is the only stable form), no extra risk on the Kotlin / JS compile chains
- **Strongly-typed UTS** - fully explicit type annotations; Kotlin nullability edges (`Any?`, object-literal bridging) are contained inside the library
- **Battle-tested** - all test cases pass on Web (JS compile chain); Android is isomorphic with core (Kotlin compile chain), pending on-device re-verification

## Installation

**npm** — after installing, sync the package into your project's `uni_modules/ux-pinia-persist/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-pinia-persist
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia-persist uni_modules/ux-pinia-persist
```

**Plugin marketplace**: search `ux-pinia-persist` in HBuilderX.

> `packages/persist` is a standard **uni_modules UTS plugin** (official `utssdk/` layout + `interface.uts` declarations); import it from `@/uni_modules/ux-pinia-persist`.

## Quick Start

### 1. Define the helper in the host project (stores/persist-helper.uts)

The plugin layer ships pure storage primitives (zero vue symbols); the vue APIs (`ref` / `watch`) for restore and auto-save are composed once in the host project and reused everywhere:

```uts
// stores/persist-helper.uts (host-project file, vue APIs allowed)
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { loadPersisted, savePersisted } from '@/uni_modules/ux-pinia-persist'

/** Persisted field: restore initial value + field-level watch auto-save */
export function persistedRef<T>(storeId: string, key: string, defaultValue: T): Ref<T> {
	const saved: any | null = loadPersisted(storeId, key)
	const r: Ref<T> = ref(saved != null ? (saved as T) : defaultValue) as Ref<T>
	watch(r, (nv: any, ov: any): void => {
		savePersisted(storeId, key, nv)
	})
	return r
}
```

### 2. One line per field in your store (stores/user.uts)

```uts
import type { Ref } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'
import { persistedRef } from './persist-helper.uts'

export type UserStore = {
	token: Ref<string>,        // persisted field
	tempView: Ref<string>      // in-memory field
}

export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
	const token: Ref<string> = persistedRef('user', 'token', '')  // ← one line per field
	const tempView: Ref<string> = ref('')
	const setToken = (t: string): void => { token.value = t }     // actions never worry about saving
	return { token, tempView, setToken } as UserStore
})
```

- **Restore**: `persistedRef` reads the initial value from storage when creating the ref (misses and corrupted data fall back to defaults automatically)
- **Save**: a field-level watch is built in; every change writes to storage (app-level lifecycle, no plugin to register, main.uts stays mount-free)
- **Direct read / debugging**: `getStorageKey('user', 'token')` composes the full key `ux-pinia-persist:user.token` for console inspection

### 3. Swap the storage backend (optional)

```uts
import { setStorageAdapter } from '@/uni_modules/ux-pinia-persist'

// Call before the first field read/write; unix-storage shown as an example
setStorageAdapter({
	get: (key: string): string | null => {
		const r: any | null = uni.getStorageSync(key)
		return r == null || (r as string).length == 0 ? null : r as string
	},
	set: (key: string, value: string): void => { uni.setStorageSync(key, value) }
})
```

## Live Demo

The bundled playground ([packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)) verifies the full chain on its "Persist" page with test cases PS1-1 ~ PS1-5 (auto-save on change / direct storage read to verify the envelope / in-memory field as the negative control / startup restore), logging with a `[verify]` prefix and rendering pass/fail right on the page. Open `packages/playground` in HBuilderX to build for Web / Android and re-run the same suite.

**Android demo build (cloud-packaged)**: [Download APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793386392738-__UNI__0AA2919_1793386383661.apk) (vapor mode; open the "Persist" page to see the PS1 results)

**Cross-platform results**: all test cases pass on Web; the Android plugin is isomorphic with ux-pinia core (zero vue symbols on the Kotlin compile chain), pending on-device re-verification.

## Differences from pinia-plugin-persistedstate

| Item | persistedstate | This library |
| --- | --- | --- |
| Declaration cost | `{ persist: true }`, zero convention | One `persistedRef` line per field |
| Mechanism | Proxy interception + `$subscribe` + `$hydrate` injection | Storage primitives + host-project helper composition (no reflection / no injection) |
| Serialization | Full JSON snapshot | Per-field JSON envelope (`{ v }`) with automatic fallback |
| Subscription granularity | Global `$subscribe` | Field-level `watch` (P9 finding: deep watch never fires on Android) |

## Community & Support

For design notes and internals (JSON-envelope serialization, the swappable-backend contract, the plugin architecture constraint proven by the 5.34 compiler, etc.), follow the WeChat official account **梦曦工作室** (MengXi Studio):

<p align="center">
  <img alt="WeChat Official Account QR" width="180" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
</p>

- 📖 [Full documentation](https://mengxi-studio.github.io/unix-pinia/) (guides + API reference + changelog)
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)

## Exports

- APIs: `loadPersisted` / `savePersisted` / `getStorageKey` / `setStorageAdapter`
- Types: `StorageAdapter`

## Documentation

📖 Unified docs for the unix-pinia family (guides + API reference + changelog):

**[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)**

## Changelog

📝 **[https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/playground/uni_modules/ux-pinia-persist/changelog.md](https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/playground/uni_modules/ux-pinia-persist/changelog.md)**

## License

[MIT](./license.md)
