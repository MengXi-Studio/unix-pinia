# Platform support

## Support matrix

| Compilation mode | Platform | Status |
| --- | --- | --- |
| Common | Web | ✅ full suite verified on the JS toolchain |
| Vapor mode | App-Android | ✅ verified via cloud build (Kotlin toolchain), on-device cases under re-verification |
| Common | App-iOS | same codebase, pending testing |
| Common | App-HarmonyOS | same codebase, pending testing |
| Common | WeChat mini-program | declared support (rides the uni-app x toolchain), not specifically tested |

Requires HBuilderX 4.75+.

## Verified adjudication record

The following platform difference items were all tested and adjudicated on both platforms (the conclusions finalized the class + reactive architecture):

| Item | Symptom | Ruling |
| --- | --- | --- |
| `reactive<T>` | compile-time expanded (generates property-proxy classes with inlined dependency tracking); Kotlin generation works | class + reactive is viable — the architecture foundation |
| runtime-class vue symbols (`Ref` / `ref` / `watch` / `effectScope`) | recent compilers fail to generate Kotlin imports for these symbols inside UTS plugins | banned inside plugins; `reactive` / `computed` (compile-time expanded) are usable |
| `effectScope` | silently dropped by the generator | getters replace computed fields |
| `app.use(pinia instance)` | does not fire install on native | mount-free is the only reliable form; plugins via top-level `setActivePinia` |
| template binding of class methods | a method is not a value on Kotlin; compiling without parentheses fails | template events always carry parentheses: `@click="store.method()"` |
| generic T stored in a `Map` | Kotlin compile error (error17) | contained with `as any` inside the library |

## One codebase across platforms

unix-pinia is a **pure orchestration layer** (no platform-specific directories): it depends on no platform-proprietary API, and every implementation is built on uni-app x built-in reactivity primitives (`reactive` / `computed` compile-time expansion) plus UTS language capabilities — one source code across uni-app x. The Swift / ArkTS compilation constraints of iOS / HarmonyOS share the same origin as Android (the UTS nominal type system), so direct compilation is expected; this page will be updated after on-device re-verification.
