# unix-pinia PoC 技术验证报告（M1）

| 项目 | 内容 |
| --- | --- |
| 报告版本 | v1.0 |
| 日期 | 2026-10-17 |
| HBuilderX | 5.26.2026091802（`D:\HBuilderX`，CLI 已验证可用） |
| 编译模式 | **VDOM 模式**（manifest 显式 `"vapor": false`，编译日志确认 `编译器版本：5.26（uni-app x）VDOM模式`） |
| 验证端 | Web 端 ✅ 全部通过；Android 端 ⏸ 待设备接入 |
| 验证工程 | `packages/playground`（uni-app x 工程，内嵌 `uni_modules/unix-pinia` PoC 插件） |

---

## 1. PoC 结论总表

| 编号 | 验证项 | Web 端结论 | 关键证据（[verify] 日志） |
| --- | --- | --- | --- |
| P1 | uts 文件内组合式 API 与类型注入 | ✅ 通过（含一个修正项） | `ref/computed` 函数与 `Ref<T>` 类型**全局注入可用**；`ComputedRef` 类型**不注入**，需 `import type { ComputedRef } from 'vue'`（修复后零警告） |
| P2 | 模块级 Map 注册表单例 | ✅ 通过（同页 + 跨页面） | `P2 same instance = true`；浏览器实测：首页 increment 后跳转 second 页读到 `count=2, doubleCount=4`，状态联动正确 |
| P3a | reactive 对 Ref 字段解包 | ✅ **通过（方案 A 成立）** | `P3a wrapped.num isRef = false value: 11` → 已解包为 number；`after raw.value=33, wrapped.num = 33` → **真解包**（写入转发至原始 ref，响应联动） |
| P3b | reactive 对 ComputedRef 字段解包 | ✅ **通过（方案 A 成立）** | `P3b wrapped.comp isRef = false value: 22` → 已解包 |
| P3c | reactive 普通值字段（基线） | ✅ 通过 | `P3c plain = changed` |
| P4 | watch 订阅（Ref 字段） | ✅ 通过 | `P4 watch fired: 1 new: 1 old: 0`，`final watchFired = 1` |
| P5 | 泛型 defineStore\<T\> + 显式 type + 函数属性对象字面量 | ✅ 通过 | 编译零错误；运行时 store 创建/读取/方法调用全部正常 |
| P6 | isRef 可用性 | ✅ 通过 | `isRef(store.count)=true`、`isRef(store.doubleCount)=true`，且对已解包字段正确返回 false |
| T6 | 同 id 重复 defineStore 幂等 | ✅ 通过（意外触发） | HMR 重载时真实触发警告：`store id 'counter' 已定义，本次定义将被忽略（返回既有实例）` |
| P7 | iOS 端编译 | ⏸ 不在 v1 范围（Q1=A） | — |

**总体结论：设计文档第 5.2 节的方案 A（reactive 解包对齐 Pinia DX）在 Web 端 vdom 模式完全成立**——`reactive()` 包装 setup 返回对象后，`Ref`/`ComputedRef` 字段自动解包且响应转发正确，`store.count` 可无 `.value` 访问。

## 2. 过程发现与修正

| 发现 | 说明 | 处置 |
| --- | --- | --- |
| `ComputedRef` 类型未全局注入 | 编译 warning：`Cannot find name 'ComputedRef'`（`Ref` 正常注入） | store 与页面统一 `import type { ComputedRef } from 'vue'`，**Web 端验证有效**；Android 端是否同样需导入待验证 |
| UTS 无声明提升（再次实证） | `onMounted` 回调引用其后声明的 `runPoC`，违反 UTS110111150/165 | 声明顺序调整（onMounted 置于文件末尾），已在代码中注释说明 |
| HMR 伪影：热更新后 computed 依赖链断裂 | HMR 替换模块后出现 `count=2, doubleCount=2`（应为 4） | 确认为开发期 HMR 特性，**冷启动完全正常**（`count=1, doubleCount=2`），不影响正式结论；写入风险表供开发期知悉 |
| vite uts-proxy 字符串常量 bug（unix-storage 已知坑） | `export const` 字符串常量在 web 编译链生成裸值 | PoC 未导出字符串常量，规避成功；正式版 index.uts 避免 `export const 'xxx'` 形态，或携带 unix-storage 的修复插件 |
| 旧 dev server 端口占用 | 重复 launch 时 vite 换端口（5173→5174） | 开发期注意事项，无碍 |

## 3. 调研结论沉淀

### 3.1 x-pinia-s 拆解（Q5=必做，已完成）

