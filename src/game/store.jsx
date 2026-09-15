// ==========================
// 全局游戏状态（useReducer + Context）+ 导航
// 所有状态自动持久化到 localStorage
// ==========================

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadSave, saveGame, clearSave, emptyState } from './save'
import { ROUTES, PROLOGUE } from '../data/story'
import { CHAR_IDS, CHAR_SHORT, CHARACTERS } from '../data/characters'
import { resolveEndingId } from '../data/endings'
import { CODEX_MAP, PAGE_IDS, SCORE_IDS } from '../data/codex'
import { BATTLES } from '../data/battles'

/* 永久遗物效果常量 */
export const RELIC_EFFECTS = {
  badgeAffMult: 1.1,   // 观测者徽章：好感度提升 +10%
  charmBonusHp: 15,    // 星之护符：最大生命 +15
  compassFirstStrike: 0.6, // 星界罗盘：先手概率
  compassVsFirstStrike: 0.5, // 星界罗盘：抵消敌方先手的概率
}

// ---------------- 导航 ----------------
const NavContext = createContext(null)

export function NavProvider({ children }) {
  const [nav, setNav] = React.useState({ screen: 'title', param: null })
  const value = useMemo(
    () => ({ nav, navigate: (screen, param = null) => setNav({ screen, param }) }),
    [nav],
  )
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  return useContext(NavContext)
}

// ---------------- 游戏状态 ----------------
const GameContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME': {
      const charId = action.charId
      return {
        ...state,
        route: charId,
        nodeId: ROUTES[charId].start,
        // 好感度跨周目保留（养成感），首次相遇保底 10
        affection: { ...state.affection, [charId]: Math.max(10, state.affection[charId] || 0) },
      }
    }
    case 'START_PROLOGUE':
      return { ...state, route: 'prologue', nodeId: PROLOGUE.start }
    case 'GOTO':
      return { ...state, nodeId: action.nodeId }
    case 'ADD_AFF': {
      const { charId, amount } = action
      if (!charId || !amount) return state
      return {
        ...state,
        affection: { ...state.affection, [charId]: Math.max(0, Math.min(100, (state.affection[charId] || 0) + amount)) },
      }
    }
    case 'UNLOCK': {
      const add = (action.ids || []).filter((id) => id && !state.unlocked.includes(id))
      if (!add.length) return state
      let unlocked = [...state.unlocked, ...add]
      // 集齐星图残页 → 解锁世界观档案；集齐乐谱 → 解锁角色语音集
      const cascade = []
      if (PAGE_IDS.every((id) => unlocked.includes(id)) && !unlocked.includes('tr-lore')) cascade.push('tr-lore')
      if (SCORE_IDS.every((id) => unlocked.includes(id)) && !unlocked.includes('tr-voice')) cascade.push('tr-voice')
      if (cascade.length) unlocked = [...unlocked, ...cascade]
      return { ...state, unlocked }
    }
    case 'GRANT_RELICS': {
      const add = (action.ids || []).filter((id) => !state.relics.includes(id))
      if (!add.length) return state
      return { ...state, relics: [...state.relics, ...add] }
    }
    case 'WIN_BATTLE': {
      const { battleId, charId } = action
      const battlesWon = state.battlesWon.includes(battleId) ? state.battlesWon : [...state.battlesWon, battleId]
      if (!charId || !CHARACTERS[charId]) return { ...state, battlesWon }
      return {
        ...state,
        battlesWon,
        affection: { ...state.affection, [charId]: Math.min(100, (state.affection[charId] || 0) + 6) },
      }
    }
    case 'REACH_ENDING': {
      const { endingId } = action
      const endings = state.endings.includes(endingId) ? state.endings : [...state.endings, endingId]
      return { ...state, endings, route: null, nodeId: null }
    }
    case 'RESET':
      return emptyState()
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadSave)

  // 自动存档：状态变化即写入
  useEffect(() => {
    saveGame(state)
  }, [state])

  const api = useMemo(() => {
    // 好感度里程碑语录（40 / 80）
    const unlockMilestones = (charId, prev, next) => {
      const short = CHAR_SHORT[charId]
      const ids = []
      if (prev < 40 && next >= 40) ids.push(`qt-${short}-40`)
      if (prev < 80 && next >= 80) ids.push(`qt-${short}-80`)
      return ids
    }

    return {
      state,
      // 选择剧情选项：加好感（观测者徽章 +10%）→ 解锁 → 跳转
      applyChoice(choice) {
        const charId = state.route
        const prev = state.affection[charId] || 0
        const boost = state.relics.includes('it-r-badge') ? RELIC_EFFECTS.badgeAffMult : 1
        const amount = Math.round((choice.aff || 0) * boost)
        dispatch({ type: 'ADD_AFF', charId, amount })
        dispatch({ type: 'UNLOCK', ids: [...(choice.unlock || []), ...unlockMilestones(charId, prev, prev + amount)] })
        dispatch({ type: 'GOTO', nodeId: choice.next })
      },
      // 战斗胜利：+6 好感（序章教学战不加好感）+ 通关掉落 → 进入战后节点
      winBattle(battleId, nextNodeId) {
        const charId = CHARACTERS[state.route] ? state.route : null
        const prev = charId ? state.affection[charId] || 0 : 0
        dispatch({ type: 'WIN_BATTLE', battleId, charId })
        if (charId) {
          dispatch({ type: 'UNLOCK', ids: unlockMilestones(charId, prev, prev + 6) })
        }
        // 通关掉落：永久遗物（it-r-*）即时生效 + 星藏收集品入图鉴
        const drops = BATTLES[battleId]?.drops || []
        const relicIds = drops.filter((d) => d.startsWith('it-r-') && !state.relics.includes(d))
        if (relicIds.length) dispatch({ type: 'GRANT_RELICS', ids: relicIds })
        const itemIds = drops.filter((d) => !d.startsWith('it-r-'))
        if (itemIds.length) dispatch({ type: 'UNLOCK', ids: itemIds })
        dispatch({ type: 'GOTO', nodeId: nextNodeId })
      },
      unlockCodex(ids) {
        dispatch({ type: 'UNLOCK', ids: ids || [] })
      },
      gotoNode(nodeId) {
        dispatch({ type: 'GOTO', nodeId })
      },
      startRoute(charId) {
        dispatch({ type: 'NEW_GAME', charId })
      },
      startPrologue() {
        dispatch({ type: 'START_PROLOGUE' })
      },
      reachEnding() {
        const charId = state.route
        const endingId = resolveEndingId(charId, state.affection[charId] || 0)
        dispatch({ type: 'REACH_ENDING', endingId })
        return endingId
      },
      resetAll() {
        clearSave()
        dispatch({ type: 'RESET' })
      },
      hasProgress: Boolean(state.route),
      isUnlocked: (id) => state.unlocked.includes(id),
    }
  }, [state])

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame() {
  return useContext(GameContext)
}

export { CHAR_IDS, CHARACTERS, CODEX_MAP }
