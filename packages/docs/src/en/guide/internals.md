# Internals

unix-pinia is not a port of the standard Pinia — it is a **re-implementation** on top of uni-app x built-in reactivity primitives (`ref` / `computed` / `reactive` / `watch`). Three adjudications explain the entire design.

## 1. Where singletons come from: the module-level registry

Standard Pinia installs a plugin via `app.use(pinia)` and injects the instance. unix-pinia's runtime (vdom-mode native) supports that chain incompletely (verified: `app.use` does not fire install), while UTS top-level variables compile to Kotlin static members — **a natural app-level singleton**.

```uts
// registry.uts (simplified)
const storeMap: Map<string, any> = new Map<string, any>()
```

The first `useStore()` call runs `setup()` and registers into `storeMap`; later calls hit the cache. Cross-page sharing and same-id idempotency both come from this.

## 2. Why scripts need `.value`: UTS has no Proxy

The standard Pinia store is a reactive proxy; `store.count` auto-unwraps the Ref. After UTS compiles to Kotlin there is **no Proxy**, and `reactive()` returns a strongly-typed object (RefImpl fields are kept as-is — verified, no unwrapping). Objects also cannot gain dynamic properties, so `$patch` and friends cannot hang off the store.

Hence **Plan B**: the setup return object passes through as-is — `.value` in scripts, template auto-unwrapping via `storeToRefs` destructuring, instance APIs as top-level functions. This is the only form with **identical behavior on both platforms**.

## 3. The API boundary: no reflection

UTS cannot enumerate object fields at runtime, which directly determines the pruned list:

- `$state` snapshots, `$patch(object)`, automatic `$onAction` tracking — all require field enumeration, not implementable
- `$subscribe` was attempted via `watch(reactive(store), deep)`; Android does not fire it for RefImpl fields (verified on both platforms), so it was pruned
- Kotlin generics erasure forces explicit `as any` when generic values cross `Map` boundaries (error17) — contained inside the library

## 4. Entry architecture

Aligned with the official UTS plugin architecture (declaration / implementation split):

- `interface.uts` declares all public types inline (uts-proxy and editor hints parse only this file)
- `index.uts` declares all public APIs inline (`export function` forwarding to domain-level `Impl` functions; **re-export chains are forbidden** — release Kotlin builds only accept inline entry declarations)
- Implementation functions always carry the `Impl` suffix to avoid Kotlin silent symbol mangling (`__1`) of same-name top-level symbols
