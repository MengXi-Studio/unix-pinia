# 基础用法

## 状态读写

setup 式 store 中，state 是 `Ref`：**脚本中通过 `.value` 读写，模板中经 `storeToRefs` 解构后自动解包**。

```uts
const store = useCounterStore()
store.count.value++                 // 脚本读写
console.log(store.doubleCount.value) // getter 求值
```

```uts
const { count, doubleCount } = storeToRefs(store)  // 模板解构自动解包
```

## 实例 API（顶层函数形态）

UTS 无 Proxy、对象不可动态注入属性，因此 `$` 方法映射为顶层函数：

```uts
import { patch, dispose, getStoreId } from '@/uni_modules/ux-pinia'

// ≙ store.$patch(fn)：批量修改（仅 mutator 形态）
patch(store, (s: CounterStore): void => {
  s.count.value = 10
})

// ≙ store.$id
const id: string = getStoreId(store)   // 'counter'

// ≙ store.$dispose()：注销实例，下次 useCounterStore() 重新执行 setup
dispose(store)
```

::: warning dispose 注意
`dispose` 后，**既有引用仍指向旧实例**（孤儿实例），后续对旧引用的修改不会反映到新实例。仅在与应用同生命周期的清理场景使用（如登出），常规业务请通过 action 重置状态。
:::

## 跨 store 依赖

在 setup 内直接调用对方 `useStore`（注册表保证单例）：

```uts
export const useUserStore = defineStore<UserStore>('user', (): UserStore => {
  const counterStore = useCounterStore()
  const score: Ref<number> = ref(0)
  const addScoreFromCount = (): void => {
    score.value += counterStore.count.value
  }
  return { score, addScoreFromCount } as UserStore
})
```

避免在 getter（computed）内跨 store 引用产生循环依赖，与标准 Pinia 注意事项一致。

## 状态订阅

整体订阅（`$subscribe`）在 Android 端不可实现（详见[差异说明](./pinia-diff)），使用字段级 `watch` 替代：

```uts
import { watch } from 'vue'

watch(store.count, (newVal: number, oldVal: number): void => {
  console.log('count changed:', oldVal, '->', newVal)
})
```

## 重置状态

`$reset` 与标准 Pinia 的 setup store 行为一比一（不内置），自定义 reset action：

```uts
const reset = (): void => {
  count.value = 0
  name.value = 'pinia'
}
```

## 插件

```uts
import { createPinia, setActivePinia } from '@/uni_modules/ux-pinia'

const logger: PiniaPlugin = (ctx: PiniaPluginContext): void => {
  console.log('store created:', ctx.storeId)
  // UTS 约束：插件不能返回对象合并进 store，仅做 hook 逻辑
}

setActivePinia(createPinia().use(logger))
```

插件需在首个 `useStore()` 调用前登记（建议放在 `main.uts` 顶层）。
