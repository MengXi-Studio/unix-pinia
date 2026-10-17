---
layout: home

title: '@meng-xi/unix-pinia'
titleTemplate: Unix Pinia state management

hero:
  name: '@meng-xi/unix-pinia'
  text: uni-app x state management
  tagline: Pinia-style state management for uni-app x (strict UTS, setup stores, one API across platforms)
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
    details: defineStore / storeToRefs / createPinia / patch / dispose — the Pinia API surface replicated 1:1, with platform-impossible items pruned and documented
  - icon: ⚡
    title: Native performance
    details: UTS source distribution — compiled to JS on Web and Kotlin on Android by the uni-app x toolchain, no JS bridge
  - icon: 🧩
    title: Mount-free singletons
    details: A module-level registry guarantees app-lifetime stores shared across pages — no app.use required
  - icon: 🔗
    title: Cross-store composition
    details: Call the other useStore inside setup; the registry guarantees singletons, matching standard Pinia
  - icon: 🛡️
    title: Verified on both platforms
    details: Full suite passes on Web (JS toolchain) and Android real device (Kotlin toolchain); platform gaps verified and adjudicated one by one
  - icon: 🔒
    title: Strictly typed
    details: Explicit store type annotations; the Kotlin generics-erasure boundary is contained inside the library
---
