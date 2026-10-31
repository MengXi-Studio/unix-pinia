# 实现原理

unix-pinia 不是标准 Pinia 的移植，而是基于 uni-app x 内建响应式原语（`reactive` / `computed` 的编译期展开）的**重新实现**。理解四个核心裁决，就理解了全部设计。

## 一、单例从哪来：模块级注册表

标准 Pinia 通过 `app.use(pinia)` 安装插件、`inject` 注入实例。unix-pinia 的运行环境对这条链路支持不完整（实测原生端 `app.use` 不触发 install），且 UTS 顶层变量编译为 Kotlin 静态成员——**天然的应用级单例**。

```uts
// registry.uts（简化）
const storeMap: Map<string, any> = new Map<string, any>()
```

`useStore()` 首次调用执行 `factory()` 并登记 `storeMap`；后续调用直接命中缓存。跨页面共享、同 id 幂等全部由此保证。

## 二、为什么是 class + reactive

两条平台硬约束夹出了唯一可行路径：

- **UTS 无 Proxy、无反射**：setup 式 + Ref 形态下，`$patch` / `$subscribe` / `$onAction` / `$reset` 均无法实现（store 对象不可挂方法、不可枚举字段）
- **运行时类 vue 符号失效**：新版 HBuilderX 编译器对 UTS 插件内的 `Ref` / `ref` / `watch` / `effectScope` 不生成 Kotlin import（Unresolved reference）；而 `reactive<T>` / `computed` 是**编译期展开**（生成属性代理类，getter/setter 内联依赖追踪），不受影响

因此定稿 class + reactive：state 用 `reactive<T>` 包裹、action 为普通 method、派生值用 class getter——换取完整 $-API 面。`effectScope` 被生成器静默丢弃，computed 会绑定首次创建页面的作用域，故派生值用 getter。

## 三、Template Method 三钩子

UTS 的 `reactive<T>` 返回强类型 class，无法 cast 为 `UTSJSONObject`，框架也无法反射遍历字段——`$reset` / `$patch` / 持久化 / `$subscribe` 分发因此由「使用者按需重写的三个钩子」驱动：

| 钩子 | 驱动的能力 | 默认行为 |
| --- | --- | --- |
| `_doReset()` | `$reset()` | 空操作（仅通知订阅器） |
| `_hydrate(data)` | `$patch(partial)` 装载 + 持久化恢复 | 空操作 |
| `_serialize()` | `$subscribe` 快照 + 持久化保存 | 空对象 |

三个钩子均可不重写——state 修改 / actions / `$subscribe`（`$patch` / `$reset` 触发）依然有效。

## 四、Kotlin 边界在库内收敛

- Kotlin 泛型擦除：泛型值进出 `Map<string, any>` 必须显式 `as any`（error17），业务侧零感知
- 可空性：UTS 的 `any` 生成 Kotlin 非空 `Any`，class 字段初始化为 null 必须声明 `any | null`（如 `$state: any | null`）
- UTS 函数类型别名必须箭头语法 `(x) => void`，冒号形式编译报错

## 五、入口架构

对齐官方 UTS 插件架构（声明/实现分层）：

- `interface.uts` 内联声明全部对外类型（uts-proxy 与语法提示只解析此文件）
- `index.uts` 内联声明全部对外 API（`export function` 具名实现，转发领域层 `Impl` 函数；**禁止 re-export 转发链**——云打包 Kotlin 编译只认入口内联声明）
- 实现函数一律 `Impl` 后缀，避免同名 top-level 符号触发 Kotlin 导出符号静默重整（`__1`）
- 插件内禁用运行时类 vue 符号；`reactive` / `computed` 编译期展开可用
