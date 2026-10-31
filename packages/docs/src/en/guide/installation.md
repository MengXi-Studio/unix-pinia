# Installation

## Option 1: npm (recommended)

Install, then sync the package contents into your project's `uni_modules/ux-pinia/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

## Option 2: plugin market

Search `ux-pinia` in the HBuilderX plugin market and import it into your project.

## Import path

Business code always imports from the uni_modules directory:

```uts
import { defineStore, PiniaStoreBase, createPinia, setActivePinia } from '@/uni_modules/ux-pinia'
import { createPersistPlugin, clearPersistedState, setStorageAdapter, dispose, getStoreId } from '@/uni_modules/ux-pinia'
import type { Pinia, PiniaPlugin, PiniaPluginContext, StorageAdapter } from '@/uni_modules/ux-pinia'
```

## Requirements

| Item | Requirement |
| --- | --- |
| HBuilderX | 4.75+ |
| Project type | a uni-app x project |
| Compilation mode | vdom or Vapor both work — verified via cloud build in Vapor mode, full suite verified on Web in vdom mode |

## Verify

Define any store and consume it in a page (see [Quick start](./getting-started)); a clean compile and a responsive page mean the installation succeeded. For a fuller check, use the repo's demo app [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground): open it in HBuilderX and release, or install the [Android demo APK (cloud build artifact)](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1793456655694-__UNI__0AA2919_1793456648910.apk) directly and open each feature page to see the `[verify]` results.
