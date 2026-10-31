---
layout: home

title: '@meng-xi/unix-pinia'
titleTemplate: Unix Pinia 状态管理

hero:
  name: '@meng-xi/unix-pinia'
  text: uni-app x 状态管理
  tagline: 为 uni-app x 提供 Pinia 风格的状态管理与内置持久化（class 式 store，UTS 编写，一套 API 多端覆盖）
  image:
    src: /logo.svg
    alt: Unix Pinia
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 介绍
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-pinia

features:
  - icon: 🍍
    title: 对齐 Pinia 心智
    details: class 式 defineStore——state 用 reactive<T> 强类型包裹、派生值用 getter、action 为普通 method，结构对齐官方 state / getters / actions
  - icon: 🧰
    title: 完整 $-API
    details: $patch / $reset / $subscribe / $onAction / $dispose / $id / $state / $save 全部内置，三个钩子按需重写
  - icon: 💾
    title: 内置持久化
    details: createPersistPlugin 一次登记全部生效——store 创建自动恢复、$patch / $reset / $save 自动落盘，存储后端可替换
  - icon: 🧩
    title: 免挂载单例
    details: 模块级注册表保证应用级单例，跨页面共享状态，无需 app.use 即可工作
  - icon: 🔗
    title: 跨 store 依赖
    details: method 内直接调用对方 useStore 即可组合 store，注册表保证单例
  - icon: ⚡
    title: 原生性能
    details: UTS 源码分发，Web 编译为 JS、Android 编译为 Kotlin，由 uni-app x 编译链现场编译，无 JS Bridge
  - icon: 🔒
    title: 严格类型
    details: 严格 UTS 类型，reactive<T> 强类型包裹；Kotlin 泛型擦除与可空性边界在库内收敛，业务侧零感知
  - icon: 🛡️
    title: 双端实测
    details: Web（JS 编译链）全用例通过；Android 云打包（Kotlin 编译链，蒸汽模式）通过；平台差异项逐项实测裁决
---
