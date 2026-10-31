## 0.2.0（2026-10-31）

### 新增

- **持久化存储原语并入**（原独立插件 ux-pinia-persist）：`loadPersisted` / `savePersisted`（JSON 信封 `{ v }` 序列化，未命中 / 损坏回退默认值）、`getStorageKey`（键拼接）、`setStorageAdapter` + `StorageAdapter` 类型（后端可替换）
- 免挂载设计不变：持久化经主工程 `persistedRef` helper 组合恢复与字段级 watch 自动落盘（vue API 收拢在使用方编译路径，5.34 编译器实证的稳态架构）
- 蒸汽模式（vapor）云打包验证通过

### 变更

- npm 包版本对齐 0.2.0；原 `@meng-xi/unix-pinia-persist` 独立包取消发布（未曾发布 npm），其定位（生态示范插件）因持久化重构为纯存储原语而消解

## 0.1.0（2026-10-18）

首个公开版本。

### 新增

- **setup 式 defineStore**：`defineStore<T>(id, setup): () => T`，state 用 `Ref`、getter 用 `ComputedRef`、action 用箭头函数；同 id 重复定义幂等并警告
- **模块级单例注册表**：应用级生命周期，跨页面共享状态（Web + Android 双端实测）
- **storeToRefs**：模板解构自动解包
- **实例 API 顶层函数映射**：`patch`（≙ `$patch` mutator 形态）/ `dispose`（≙ `$dispose`）/ `getStoreId`（≙ `$id`）
- **Pinia 实例与插件体系**：`createPinia` / `setActivePinia` / `getActivePinia` / `pinia.use(plugin)`（插件返回 void，UTS 约束）
- **免挂载设计**：纯状态管理无需任何挂载代码；插件场景顶层 `setActivePinia(createPinia().use(plugin))`
- **平台验证**：vdom 模式 Web 与 App-Android（Kotlin 编译链）全用例通过

### 已知差异

- 脚本访问 state 需 `.value`（UTS 无 Proxy）；模板经 `storeToRefs` 解构后自动解包
- `$subscribe` / `$onAction` / `$state` / `$patch` 对象形态 / Options 式 defineStore 不支持，详见文档「与标准 Pinia 的差异」
