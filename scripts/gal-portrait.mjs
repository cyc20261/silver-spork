// GAL 立绘预处理：白底 → 透明底 PNG
// 用法:
//   node scripts/gal-portrait.mjs inspect   仅转换查看
//   node scripts/gal-portrait.mjs process   泛洪去底 + 羽化 + 去水印
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHAR_DIR = path.resolve(__dirname, '../src/assets/chars')
const OUT_DIR = path.resolve(__dirname, '../src/assets/chars/trans')
const CHARS = ['xingbai', 'linyue', 'yaoguang', 'jinyu']

const TIGHT = 244   // 第一遍：从边框泛洪，几乎纯白才算背景
const LOOSE_B = 196 // 第二遍：亮度高于此且低饱和
const LOOSE_S = 0.13
const LOOSE_D = 8   // 第二遍最多从紧致背景往内渗的像素距离

async function loadRGBA(file) {
  const img = sharp(file).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

function isBg(r, g, b, mode) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const sat = mx === 0 ? 0 : (mx - mn) / mx
  if (mode === 'tight') return r >= TIGHT && g >= TIGHT && b >= TIGHT
  return r >= LOOSE_B && g >= LOOSE_B && b >= LOOSE_B && sat <= LOOSE_S
}

// 3.从紧致背景向内做限距 BFS（吃掉轮廓白边与水印细字，不深入发丝内部）
function looseNear(data, w, h, tight) {
  const depth = new Int16Array(w * h).fill(-1)
  const queue = []
  for (let i = 0; i < w * h; i++) {
    if (!tight[i]) continue
    // 与角色像素相邻的背景格作为起点
    const x = i % w, y = (i / w) | 0
    const nearChar = (x > 0 && !tight[i - 1]) || (x < w - 1 && !tight[i + 1]) || (y > 0 && !tight[i - w]) || (y < h - 1 && !tight[i + w])
    if (nearChar) { depth[i] = 0; queue.push(i) }
  }
  let head = 0
  const out = new Uint8Array(w * h)
  while (head < queue.length) {
    const i = queue[head++]
    const d = depth[i]
    if (d >= LOOSE_D) continue
    const x = i % w, y = (i / w) | 0
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]
    for (const j of nb) {
      if (j < 0 || tight[j] || depth[j] >= 0) continue
      const o = j * 4
      if (!isBg(data[o], data[o + 1], data[o + 2], 'loose')) { depth[j] = LOOSE_D; continue }
      depth[j] = d + 1
      out[j] = 1
      queue.push(j)
    }
  }
  return out
}

function flood(data, w, h, mode) {
  const visited = new Uint8Array(w * h)
  const stack = []
  const push = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const i = y * w + x
    if (visited[i]) return
    visited[i] = 1
    const o = i * 4
    if (!isBg(data[o], data[o + 1], data[o + 2], mode)) return
    stack.push(i)
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  const out = new Uint8Array(w * h)
  while (stack.length) {
    const i = stack.pop()
    out[i] = 1
    const x = i % w, y = (i / w) | 0
    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }
  return out
}

// 3x3 最大值腐蚀 alpha 边缘，再 3x3 均值羽化，去白边
function feather(alpha, w, h) {
  const eroded = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 1
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx))
          const yy = Math.min(h - 1, Math.max(0, y + dy))
          m = Math.min(m, alpha[yy * w + xx])
        }
      }
      eroded[y * w + x] = m
    }
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx))
          const yy = Math.min(h - 1, Math.max(0, y + dy))
          s += eroded[yy * w + xx]; n++
        }
      }
      out[y * w + x] = s / n
    }
  }
  return out
}

async function main() {
  const cmd = process.argv[2] || 'process'
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const id of CHARS) {
    const src = path.join(CHAR_DIR, `${id}.webp`)
    const { data, w, h } = await loadRGBA(src)
    console.log(`${id}: ${w}x${h}`)

    if (cmd === 'inspect') {
      await sharp(data, { raw: { width: w, height: h, channels: 4 } })
        .png().toFile(path.join(OUT_DIR, `${id}-inspect.png`))
      continue
    }

    const t0 = Date.now()
    const tight = flood(data, w, h, 'tight')
    const loose = looseNear(data, w, h, tight)
    let removed = 0
    const alpha = new Float32Array(w * h).fill(1)
    for (let i = 0; i < w * h; i++) {
      if (tight[i] || loose[i]) { alpha[i] = 0; removed++ }
    }
    // 羽化
    const soft = feather(alpha, w, h)
    for (let i = 0; i < w * h; i++) {
      data[i * 4 + 3] = Math.round(soft[i] * 255)
    }
    await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .webp({ quality: 90, alphaQuality: 90 }).toFile(path.join(OUT_DIR, `${id}.webp`))
    console.log(`  bg removed: ${(removed / (w * h) * 100).toFixed(1)}%  ${Date.now() - t0}ms`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
