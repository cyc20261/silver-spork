// ==========================
// 主线剧情界面（标准 GALGAME 风格）
// 全屏背景 + 站位立绘 + 底部对话框（打字机）+ 全屏点击推进 + 居中选项弹窗
// 剧情 / 好感 / 多结局逻辑与原先完全一致，仅重构 UI 层
// ==========================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame, useNav, CHARACTERS } from '../game/store'
import { useToast } from '../game/toast'
import { sfx, speak, stopSpeak } from '../game/audio'
import { getNode, CHAPTER_TITLES } from '../data/story'
import { BATTLES } from '../data/battles'
import { CODEX_MAP } from '../data/codex'
import { affTier } from '../data/characters'
import GalPortrait from '../components/GalPortrait'
import SceneBG from '../components/SceneBG'
import CGCard from '../components/CGCard'

/* ---------------- 打字机 ---------------- */
function useTypewriter(text, speed = 32) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    clearInterval(timerRef.current)
    setShown('')
    setDone(false)
    if (!text) {
      setDone(true)
      return
    }
    let i = 0
    timerRef.current = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      // 每 4 个字一下轻微的敲击声（非空白字符才出声）
      if (i % 4 === 0 && text[i - 1] && !/\s/.test(text[i - 1])) sfx('type')
      if (i >= text.length) {
        clearInterval(timerRef.current)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(timerRef.current)
  }, [text, speed])

  const skip = useCallback(() => {
    clearInterval(timerRef.current)
    setShown(text || '')
    setDone(true)
  }, [text])

  return { shown, done, skip }
}

/* ---------------- GAL 名字牌（角色专属配色） ---------------- */
function SpeakerTag({ node, routeChar }) {
  if (node.sp === 'char' && routeChar) {
    return (
      <span
        className="rounded-t-lg rounded-br-lg border border-white/30 px-4 py-1 text-base font-bold text-white"
        style={{
          background: `linear-gradient(120deg, ${routeChar.colors.deep}e6, ${routeChar.colors.primary}e6)`,
          boxShadow: `0 4px 18px ${routeChar.colors.primary}66`,
        }}
      >
        {routeChar.name}
      </span>
    )
  }
  if (node.sp === 'you') {
    return (
      <span className="rounded-t-lg rounded-br-lg border border-white/25 bg-[#10142e]/85 px-4 py-1 text-base font-bold text-sky-100">
        你 · 观测者
      </span>
    )
  }
  return (
    <span className="rounded-t-lg rounded-br-lg border border-white/15 bg-[#10142e]/75 px-4 py-1 text-sm font-bold tracking-[0.3em] text-indigo-200/90">
      ✦ 观测记录
    </span>
  )
}

