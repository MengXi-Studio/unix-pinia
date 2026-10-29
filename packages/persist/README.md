# @meng-xi/unix-pinia-persist

为 [unix-pinia](https://github.com/MengXi-Studio/unix-pinia) 提供持久化的**生态示范插件**：每字段一行约定 + state 变化自动落盘，存储后端可替换。

## 为什么是"约定"而不是"全自动"

UTS 无运行时反射（不能枚举 store 字段）、插件不能向 store 注入属性、整体订阅（deep watch）在 Android 端不触发——标准 persistedstate 的零约定全自动形态不可实现。本库用**注册表约定**绕开：

- `persistRef`：声明持久化字段（每字段一行），从存储读历史值做启动恢复
- `persistPlugin`：store 创建时为已登记字段建立字段级 watch，变化自动落盘
- `setStorageAdapter`：自选存储后端（默认 uni storage；可换 unix-storage / 原生 preferences）

## 用法

```sh
pnpm add @meng-xi/unix-pinia-persist
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia-persist uni_modules/ux-pinia-persist
```

```uts
// stores/user.uts
import { persistRef } from '@/uni_modules/ux-pinia-persist'

export type UserStore = {
	token: Ref<string>,        // 持久化字段
	tempView: Ref<string>      // 普通内存字段
}

export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
	const token: Ref<string> = persistRef<string>('user', 'token', '')  // ← 每字段一行
	const tempView: Ref<string> = ref('')
	const setToken = (t: string): void => { token.value = t }           // action 不用管落盘
	return { token, tempView, setToken } as UserStore
})
```

```uts
// main.uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
import { persistPlugin } from '@/uni_modules/ux-pinia-persist'
setActivePinia(createPinia().use(persistPlugin))
```

- 恢复：`persistRef` 创建 ref 时即从存储读初始值（损坏数据自动回退默认值）
- 落盘：`persistPlugin` 挂接字段级 watch，值变化即写存储；未挂接插件时恢复仍生效，仅自动落盘失效（可手动 `persistNow(storeId, key, value)`）
- 换后端：`setStorageAdapter({ get, set })` 在创建任何 store 前调用

## 与 pinia-plugin-persistedstate 的差异

| 项 | persistedstate | 本库 |
| --- | --- | --- |
| 声明成本 | `{ persist: true }` 零约定 | 每字段一行 `persistRef` |
| 实现原理 | Proxy 拦截 + $subscribe + 注入 $hydrate | 注册表约定 + 字段级 watch + 无注入 |
| 序列化 | JSON 全量快照 | 每字段独立 JSON 信封（`{ v }`），损坏自动回退 |

## License

[MIT](./license.md)
