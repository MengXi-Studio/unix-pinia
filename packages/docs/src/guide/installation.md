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
import { defineStore, storeToRefs } from '@/uni_modules/ux-pinia'
import type { PiniaPlugin } from '@/uni_modules/ux-pinia'
```

## 环境要求

| 项 | 要求 |
| --- | --- |
| HBuilderX | 4.75+（5.26 实测） |
| 编译模式 | vdom 模式主战场（蒸汽模式建议直接用标准 Pinia） |
| uni-app x 项目 | `manifest.json` 的 `uni-app-x` 节点**不要**开启 `vapor: true` |

## 验证安装

在任意页面 `script setup` 中执行：

```uts
import { getActivePinia } from '@/uni_modules/ux-pinia'
console.log('unix-pinia ready')
```

编译通过且控制台输出即安装成功。更完整的验证可使用仓库示例工程 [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground)。
