# 常见问题

## 脚本访问 state 需要写 `.value` 吗？

不需要。state 是 `reactive<T>` 强类型对象，`counter.state.count` 脚本与模板同路径直接读写；派生值 getter 同理（`counter.doubleCount`）。详见[实现原理](./internals)。

## 为什么 store 是 class？

UTS 无 Proxy、无反射，setup 式 + Ref 形态无法实现 `$patch` / `$subscribe` / `$onAction` / `$reset`；且新版 HBuilderX 编译器对 UTS 插件内运行时类 vue 符号（`Ref` / `watch` / `effectScope`）的 Kotlin import 生成失效。class + reactive（`reactive<T>` 编译期展开）是插件内实现完整 $-API 的唯一可行架构。详见[实现原理](./internals)。

## 为什么派生值用 getter 而不是 computed？

插件内 `effectScope` 不可用，computed 会绑定首次创建页面的作用域、跨页面后失效；class getter 每次求值，依赖收集经 reactive 属性自动完成，无生命周期问题。

## `$subscribe` 为什么只在 `$patch` / `$reset` / `$save` 时触发？

UTS 无全局字段订阅钩子，无法监听 direct 修改。需要快照 / 落盘的场景，在关键操作后显式调用 `store.$save()`。见[基础用法](./basic-usage#状态订阅)。

## 为什么模板事件绑定 method 必须带括号？

Kotlin 端 class method 不是值（Web 端 JS 函数一等公民掩盖了该差异），`@click="counter.increment"` 会编译报错，必须 `@click="counter.increment()"`。

## 为什么不需要 `app.use(pinia)`？

unix-pinia 使用模块级注册表而非 Vue 插件注入链，import 即用。实测原生端 `app.use(Pinia实例)` 不会触发 install（双端不一致），因此免挂载是唯一可靠形态。需要插件时在 `main.uts` 顶层 `setActivePinia(createPinia().use(plugin))`。

## 持久化为什么需要重写 `_serialize` / `_hydrate`？

UTS 的 `reactive<T>` 返回强类型 class，无法 cast 为 `UTSJSONObject`、无法反射遍历字段——框架不知道你的 state 有哪些字段、哪些需要持久化。两个钩子即持久化契约：`_serialize` 定快照、`_hydrate` 定回填。不重写则该 store 持久化为空操作。

## 支持 iOS / 鸿蒙吗？

代码全端同构（纯 UTS、无平台分支），预期 Swift / ArkTS 编译链可直接通过；目前 Web 全用例实测、Android 云打包验证通过，iOS / 鸿蒙待复验后更新[平台支持](./platform)。

## 蒸汽模式项目能用吗？

能——云打包（蒸汽模式）验证通过。不过蒸汽模式全平台也可直接使用标准 Pinia（官方适配）；本库的增量价值在于统一范式与内置持久化插件。

## getter 能依赖另一个 store 吗？

技术上可行，但**不推荐**——跨 store 引用建议放在 method 内，避免 getter 依赖链形成循环（与标准 Pinia 注意事项一致）。见[最佳实践](./best-practices)。

## 与直接导出全局 reactive 变量比，价值在哪？

官方轻量方案（导出模块级 reactive 变量）适合单状态单文件。unix-pinia 提供的是**范式**：id 命名空间与幂等、统一组织（state / getter / action 分层）、完整 $-API、内置持久化插件、跨 store 组合、以及向标准 Pinia 迁移的最低成本路径。
