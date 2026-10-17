# Platform support

## Support matrix

| Mode | Platform | Status |
| --- | --- | --- |
| vdom mode | App-Android | ✅ Kotlin toolchain + real-device full suite verified |
| vdom mode | Web | ✅ JS toolchain full suite verified |
| vdom mode | App-iOS | same codebase, pending on-device testing |
| vdom mode | App-HarmonyOS | same codebase, pending on-device testing |
| Vapor mode | all platforms | runs, but use standard Pinia there |

Requires HBuilderX 4.75+ (tested on 5.26).

## Adjudicated platform differences (verified on Web + Android)

| Item | Web (JS / Proxy) | Android (Kotlin / no Proxy) | Ruling |
| --- | --- | --- | --- |
| `reactive()` on Ref fields | auto-unwrap (true forwarding) | no unwrap (keeps `RefImpl`) | stores pass through as-is (Plan B); no reliance on reactive unwrapping |
| `app.use(pinia instance)` | fires install | does not fire | mount-free is the only reliable form; plugins via top-level `setActivePinia` |
| deep watch on store object | fires normally | does not fire | `$subscribe` pruned; per-field `watch` instead |
| generic T into `Map` | fine | compile error (error17) | contained via `as any` inside the library |

## Why one codebase works everywhere

unix-pinia is a **pure orchestration layer** (no platform-specific directories): it depends only on uni-app x built-in reactivity primitives (`ref` / `computed` / `reactive` / `watch`) and UTS language capabilities. iOS / HarmonyOS share the same UTS nominal type system as Android, so they are expected to compile directly; this page will be updated after on-device verification.