| 维度 | x-pinia-s（v1.0.0，作者 tmui/TMUI4x） | unix-pinia 差异化 |
| --- | --- | --- |
| Store 风格 | `class XxxStore extends PiniaStoreBase`（class 风格） | **setup 函数式**（对齐标准 Pinia setup store 官方推荐，Q3 已确认） |
| state | `reactive<T>` class 字段 + `bindState()` | setup 内 ref/computed + reactive 包装（PoC 已验证解包可行） |
| $reset/$patch/持久化 | Template Method 钩子 `_doReset/_hydrate/_serialize`（因 UTS 无 Proxy、reactive 是强类型 class 无法反射遍历） | setup 式下用户在 setup 内自定义 reset；$patch 用 mutator 形态；无钩子负担 |
| effectScope | **已实证 vdom 模式可用**（其 defineStore 内部为每个 store 建 EffectScope 隔离组件生命周期） | 修正设计文档假设（原以为不存在）；v1 全局单例可不用，但 $dispose 场景后续可用 scope.stop() |
| 插件系统 | `pinia.use(plugin)`，插件**不能返回扩展对象**（PiniaPlugin 返回 void） | v1 不做插件（非目标），后置时遵循同样约束 |
| Vue 标准接入 | 支持 `app.use(pinia)`，但 `globalProperties` 赋值变量必须定义在模块顶层（app-android 强制约束） | unix-pinia 模块单例无需 app.use，天然规避该约束 |
| 泛型约束 | `defineStore<T>` 不加约束（UTS 泛型约束不可靠），运行时 `as any as PiniaStoreBase` | 同样不加约束 + `as T` 收窄（PoC 验证可行） |
| 环境要求 | HBuilderX 4.87+，Android/iOS/鸿蒙/微信/Chrome 全覆盖，含蒸汽模式 | 一致（我们 5.26 起步更宽裕） |

### 3.2 unix-storage 工程结构（Q4 参考，已确认）

- pnpm monorepo：`packages/core`（标准 uni_modules UTS 插件：`utssdk/` + `interface.uts` 对外声明）+ `packages/docs`（VitePress）+ `packages/playground`（**纯 HBuilderX 工程**，`[verify]` 前缀自动验证页模式）
- **npm 分发机制（关键）**：uni-app x 编译器不扫描 node_modules——`pnpm add @meng-xi/unix-storage` 后需将包内容同步到工程 `uni_modules/ux-storage/`（cp 命令）
- core `package.json` 要点：`main/module/types` 均指 `utssdk/index.uts`；peerDependencies vue optional
- playground 的 `vite.config.ts` 携带 uts-proxy 字符串字面量官方 bug 修复插件
- **注意**：unix-storage playground 的 manifest 是 `"vapor": true`（蒸汽模式）；unix-pinia 主战场是 vdom 模式，PoC 工程已显式 `"vapor": false` 并经编译日志确认

## 4. DoD 检查清单（core-protocol）

- [x] 代码保存且编译通过（VDOM 模式，编译成功，**零警告**）
- [x] 已实际运行（HBuilderX 内置浏览器 + 外部浏览器双通道）
- [x] 日志已验证（`cli logcat web` 捕获全部 `[verify]` 输出，见第 1 章证据列）
- [x] 功能符合预期（P1–P6、T6 全部 pass；跨页面状态联动经浏览器实测确认）
- [x] 无运行时错误（日志无任何 error/exception）
- [x] 现场已清理（无调试残留；`[verify]` 日志为验证工程必要业务日志，保留）
- [ ] **Android 端复验（待办）**：方案 A 的 Kotlin 端 reactive 解包行为、`import type { ComputedRef } from 'vue'` 的 Kotlin 侧表现，需设备后执行

## 5. Android 端待补验步骤（设备就绪后执行）

1. 连接 Android 真机（USB 调试）或启动模拟器，`adb devices` 确认设备在线（adb：`D:\HBuilderX\plugins\launcher-tools\tools\adbs\adb.exe`）
2. `D:\HBuilderX\cli.exe launch app-android --project e:\github\MengXi-Studio\unix-pinia\packages\playground`
3. `D:\HBuilderX\cli.exe logcat app --project e:\github\MengXi-Studio\unix-pinia\packages\playground --mode full` 收集 `[verify]` 日志
4. 比对第 1 章结论是否在 Kotlin 端复现；重点观察 P3a/P3b（方案 A 门控项）

## 6. 对设计文档的修正建议（已同步更新）

1. 3 章约束表：`effectScope` 行修正——vdom 模式实际可用（x-pinia-s 实证），v1 仍不依赖（全局单例无需 scope）
2. 5.2 方案 A/B：Web 端 PoC 通过，方案 A 确认为目标形态（Android 复验后最终定稿）
3. 5.1 类型规范补充：`ComputedRef` 必须 `import type { ComputedRef } from 'vue'`（`Ref` 可全局注入，但为一致性建议统一显式导入）
