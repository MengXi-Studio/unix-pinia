# Pinia instance

The instance type returned by `createPinia()`, carrying the plugin list and the active flag.

## Create & register

```uts
import { createPinia, setActivePinia, getActivePinia } from '@/uni_modules/ux-pinia'

// Case 1: pure state management — do nothing (without a registered activePinia, only plugins are not scheduled; stores work normally)

// Case 2: plugins — register explicitly at the top level of main.uts
setActivePinia(
	createPinia()
		.use(pluginA)
		.use(pluginB)
)

// read at runtime
const pinia = getActivePinia() // Pinia | null
```

::: warning P8 verified finding
On native, `app.use(pinia instance)` does not fire `install`. Mount-free (or top-level `setActivePinia`) is the only cross-platform-consistent form.
:::

## Pinia

| Member | Signature | Notes |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | registers a plugin, chainable; scheduled in registration order when a store is created |
| `install` | `(app: any) => void` | entry for `app.use(pinia)` (reliable on Web only; use `setActivePinia` on native) |

## Plugin scheduling

For every store, registered plugins are called **at first creation** (first `useStore` call, after the factory runs), in registration order:

```uts
const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
	console.log('store created:', ctx.storeId)
	// ctx.store is any — narrow at the use site: const base = ctx.store as any as PiniaStoreBase
}
```

- Plugins run **exactly once** over the store's lifetime (guaranteed by the singleton)
- Without a registered activePinia, plugins are not scheduled (mount-free mode); stores themselves work normally
- UTS constraint: plugins **return void** — unlike standard Pinia, they cannot return an object to merge into the store; extend behavior through the store's existing actions / state via `ctx.store`
