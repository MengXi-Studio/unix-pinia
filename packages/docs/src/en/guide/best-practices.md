# Best practices

## Naming & organization

- Use **reverse-domain ids** to avoid collisions: `'user.profile'`, `'cart.items'`
- One store per file under `stores/`: `stores/user.uts`
- Export the `type` and `useStore` from the same file — one import gives consumers everything

## State design

- **Derive, don't duplicate**: getters are always `ComputedRef` derivations; never store a derived value as state (avoid dual sources of truth)
- **Mutate through actions**: components call actions instead of writing `store.count.value` directly — keep every mutation path traceable (same mindset as Pinia)
- **Reset explicitly**: every store provides a custom `reset` action (`$reset` is not built in, see the [diff](./pinia-diff))

## Cross-store composition

```uts
// ✅ Recommended: depend at the top of setup, use inside actions
export const useCartStore = defineStore<CartStore>('cart', (): CartStore => {
	const userStore = useUserStore()
	const clearOnLogout = (): void => {
		userStore.logout()
		items.value = []
	}
	...
})
```

```uts
// ❌ Avoid: cross-store references inside getters create circular chains
const fullName: ComputedRef<string> = computed((): string => {
	return useOtherStore().a + useOtherStore().b // uncontrolled dependency chain
})
```

## Subscriptions & side effects

- Subscribe per field with `watch` (whole-store `$subscribe` is pruned); watches registered in a component's setup stop automatically with the component — app-level subscriptions belong in store actions
- `dispose` is for app-level cleanup only (e.g. logout); **existing references become orphans after dispose** — prefer resetting via actions in normal flows

## Type conventions

- `import type { Ref, ComputedRef } from 'vue'` — always import explicitly (`ComputedRef` is not globally injected; missing it only warns on Web but is stricter on native)
- Keep the setup return object aligned with the `type` field by field, ending with `as XxxStore`
- Actions must be arrow functions (UTS forbids passing function declarations as values)
