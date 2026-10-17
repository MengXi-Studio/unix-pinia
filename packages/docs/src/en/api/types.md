# Types

## Pinia

The Pinia instance type (returned by `createPinia()`).

| Member | Signature | Notes |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | register a plugin, chainable |
| `install` | `(app: any) => void` | `app.use(pinia)` entry (reliable on Web only; use `setActivePinia` on native) |

## PiniaPlugin

```uts
export type PiniaPlugin = (ctx: PiniaPluginContext) => void
```

Plugin function type. UTS constraint: returns `void` (no object merging into the store); hook logic goes through the context.

## PiniaPluginContext

```uts
export type PiniaPluginContext = {
  pinia: Pinia,
  store: any,
  storeId: string
}
```

| Field | Notes |
| --- | --- |
| `pinia` | the current Pinia instance |
| `store` | the newly created store instance (`any`; narrow with `as` at the use site) |
| `storeId` | the store id |

## Unsubscribe

```uts
export type Unsubscribe = () => void
```

Unsubscribe handle (the return shape of per-field `watch`).

## Store type convention

Store types are user-defined `type` aliases with explicit annotations (object literals can only be assigned to type aliases):

```uts
export type CounterStore = {
  count: Ref<number>,                 // state: Ref<T>
  doubleCount: ComputedRef<number>,   // getter: ComputedRef<T>
  increment: () => void               // action: arrow function
}
```

::: warning
`ComputedRef` must be imported explicitly: `import type { ComputedRef } from 'vue'` (not globally injected). `Ref` is injected, but importing both explicitly is recommended.
:::
