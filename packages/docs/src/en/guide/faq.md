# FAQ

## Does script access to state need `.value`?

No. state is a strongly-typed `reactive<T>` object; `counter.state.count` is read/written directly through the same path in scripts and templates, and derived getters work the same way (`counter.doubleCount`). See [Internals](./internals).

## Why are stores classes?

UTS has no Proxy and no reflection, so the setup-style + Ref form cannot implement `$patch` / `$subscribe` / `$onAction` / `$reset`; moreover, recent HBuilderX compilers fail to generate Kotlin imports for runtime-class vue symbols (`Ref` / `watch` / `effectScope`) inside UTS plugins. Class + reactive (`reactive<T>` compile-time expansion) is the only viable architecture for a full $-API inside a plugin. See [Internals](./internals).

## Why getters instead of computed for derived values?

`effectScope` is unavailable inside plugins; a computed binds to the scope of the page that first creates the store and stops working across pages. A class getter is evaluated per access, with dependency tracking happening automatically through reactive property access — no lifecycle issues.

## Why does `$subscribe` fire only on `$patch` / `$reset` / `$save`?

UTS has no global field-subscription hook, so direct mutations cannot be observed. For snapshot / persist-to-storage scenarios, call `store.$save()` explicitly after key operations. See [Basic usage](./basic-usage#state-subscriptions).

## Why must template event bindings include parentheses?

A class method is not a value on Kotlin (Web's first-class JS functions mask the difference): `@click="counter.increment"` fails to compile — it must be `@click="counter.increment()"`.

## Why is `app.use(pinia)` not needed?

unix-pinia uses a module-level registry instead of the Vue plugin injection chain — import and use. Verified: `app.use(Pinia instance)` does not fire install on native (cross-platform inconsistency), so mount-free is the only reliable form. For plugins, use top-level `setActivePinia(createPinia().use(plugin))` in `main.uts`.

## Why does persistence require overriding `_serialize` / `_hydrate`?

UTS's `reactive<T>` returns a strongly-typed class that cannot be cast to `UTSJSONObject` or reflectively enumerated — the framework cannot know which fields your state has and which of them need persistence. The two hooks are the persistence contract: `_serialize` defines the snapshot, `_hydrate` defines the refill. Without overriding them, persistence for that store is a no-op.

## Does it support iOS / HarmonyOS?

The codebase is fully platform-homogeneous (pure UTS, no platform branches), so direct compilation on the Swift / ArkTS toolchains is expected. Today the full suite is verified on Web and the Android cloud build passes; iOS / HarmonyOS will be reflected on the [Platform support](./platform) page after re-verification.

## Can Vapor-mode projects use it?

Yes — verified via cloud build (Vapor mode). That said, Vapor-mode projects can also use standard Pinia directly on all platforms (officially adapted); this library's incremental value lies in a unified paradigm plus the built-in persistence plugin.

## Can a getter depend on another store?

Technically possible, but **not recommended** — put cross-store references inside methods to avoid circular getter dependency chains (same caveat as standard Pinia). See [Best practices](./best-practices).

## Compared with exporting a global reactive variable, what is the value?

The official lightweight recipe (exporting a module-level reactive variable) fits a single state in a single file. unix-pinia provides the **paradigm**: id namespaces with idempotency, unified organization (state / getter / action layering), the full $-API, the built-in persistence plugin, cross-store composition, and the lowest-cost migration path to standard Pinia.
