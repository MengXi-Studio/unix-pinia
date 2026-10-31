# Changelog

## [0.2.0] - 2026-10-31

### Changed (breaking)

- **Architecture upgrade: class + reactive**: stores are now defined as `class XxxStore extends PiniaStoreBase` — state wrapped in strongly-typed `reactive<T>`, derived values as class getters, actions as plain methods; `defineStore<T>(id, factory)` returns the useStore function
- Setup-style APIs from 0.1.0 removed: `storeToRefs` (reactive state is template-reactive directly, no destructuring needed), top-level `patch(mutator)` (`$patch(partial)` is equivalent and type-safe), `loadPersisted` / `savePersisted` / `getStorageKey` (internalized by the built-in persistence plugin)

### Added

- **Full instance API**: `$patch(partial)` / `$reset()` / `$subscribe(cb)` / `$onAction(cb)` / `$dispose()` / `$id` / `$state` / `$save()` all available (driven by the three optionally-overridden Template Method hooks `_doReset` / `_hydrate` / `_serialize`)
- **Built-in persistence plugin**: `createPersistPlugin` (automatic restore on store creation, automatic `_serialize` snapshot save on `$patch` / `$reset` / `$save`) + `clearPersistedState` (clears one store's persisted data)
- **Persistence merged into the main package**: the standalone ux-pinia-persist plugin is discontinued; swappable storage backend (`setStorageAdapter` + `StorageAdapter` type, uni storage by default, unix-storage / native preferences supported)
- **Verification**: full suite passes on Web; Android cloud build (Kotlin toolchain, vapor mode) passes, on-device cases under re-verification

## [0.1.0] - 2026-10-18

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
