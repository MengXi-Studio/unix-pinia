# 介绍

**unix-pinia**（`@meng-xi/unix-pinia`）为 uni-app x 提供 Pinia 风格的状态管理与内置持久化：UTS 编写，class 式 store，一套代码多端覆盖。

## 为什么需要它

uni-app x 存在两套编译管线，标准 Pinia 的支持情况如下：

| 编译模式 | App 原生端 | Web / 小程序 |
| --- | --- | --- |
| 蒸汽模式（Vapor） | ✅ 标准库直接可用 | ✅ |
| vdom 模式 | ❌ 标准库不可用 | ✅ |

如果你的项目运行在 **vdom 模式的 App 原生端**（Android/iOS/鸿蒙），标准 Pinia 无法使用——这正是 unix-pinia 填补的空缺。蒸汽模式项目也可以使用本库（云打包验证通过），或直接使用标准 Pinia。

## 特性

- **class 式 defineStore**：`class XxxStore extends PiniaStoreBase`——state 用 `reactive<T>` 强类型包裹、派生值用 class getter、action 为普通 method，结构对齐官方 `state / getters / actions` 心智
- **完整实例 API**：`$patch` / `$reset` / `$subscribe` / `$onAction` / `$dispose` / `$id` / `$state` / `$save` 全部内置
- **内置持久化插件**：`createPersistPlugin` 一次登记全部 store 生效——store 创建自动恢复、`$patch` / `$reset` / `$save` 自动落盘；存储后端可替换
- **免挂载单例**：模块级注册表保证应用级单例，跨页面共享状态，无需 `app.use`
- **原生性能**：UTS 源码分发（Web → JS，Android → Kotlin），由 uni-app x 编译链现场编译
- **严格类型**：`reactive<T>` 强类型包裹，编辑器全程提示；Kotlin 泛型擦除与可空性边界在库内收敛

## 设计原则

**class + reactive 是 uni-app x 插件实现完整 Pinia 功能面的唯一可行架构**：

- UTS 无 Proxy、无反射，且新版 HBuilderX 编译器对 UTS 插件内运行时类 vue 符号（`Ref` / `watch` / `effectScope`）的 Kotlin import 生成失效——setup 式 + Ref 形态无法支撑完整 $-API
- `reactive<T>` 在 UTS 中为编译期展开（生成属性代理），不受该约束影响
- 框架无法反射遍历 state 字段，`$reset` / `$patch` / 持久化 / `$subscribe` 分发由「按需重写的三个钩子」驱动（Template Method）：`_doReset` / `_hydrate` / `_serialize`
- 每个与标准 Pinia 的差异项都在[差异对照表](./pinia-diff)中给出原因与替代方案

## 平台兼容

| 场景 | 支持 |
| --- | --- |
| Web（JS 编译链） | ✅ 全用例实测 |
| App-Android（Kotlin 编译链） | ✅ 云打包验证通过，真机用例复验中 |
| App-iOS / App-HarmonyOS | 代码全端同构，待实测 |
| 微信小程序 | 支持声明（随 uni-app x 编译链），未专项实测 |

环境要求：HBuilderX 4.75+。
