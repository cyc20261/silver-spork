// ==========================
// 本地存档：localStorage 持久化（刷新不丢失进度）
// ==========================

export const SAVE_KEY = 'startrace_save_v1'
export const SAVE_VERSION = 1

export function emptyState() {
  return {
    version: SAVE_VERSION,
    route: null,       // 'prologue' | charId | null（null = 无进行中的旅程）
    nodeId: null,      // 当前剧情节点
    affection: { xingbai: 0, linyue: 0, yaoguang: 0, jinyu: 0 },
    unlocked: [],      // 已解锁的图鉴 id（星空图鉴/语录/回忆/遗物/星藏）
    relics: [],        // 已获得的永久遗物 id（获得即生效）
    endings: [],       // 已解锁的结局 id
    battlesWon: [],    // 已战胜的战斗 id
    lastPlayedAt: 0,
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return emptyState()
    const data = JSON.parse(raw)
    if (!data || data.version !== SAVE_VERSION) return emptyState()
    const base = emptyState()
    return {
      ...base,
      ...data,
      affection: { ...base.affection, ...(data.affection || {}) },
      unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
      relics: Array.isArray(data.relics) ? data.relics : [],
      endings: Array.isArray(data.endings) ? data.endings : [],
      battlesWon: Array.isArray(data.battlesWon) ? data.battlesWon : [],
    }
  } catch {
    return emptyState()
  }
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastPlayedAt: Date.now() }))
  } catch {
    /* 存储不可用时静默降级 */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}
