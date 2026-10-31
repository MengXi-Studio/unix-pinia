# Differences from standard Pinia

unix-pinia aligns with standard Pinia's feature surface and usage habits. Because UTS compiles to Kotlin/Swift without Proxy and without reflective field enumeration, and recent HBuilderX compilers fail to generate Kotlin imports for runtime-class vue symbols (`Ref` / `watch` / `effectScope`) inside UTS plugins, some capabilities take a different form or are pruned — each listed below.

## Architecture form differences

| Standard Pinia | unix-pinia | Reason |
| --- | --- | --- |
| setup-style or Options-style defineStore | class-style: `class XxxStore extends PiniaStoreBase` | class + reactive is the only viable architecture for a full $-API inside a plugin |
| state in any shape (ref / reactive mixed) | state is a class field wrapped in strongly-typed `reactive<T>` (primitive-value fields) | UTS has no Proxy and the Ref-unwrapping behavior is inconsistent across platforms; reactive is compile-time expanded and consistent |
| getter = `computed` | derived values = class getters | `effectScope` is unavailable inside plugins and computed stops working across pages; getters are evaluated per access with no lifecycle issues |
| script access `store.count` | `store.state.count` (no `.value`) | state is a strongly-typed reactive object; scripts and templates share the same path |
| return type auto-inferred | factory return type annotated explicitly (a class instance) | UTS inference is limited; explicit annotation is safer |

## Instance API differences

| Standard Pinia | unix-pinia | Notes |
| --- | --- | --- |
| `$patch(fn)` / `$patch(partial)` | `$patch(partial: UTSJSONObject)` — object form only | no `Partial<T>` inference; loading goes through the `_hydrate` hook and stays type-safe |
| `$subscribe(cb)` fires on any change | `$subscribe(cb)` fires only on `$patch` / `$reset` / `$save` | UTS has no global field-subscription hook; call `$save()` after direct mutations |
| `$onAction` tracks all actions automatically | only actions wrapped with `callAction` are tracked | UTS cannot wrap methods automatically |
| `$state = { ... }` whole replacement | `$state` is a read-only reference (same as `store.state`) | a reactive object cannot be cast wholesale; mutate per field + `$patch` |
| `$reset()` built in (Options stores) | `$reset()` is defined by the `_doReset` hook | standard Pinia does not build it in for setup stores either |
| plugins may return an object merged into the store | plugins return `void`, hook logic only | UTS forbids injecting properties into existing objects dynamically |

## Pruned APIs

| API | Reason | Replacement |
| --- | --- | --- |
| Options-style `defineStore` | `this` in UTS is limited to class methods (the class style already covers that form) | class-style defineStore |
| Options helpers like `mapState` | composition is the mainstream; spread injection is unverified | access `store.state.x` and getters directly |
| devtools / HMR / SSR / `acceptHMRUpdate` | no corresponding mechanism on native | — |

## Behavioral parity (not pruned)

| Item | Notes |
| --- | --- |
| required id | standard Pinia's id inference relies on Symbol/SSR context |
| same-id idempotency | duplicate `defineStore` warns and returns the existing instance |
| multiple Pinia instances | one globally unique store registry (uni-app x apps have no multi-instance isolation scenario); `createPinia` instances carry plugins and the active flag |

## Mounting difference

`app.use(pinia)` does not fire install on native (verified) — unix-pinia adopts **mount-free** as the only reliable form: it works with zero mounting code; for plugins, top-level `setActivePinia(createPinia().use(plugin))`.

## Template binding difference

Template event bindings to class methods **must include parentheses**: `@click="counter.increment()"` — a method is not a value on Kotlin (Web's first-class JS functions mask the difference).
