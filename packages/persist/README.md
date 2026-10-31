**中文** | [English](./README-en.md)

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="梦曦工作室 Logo" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-pinia">
    <img alt="微信公众号 二维码" width="215" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-pinia-persist</h1>
  <p>为 uni-app x 提供持久化的生态示范插件（存储原语 + 每字段一行约定，后端可替换）</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-pinia.svg)](./license.md) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-pinia-persist?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-pinia-persist)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-pinia-persist?color=green)

</div>

## 为什么是 unix-pinia-persist

uni-app x 的状态是内存态：应用冷启动即失——计数器、登录态、用户偏好，每项都要手写 `getStorageSync` / `setStorageSync` 样板，还要自己处理序列化、脏数据与键名规范。标准 Pinia 生态的 [pinia-plugin-persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) 在这里帮不上忙：vdom 模式原生端连标准 Pinia 都不可用，且 UTS 无反射、插件不能注入属性——`{ persist: true }` 的零约定全自动形态没有实现基础。unix-pinia-persist 把持久化收敛成**两个存储原语 + 一行约定**：

- **用过 persistedstate？** 「声明即持久化」的心智保留：每字段一行 `persistedRef` 声明，恢复与自动落盘全部内建；
- **在意数据安全？** 每字段独立 JSON 信封（`{ v }`）序列化——规避 uni storage「未命中返回空串」与合法空值的歧义，损坏数据自动回退默认值；
- **换存储后端？** `setStorageAdapter` 一个函数切换 unix-storage / 原生 preferences，业务代码零改动。

## 特性

- **纯存储原语** - `loadPersisted` / `savePersisted`：JSON 信封读写，未命中或损坏自动回退，插件层零 vue 依赖
- **每字段一行约定** - 主工程 `persistedRef` helper（示例见下）：声明即持久化，恢复 + 字段级 watch 自动落盘全部内建
- **后端可替换** - `setStorageAdapter`：默认 uni storage，可换 unix-storage / 原生 preferences，业务代码零改动
- **架构稳态** - 插件层零 vue 符号（HBuilderX 5.34 云打包实证：UTS 插件内 vue 符号的 Kotlin import 生成失效，与 ux-pinia core 同构是唯一稳态），Kotlin / JS 编译链无额外风险
- **强类型 UTS** - 全量显式类型标注；Kotlin 可空性边界（`Any?` / 对象字面量桥接）已在库内收敛，业务侧零感知
- **双端实测** - Web（JS 编译链）全用例通过；Android 与 core 同构（Kotlin 编译链），待真机复验

## 安装

**npm**——安装后将包内容同步到工程 `uni_modules/ux-pinia-persist/`（编译器不扫描 node_modules）：

```bash
pnpm add @meng-xi/unix-pinia-persist
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia-persist uni_modules/ux-pinia-persist
```

**插件市场**：搜索 `ux-pinia-persist` 导入 HBuilderX。

> `packages/persist` 为标准 **uni_modules UTS 插件**（`utssdk/` 官方目录结构 + `interface.uts` 对外声明），业务侧从 `@/uni_modules/ux-pinia-persist` 导入。

## 快速开始

### 1. 主工程侧定义 helper（stores/persist-helper.uts）

插件层是纯存储原语（零 vue 符号），恢复与落盘的 vue API（`ref` / `watch`）在主工程组合一次、全项目复用：

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

### 2. store 内每字段一行（stores/user.uts）

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

- **恢复**：`persistedRef` 创建 ref 时即从存储读初始值（未命中或损坏数据自动回退默认值）
- **落盘**：内建字段级 watch，值变化即写存储（应用级生命周期，无需挂接任何插件，main.uts 保持免挂载）
- **直读/调试**：`getStorageKey('user', 'token')` 组出完整键 `ux-pinia-persist:user.token`，配合控制台直查存储内容

### 3. 换存储后端（可选）

```uts
import { setStorageAdapter } from '@/uni_modules/ux-pinia-persist'

// 在首次读写字段前调用；以 unix-storage 为例
setStorageAdapter({
	get: (key: string): string | null => {
		const r: any | null = uni.getStorageSync(key)
		return r == null || (r as string).length == 0 ? null : r as string
	},
	set: (key: string, value: string): void => { uni.setStorageSync(key, value) }
})
```

## 运行效果

仓库自带示例工程 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)，「持久化插件 Persist」页以 PS1-1 ~ PS1-5 用例验证完整链路（修改自动落盘 / 直读存储验证信封内容 / 内存字段不落盘对照 / 启动恢复），以 `[verify]` 前缀输出日志并在页面直接显示 pass/fail。用 HBuilderX 打开 `packages/playground` 即可发行 Web / Android 复验。

**Android 体验包（云打包产物）**：[下载 APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793386392738-__UNI__0AA2919_1793386383661.apk)（蒸汽模式，安装后进入「持久化插件」页查看 PS1 结果）

**双端实测结论**：Web 全部用例通过；Android 侧插件与 ux-pinia core 同构（Kotlin 编译链零 vue 符号），待真机复验。

## 与 pinia-plugin-persistedstate 的差异

| 项 | persistedstate | 本库 |
| --- | --- | --- |
| 声明成本 | `{ persist: true }` 零约定 | 每字段一行 `persistedRef` |
| 实现原理 | Proxy 拦截 + `$subscribe` + 注入 `$hydrate` | 存储原语 + 主工程 helper 组合（无反射 / 无注入） |
| 序列化 | JSON 全量快照 | 每字段独立 JSON 信封（`{ v }`），损坏自动回退 |
| 订阅粒度 | 整体 `$subscribe` | 字段级 `watch`（P9 实证：deep watch Android 端不触发） |

## 交流与支持

想了解设计思路与实现原理（JSON 信封序列化、可替换后端契约、5.34 编译器实证的插件架构约束等）？公众号「**梦曦工作室**」有系列解析，扫码关注：

<p align="center">
  <img alt="微信公众号 二维码" width="180" src="https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/docs/src/public/QR_code.jpg">
</p>

- 📖 [完整文档](https://mengxi-studio.github.io/unix-pinia/)（指南 + API 参考 + 更新日志）
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-pinia/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-pinia/discussions)

## 导出

- API：`loadPersisted` / `savePersisted` / `getStorageKey` / `setStorageAdapter`
- 类型：`StorageAdapter`

## 文档

📖 unix-pinia 全家桶文档（指南 + API 参考 + 更新日志）：

**[https://mengxi-studio.github.io/unix-pinia/](https://mengxi-studio.github.io/unix-pinia/)**

## 更新日志

📝 **[https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/playground/uni_modules/ux-pinia-persist/changelog.md](https://github.com/MengXi-Studio/unix-pinia/blob/master/packages/playground/uni_modules/ux-pinia-persist/changelog.md)**

## License

[MIT](./license.md)
