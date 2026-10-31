# 最佳实践

## store 命名与组织

- id 使用**域名式反写**避免冲突：`'user.profile'`、`'cart.items'`
- 一个 store 一个文件，放在 `stores/` 目录：`stores/user.uts`
- state `type`、store class 与 `useStore` 同文件导出，调用方一次 import 拿全

## 状态设计

- **state 只放原始值字段**：`reactive<T>` 强类型包裹；嵌套对象 / Ref 的解包行为双端不一致，避免放入 state
- **能推导的别存储**：派生值一律 class getter，不要存成 state 字段（避免双份数据源）
- **action 里改状态**：业务组件只调用 action，不直接改 `store.state.x`——保持修改路径可追踪；direct 修改后如需落盘 / 通知，调用 `store.$save()`
- **快照最小化**：`_serialize()` 只返回需持久化的字段（临时输入等内存态字段不入快照）

## 跨 store 组合

```uts
// ✅ 推荐：method 内调用对方 useStore（注册表保证单例）
export class CartStore extends PiniaStoreBase {
  state: CartState = reactive<CartState>({ items: 0 })

  constructor() {
    super()
    this.bindState(this.state)
  }

  clearOnLogout(): void {
    useUserStore().logout()
    this.state.items = 0
  }
}
```

```uts
// ❌ 避免：字段初始化器中跨 store（store 创建时机不可控）
// ❌ 避免：getter 内跨 store 引用形成循环依赖
```

## 订阅与副作用

- `$subscribe` 仅由 `$patch` / `$reset` / `$save` 触发——关键操作后显式 `$save()`；回调中拿到的是 `_serialize()` 快照
- `$dispose` 仅用于应用级清理（如登出）；**dispose 后旧引用成为孤儿实例**，常规业务通过 action 重置而非 dispose

## 模板绑定

- 模板事件绑定 class method **必须带括号**：`@click="counter.increment()"`（Kotlin 端 method 不是值）
- 模板直接使用 `store.state.x` 与 getter，无需任何解构步骤

## 持久化实践

- `_hydrate` 逐字段判空回填（存储损坏 / 字段缺失天然回退初始值），不要整体覆盖 state
- 调试用 `clearPersistedState(storeId, keyPrefix)` 清空单个 store；换后端用 `setStorageAdapter` 并在创建任何 store 前调用

## 类型规范

- `reactive<T>` 泛型实参显式标注，state 字段类型来自独立 `type`（如 `CounterState`）
- `PiniaPlugin` / `PiniaPluginContext` / `StorageAdapter` 等类型从插件入口 `import type` 导入
- constructor 中 `super()` 后必须 `bindState(this.state)`——漏写仅运行时警告，但 `$reset` / `$patch` / `$subscribe` / 持久化不可用
