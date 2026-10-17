import { defineConfig } from 'vitepress'

/** 网站部署基础路径（CI 可经 DOCS_BASE 注入，本地默认 /unix-pinia/） */
const base = process.env.DOCS_BASE || '/unix-pinia/'

export default defineConfig({
	/** 网站部署基础路径（GitHub Pages 项目页必须为仓库名） */
	base,

	title: 'Unix Pinia',
	description: '为 uni-app x 提供 Pinia 风格的状态管理库（UTS 编写，setup 式）',

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

	themeConfig: {
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

		nav: [
			{ text: '指南', link: '/guide/introduction', activeMatch: '/guide/' },
			{ text: 'API', link: '/api/functions', activeMatch: '/api/' },
			{ text: '版本记录', link: '/changelog' }
		],

		sidebar: {
			'/guide/': [
				{
					text: '指南',
					items: [
						{ text: '介绍', link: '/guide/introduction' },
						{ text: '快速开始', link: '/guide/getting-started' },
						{ text: '基础用法', link: '/guide/basic-usage' },
						{ text: '与标准 Pinia 的差异', link: '/guide/pinia-diff' }
					]
				}
			],
			'/api/': [
				{
					text: 'API 参考',
					items: [
						{ text: '函数', link: '/api/functions' },
						{ text: '类型', link: '/api/types' }
					]
				}
			]
		},

		/** 页脚 */
		footer: {
			copyright: 'Copyright © 2026-present 梦曦工作室',
			message: 'Released under the MIT License.'
		}
	}
})
