/**
 * 同步各 UTS 插件包到 playground（多包映射）
 *
 * 用法：
 *   node scripts/sync-uni-modules.mjs           # 复制（增量覆盖）
 *   node scripts/sync-uni-modules.mjs --check   # 仅校验一致性（CI / precommit）
 *
 * 原理：packages/* 各包本身就是标准 uni_modules 插件目录（utssdk/ 结构），
 * 复制为 playground/uni_modules/<id>；HBuilderX 编译只扫描工程 uni_modules/
 * 目录，node_modules 内的 UTS 插件不被识别。
 *
 * 注意：插件目录名必须为 uni_modules id（npm 包名 @meng-xi/unix-pinia →
 * ux-pinia、@meng-xi/unix-pinia-persist → ux-pinia-persist），因此各
 * dest/package.json 为 playground 侧手工维护（id 与 npm 包名不同），同步时
 * 保留、不参与复制与校验。
 */
import { cpSync, existsSync, rmSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** 同步映射：包目录 → playground uni_modules 插件 id */
const targets = [
	{ src: 'packages/core', dest: 'packages/playground/uni_modules/ux-pinia', label: 'ux-pinia' },
	{ src: 'packages/persist', dest: 'packages/playground/uni_modules/ux-pinia-persist', label: 'ux-pinia-persist' }
]

/** 插件目录只需要这些内容（core 侧 README-en.md 面向 npm 仓库浏览场景，playground 不需要） */
const INCLUDE = ['utssdk', 'README.md', 'license.md']

/** 同步时需在目标目录保留的手工维护文件（不复制、不删除、校验豁免）：
 *  - package.json：HBuilderX 插件发布要求 id 为 ux-*，与 npm 包元数据不同
 *  - changelog.md：包侧无此文件，仅 playground 侧维护 */
const KEEP = ['package.json', 'changelog.md']

/** 列出目录下全部相对文件；filterTop 为 true 时仅统计 INCLUDE 白名单内的顶层条目（与复制 filter 语义一致） */
function listFiles(dir, filterTop = false) {
	const out = []
	if (!existsSync(dir)) return out
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name === 'unpackage' || name === '.DS_Store') continue
		if (filterTop && !INCLUDE.includes(name)) continue
		const p = join(dir, name)
		if (statSync(p).isDirectory()) out.push(...listFiles(p).map(f => join(name, f)))
		else out.push(name)
	}
	return out.sort()
}

/** 哈希目录树；exclude 中的相对路径不参与（用于豁免手工维护文件） */
function hashTree(base, filterTop = false, exclude = []) {
	const hash = createHash('sha256')
	for (const rel of listFiles(base, filterTop)) {
		if (exclude.includes(rel)) continue
		hash.update(rel)
		hash.update(readFileSync(join(base, rel)))
	}
	return hash.digest('hex')
}

const check = process.argv.includes('--check')
let failed = false

for (const t of targets) {
	const src = join(root, t.src)
	const dest = join(root, t.dest)

	if (!existsSync(src)) {
		console.error(`[sync] 源目录不存在: ${src}`)
		failed = true
		continue
	}

	if (check) {
		/** 源侧按白名单过滤（INCLUDE 外文件不参与校验）；
		 *  目标侧全量校验（可发现白名单外的多余文件），仅豁免手工维护的 KEEP 文件 */
		const complete = existsSync(dest) && KEEP.every(name => existsSync(join(dest, name)))
		const same = complete && hashTree(src, true) === hashTree(dest, false, KEEP)
		console.log(same ? `[sync] ${t.label} 与 ${t.src} 一致` : complete ? `[sync] ${t.label} 与 ${t.src} 不一致（需执行 pnpm sync:uni-modules）` : `[sync] ${t.label} 缺失或缺少手工维护文件（${KEEP.join(', ')}）`)
		if (!same) failed = true
		continue
	}

	/** 清空目标目录但保留手工维护文件（rmSync 整目录会连带删掉 dest/package.json） */
	if (existsSync(dest)) {
		for (const name of readdirSync(dest)) {
			if (KEEP.includes(name)) continue
			rmSync(join(dest, name), { recursive: true, force: true })
		}
	}
	cpSync(src, dest, {
		recursive: true,
		filter: from => {
			const rel = from.slice(src.length + 1)
			if (rel === '') return true
			return INCLUDE.includes(rel.split(/[\\/]/)[0])
		}
	})
	console.log(`[sync] 已同步 ${t.src} → packages/playground/uni_modules/${t.label}（package.json 保留手工版本）`)
}

if (check && failed) process.exit(1)
