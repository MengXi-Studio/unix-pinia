# 安装

## 方式一：npm（推荐）

安装后将包内容同步到工程 `uni_modules/ux-pinia/`（编译器不扫描 node_modules）：

```bash
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

## 方式二：插件市场

在 HBuilderX 插件市场搜索 `ux-pinia`，导入工程。

## 导入路径

业务侧统一从 uni_modules 目录导入：

```uts
import { defineStore, PiniaStoreBase, createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
import { createPersistPlugin, clearPersistedState, setStorageAdapter, dispose, getStoreId } from '@/uni_modules/ux-pinia'
import type { Pinia, PiniaPlugin, PiniaPluginContext, StorageAdapter } from '@/uni_modules/ux-pinia'
```

## 环境要求

| 项 | 要求 |
| --- | --- |
| HBuilderX | 4.75+ |
| 项目类型 | uni-app x 项目 |
| 编译模式 | vdom / 蒸汽（vapor）均可——蒸汽模式云打包验证通过，vdom 模式 Web 全用例实测 |

## 验证安装

定义任意 store 并在页面消费（见[快速开始](./getting-started)），编译通过且页面响应即安装成功。更完整的验证可使用仓库示例工程 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)：用 HBuilderX 打开并发行，或直接安装 [Android 体验包（云打包产物）](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793456655694-__UNI__0AA2919_1793456648910.apk)，进入各功能页查看 `[verify]` 结果。
