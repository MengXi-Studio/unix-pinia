# Installation

## Option 1: npm (recommended)

Install, then sync the package into your project's `uni_modules/ux-pinia/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-pinia
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-pinia uni_modules/ux-pinia
```

## Option 2: plugin market

Search `ux-pinia` in the HBuilderX plugin market and import it.

## Import path

Always import from the uni_modules directory:

```uts
import { defineStore, storeToRefs } from '@/uni_modules/ux-pinia'
import type { PiniaPlugin } from '@/uni_modules/ux-pinia'
```

## Requirements

| Item | Requirement |
| --- | --- |
| HBuilderX | 4.75+ (tested on 5.26) |
| Compilation mode | vdom mode is the target (Vapor-mode projects should use standard Pinia) |
| manifest.json | do **not** enable `vapor: true` |

## Verify

Run this in any page's `script setup`:

```uts
import { getActivePinia } from '@/uni_modules/ux-pinia'
console.log('unix-pinia ready')
```

For a full check, use the demo app [packages/playground](https://github.com/MengXi-Studio/unix-pinia/tree/master/packages/playground): open it in HBuilderX and release, or install the [Android demo APK (cloud build)](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1792298656822-__UNI__0AA2919_1792298648182.apk) directly and open each feature page to see the `[verify]` results.
