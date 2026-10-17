# 实现原理

unix-pinia 不是标准 Pinia 的移植，而是基于 uni-app x 内建响应式原语（`ref` / `computed` / `reactive` / `watch`）的**重新实现**。理解三个核心裁决，就理解了全部设计。

## 一、单例从哪来：模块级注册表

标准 Pinia 通过 `app.use(pinia)` 安装插件、`inject` 注入实例。unix-pinia 的运行环境（vdom 模式原生端）对这条链路支持不完整（实测 `app.use` 不触发 install），且 UTS 顶层变量编译为 Kotlin 静态成员——**天然的应用级单例**。

```uts
// registry.uts（简化）
const storeMap: Map<string, any> = new Map<string, any>()
```

`useStore()` 首次调用执行 `setup()` 并登记 `storeMap`；后续调用直接命中缓存。跨页面共享、同 id 幂等全部由此保证。

## 二、为什么脚本要写 `.value`：UTS 无 Proxy

标准 Pinia 的 store 是 reactive 代理，访问 `store.count` 自动解包 Ref。UTS 编译到 Kotlin 后**没有 Proxy**，`reactive()` 返回强类型对象（`RefImpl` 字段原样保留，实测不解包）；且 UTS 对象不可动态注入属性，`$patch` 等方法挂不到 store 上。

由此定稿**方案 B**：setup 返回对象直接透传——脚本 `.value`、模板经 `storeToRefs` 解构后由 uvue 渲染层自动解包、实例 API 走顶层函数。这是唯一让**双端行为完全一致**的形态。

## 三、API 面的边界：反射不可用

UTS 无法运行时枚举对象字段，直接决定了裁掉清单：

- `$state` 快照、`$patch(对象)`、`$onAction` 自动追踪——全部依赖字段枚举，不可实现
- `$subscribe` 整体订阅曾尝试 `watch(reactive(store), deep)` 实现，Android 端对 `RefImpl` 字段不触发（双端实测），裁掉
- Kotlin 泛型擦除导致泛型值进出 `Map` 必须显式 `as any`（error17），该边界在库内收敛

## 四、入口架构

对齐官方 UTS 插件架构（声明/实现分层）：

- `interface.uts` 内联声明全部对外类型（uts-proxy 与语法提示只解析此文件）
- `index.uts` 内联声明全部对外 API（`export function` 具名实现，转发领域层 `Impl` 函数；**禁止 re-export 转发链**——云打包 Kotlin 编译只认入口内联声明）
- 实现函数一律 `Impl` 后缀，避免同名 top-level 符号触发 Kotlin 导出符号静默重整（`__1`）
