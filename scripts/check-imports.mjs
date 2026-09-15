// 检查所有相对 import 在磁盘上是否存在，且大小写完全一致
// （Windows 不区分大小写，Vercel 的 Linux 构建区分 —— 这是本地能过、线上构建失败的头号原因）
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const exts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif']
const files = []

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.v2c', '.video_agent'].includes(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(jsx?|mjs|tsx?)$/.test(e.name)) files.push(p)
  }
}
walk(root)

let bad = 0
let checked = 0
// 匹配 import ... from '...' / import '...' / export ... from '...'，且说明符是相对路径
const re = /(?:^|[^\w$])(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](\.[^'"]+)['"]/g

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  for (const m of src.matchAll(re)) {
    const spec = m[1]
    const base = path.resolve(path.dirname(f), spec)
    const cands = [base, ...exts.map((x) => base + x), ...exts.map((x) => path.join(base, 'index' + x))]
    const hit = cands.find((c) => fs.existsSync(c))
    checked++
    if (!hit) {
      console.log(`MISSING  ${path.relative(root, f)}  ->  ${spec}`)
      bad++
      continue
    }
    // 逐段核对真实大小写
    let cur = root
    for (const part of path.relative(root, hit).split(path.sep)) {
      const entries = fs.readdirSync(cur)
      if (!entries.includes(part)) {
        const near = entries.find((x) => x.toLowerCase() === part.toLowerCase())
        console.log(`CASE     ${path.relative(root, f)}  ->  ${spec}   (磁盘上实际是 "${near}")`)
        bad++
        break
      }
      cur = path.join(cur, part)
    }
  }
}

console.log(`\n扫描 ${files.length} 个源文件，检查 ${checked} 条相对 import，问题 ${bad} 处`)
