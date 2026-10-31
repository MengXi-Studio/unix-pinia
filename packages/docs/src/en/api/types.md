# Types

## Pinia

The Pinia instance type (returned by `createPinia`).

| Member | Signature | Notes |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | registers a plugin, chainable |
| `install` | `(app: any) => void` | entry for `app.use(pinia)` (reliable on Web only; use `setActivePinia` on native) |

## PiniaStoreBase

The class-style store base class; all stores inherit it to gain the $-API and persistence capabilities.

| Member | Signature | Notes |
| --- | --- | --- |
| `$id` | `string` | store id (injected when defineStore creates the instance) |
| `$state` | `any \| null` | reference to the current state (same reference as the subclass state after bindState) |
| `bindState` | `(state: any) => void` | called once after `super()` in the constructor to bind the reactive state |
| `$patch` | `(partial: UTSJSONObject) => void` | batch update (loaded via `_hydrate`) and notify subscribers |
| `$reset` | `() => void` | runs the `_doReset` hook, then notifies subscribers |
| `$save` | `() => void` | explicit save point (persist-to-storage trigger after direct state mutations) |
| `$subscribe` | `(cb: StateChangeCallback) => Unsubscribe` | subscribe to state changes (triggered by `$patch` / `$reset` / `$save`) |
| `$onAction` | `(cb: ActionChangeCallback) => Unsubscribe` | subscribe to action calls (actions wrapped with `callAction`) |
| `$dispose` | `() => void` | dispose the instance; the next `useStore()` rebuilds it |
| `callAction` | `(name: string, fn: () => any) => any \| null` | makes an action trigger `$onAction` subscribers |
| `_doReset` | `() => void` | hook: defines `$reset` behavior (override on demand) |
| `_hydrate` | `(data: UTSJSONObject) => void` | hook: loads partial data / persistence restore (override on demand) |
| `_serialize` | `() => UTSJSONObject` | hook: state snapshot (override on demand) |

## PiniaPlugin

```uts
export type PiniaPlugin = (ctx: PiniaPluginContext) => void
```

Plugin function type. UTS constraint: returns `void` (cannot return an object to merge into the store); plugin logic goes through ctx.

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
| `store` | the newly created store instance (`any`; narrow with `as any as PiniaStoreBase` at the use site) |
| `storeId` | the store id |

## StateChangeCallback

```uts
export type StateChangeCallback = (type: string, state: UTSJSONObject) => void
```

`$subscribe` callback: `type` = `'patch' | 'reset' | 'save'`; `state` = the `_serialize()` snapshot.

## ActionInfo / ActionChangeCallback

```uts
export type ActionInfo = {
  name: string
}

export type ActionChangeCallback = (info: ActionInfo) => void
```

`$onAction` callback data: only actions wrapped with `callAction` / `callActionWithArgs` are tracked.

## Unsubscribe

```uts
export type Unsubscribe = () => void
```

Unsubscribe function (the return value of `$subscribe` / `$onAction`).

## StorageAdapter

```uts
export type StorageAdapter = {
  get: (key: string) => string | null,
  set: (key: string, value: string) => void,
  remove: (key: string) => void
}
```

Storage adapter (persistence backend): the default implementation is based on uni storage (zero dependencies); swap to unix-storage / native preferences.

## PersistOptions

```uts
export type PersistOptions = {
  keyPrefix: string,
  includeStores: Array<string> | null,
  excludeStores: Array<string>,
  serializer: ((state: UTSJSONObject) => string) | null
}
```

| Field | Notes |
| --- | --- |
| `keyPrefix` | storage key prefix (full key = `keyPrefix + storeId`), default `'ux-pinia:'` |
| `includeStores` | persist only the given stores (`null` = all) |
| `excludeStores` | exclude the given stores |
| `serializer` | custom serializer (`null` = JSON serialization) |

::: warning UTS types must be complete
UTS object literals must be complete: when calling `createPersistPlugin`, all four fields must be given explicitly (optional semantics are expressed with `null`); see the [Basic usage](../guide/basic-usage#persistence) example.
:::

## Store type convention

A store = a `PiniaStoreBase` subclass + a standalone state `type`:

```uts
export type CounterState = {
  count: number
  name: string
}

export class CounterStore extends PiniaStoreBase {
  state: CounterState = reactive<CounterState>({ count: 0, name: 'pinia' })

  constructor() {
    super()
    this.bindState(this.state)
  }
}
```
