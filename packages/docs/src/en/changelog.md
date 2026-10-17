# Changelog

## [0.1.0] - 2026-10-17

First public release.

### Added

- **Setup-style defineStore**: `defineStore<T>(id, setup): () => T` — state via `Ref`, getters via `ComputedRef`, actions via arrow functions; same-id duplicates warn and stay idempotent
- **Module-level singleton registry**: app-lifetime stores shared across pages (verified on Web + Android)
- **storeToRefs**: template destructuring with auto-unwrapping
- **Instance APIs as top-level functions**: `patch` (≙ `$patch` mutator form) / `dispose` (≙ `$dispose`) / `getStoreId` (≙ `$id`)
- **Pinia instance & plugin system**: `createPinia` / `setActivePinia` / `getActivePinia` / `pinia.use(plugin)` (plugins return void — a UTS constraint)
- **Mount-free design**: zero setup code for pure state management; plugins via top-level `setActivePinia(createPinia().use(plugin))`
- **Platform verification**: vdom-mode Web and App-Android (Kotlin toolchain) full suites pass

### Known differences

- Script state access requires `.value` (UTS has no Proxy); templates auto-unwrap after `storeToRefs` destructuring
- `$subscribe` / `$onAction` / `$state` / `$patch` object form / Options-style defineStore are not supported — see "Differences from standard Pinia"
