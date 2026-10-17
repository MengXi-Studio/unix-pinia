# Introduction

**unix-pinia** (`@meng-xi/unix-pinia`) provides Pinia-style reactive state management for uni-app x: written in strict UTS with setup stores, one codebase across platforms.

## Why it exists

uni-app x has two compilation pipelines, and the standard Pinia support matrix looks like this:

| Mode | Native app | Web / mini-programs |
| --- | --- | --- |
| Vapor mode | ✅ standard Pinia works | ✅ |
| vdom mode | ❌ standard Pinia unavailable | ✅ |

If your project runs on **vdom-mode native apps** (Android/iOS/HarmonyOS), the standard Pinia is out — that is exactly the gap unix-pinia fills. Vapor-mode projects should use the standard Pinia directly.

## Features

- **Pinia mental model**: `defineStore` / `storeToRefs` / `createPinia` / `patch` / `dispose` replicated 1:1; pruned items documented with reasons and replacements
- **Mount-free singletons**: module-level registry, state shared across pages, zero setup code
- **Native performance**: UTS source distribution (Web → JS, Android → Kotlin), compiled on the fly
- **Strictly typed**: explicit store type annotations, full editor support

## Design principle

Replicate the Pinia API surface 1:1 and **prune platform-impossible items** (in the spirit of unix-router replicating vue-router):

- Semantics 1:1, form follows platform: UTS has no Proxy and objects cannot gain dynamic properties, so `store.$patch(fn)` maps to the top-level function `patch(store, fn)`
- Every pruned item is listed in the [diff table](./pinia-diff) with its reason and replacement

## Platform support

| Scenario | Support |
| --- | --- |
| vdom mode App-Android | ✅ Kotlin toolchain + real-device verified |
| vdom mode Web | ✅ |
| vdom mode iOS / HarmonyOS | same codebase, pending on-device testing |
| Vapor mode | runs, but use standard Pinia there |

Requires HBuilderX 4.75+ (tested on 5.26).
