# Internals

unix-pinia is not a port of standard Pinia — it is a **re-implementation** on top of uni-app x built-in reactivity primitives (`reactive` / `computed`, compile-time expanded). Understanding the four core adjudications means understanding the entire design.

## 1. Where singletons come from: the module-level registry

Standard Pinia installs a plugin via `app.use(pinia)` and injects the instance. unix-pinia's runtime supports that chain incompletely (verified: `app.use` does not fire install on native), while UTS top-level variables compile to Kotlin static members — **a natural app-level singleton**.

```uts
// registry.uts (simplified)
const storeMap: Map<string, any> = new Map<string, any>()
```

The first `useStore()` call runs `factory()` and registers into `storeMap`; later calls hit the cache. Cross-page sharing and same-id idempotency are all guaranteed here.

## 2. Why class + reactive

Two hard platform constraints leave only one viable path:

- **UTS has no Proxy and no reflection**: in the setup-style + Ref form, `$patch` / `$subscribe` / `$onAction` / `$reset` cannot be implemented (a store object cannot carry methods, fields cannot be enumerated)
- **Runtime-class vue symbols break**: recent HBuilderX compilers do not generate Kotlin imports (Unresolved reference) for `Ref` / `ref` / `watch` / `effectScope` inside UTS plugins; while `reactive<T>` / `computed` are **compile-time expanded** (property-proxy classes, dependency tracking inlined in getters/setters) and unaffected

Class + reactive was therefore finalized: state wrapped in `reactive<T>`, actions as plain methods, derived values as class getters — in exchange for the full $-API surface. `effectScope` is silently dropped by the generator and a computed would bind to the scope of the page that first creates the store, hence getters for derived values.

## 3. The three Template Method hooks

UTS's `reactive<T>` returns a strongly-typed class that cannot be cast to `UTSJSONObject`, and the framework cannot reflect over fields — `$reset` / `$patch` / persistence / `$subscribe` dispatch are therefore driven by the "three hooks the user overrides on demand":

| Hook | Drives | Default behavior |
| --- | --- | --- |
| `_doReset()` | `$reset()` | no-op (only notifies subscribers) |
| `_hydrate(data)` | `$patch(partial)` loading + persistence restore | no-op |
| `_serialize()` | `$subscribe` snapshot + persistence save | empty object |

All three hooks can be left unoverridden — state mutations / actions / `$subscribe` (triggered by `$patch` / `$reset`) still work.

## 4. Kotlin boundaries contained inside the library

- Kotlin generics erasure: generic values crossing `Map<string, any>` need an explicit `as any` (error17) — invisible to business code
- Nullability: UTS `any` generates a non-null Kotlin `Any`; a class field initialized to null must be declared `any | null` (e.g. `$state: any | null`)
- UTS function type aliases must use arrow syntax `(x) => void`; the colon form fails to compile

## 5. Entry architecture

Aligned with the official UTS plugin architecture (declaration / implementation split):

- `interface.uts` declares all public types inline (uts-proxy and editor hints parse only this file)
- `index.uts` declares all public APIs inline (`export function` named implementations forwarding to domain-level `Impl` functions; **re-export forwarding chains are forbidden** — release Kotlin compilation only accepts inline entry declarations)
- Implementation functions always carry the `Impl` suffix to avoid Kotlin silently mangling same-name top-level export symbols (`__1`)
- Runtime-class vue symbols are banned inside plugins; `reactive` / `computed` (compile-time expanded) are usable
