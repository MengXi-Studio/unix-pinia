<img alt="梦曦工作室 Logo" width="180" src="https://raw.githubusercontent.com/MengXi-Studio/unix-pinia/master/packages/docs/src/public/logo.png">

# ux-pinia-persist

为 [ux-pinia](https://www.npmjs.com/package/@meng-xi/unix-pinia) 提供持久化（存储原语 + 每字段一行约定，后端可替换）。

**ux-pinia-persist** 是开源项目 [unix-pinia](https://github.com/MengXi-Studio/unix-pinia) 的 uni_modules 插件发行版（npm 包名
[`@meng-xi/unix-pinia-persist`](https://www.npmjs.com/package/@meng-xi/unix-pinia-persist)），把持久化收敛成**两个存储原语 + 一行约定**：JSON 信封序列化防脏数据、每字段独立存储键、后端可替换——对标 pinia-plugin-persistedstate 的「声明即持久化」体验，适配 UTS 的强类型约束。

## 特性

- **纯存储原语**：`loadPersisted` / `savePersisted` 零 vue 依赖，插件层与 ux-pinia core 同构（HBuilderX 5.34 云打包实证的稳态架构）
- **每字段一行约定**：主工程 `persistedRef` helper 组合恢复与自动落盘，store 内声明即持久化
- **JSON 信封序列化**：每字段独立 `{ v }` 信封——规避 uni storage「未命中返回空串」与合法空值的歧义，损坏数据自动回退默认值
- **后端可替换**：`setStorageAdapter` 一个函数切换 unix-storage / 原生 preferences，业务代码零改动
- **强类型 UTS**：全量显式类型标注；Kotlin 可空性边界（`Any?` / 对象字面量桥接）已在库内收敛

## 平台兼容性

| App-Android | App-iOS | App-HarmonyOS | Web（Chrome / Safari） | 微信小程序 |
| :---------: | :-----: | :-----------: | :--------------------: | :--------: |
|      √      |    √    |       √       |           √            |     √      |

> 环境要求：HBuilderX 4.75+，uni-app x 项目；依赖 [ux-pinia](https://ext.dcloud.net.cn/plugin?name=ux-pinia)。

## 使用说明

### 1. 导入插件

在 HBuilderX 中通过插件市场「导入插件」安装（同时导入依赖 ux-pinia），插件位于工程 `uni_modules/ux-pinia-persist/`；也可从 npm 安装后将包内容复制到 `uni_modules/ux-pinia-persist/`。

### 2. 主工程侧定义 helper（stores/persist-helper.uts）

插件层是纯存储原语，恢复与落盘的 vue API（`ref` / `watch`）在主工程组合一次、全项目复用：

```uts
// stores/persist-helper.uts（主工程文件，可用 vue API）
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { loadPersisted, savePersisted } from '@/uni_modules/ux-pinia-persist'

/** 持久化字段：恢复初值 + 字段级 watch 自动落盘 */
export function persistedRef<T>(storeId: string, key: string, defaultValue: T): Ref<T> {
	const saved: any | null = loadPersisted(storeId, key)
	const r: Ref<T> = ref(saved != null ? (saved as T) : defaultValue) as Ref<T>
	watch(r, (nv: any, ov: any): void => {
		savePersisted(storeId, key, nv)
	})
	return r
}
```

### 3. store 内每字段一行

```uts
import type { Ref } from 'vue'
import { defineStore } from '@/uni_modules/ux-pinia'
import { persistedRef } from './persist-helper.uts'

export type UserStore = {
	token: Ref<string>,        // 持久化字段
	tempView: Ref<string>      // 普通内存字段
}

export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
	const token: Ref<string> = persistedRef('user', 'token', '')  // ← 每字段一行
	const tempView: Ref<string> = ref('')
	const setToken = (t: string): void => { token.value = t }     // action 不用管落盘
	return { token, tempView, setToken } as UserStore
})
```

> 为什么需要主工程 helper：UTS 插件内 vue 符号（Ref/ref/watch）的 Kotlin import 生成失效（HBuilderX 5.34 云打包实证），插件保持零 vue 符号是唯一稳态；主工程 / 页面编译路径不受影响。

## API 清单

| API | 说明 |
| --- | --- |
| loadPersisted | 读取持久化值（JSON 信封解包），未命中 / 损坏返回 null |
| savePersisted | 写入持久化值（JSON 信封封装） |
| getStorageKey | 组完整存储键（`ux-pinia-persist:<storeId>.<key>`），调试直读存储用 |
| setStorageAdapter | 替换存储后端（默认 uni storage，可换 unix-storage / 原生 preferences） |
| StorageAdapter | 存储后端契约类型：`{ get, set }` |

## 文档与演示

- 📖 完整文档（指南 + API 参考 + 更新日志，中英双语）：[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)
- 💻 示例工程：仓库自带 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)，「持久化插件」页运行 PS1-1 ~ PS1-5 完整验证用例
- 📱 Android 真机体验：[下载演示 App（APK）](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1792298656822-__UNI__0AA2919_1792298648182.apk)

## 更新记录

### 0.1.0（2026-10-30）

- 首个版本发布：unix-pinia 生态持久化插件（纯存储原语形态）
- API：loadPersisted / savePersisted / getStorageKey / setStorageAdapter，类型 StorageAdapter
- 零 vue 依赖架构：与 ux-pinia core 同构，Kotlin / JS 编译链无额外风险

完整更新记录见 [changelog.md](./changelog.md)。

## 交流与支持

想了解设计思路与实现原理（JSON 信封序列化、可替换后端契约、5.34 编译器实证的插件架构约束等）？公众号「**梦曦工作室**」有系列解析，扫码获取更多信息：

<img alt="微信公众号二维码" width="180" src="https://raw.githubusercontent.com/MengXi-Studio/unix-pinia/master/packages/docs/src/public/QR_code.jpg">

- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)
- 🌐 官网：[mengxi-studio.github.io](https://mengxi-studio.github.io/.github/)

## 开源协议

[MIT](./license.md) © MengXi-Studio
