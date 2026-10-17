# Pinia 实例

`createPinia()` 返回的实例类型，承载插件列表与 active 标记。

## 创建与登记

```uts
import { createPinia, setActivePinia, getActivePinia } from '@/uni_modules/ux-pinia'

// 场景一：纯状态管理——什么都不用做（首次 useStore 惰性创建默认实例）

// 场景二：使用插件——main.uts 顶层显式登记
setActivePinia(
	createPinia()
		.use(pluginA)
		.use(pluginB)
)

// 运行时读取
const pinia = getActivePinia() // Pinia | null
```

::: warning P8 实测
原生端 `app.use(pinia实例)` 不会触发 `install`。免挂载（或顶层 `setActivePinia`）是唯一双端一致的形态。
:::

## Pinia

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `use` | `(plugin: PiniaPlugin) => Pinia` | 注册插件，链式调用；store 创建时按注册顺序调度 |
| `install` | `(app: any) => void` | `app.use(pinia)` 入口（仅 Web 端可靠，原生端用 `setActivePinia`） |

## 插件调度时机

每个 store **首次创建**时（`useStore` 首次调用、setup 执行后），按顺序调用已注册插件：

```uts
const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
	console.log('store created:', ctx.storeId)
	// ctx.store 为 any，使用处收窄：const s = ctx.store as CounterStore
}
```

- 插件在 store 的**整个生命周期内只执行一次**（单例保证）
- 未登记 activePinia 时插件不调度（免挂载模式），store 本身正常工作
- UTS 约束：插件**返回 void**——不能像标准 Pinia 那样返回对象合并进 store，扩展逻辑请通过 `ctx.store` 的既有 action / 状态完成
