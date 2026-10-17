---
layout: home

title: '@meng-xi/unix-pinia'
titleTemplate: Unix Pinia 状态管理

hero:
  name: '@meng-xi/unix-pinia'
  text: uni-app x 状态管理
  tagline: 为 uni-app x 提供 Pinia 风格的状态管理库（UTS 编写，setup 式，一套 API 多端覆盖）
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
    details: defineStore / storeToRefs / createPinia / patch / dispose——一比一复刻 Pinia API 面，裁掉平台不可实现项并给足替代方案
  - icon: ⚡
    title: 原生性能
    details: UTS 源码分发，Web 编译为 JS、Android 编译为 Kotlin，由 uni-app x 编译链现场编译，无 JS Bridge
  - icon: 🧩
    title: 免挂载单例
    details: 模块级注册表保证应用级单例，跨页面共享状态，无需 app.use 即可工作
  - icon: 🔗
    title: 跨 store 依赖
    details: setup 内直接调用对方 useStore 即可组合 store，注册表保证单例，与标准 Pinia 用法一致
  - icon: 🛡️
    title: 双端实测
    details: Web（JS 编译链）与 Android 真机（Kotlin 编译链）全用例通过；平台差异项（reactive 解包、app.use、deep watch）逐项实测裁决
  - icon: 🔒
    title: 严格类型
    details: 严格 UTS 类型，store 返回类型显式标注；Kotlin 泛型擦除边界在库内收敛，业务侧零感知
---
