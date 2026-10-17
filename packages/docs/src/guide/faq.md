# 常见问题

## 为什么脚本里要写 `.value`，标准 Pinia 不用？

UTS 编译到 Kotlin/Swift 后没有 Proxy，`reactive()` 无法自动解包 Ref（实测字段保持 `RefImpl` 原样）。模板不受影响——经 `storeToRefs` 解构后的 Ref 在 uvue 模板中自动解包。详见[实现原理](./internals)。

## 为什么没有 `$subscribe`？

整体订阅需要遍历 store 的全部 state 字段建立依赖，UTS 无法反射枚举对象字段；实测 `deep watch` 方案在 Android 端对 `RefImpl` 字段不触发（Web 端正常，双端不一致故裁掉）。替代：字段级订阅 `watch(store.count, cb)`，语义等价且类型更明确。

## 为什么 `patch` 是顶层函数而不是 `store.$patch()`？

UTS 对象不可动态注入属性，`$patch` 方法挂不到 setup 返回的 type 对象上。顶层函数 `patch(store, fn)` 是平台约束下的等价形态。

## 为什么不需要 `app.use(pinia)`？

unix-pinia 使用模块级注册表而非 Vue 插件注入链，import 即用。实测原生端 `app.use(Pinia实例)` 不会触发 install（双端不一致），因此免挂载是唯一可靠形态。需要插件时在 `main.uts` 顶层 `setActivePinia(createPinia().use(plugin))`。

## 支持 iOS / 鸿蒙吗？

代码全端同构（纯 UTS、无平台分支），预期 Swift / ArkTS 编译链可直接通过；目前 Android + Web 已真机/构建实测，iOS / 鸿蒙待复验后更新[平台支持](./platform)。

## 蒸汽模式项目能用吗？

能运行，但**不建议**——蒸汽模式全平台可直接使用标准 Pinia（官方适配），无需本库。unix-pinia 的目标场景是 vdom 模式 App 原生端。

## getter 能依赖另一个 store 吗？

技术上可行，但**不推荐**——跨 store 引用建议放在 action 内或 setup 顶部，避免 getter 依赖链形成循环（与标准 Pinia 注意事项一致）。见[最佳实践](./best-practices)。

## 与直接导出全局 reactive 变量比，价值在哪？

官方轻量方案（导出模块级 reactive 变量）适合单状态单文件。unix-pinia 提供的是**范式**：id 命名空间与幂等、统一组织（state/getter/action 分层）、`storeToRefs` 模板绑定、实例 API、跨 store 组合、以及向标准 Pinia 迁移的最低成本路径。
