# 平台支持

## 支持矩阵

| 编译模式 | 平台 | 支持情况 |
| --- | --- | --- |
| vdom 模式 | App-Android | ✅ Kotlin 编译链 + 真机全用例实测 |
| vdom 模式 | Web | ✅ JS 编译链全用例实测 |
| vdom 模式 | App-iOS | 代码全端同构，待实测 |
| vdom 模式 | App-HarmonyOS | 代码全端同构，待实测 |
| 蒸汽模式 | 全平台 | 库可运行；该场景建议直接使用标准 Pinia |

环境要求：HBuilderX 4.75+（5.26 实测）。

## 双端实测裁决记录

以下平台差异项均在 Web 与 Android 真机双端实测并裁决：

| 差异项 | Web（JS / Proxy） | Android（Kotlin / 无 Proxy） | 裁决 |
| --- | --- | --- | --- |
| `reactive()` 对 Ref 字段 | 自动解包（真转发） | 不解包（保持 `RefImpl`） | store 对象直接透传（方案 B），不依赖 reactive 解包 |
| `app.use(pinia实例)` | 触发 install | 不触发 | 免挂载为唯一可靠形态；插件场景顶层 `setActivePinia` |
| deep watch 对 store 对象 | 正常触发 | 不触发 | `$subscribe` 裁掉，字段级 `watch` 替代 |
| 泛型 T 存入 `Map` | 正常 | 编译错误（error17） | 库内 `as any` 收敛，业务侧零感知 |

## 全端同构说明

unix-pinia 为**纯编排层**（无平台目录端）：不依赖任何平台专有 API，所有实现基于 uni-app x 内建响应式原语（`ref` / `computed` / `reactive` / `watch`）与 UTS 语言能力，一套源码走遍 uni-app x。iOS / 鸿蒙的 Swift / ArkTS 编译约束与 Android 同源（UTS 名义类型系统），预期可直接编译，待真机复验后更新本页。
