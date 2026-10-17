# 介绍

**unix-pinia**（`@meng-xi/unix-pinia`）为 uni-app x 提供 Pinia 风格的响应式状态管理：UTS 编写，setup 式 API，一套代码多端覆盖。

## 为什么需要它

uni-app x 存在两套编译管线，标准 Pinia 的支持情况如下：

| 编译模式 | App 原生端 | Web / 小程序 |
| --- | --- | --- |
| 蒸汽模式（Vapor） | ✅ 标准库直接可用 | ✅ |
| vdom 模式 | ❌ 标准库不可用 | ✅ |

如果你的项目运行在 **vdom 模式的 App 原生端**（Android/iOS/鸿蒙），标准 Pinia 无法使用——这正是 unix-pinia 填补的空缺。蒸汽模式项目请直接使用标准 Pinia。

## 特性

- **对齐 Pinia 心智**：`defineStore` / `storeToRefs` / `createPinia` / `patch` / `dispose` 一比一复刻，裁掉平台不可实现项并给足替代方案
- **免挂载单例**：模块级注册表保证应用级单例，跨页面共享状态，无需 `app.use`
- **原生性能**：UTS 源码分发（Web → JS，Android → Kotlin），由 uni-app x 编译链现场编译
- **严格类型**：store 返回类型显式标注，编辑器全程提示

## 设计原则

一比一复刻 Pinia API 面，**裁掉平台不可实现项**（对标 unix-router 复刻 vue-router 的方式）：

- 语义一比一，形态随平台：UTS 无 Proxy、对象不可动态注入属性，因此 `store.$patch(fn)` 映射为顶层函数 `patch(store, fn)`
- 每个裁掉项都在[差异对照表](./pinia-diff)中给出原因与替代方案

## 平台兼容

| 场景 | 支持 |
| --- | --- |
| vdom 模式 App-Android | ✅（Kotlin 编译链实测） |
| vdom 模式 Web | ✅ |
| vdom 模式 iOS / 鸿蒙 | 代码全端同构，待实测 |
| 蒸汽模式 | 可运行（建议直接用标准 Pinia） |

环境要求：HBuilderX 4.75+（5.26 实测）。
