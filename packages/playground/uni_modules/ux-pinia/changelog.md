## 0.1.0（2026-10-17）

PoC 骨架版本（M1 技术验证用，API 未定稿）。

### 新增

- **模块级单例注册表**：`Map<string, any>` 顶层静态注册表，应用级生命周期，跨页面共享（Web 端验证通过，Android 待复验）
- **setup 式 defineStore**：`defineStore<T>(id, setup): () => T`，泛型 + 显式 type 标注；同 id 重复定义幂等返回既有实例并警告
- **storeToRefs**：方案 B 透传形态（方案 A reactive 解包已验证可行，待 Android 复验后定稿）
- **PoC 结论**：Web 端 vdom 模式 P1–P6 全部通过，详见 `.trae/documents/unix-pinia-PoC验证报告.md`
