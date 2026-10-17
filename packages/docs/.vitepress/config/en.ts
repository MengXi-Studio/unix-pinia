import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/unix-pinia/en/'
export const META_TITLE = 'Unix Pinia'
export const META_DESCRIPTION = 'Pinia-style state management for uni-app x, written in strict UTS'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** Site description */
	description: META_DESCRIPTION,

	/** Site head */
	head: [
		['meta', { property: 'og:url', content: META_URL }],
		['meta', { property: 'og:description', content: META_DESCRIPTION }],
		['meta', { property: 'twitter:url', content: META_URL }],
		['meta', { property: 'twitter:title', content: META_TITLE }],
		['meta', { property: 'twitter:description', content: META_DESCRIPTION }]
	],

	/** Theme config */
	themeConfig: {
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/unix-pinia/edit/master/packages/docs/:path',
			text: 'Suggest changes to this page'
		},

		nav: [
			{ text: 'Guide', link: '/en/guide/introduction' },
			{ text: 'API', link: '/en/api/functions' },
			{ text: 'Changelog', link: '/en/changelog' },
			{
				text: 'Links',
				items: [
					{ text: 'Discussions', link: 'https://github.com/MengXi-Studio/unix-pinia/discussions' },
					{ text: 'Releases', link: 'https://github.com/MengXi-Studio/unix-pinia/releases' }
				]
			}
		],

		sidebar: {
			'/en/guide/': [
				{
					text: 'Getting started',
					items: [
						{ text: 'Introduction', link: '/en/guide/introduction' },
						{ text: 'Installation', link: '/en/guide/installation' },
						{ text: 'Quick start', link: '/en/guide/getting-started' }
					]
				},
				{
					text: 'Essentials',
					items: [
						{ text: 'Basic usage', link: '/en/guide/basic-usage' },
						{ text: 'Differences from standard Pinia', link: '/en/guide/pinia-diff' }
					]
				},
				{
					text: 'Advanced',
					items: [
						{ text: 'Platform support', link: '/en/guide/platform' },
						{ text: 'Best practices', link: '/en/guide/best-practices' }
					]
				},
				{
					text: 'Deep dive',
					items: [
						{ text: 'Internals', link: '/en/guide/internals' },
						{ text: 'FAQ', link: '/en/guide/faq' }
					]
				}
			],
			'/en/api/': [
				{
					text: 'Core API',
					items: [
						{ text: 'Top-level functions', link: '/en/api/functions' },
						{ text: 'Pinia instance', link: '/en/api/instance' }
					]
				},
				{
					text: 'Types',
					items: [{ text: 'Type definitions', link: '/en/api/types' }]
				}
			]
		}
	}
}
