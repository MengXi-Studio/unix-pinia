# Introduction

**unix-pinia** (`@meng-xi/unix-pinia`) provides Pinia-style state management with built-in persistence for uni-app x: written in UTS with class-style stores, one codebase across platforms.

## Why it exists

uni-app x has two compilation pipelines, and standard Pinia support looks like this:

| Compilation mode | Native app | Web / mini-programs |
| --- | --- | --- |
| Vapor mode | ✅ standard Pinia works out of the box | ✅ |
| vdom mode | ❌ standard Pinia unavailable | ✅ |

If your project runs on **vdom-mode native apps** (Android/iOS/HarmonyOS), standard Pinia cannot be used — that is exactly the gap unix-pinia fills. Vapor-mode projects can also use this library (verified via cloud build), or use standard Pinia directly.

## Features

- **Class-style defineStore**: `class XxxStore extends PiniaStoreBase` — state wrapped in strongly-typed `reactive<T>`, derived values as class getters, actions as plain methods; the structure aligns with the official `state / getters / actions` mental model
- **Full instance API**: `$patch` / `$reset` / `$subscribe` / `$onAction` / `$dispose` / `$id` / `$state` / `$save` all built in
- **Built-in persistence plugin**: register `createPersistPlugin` once and every store is covered — automatic restore on store creation, automatic persist to storage on `$patch` / `$reset` / `$save`; swappable storage backend
- **Mount-free singletons**: a module-level registry guarantees app-level singletons shared across pages, with no `app.use` needed
- **Native performance**: UTS source distribution (Web → JS, Android → Kotlin), compiled on the fly by the uni-app x toolchain
- **Strictly typed**: strongly-typed `reactive<T>` wrapping with full editor support; Kotlin generics-erasure and nullability boundaries are contained inside the library

## Design principles

**Class + reactive is the only viable architecture for a full Pinia feature surface inside a uni-app x plugin**:

- UTS has no Proxy and no reflection, and recent HBuilderX compilers fail to generate Kotlin imports for runtime-class vue symbols (`Ref` / `watch` / `effectScope`) inside UTS plugins — the setup-style + Ref form cannot support the full $-API
- `reactive<T>` in UTS is compile-time expanded (property proxies are generated) and unaffected by that constraint
- The framework cannot reflect over state fields, so `$reset` / `$patch` / persistence / `$subscribe` dispatch are driven by the "three hooks overridden on demand" (Template Method): `_doReset` / `_hydrate` / `_serialize`
- Every difference from standard Pinia is listed in the [diff table](./pinia-diff) with its reason and replacement

## Platform compatibility

| Scenario | Support |
| --- | --- |
| Web (JS toolchain) | ✅ full suite verified |
| App-Android (Kotlin toolchain) | ✅ verified via cloud build, on-device cases under re-verification |
| App-iOS / App-HarmonyOS | same codebase across platforms, pending testing |
| WeChat mini-program | declared support (rides the uni-app x toolchain), not specifically tested |

Requires HBuilderX 4.75+.
