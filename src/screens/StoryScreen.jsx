// ==========================
// 主线剧情界面：打字机 + 分支选择 + 章节卡 + 回忆CG
// ==========================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame, useNav, CHARACTERS } from '../game/store'
import { useToast } from '../game/toast'
import { getNode, getRoute, CHAPTER_TITLES } from '../data/story'
import { BATTLES } from '../data/battles'
import { CODEX_MAP } from '../data/codex'
import { affTier } from '../data/characters'
import Portrait from '../components/Portrait'
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

/* ---------------- 说话人名牌 ---------------- */
function SpeakerTag({ node, routeChar }) {
  if (node.sp === 'char' && routeChar) {
    return (
      <span
        className="rounded-xl px-4 py-1 text-lg font-bold text-white shadow-lg"
        style={{
          background: `linear-gradient(120deg, ${routeChar.colors.deep}cc, ${routeChar.colors.primary}cc)`,
          boxShadow: `0 4px 20px ${routeChar.colors.primary}55`,
        }}
      >
        {routeChar.name}
      </span>
    )
  }
  if (node.sp === 'you') {
    return <span className="glass rounded-xl px-4 py-1 text-lg font-bold text-sky-100">你 · 观测者</span>
  }
  return <span className="glass rounded-xl px-4 py-1 text-base font-bold tracking-[0.3em] text-indigo-200/90">✦ 观测记录</span>
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
    }
  }, [node])

  const { shown, done, skip } = useTypewriter(node ? node.tx : '')

  // CG 覆盖层
  const [cgOpen, setCgOpen] = useState(false)
  const cgForRef = useRef(null)
  useEffect(() => {
    if (!node) return
    if (node.cg && cgForRef.current !== node.id) {
      cgForRef.current = node.id
      setCgOpen(true)
    }
    if (!node.cg) setCgOpen(false)
  }, [node])

  const closeCg = () => {
    setCgOpen(false)
    unlockCodex(node.cg ? [node.cg] : [])
    if (node.cg) pushToast(`解锁回忆片段 · ${CODEX_MAP[node.cg].name}`, '📷', '#f0abfc')
    if (node.next) gotoNode(node.next)
  }

  // 推进
  const advance = useCallback(() => {
    if (!node) return
    if (!done) {
      skip()
      return
    }
    if (node.choices || node.battle || node.ending || node.select) return
    if (node.next) gotoNode(node.next)
  }, [node, done, skip, gotoNode])

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

  const onChoose = (choice) => {
    pushToast(`♥ 好感 +${choice.aff}`, '♥', routeChar ? routeChar.colors.primary : '#f472b6')
    applyChoice(choice)
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

  return (
    <div className="relative h-full select-none overflow-hidden">
      <SceneBG variant={node.bg || 'void'} />

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

      {/* 立绘 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[248px] z-10 flex justify-center sm:bottom-[262px]">
        <div key={`${routeChar?.id}-${node.id}`} className="anim-fade-in">
          {routeChar && (
            <div className="anim-float relative">
              <div
                className="absolute inset-x-8 bottom-2 top-10 rounded-full blur-2xl"
                style={{ background: `${routeChar.colors.primary}30` }}
              />
              <Portrait
                charId={routeChar.id}
                expression={portraitEx}
                mode="scene"
                className="relative h-[50vh] max-h-[440px] w-auto"
                glow={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* 对话框 */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-4 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          {/* 选择项 */}
          {node.choices && done && (
            <div className="mb-3 flex flex-col gap-2.5">
              {node.choices.map((choice, i) => (
                <button
                  key={i}
                  className="glass card-hover group flex items-center gap-3 rounded-2xl px-5 py-3.5 text-left"
                  onClick={() => onChoose(choice)}
                >
                  <span className="text-lg opacity-70 transition group-hover:opacity-100" style={{ color: routeChar?.colors.primary }}>✧</span>
                  <span className="flex-1 text-[15px] leading-relaxed text-white/95">{choice.tx}</span>
                  <span className="rounded-full border border-pink-300/40 bg-pink-400/15 px-2 py-0.5 text-[11px] text-pink-200">♥ +{choice.aff}</span>
                </button>
              ))}
            </div>
          )}

          {/* 主对话框 */}
          <div
            className="glass-deep relative cursor-pointer rounded-3xl px-5 pb-5 pt-4 sm:px-7 sm:pb-6"
            onClick={advance}
          >
            <div className="absolute -top-4 left-5">
              <SpeakerTag node={node} routeChar={routeChar} />
            </div>
            <p
              className={`mt-4 min-h-[76px] text-[15px] leading-[1.9] text-white/95 sm:min-h-[64px] sm:text-base ${!done ? 'typing-caret' : ''}`}
              onClick={(e) => { e.stopPropagation(); advance() }}
            >
              {shown}
            </p>

            {/* 行动区 */}
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
              {done && !node.choices && !node.select && !node.battle && !node.ending && node.next && (
                <span className="anim-next text-sm text-indigo-200/90">▼ 点击继续</span>
              )}
              {done && node.choices && <span className="text-xs text-white/45">做出你的选择</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 章节过渡卡 */}
      {chapterCard != null && chapterTitle && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0b1026]/80 backdrop-blur-md"
          onClick={() => setChapterCard(null)}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b1026]/85 px-5 backdrop-blur-md" onClick={closeCg}>
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
