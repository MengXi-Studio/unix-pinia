# Differences from standard Pinia

unix-pinia replicates the Pinia API surface 1:1; because UTS compiles to Kotlin/Swift without Proxy, objects cannot gain dynamic properties and fields cannot be enumerated at runtime, some capabilities cannot be implemented. Each is listed with its reason and replacement.

## Form differences (implemented, different form)

| Standard Pinia | unix-pinia | Reason |
| --- | --- | --- |
| `store.$patch(fn)` | `patch(store, fn)` top-level function | methods cannot be attached to store objects |
| `store.$id` | `getStoreId(store)` | same |
| `store.$dispose()` | `dispose(store)` | same |
| Script state access `store.count` | `store.count.value` | UTS has no Proxy; templates auto-unwrap after `storeToRefs` destructuring |
| `defineStore` type inference | explicit `type` annotation required | UTS inference is limited; explicit is safer |
| `pinia.use` plugins may return objects merged into the store | plugins return `void`, hook logic only | UTS forbids injecting properties into existing objects |

## Pruned APIs (not implementable)

| API | Reason | Replacement |
| --- | --- | --- |
| Options-style `defineStore` | UTS `this` is limited to class methods | setup style (Pinia officially recommends it too) |
| `$patch(对象)` object form | no `Partial<T>`, no field reflection | `patch(store, mutator)` |
| `$subscribe(cb)` | deep watch does not fire on RefImpl fields in Android (verified, cross-platform mismatch) | per-field `watch(store.count, cb)` |
| `$onAction(cb)` | action enumeration is not implementable | explicit logging inside actions |
| `$state` snapshot | field enumeration is not implementable | per-field operations inside a patch mutator |
| `mapState` helpers | composition API is the mainstream; spread injection unverified | `storeToRefs` destructuring |
| devtools / HMR / SSR | no such mechanisms on native | — |
| `acceptHMRUpdate` | same | — |

## Behavioral parity (not pruned)

| Item | Note |
| --- | --- |
| `$reset` not built in | standard Pinia's setup stores behave the same (throws); provide a custom reset action |
| Required `id` | Pinia's id inference relies on Symbol/SSR context |
| Multiple Pinia instances | one global store registry (no multi-instance isolation scenario in uni-app x apps); `createPinia` instances carry plugins and the active flag |

## Mounting difference

`app.use(pinia)` does not fire `install` on vdom-mode native (verified) — unix-pinia adopts **mount-free** as the only reliable form: zero setup code; for plugins use top-level `setActivePinia(createPinia().use(plugin))`.
