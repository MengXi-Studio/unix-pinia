# FAQ

## Why do scripts need `.value` when standard Pinia does not?

UTS compiles to Kotlin/Swift without Proxy, so `reactive()` cannot auto-unwrap Refs (verified: fields keep their `RefImpl` form). Templates are unaffected — Refs from `storeToRefs` destructuring are auto-unwrapped by the uvue renderer. See [Internals](./internals).

## Why is there no `$subscribe`?

Whole-store subscription requires enumerating all state fields; UTS cannot reflect over object fields, and `deep watch` was verified not to fire on RefImpl fields in Android (it works on Web — a cross-platform mismatch, hence pruned). Replacement: per-field subscription `watch(store.count, cb)` — same semantics, more precise types.

## Why is `patch` a top-level function instead of `store.$patch()`?

UTS objects cannot gain dynamic properties, so `$patch` cannot be attached to the type object returned by setup. The top-level `patch(store, fn)` is the equivalent form under this platform constraint.

## Why is `app.use(pinia)` not needed?

unix-pinia uses a module-level registry instead of the Vue plugin injection chain — import and go. Verified: `app.use(Pinia instance)` does not fire install on native (cross-platform mismatch), so mount-free is the only reliable form. For plugins, use top-level `setActivePinia(createPinia().use(plugin))` in `main.uts`.

## Does it support iOS / HarmonyOS?

The codebase is fully platform-homogeneous (pure UTS, no platform branches) and is expected to compile directly on Swift / ArkTS toolchains. Android + Web are verified today; this page will be updated after on-device verification. See [Platform support](./platform).

## Can Vapor-mode projects use it?

It runs, but they **shouldn't** — Vapor-mode projects can use the standard Pinia on all platforms (officially adapted). unix-pinia targets vdom-mode native apps.

## Can a getter depend on another store?

Technically possible, but **not recommended** — put cross-store references in actions or at the top of setup to avoid circular getter chains (same caveat as standard Pinia). See [Best practices](./best-practices).

## How is this different from just exporting a global reactive variable?

The official lightweight recipe fits a single state file. unix-pinia provides the **conventions**: id namespaces with idempotency, unified structure (state/getter/action layering), `storeToRefs` template binding, instance APIs, cross-store composition, and the lowest-cost migration path to standard Pinia.
