// ==========================
// 剧情数据链完整性校验
//   node scripts/validate.mjs
// 检查：节点引用、选项跳转、战斗/CG/图鉴 id、结局解析
// ==========================

import { ROUTES, PROLOGUE, PROLOGUE_ROUTE_ID } from '../src/data/story.js'
import { BATTLES } from '../src/data/battles.js'
import { CODEX } from '../src/data/codex.js'
import { ENDINGS, ENDING_ORDER, resolveEndingId } from '../src/data/endings.js'
import { CHAR_IDS, CHAR_SHORT } from '../src/data/characters.js'

const errors = []
const warns = []

const codexIds = new Set(CODEX.map((c) => c.id))
const battleIds = new Set(Object.keys(BATTLES))
const visited = new Set()

function checkRoute(routeId, route) {
  const nodeIds = new Set(Object.keys(route.nodes))
  for (const [id, node] of Object.entries(route.nodes)) {
    visited.add(`${routeId}:${id}`)

    if (node.next !== null && node.next !== undefined && !nodeIds.has(node.next)) {
      errors.push(`[${routeId}] 节点 ${id} 的 next 指向不存在的节点: ${node.next}`)
    }
    if (node.next && node.choices) {
      errors.push(`[${routeId}] 节点 ${id} 同时拥有 next 与 choices`)
    }
    if (!node.next && !node.choices && !node.battle && !node.ending && !node.select) {
      errors.push(`[${routeId}] 节点 ${id} 是死路（无 next/choices/battle/ending/select）`)
    }
    for (const ch of node.choices || []) {
      if (!nodeIds.has(ch.next)) errors.push(`[${routeId}] 节点 ${id} 选项「${ch.tx.slice(0, 12)}…」指向不存在的节点: ${ch.next}`)
      if (typeof ch.aff !== 'number') errors.push(`[${routeId}] 节点 ${id} 选项缺少 aff 数值`)
    }
    if (node.battle) {
      if (!battleIds.has(node.battle)) errors.push(`[${routeId}] 节点 ${id} 引用了不存在的战斗: ${node.battle}`)
      else {
        const expectRoute = routeId === PROLOGUE_ROUTE_ID ? 'prologue' : routeId
        if (BATTLES[node.battle].route !== expectRoute) {
          warns.push(`[${routeId}] 节点 ${id} 的战斗 ${node.battle} 与路线不匹配`)
        }
      }
      if (!node.next) errors.push(`[${routeId}] 战斗节点 ${id} 缺少战后 next`)
    }
    for (const u of node.unlock || []) {
      if (!codexIds.has(u)) errors.push(`[${routeId}] 节点 ${id} 解锁了不存在的图鉴: ${u}`)
    }
    for (const ch of node.choices || []) {
      for (const u of ch.unlock || []) {
        if (!codexIds.has(u)) errors.push(`[${routeId}] 节点 ${id} 的选项解锁了不存在的图鉴: ${u}`)
      }
    }
    if (node.cg && !codexIds.has(node.cg)) errors.push(`[${routeId}] 节点 ${id} 的 CG 不存在: ${node.cg}`)
    if (node.cg && !node.next) errors.push(`[${routeId}] CG 节点 ${id} 缺少 next`)
    if (node.ending && node.next) {
      // ending 节点不需要 next，但写了也不算错误
    }
  }
  // 可达性
  if (route.start && !nodeIds.has(route.start)) errors.push(`[${routeId}] 起始节点不存在: ${route.start}`)
}

checkRoute(PROLOGUE_ROUTE_ID, PROLOGUE)
for (const [rid, route] of Object.entries(ROUTES)) checkRoute(rid, route)

// 不可达节点检查
for (const [rid, route] of Object.entries(ROUTES)) {
  const seen = new Set()
  const walk = (id) => {
    if (!id || seen.has(id)) return
    seen.add(id)
    const n = route.nodes[id]
    if (!n) return
    if (n.next) walk(n.next)
    for (const c of n.choices || []) walk(c.next)
  }
  walk(route.start)
  for (const id of Object.keys(route.nodes)) {
    if (!seen.has(id)) warns.push(`[${rid}] 节点 ${id} 从起点不可达（孤儿节点）`)
  }
}

// 图鉴提示 vs 数据一致性（宽松检查：只查 hint 是否为空）
for (const c of CODEX) {
  if (!c.hint) warns.push(`图鉴 ${c.id} 缺少解锁提示`)
}

// 结局解析
for (const charId of CHAR_IDS) {
  const short = CHAR_SHORT[charId]
  for (const aff of [0, 69, 70, 100]) {
    const eid = resolveEndingId(charId, aff)
    if (!ENDINGS[eid]) errors.push(`结局解析失败: ${charId}@${aff} -> ${eid}`)
  }
  if (!ENDING_ORDER.includes(`${short}-true`)) errors.push(`缺少 ${charId} 真结局`)
  if (!ENDING_ORDER.includes(`${short}-normal`)) errors.push(`缺少 ${charId} 普通结局`)
}
if (ENDING_ORDER.length !== 8) errors.push(`结局总数应为 8，实际 ${ENDING_ORDER.length}`)

// 每条线的图鉴数量检查（星空 2 + 语录 4 + 回忆 3 = 9）
for (const charId of CHAR_IDS) {
  const count = CODEX.filter((c) => c.char === charId).length
  if (count !== 9) errors.push(`${charId} 线图鉴数量应为 9（2图鉴+4语录+3回忆），实际 ${count}`)
}

console.log('— 剧情数据链校验 —')
console.log(`节点总数: ${visited.size} · 图鉴: ${CODEX.length} · 战斗: ${battleIds.size} · 结局: ${ENDING_ORDER.length}`)
if (errors.length) {
  console.error(`\n❌ ${errors.length} 个错误:`)
  errors.forEach((e) => console.error('  ' + e))
}
if (warns.length) {
  console.warn(`\n⚠ ${warns.length} 个警告:`)
  warns.forEach((w) => console.warn('  ' + w))
}
if (!errors.length && !warns.length) console.log('\n✅ 全部通过')
process.exit(errors.length ? 1 : 0)
