/**
 * RouteNameMap 字面量类型增强（由 @meng-xi/unix-router/vite-plugin 生成）
 * 供 WEB 端 RouteName 类型推导；原生端 UTS 不支持 keyof 组合，仍为 string。
 */
import '@/uni_modules/ux-router/utssdk/index.uts'

declare module '@/uni_modules/ux-router/utssdk/index.uts' {
	interface RouteNameMap {
		/** unix-pinia */
		home: 'pages/index/index'
		/** 基础用法 */
		basic: 'pages-sub/basic/basic'
		/** 跨页面共享（写入） */
		'cross-page': 'pages-sub/cross-page/cross-page'
		/** 跨 store 依赖 */
		'cross-store': 'pages-sub/cross-store/cross-store'
		/** 跨页面共享（断言） */
		'cross-verify': 'pages-sub/cross-verify/cross-verify'
		/** 实例 API */
		'instance-api': 'pages-sub/instance-api/instance-api'
		/** 插件与 Pinia 实例 */
		plugin: 'pages-sub/plugin/plugin'
		/** 响应式矩阵 */
		reactive: 'pages-sub/reactive/reactive'
		/** 单例与幂等 */
		singleton: 'pages-sub/singleton/singleton'
		/** 状态订阅 */
		subscribe: 'pages-sub/subscribe/subscribe'
	}
}
