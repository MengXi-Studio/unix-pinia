# 平台支持

## 支持矩阵

| 编译模式 | 平台 | 支持情况 |
| --- | --- | --- |
| 通用 | Web | ✅ JS 编译链全用例实测 |
| 蒸汽模式（vapor） | App-Android | ✅ 云打包（Kotlin 编译链）验证通过，真机用例复验中 |
| 通用 | App-iOS | 代码全端同构，待实测 |
| 通用 | App-HarmonyOS | 代码全端同构，待实测 |
| 通用 | 微信小程序 | 支持声明（随 uni-app x 编译链），未专项实测 |

环境要求：HBuilderX 4.75+。

## 实测裁决记录

以下平台差异项均在双端实测并裁决（结论驱动了 class + reactive 架构定稿）：

| 差异项 | 现象 | 裁决 |
| --- | --- | --- |
| `reactive<T>` | 编译期展开（生成属性代理类，内联依赖追踪），Kotlin 生成正常 | class + reactive 可行，架构基座 |
| 运行时类 vue 符号（`Ref` / `ref` / `watch` / `effectScope`） | 新版编译器对 UTS 插件内此类符号的 Kotlin import 生成失效 | 插件内禁用；`reactive` / `computed` 编译期展开可用 |
| `effectScope` | 被生成器静默丢弃 | getter 替代 computed 字段 |
| `app.use(pinia实例)` | 原生端不触发 install | 免挂载为唯一可靠形态；插件场景顶层 `setActivePinia` |
| 模板绑定 class method | Kotlin 端 method 不是值，不带括号编译报错 | 模板事件一律带括号 `@click="store.method()"` |
| 泛型 T 存入 `Map` | Kotlin 编译错误（error17） | 库内 `as any` 收敛，业务侧零感知 |

## 全端同构说明

unix-pinia 为**纯编排层**（无平台目录端）：不依赖任何平台专有 API，所有实现基于 uni-app x 内建响应式原语（`reactive` / `computed` 的编译期展开）与 UTS 语言能力，一套源码走遍 uni-app x。iOS / 鸿蒙的 Swift / ArkTS 编译约束与 Android 同源（UTS 名义类型系统），预期可直接编译，待真机复验后更新本页。
