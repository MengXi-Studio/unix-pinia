---
layout: home

title: '@meng-xi/unix-pinia'
titleTemplate: Unix Pinia state management

hero:
  name: '@meng-xi/unix-pinia'
  text: uni-app x state management
  tagline: Pinia-style state management with built-in persistence for uni-app x (class-style stores, strict UTS, one API across platforms)
  image:
    src: /logo.svg
    alt: Unix Pinia
  actions:
    - theme: brand
      text: Quick start
      link: /en/guide/getting-started
    - theme: alt
      text: Introduction
      link: /en/guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-pinia

features:
  - icon: 🍍
    title: Pinia mental model
    details: class-style defineStore — state wrapped in strongly-typed reactive<T>, derived values as getters, actions as plain methods; the structure aligns with the official state / getters / actions
  - icon: 🧰
    title: Full $-API
    details: $patch / $reset / $subscribe / $onAction / $dispose / $id / $state / $save all built in, with three hooks to override on demand
  - icon: 💾
    title: Built-in persistence
    details: register createPersistPlugin once and every store is covered — automatic restore on store creation, automatic persist to storage on $patch / $reset / $save, swappable storage backend
  - icon: 🧩
    title: Mount-free singletons
    details: a module-level registry guarantees app-level singletons shared across pages — works with no app.use at all
  - icon: 🔗
    title: Cross-store dependencies
    details: compose stores by calling the other useStore inside a method; the registry guarantees singletons
  - icon: ⚡
    title: Native performance
    details: UTS source distribution — compiled to JS on Web and Kotlin on Android by the uni-app x toolchain, no JS bridge
  - icon: 🔒
    title: Strictly typed
    details: strict UTS types with strongly-typed reactive<T> wrapping; Kotlin generics-erasure and nullability boundaries are contained inside the library — zero awareness on the business side
  - icon: 🛡️
    title: Verified on both platforms
    details: full suite passes on Web (JS toolchain); Android cloud build (Kotlin toolchain, Vapor mode) passes; platform difference items adjudicated case by case
---
