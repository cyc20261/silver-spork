// ==========================
// 剧情数据汇总入口
// ==========================

import { PROLOGUE } from './stories/prologue.js'
import { XINGBAI_NODES, XINGBAI_CHAPTERS } from './stories/xingbai.js'
import { LINYUE_NODES, LINYUE_CHAPTERS } from './stories/linyue.js'
import { YAOGUANG_NODES, YAOGUANG_CHAPTERS } from './stories/yaoguang.js'
import { JINYU_NODES, JINYU_CHAPTERS } from './stories/jinyu.js'

export const PROLOGUE_ROUTE_ID = 'prologue'
export { PROLOGUE }

export const ROUTES = {
  xingbai: { start: 'xb1-1', nodes: XINGBAI_NODES },
  linyue: { start: 'ly1-1', nodes: LINYUE_NODES },
  yaoguang: { start: 'yg1-1', nodes: YAOGUANG_NODES },
  jinyu: { start: 'jy1-1', nodes: JINYU_NODES },
}

export const CHAPTER_TITLES = {
  [PROLOGUE_ROUTE_ID]: {},
  xingbai: XINGBAI_CHAPTERS,
  linyue: LINYUE_CHAPTERS,
  yaoguang: YAOGUANG_CHAPTERS,
  jinyu: JINYU_CHAPTERS,
}

export function getRoute(routeId) {
  if (routeId === PROLOGUE_ROUTE_ID) return PROLOGUE
  return ROUTES[routeId] || null
}

export function getNode(routeId, nodeId) {
  const route = getRoute(routeId)
  if (!route) return null
  return route.nodes[nodeId] || null
}
