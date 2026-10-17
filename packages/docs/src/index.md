---
layout: home

hero:
  name: Unix Pinia
  text: uni-app x 的 Pinia 风格状态管理
  tagline: UTS 编写，setup 式 API，一套代码覆盖 vdom 模式 App 原生端与 Web——填补标准 Pinia 无法覆盖的空缺
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
  - icon: 🔒
    title: 严格类型
    details: 严格 UTS 类型，编辑器全程提示；store 返回类型显式标注，泛型工厂保持类型安全
---
