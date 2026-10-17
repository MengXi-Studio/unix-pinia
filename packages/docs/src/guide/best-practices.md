# 最佳实践

## store 命名与组织

- id 使用**域名式反写**避免冲突：`'user.profile'`、`'cart.items'`
- 一个 store 一个文件，放在 `stores/` 目录：`stores/user.uts`
- `type` 与 `useStore` 同文件导出，调用方一次 import 拿全

## 状态设计

- **能推导的类型别手写**：getter 一律 `ComputedRef` 派生，不要把派生值存成 state（避免双份数据源）
- **action 里改状态**：业务组件只调用 action，不直接改 `store.count.value`——保持修改路径可追踪（与 Pinia 一致的心智）
- **reset 一律显式**：每个 store 提供自定义 `reset` action（`$reset` 不内置，见[差异说明](./pinia-diff)）

## 跨 store 组合

```uts
// ✅ 推荐：setup 顶部依赖，action 中使用
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
// ❌ 避免：getter 内跨 store 引用形成循环依赖
const fullName: ComputedRef<string> = computed((): string => {
	return useOtherStore().a + useOtherStore().b // 依赖链失控
})
```

## subscribe 与副作用

- 状态订阅使用**字段级 `watch`**（整体 `$subscribe` 已裁掉）；在组件 setup 中注册的 watch 随组件销毁自动停止，全局型订阅放在 store 的 action 内注册
- `dispose` 仅用于应用级清理（如登出）；**dispose 后旧引用成为孤儿实例**，常规业务通过 action 重置而非 dispose

## 类型规范

- `import type { Ref, ComputedRef } from 'vue'` 统一显式导入（`ComputedRef` 不全局注入，漏导入仅告警但 Kotlin 端更严）
- setup 返回对象与 `type` 逐字段对齐，使用 `as XxxStore` 收尾（对象字面量只能赋给 type 类型）
- action 必须箭头函数（UTS 函数声明不能作值传递）
