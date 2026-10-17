import { defineConfig } from 'vitepress'

/** 网站标题 */
export const title = 'Unix Pinia'

/** 跨语言共享配置（head / markdown / 主题公共项） */
export const sharedConfig = defineConfig({
	title,

	lastUpdated: true,

	markdown: {
		/** 代码块高亮主题 */
		theme: {
			dark: 'one-dark-pro',
			light: 'github-light'
		},
		/** UTS 是 TypeScript 的超集，按 TypeScript 高亮 */
		languageAlias: { uts: 'typescript' }
	},

	/** 网站头标签（favicon 资源拼 base 避免 404） */
	head: [
		['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
		['link', { rel: 'icon', href: '/favicon.ico' }]
	],

	/** 网站主题配置 */
	themeConfig: {
		/** 主题 logo（VitePress 自动拼 base） */
		logo: { src: '/logo.png', alt: 'Unix Pinia' },

		/** 本地搜索 */
		search: {
			provider: 'local',
			options: {
				translations: { button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' } }
			}
		},

		/** 社交链接 */
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/MengXi-Studio/unix-pinia' },
			{ icon: 'npm', link: 'https://www.npmjs.com/package/@meng-xi/unix-pinia' }
		],

		/** 页脚 */
		footer: {
			copyright: 'Copyright © 2026-present 梦曦工作室',
			message: 'Released under the MIT License.'
		}
	}
})