export default function StoryScreen() {
  const { state, applyChoice, unlockCodex, gotoNode, reachEnding } = useGame()
  const { navigate } = useNav()
  const { pushToast } = useToast()

  const route = state.route
  const node = route ? getNode(route, state.nodeId) : null
  const routeChar = CHARACTERS[route] || null
  const chapterTitle = route && CHAPTER_TITLES[route] ? CHAPTER_TITLES[route][node?.ch] : null

  // 无进度 → 回标题/选人
  useEffect(() => {
    if (!route) navigate('title')
    else if (!node) navigate(route === 'prologue' ? 'title' : 'select')
  }, [route, node, navigate])

  // 节点解锁（星空图鉴等）
  const unlockedRef = useRef(null)
  useEffect(() => {
    if (!node) return
    if (unlockedRef.current === node.id) return
    unlockedRef.current = node.id
    if (node.unlock && node.unlock.length) {
      const fresh = node.unlock.filter((id) => !state.unlocked.includes(id))
      unlockCodex(node.unlock)
      fresh.forEach((id) => {
        const item = CODEX_MAP[id]
        if (item) pushToast(`解锁${item.cat === 'star' ? '星空图鉴' : item.cat === 'quote' ? '角色语录' : '回忆'} · ${item.name}`, '✦', '#7dd3fc')
      })
      if (fresh.length) sfx('unlock')
    }
  }, [node, state.unlocked, unlockCodex, pushToast])

  // 章节过渡卡
  const lastChRef = useRef(null)
  const [chapterCard, setChapterCard] = useState(null)
  useEffect(() => {
    if (!node) return
    if (node.ch > 0 && lastChRef.current !== node.ch) {
      lastChRef.current = node.ch
      setChapterCard(node.ch)
      sfx('chapter')
    }
  }, [node])

  /* 段落独白朗读：节点文字出来后用浏览器 TTS 念一遍
     （合成语音，不是真人配音；可在左下角关闭） */
  useEffect(() => {
    if (!node || !node.tx) return
    stopSpeak()
    const t = setTimeout(() => speak(node.tx), 320)
    return () => {
      clearTimeout(t)
      stopSpeak()
    }
  }, [node])

  useEffect(() => () => stopSpeak(), [])

  const { shown, done, skip } = useTypewriter(node ? node.tx : '')

  // CG 覆盖层
  const [cgOpen, setCgOpen] = useState(false)
  const cgForRef = useRef(null)
  useEffect(() => {
    if (!node) return
    if (node.cg && cgForRef.current !== node.id) {
      cgForRef.current = node.id
      setCgOpen(true)
      sfx('memory')
    }
    if (!node.cg) setCgOpen(false)
  }, [node])

  const closeCg = () => {
    setCgOpen(false)
    unlockCodex(node.cg ? [node.cg] : [])
    if (node.cg) pushToast(`解锁回忆片段 · ${CODEX_MAP[node.cg].name}`, '📷', '#f0abfc')
    if (node.next) gotoNode(node.next)
  }

  // 推进：打字中 → 跳过；完毕 → 下一节点（有选项/战斗/结局/选人时点击无效）
  const advance = useCallback(() => {
    if (!node) return
    if (!done) {
      skip()
      return
    }
    if (node.choices || node.battle || node.ending || node.select) return
    if (node.next) gotoNode(node.next)
  }, [node, done, skip, gotoNode])

  // GAL 核心交互：点击画面任意位置推进（按钮与弹层自己处理事件）
  const onScreenClick = (e) => {
    if (e.target.closest('button')) return
    advance()
  }

  // 键盘：空格 / 回车 推进
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      if (e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  // 选项弹窗：选中 → 淡出 → 应用分支
  const [chosenIdx, setChosenIdx] = useState(null)
  useEffect(() => {
    setChosenIdx(null)
  }, [node?.id])

  const onChoose = (choice, i) => {
    if (chosenIdx != null) return
    setChosenIdx(i)
    sfx('confirm')
    pushToast(`♥ 好感 +${choice.aff}`, '♥', routeChar ? routeChar.colors.primary : '#f472b6')
    setTimeout(() => applyChoice(choice), 320)
  }

  const onEnding = () => {
    const endingId = reachEnding()
    navigate('ending', { endingId })
  }

  if (!route || !node) return null

  const aff = routeChar ? state.affection[routeChar.id] || 0 : 0
  const tier = affTier(aff)
  const battleCfg = node.battle ? BATTLES[node.battle] : null
  const portraitEx = node.sp === 'char' && node.ex ? node.ex : 'normal'
  const hasAction = node.select || node.battle || node.ending

  return (
    <div className="relative h-full select-none overflow-hidden" onClick={onScreenClick}>
      <SceneBG variant={node.bg || 'void'} />

      {/* 立绘（左右站位 / 表情切换 / 旁白时压暗） */}
      {routeChar && (
        <GalPortrait
          charId={routeChar.id}
          expression={portraitEx}
          side={node.side || 'right'}
          speaking={node.sp !== 'narr'}
        />
      )}

      {/* 顶部 HUD */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className="flex gap-2">
          <button className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/20" onClick={() => navigate('title')}>✧ 标题</button>
          <button className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/20" onClick={() => navigate('affection')}>♥ 好感度</button>
          <button className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85 transition hover:bg-white/20" onClick={() => navigate('codex')}>✦ 图鉴</button>
        </div>
        {routeChar && (
          <div className="glass flex items-center gap-2.5 rounded-full px-4 py-1.5">
            <span className="text-xs font-bold text-white">{routeChar.name}</span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
              <div className="aff-fill h-full rounded-full" style={{ width: `${aff}%`, background: `linear-gradient(90deg, ${routeChar.colors.deep}, ${routeChar.colors.primary})` }} />
            </div>
            <span className="text-[10px] text-white/70">{aff}</span>
          </div>
        )}
      </div>

      {/* 底部对话框（≈25vh 半透明黑框） */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-2 pb-2 sm:px-4 sm:pb-4">
        <div className="gal-dialog relative mx-auto flex min-h-[24vh] w-full max-w-5xl flex-col px-5 pb-5 pt-6 sm:px-8">
          <div className="absolute -top-4 left-4 sm:left-6">
            <SpeakerTag node={node} routeChar={routeChar} />
          </div>

          <p
            className={`min-h-[4.2em] flex-1 text-[15px] leading-[2] text-white/95 sm:text-base ${!done ? 'typing-caret' : ''}`}
          >
            {shown}
          </p>

          {/* 行动区（战斗 / 结局 / 选人 / 继续提示） */}
          <div className="mt-2 flex items-center justify-end gap-3">
            {node.select && done && (
              <button
                className="btn btn-primary anim-breathe"
                onClick={(e) => { e.stopPropagation(); navigate('select') }}
              >
                ✦ 前往星灵之庭
              </button>
            )}
            {battleCfg && done && (
              <button
                className="btn btn-primary anim-breathe"
                style={{ boxShadow: `0 6px 26px ${battleCfg.color}66` }}
                onClick={(e) => { e.stopPropagation(); navigate('battle', { battleId: node.battle, next: node.next }) }}
              >
                ⚔ 进入战斗 · {battleCfg.name}
              </button>
            )}
            {node.ending && done && (
              <button
                className="btn btn-primary anim-breathe"
                onClick={(e) => { e.stopPropagation(); onEnding() }}
              >
                ✦ 走向结局
              </button>
            )}
            {done && !hasAction && !node.choices && node.next && (
              <span className="anim-next pr-1 text-lg text-indigo-200/90">▼</span>
            )}
            {done && node.choices && <span className="pr-1 text-xs text-white/45">做出你的选择</span>}
          </div>
        </div>
      </div>

      {/* 选项弹窗：画面中央 · 白色半透明按钮 */}
      {node.choices && done && (
        <div
          className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-[#04071a]/30 ${chosenIdx != null ? 'gal-choices-out' : 'gal-choices'}`}
        >
          <div className="flex flex-col items-center gap-3.5">
            {node.choices.map((choice, i) => (
              <button
                key={i}
                className="gal-choice pointer-events-auto flex items-center gap-3"
                style={{
                  '--choice-accent': routeChar?.colors.primary || '#a5b4fc',
                  '--choice-glow': `${routeChar?.colors.primary || '#a5b4fc'}88`,
                }}
                onClick={(e) => { e.stopPropagation(); onChoose(choice, i) }}
              >
                <span className="text-lg" style={{ color: routeChar?.colors.primary }}>✧</span>
                <span className="flex-1">{choice.tx}</span>
                <span className="rounded-full border border-pink-300/80 bg-pink-100/90 px-2 py-0.5 text-[11px] font-bold text-pink-500">♥ +{choice.aff}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 章节过渡卡 */}
      {chapterCard != null && chapterTitle && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0b1026]/80 backdrop-blur-md"
          onClick={(e) => { e.stopPropagation(); setChapterCard(null) }}
        >
          <div className="anim-chapter text-center">
            <div className="text-sm tracking-[0.6em] text-indigo-200/70">CHAPTER {chapterCard}</div>
            <div className="text-gradient mt-4 text-4xl font-black tracking-[0.28em] sm:text-5xl">{chapterTitle}</div>
            <div className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-indigo-200/70 to-transparent" />
          </div>
          <div className="anim-next mt-10 text-xs text-white/50">点击任意处开始</div>
        </div>
      )}

      {/* 回忆 CG */}
      {node.cg && cgOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b1026]/85 px-5 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); closeCg() }}>
          <div className="anim-pop w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CGCard memId={node.cg} />
            <div className="mt-5 text-center">
              <button className="btn btn-primary anim-breathe" onClick={closeCg}>✦ 收下这份回忆</button>
            </div>
          </div>
        </div>
      )}

      {/* 当前好感阶段小字 */}
      {routeChar && (
        <div className="pointer-events-none absolute right-4 top-14 z-10 text-right text-[10px] tracking-widest text-white/35">
          {tier.name} · {aff}/100
        </div>
      )}
    </div>
  )
}
